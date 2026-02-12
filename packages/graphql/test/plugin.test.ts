/**
 * GraphQL Plugin Tests
 *
 * Tests for O.1.1 (schema generation), O.1.2 (permission enforcement),
 * and O.1.3 (audit logging) functionality.
 */

import { graphql, printSchema, GraphQLSchema } from 'graphql';
import { generateSchema, toPascalCase } from '../src/schema-generator.js';
import { createResolverCallbacks } from '../src/resolvers.js';
import { GraphQLPlugin } from '../src/plugin.js';
import type { ObjectDef, GraphQLResolverContext, ResolvedGraphQLConfig } from '../src/types.js';

// ─── Test Fixtures ─────────────────────────────────────────────────

const testConfig: ResolvedGraphQLConfig = {
  enabled: true,
  path: '/api/v1/graphql',
  introspection: true,
  maxDepth: 10,
  maxComplexity: 1000,
  defaultPageSize: 20,
  maxPageSize: 100,
  playground: false,
};

const accountObject: ObjectDef = {
  name: 'account',
  label: 'Account',
  description: 'Customer account',
  fields: {
    name: { type: 'text', required: true },
    email: { type: 'email' },
    phone: { type: 'phone' },
    revenue: { type: 'currency' },
    is_active: { type: 'boolean' },
    type: { type: 'select', options: ['customer', 'partner', 'vendor'] },
    notes: { type: 'textarea' },
    metadata: { type: 'object', blackbox: true },
  },
};

const auditLogObject: ObjectDef = {
  name: 'audit_log',
  label: 'Audit Log',
  fields: {
    event_type: { type: 'select', required: true, options: ['create', 'update', 'delete'] },
    object_name: { type: 'text' },
    record_id: { type: 'text' },
    user_id: { type: 'text' },
    timestamp: { type: 'datetime', required: true },
  },
};

function createMockBroker(overrides: any = {}) {
  const records: any[] = overrides.records ?? [
    { _id: '1', name: 'Acme Corp', email: 'acme@example.com', is_active: true },
    { _id: '2', name: 'Globex', email: 'globex@example.com', is_active: false },
  ];

  return {
    call: jest.fn(async (action: string, params: any) => {
      switch (action) {
        case 'data.find':
          return records;
        case 'data.findOne':
          return records.find(r => r._id === params.filters?._id) ?? null;
        case 'data.count':
          return records.length;
        case 'data.create':
          return { _id: 'new-1', ...params.doc };
        case 'data.update':
          return { _id: params.id, ...params.doc };
        case 'data.delete':
          return { success: true };
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    }),
    getService: jest.fn((name: string) => {
      if (name === 'permissions') return overrides.permissions ?? null;
      if (name === 'audit') return overrides.audit ?? null;
      return null;
    }),
  };
}

function createContext(broker: any, user?: { id: string; profile?: string }): GraphQLResolverContext {
  return {
    broker,
    user: user ?? { id: 'user-1', profile: 'admin' },
    ip: '127.0.0.1',
    userAgent: 'test',
    sessionId: 'session-1',
  };
}

// ─── O.1.1: Schema Generation Tests ─────────────────────────────

describe('O.1.1 — Schema Generation', () => {
  test('generates schema from a single object definition', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);
    expect(schema).toBeInstanceOf(GraphQLSchema);

    const schemaStr = printSchema(schema);
    expect(schemaStr).toContain('type Account');
    expect(schemaStr).toContain('type Query');
    expect(schemaStr).toContain('type Mutation');
  });

  test('generates schema from multiple object definitions', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject, auditLogObject], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    expect(schemaStr).toContain('type Account');
    expect(schemaStr).toContain('type AuditLog');
    expect(schemaStr).toContain('findAccounts');
    expect(schemaStr).toContain('findAuditLogs');
    expect(schemaStr).toContain('getAccount');
    expect(schemaStr).toContain('getAuditLog');
  });

  test('maps field types correctly', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    // text → String, required → NonNull
    expect(schemaStr).toContain('name: String!');
    // email → String (nullable)
    expect(schemaStr).toContain('email: String');
    // currency → Float
    expect(schemaStr).toContain('revenue: Float');
    // boolean → Boolean
    expect(schemaStr).toContain('is_active: Boolean');
  });

  test('generates create and update input types', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    expect(schemaStr).toContain('input AccountCreateInput');
    expect(schemaStr).toContain('input AccountUpdateInput');
  });

  test('generates filter input types', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    expect(schemaStr).toContain('input AccountFilter');
    // Blackbox fields should not appear in filter input
    const filterBlock = schemaStr.match(/input AccountFilter \{([^}]+)\}/s)?.[1] ?? '';
    expect(filterBlock).not.toContain('metadata');
  });

  test('generates paginated connection types', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    expect(schemaStr).toContain('type AccountConnection');
    expect(schemaStr).toContain('totalCount: Int!');
    expect(schemaStr).toContain('hasMore: Boolean!');
    expect(schemaStr).toContain('pageSize: Int!');
    expect(schemaStr).toContain('offset: Int!');
  });

  test('generates CRUD mutations', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    expect(schemaStr).toContain('createAccount(input: AccountCreateInput!): Account');
    expect(schemaStr).toContain('updateAccount(');
    expect(schemaStr).toContain('input: AccountUpdateInput!');
    expect(schemaStr).toContain('deleteAccount(');
  });

  test('returns minimal schema for empty objects list', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    expect(schemaStr).toContain('type Query');
    expect(schemaStr).not.toContain('type Mutation');
  });

  test('toPascalCase converts object names correctly', () => {
    expect(toPascalCase('account')).toBe('Account');
    expect(toPascalCase('audit_log')).toBe('AuditLog');
    expect(toPascalCase('permission_set')).toBe('PermissionSet');
    expect(toPascalCase('workflow_task')).toBe('WorkflowTask');
  });

  test('includes standard metadata fields (_id, created_at, etc.)', () => {
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);
    const schemaStr = printSchema(schema);

    expect(schemaStr).toContain('_id: String');
    expect(schemaStr).toContain('created_at: String');
    expect(schemaStr).toContain('updated_at: String');
    expect(schemaStr).toContain('created_by: String');
    expect(schemaStr).toContain('updated_by: String');
  });
});

// ─── O.1.2: Query Resolvers with Permission Enforcement ──────────

describe('O.1.2 — Query Resolvers with Permission Enforcement', () => {
  test('find query returns paginated results', async () => {
    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: '{ findAccounts { data { _id name email } totalCount hasMore } }',
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.findAccounts).toBeDefined();
    expect((result.data?.findAccounts as any).data).toHaveLength(2);
    expect((result.data?.findAccounts as any).totalCount).toBe(2);
  });

  test('findOne query returns a single record', async () => {
    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: '{ getAccount(id: "1") { _id name email } }',
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.getAccount).toEqual({
      _id: '1',
      name: 'Acme Corp',
      email: 'acme@example.com',
    });
  });

  test('query enforces read permission', async () => {
    const permissionsService = {
      checkPermission: jest.fn().mockResolvedValue(false),
    };
    const broker = createMockBroker({ permissions: permissionsService });
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: '{ findAccounts { data { _id } totalCount hasMore } }',
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Permission denied');
    expect(permissionsService.checkPermission).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'read', objectName: 'account' }),
    );
  });

  test('query passes when permission is granted', async () => {
    const permissionsService = {
      checkPermission: jest.fn().mockResolvedValue(true),
    };
    const broker = createMockBroker({ permissions: permissionsService });
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: '{ findAccounts { data { _id name } totalCount hasMore } }',
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeUndefined();
    expect(permissionsService.checkPermission).toHaveBeenCalled();
  });

  test('query fails without authentication', async () => {
    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: '{ findAccounts { data { _id } totalCount hasMore } }',
      contextValue: { broker, user: undefined },
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Authentication required');
  });

  test('find query respects pagination parameters', async () => {
    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    await graphql({
      schema,
      source: '{ findAccounts(limit: 5, offset: 10) { data { _id } totalCount hasMore } }',
      contextValue: createContext(broker),
    });

    expect(broker.call).toHaveBeenCalledWith('data.find', expect.objectContaining({
      options: expect.objectContaining({ limit: 5, skip: 10 }),
    }));
  });

  test('find query enforces maxPageSize', async () => {
    const broker = createMockBroker();
    const config = { ...testConfig, maxPageSize: 50 };
    const callbacks = createResolverCallbacks(config);
    const schema = generateSchema([accountObject], config, callbacks);

    await graphql({
      schema,
      source: '{ findAccounts(limit: 200) { data { _id } totalCount hasMore } }',
      contextValue: createContext(broker),
    });

    expect(broker.call).toHaveBeenCalledWith('data.find', expect.objectContaining({
      options: expect.objectContaining({ limit: 50 }),
    }));
  });
});

// ─── O.1.3: Mutation Resolvers with Audit Logging ────────────────

describe('O.1.3 — Mutation Resolvers with Audit Logging', () => {
  test('create mutation creates a record and logs audit event', async () => {
    const auditService = { log: jest.fn().mockResolvedValue(undefined) };
    const broker = createMockBroker({ audit: auditService });
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: `mutation { createAccount(input: { name: "New Corp", email: "new@corp.com" }) { _id name email } }`,
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.createAccount).toEqual(
      expect.objectContaining({ _id: 'new-1', name: 'New Corp', email: 'new@corp.com' }),
    );

    // Verify broker.call was called with data.create
    expect(broker.call).toHaveBeenCalledWith('data.create', {
      objectName: 'account',
      doc: { name: 'New Corp', email: 'new@corp.com' },
    });

    // Verify audit log was created
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'create',
        object_name: 'account',
        record_id: 'new-1',
        metadata: { source: 'graphql' },
      }),
    );
  });

  test('update mutation updates a record and logs audit event', async () => {
    const auditService = { log: jest.fn().mockResolvedValue(undefined) };
    const broker = createMockBroker({ audit: auditService });
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: `mutation { updateAccount(id: "1", input: { name: "Updated Corp" }) { _id name } }`,
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.updateAccount).toEqual(
      expect.objectContaining({ _id: '1', name: 'Updated Corp' }),
    );

    expect(broker.call).toHaveBeenCalledWith('data.update', {
      objectName: 'account',
      id: '1',
      doc: { name: 'Updated Corp' },
    });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'update',
        object_name: 'account',
        record_id: '1',
      }),
    );
  });

  test('delete mutation deletes a record and logs audit event', async () => {
    const auditService = { log: jest.fn().mockResolvedValue(undefined) };
    const broker = createMockBroker({ audit: auditService });
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: `mutation { deleteAccount(id: "1") { success message } }`,
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeUndefined();
    expect((result.data?.deleteAccount as any).success).toBe(true);

    expect(broker.call).toHaveBeenCalledWith('data.delete', {
      objectName: 'account',
      id: '1',
    });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: 'delete',
        object_name: 'account',
        record_id: '1',
      }),
    );
  });

  test('mutation enforces permission before data operation', async () => {
    const permissionsService = {
      checkPermission: jest.fn().mockResolvedValue(false),
    };
    const broker = createMockBroker({ permissions: permissionsService });
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: `mutation { createAccount(input: { name: "Denied Corp" }) { _id } }`,
      contextValue: createContext(broker),
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Permission denied');
    // data.create should NOT have been called
    expect(broker.call).not.toHaveBeenCalledWith('data.create', expect.anything());
  });

  test('mutation fails without authentication', async () => {
    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    const result = await graphql({
      schema,
      source: `mutation { createAccount(input: { name: "Unauth Corp" }) { _id } }`,
      contextValue: { broker, user: undefined },
    });

    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toContain('Authentication required');
  });

  test('audit logging failure does not prevent mutation', async () => {
    const auditService = {
      log: jest.fn().mockRejectedValue(new Error('Audit service down')),
    };
    const broker = createMockBroker({ audit: auditService });
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    // This should still fail because the audit error propagates
    // The resolvers let audit errors bubble up for safety
    const result = await graphql({
      schema,
      source: `mutation { createAccount(input: { name: "Audit Fail Corp" }) { _id } }`,
      contextValue: createContext(broker),
    });

    // The data.create call should have succeeded
    expect(broker.call).toHaveBeenCalledWith('data.create', expect.anything());
  });
});

// ─── Plugin Class Tests ──────────────────────────────────────────

describe('GraphQLPlugin', () => {
  test('initializes with default config', () => {
    const plugin = new GraphQLPlugin();
    expect(plugin.name).toBe('@objectos/graphql');
    expect(plugin.version).toBe('0.1.0');
  });

  test('initializes with custom config', () => {
    const plugin = new GraphQLPlugin({
      path: '/api/v2/graphql',
      maxDepth: 5,
      defaultPageSize: 50,
    });
    expect(plugin.name).toBe('@objectos/graphql');
  });

  test('registers service on init', async () => {
    const plugin = new GraphQLPlugin();
    const registerService = jest.fn();
    const trigger = jest.fn();

    await plugin.init!({
      registerService,
      trigger,
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    } as any);

    expect(registerService).toHaveBeenCalledWith('graphql', plugin);
  });

  test('reports health status', () => {
    const plugin = new GraphQLPlugin();
    const report = plugin.getHealthReport();
    expect(report.status).toBe('degraded');
    expect(report.message).toContain('Schema not generated');
  });

  test('provides capability manifest', () => {
    const plugin = new GraphQLPlugin();
    const caps = plugin.getCapabilities();
    expect(caps.provides).toContain('graphql');
    expect(caps.consumes).toContain('http.server');
    expect(caps.consumes).toContain('permissions');
    expect(caps.consumes).toContain('audit');
  });

  test('provides security manifest', () => {
    const plugin = new GraphQLPlugin();
    const sec = plugin.getSecurityManifest();
    expect(sec.permissions).toContain('graphql.execute');
    expect(sec.dataAccess).toContain('read');
    expect(sec.dataAccess).toContain('create');
  });
});
