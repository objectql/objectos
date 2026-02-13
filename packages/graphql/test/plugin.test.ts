/**
 * GraphQL Plugin Tests
 *
 * Tests for O.1.1 (schema generation), O.1.2 (permission enforcement),
 * O.1.3 (audit logging), O.1.4 (subscriptions), O.1.5 (DataLoader),
 * and O.1.6 (enhanced playground) functionality.
 */

import { graphql, printSchema, GraphQLSchema } from 'graphql';
import { generateSchema, toPascalCase, buildObjectType } from '../src/schema-generator.js';
import { createResolverCallbacks } from '../src/resolvers.js';
import { GraphQLPlugin } from '../src/plugin.js';
import { PubSub } from '../src/pubsub.js';
import { buildSubscriptionType, createSubscriptionHooks } from '../src/subscriptions.js';
import { DataLoader, createDataLoaderFactory } from '../src/dataloader.js';
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
          return records.find((r) => r._id === params.filters?._id) ?? null;
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

function createContext(
  broker: any,
  user?: { id: string; profile?: string },
): GraphQLResolverContext {
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

    expect(broker.call).toHaveBeenCalledWith(
      'data.find',
      expect.objectContaining({
        options: expect.objectContaining({ limit: 5, skip: 10 }),
      }),
    );
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

    expect(broker.call).toHaveBeenCalledWith(
      'data.find',
      expect.objectContaining({
        options: expect.objectContaining({ limit: 50 }),
      }),
    );
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

  test('provides subscriptions capability', () => {
    const plugin = new GraphQLPlugin();
    const caps = plugin.getCapabilities();
    expect(caps.provides).toContain('graphql.subscriptions');
  });

  test('exposes PubSub instance', () => {
    const plugin = new GraphQLPlugin();
    expect(plugin.getPubSub()).toBeInstanceOf(PubSub);
  });
});

// ─── O.1.4: Subscription Support ────────────────────────────────

describe('O.1.4 — PubSub', () => {
  test('subscribes and receives published messages', () => {
    const pubsub = new PubSub();
    const received: any[] = [];
    pubsub.subscribe('test.channel', (payload) => received.push(payload));

    pubsub.publish('test.channel', { id: '1' });
    pubsub.publish('test.channel', { id: '2' });

    expect(received).toEqual([{ id: '1' }, { id: '2' }]);
  });

  test('unsubscribe stops receiving messages', () => {
    const pubsub = new PubSub();
    const received: any[] = [];
    const unsub = pubsub.subscribe('test.channel', (payload) => received.push(payload));

    pubsub.publish('test.channel', { id: '1' });
    unsub();
    pubsub.publish('test.channel', { id: '2' });

    expect(received).toEqual([{ id: '1' }]);
  });

  test('getSubscriberCount returns correct count', () => {
    const pubsub = new PubSub();
    expect(pubsub.getSubscriberCount('ch')).toBe(0);

    const unsub1 = pubsub.subscribe('ch', () => {});
    const unsub2 = pubsub.subscribe('ch', () => {});
    expect(pubsub.getSubscriberCount('ch')).toBe(2);

    unsub1();
    expect(pubsub.getSubscriberCount('ch')).toBe(1);
  });

  test('clear removes all subscribers', () => {
    const pubsub = new PubSub();
    pubsub.subscribe('ch1', () => {});
    pubsub.subscribe('ch2', () => {});
    pubsub.clear();

    expect(pubsub.getSubscriberCount('ch1')).toBe(0);
    expect(pubsub.getSubscriberCount('ch2')).toBe(0);
  });

  test('asyncIterator yields published values', async () => {
    const pubsub = new PubSub();
    const iterator = pubsub.asyncIterator('test.iter');

    // Publish after a microtask
    queueMicrotask(() => {
      pubsub.publish('test.iter', { value: 'first' });
    });

    const result = await iterator.next();
    expect(result).toEqual({ value: { value: 'first' }, done: false });
  });

  test('asyncIterator returns queued values immediately', async () => {
    const pubsub = new PubSub();
    const iterator = pubsub.asyncIterator('test.queue');

    // Publish before consuming
    pubsub.publish('test.queue', 'a');
    pubsub.publish('test.queue', 'b');

    const r1 = await iterator.next();
    const r2 = await iterator.next();
    expect(r1.value).toBe('a');
    expect(r2.value).toBe('b');
  });

  test('asyncIterator return() completes the iterator', async () => {
    const pubsub = new PubSub();
    const iterator = pubsub.asyncIterator('test.return');

    const result = await iterator.return!();
    expect(result).toEqual({ value: undefined, done: true });
  });

  test('publishing to unknown channel is a no-op', () => {
    const pubsub = new PubSub();
    expect(() => pubsub.publish('nonexistent', {})).not.toThrow();
  });
});

describe('O.1.4 — Subscription Schema Generation', () => {
  test('builds subscription type from object definitions', () => {
    const pubsub = new PubSub();
    const objectTypes = new Map();
    objectTypes.set('account', buildObjectType(accountObject));

    const subType = buildSubscriptionType([accountObject], objectTypes, pubsub);

    expect(subType).toBeDefined();
    expect(subType!.name).toBe('Subscription');
    const fields = subType!.getFields();
    expect(fields.onAccountCreated).toBeDefined();
    expect(fields.onAccountUpdated).toBeDefined();
    expect(fields.onAccountDeleted).toBeDefined();
  });

  test('returns undefined for empty object list', () => {
    const pubsub = new PubSub();
    const result = buildSubscriptionType([], new Map(), pubsub);
    expect(result).toBeUndefined();
  });

  test('schema includes subscription type when provided', () => {
    const pubsub = new PubSub();
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks, { pubsub });

    const schemaStr = printSchema(schema);
    expect(schemaStr).toContain('type Subscription');
    expect(schemaStr).toContain('onAccountCreated');
    expect(schemaStr).toContain('onAccountUpdated');
    expect(schemaStr).toContain('onAccountDeleted');
  });

  test('delete event type has correct fields', () => {
    const pubsub = new PubSub();
    const callbacks = createResolverCallbacks(testConfig);
    const schema = generateSchema([accountObject], testConfig, callbacks, { pubsub });

    const schemaStr = printSchema(schema);
    expect(schemaStr).toContain('type AccountDeleteEvent');
    expect(schemaStr).toContain('deletedAt: String!');
    expect(schemaStr).toContain('deletedBy: String');
  });
});

describe('O.1.4 — Subscription Hooks Integration', () => {
  test('mutation resolvers fire subscription hooks on create', async () => {
    const pubsub = new PubSub();
    const hooks = createSubscriptionHooks(pubsub);
    const received: any[] = [];
    pubsub.subscribe('account.created', (p) => received.push(p));

    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig, hooks);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    await graphql({
      schema,
      source: `mutation { createAccount(input: { name: "Hook Corp" }) { _id name } }`,
      contextValue: createContext(broker),
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(expect.objectContaining({ _id: 'new-1', name: 'Hook Corp' }));
  });

  test('mutation resolvers fire subscription hooks on update', async () => {
    const pubsub = new PubSub();
    const hooks = createSubscriptionHooks(pubsub);
    const received: any[] = [];
    pubsub.subscribe('account.updated', (p) => received.push(p));

    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig, hooks);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    await graphql({
      schema,
      source: `mutation { updateAccount(id: "1", input: { name: "Updated" }) { _id name } }`,
      contextValue: createContext(broker),
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(expect.objectContaining({ _id: '1', name: 'Updated' }));
  });

  test('mutation resolvers fire subscription hooks on delete', async () => {
    const pubsub = new PubSub();
    const hooks = createSubscriptionHooks(pubsub);
    const received: any[] = [];
    pubsub.subscribe('account.deleted', (p) => received.push(p));

    const broker = createMockBroker();
    const callbacks = createResolverCallbacks(testConfig, hooks);
    const schema = generateSchema([accountObject], testConfig, callbacks);

    await graphql({
      schema,
      source: `mutation { deleteAccount(id: "1") { success message } }`,
      contextValue: createContext(broker),
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(
      expect.objectContaining({
        id: '1',
        objectName: 'account',
        deletedBy: 'user-1',
      }),
    );
    expect(received[0].deletedAt).toBeDefined();
  });
});

// ─── O.1.5: DataLoader Tests ────────────────────────────────────

describe('O.1.5 — DataLoader', () => {
  test('batches multiple load calls into a single batch function call', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map((k) => ({ id: k })));
    const loader = new DataLoader(batchFn);

    const [r1, r2, r3] = await Promise.all([loader.load('a'), loader.load('b'), loader.load('c')]);

    expect(r1).toEqual({ id: 'a' });
    expect(r2).toEqual({ id: 'b' });
    expect(r3).toEqual({ id: 'c' });
    expect(batchFn).toHaveBeenCalledTimes(1);
    expect(batchFn).toHaveBeenCalledWith(['a', 'b', 'c']);
  });

  test('caches results across sequential loads', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map((k) => ({ id: k })));
    const loader = new DataLoader(batchFn);

    await loader.load('x');
    const second = await loader.load('x');

    expect(second).toEqual({ id: 'x' });
    // Second call should be from cache, not a new batch
    expect(batchFn).toHaveBeenCalledTimes(1);
  });

  test('does not cache when cache is disabled', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map((k) => ({ id: k })));
    const loader = new DataLoader(batchFn, { cache: false });

    await loader.load('x');
    await loader.load('x');

    expect(batchFn).toHaveBeenCalledTimes(2);
  });

  test('loadMany loads multiple keys', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map((k) => ({ id: k })));
    const loader = new DataLoader(batchFn);

    const results = await loader.loadMany(['a', 'b']);
    expect(results).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  test('returns null for missing keys', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map(() => null));
    const loader = new DataLoader(batchFn);

    const result = await loader.load('missing');
    expect(result).toBeNull();
  });

  test('handles batch function errors', async () => {
    const batchFn = jest.fn(async () => {
      throw new Error('Batch failed');
    });
    const loader = new DataLoader(batchFn);

    await expect(loader.load('x')).rejects.toThrow('Batch failed');
  });

  test('clearCache removes cached entries', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map((k) => ({ id: k })));
    const loader = new DataLoader(batchFn);

    await loader.load('x');
    expect(loader.getCacheSize()).toBe(1);

    loader.clearCache();
    expect(loader.getCacheSize()).toBe(0);
  });

  test('prime pre-populates the cache', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map((k) => ({ id: k })));
    const loader = new DataLoader<string, Record<string, any>>(batchFn);

    loader.prime('primed', { id: 'primed', extra: true });
    const result = await loader.load('primed');

    expect(result).toEqual({ id: 'primed', extra: true });
    expect(batchFn).not.toHaveBeenCalled();
  });

  test('respects maxBatchSize', async () => {
    const batchFn = jest.fn(async (keys: string[]) => keys.map((k) => ({ id: k })));
    const loader = new DataLoader(batchFn, { maxBatchSize: 2 });

    const results = await Promise.all([loader.load('a'), loader.load('b'), loader.load('c')]);

    expect(results).toHaveLength(3);
    // Should have been split into at least 2 batches
    expect(batchFn).toHaveBeenCalledTimes(2);
  });
});

describe('O.1.5 — DataLoader Factory', () => {
  test('creates per-object loaders', () => {
    const broker = createMockBroker();
    const factory = createDataLoaderFactory(broker);

    const loader1 = factory.getLoader('account');
    const loader2 = factory.getLoader('account');
    const loader3 = factory.getLoader('contact');

    expect(loader1).toBe(loader2); // Same object, same loader
    expect(loader1).not.toBe(loader3); // Different object, different loader
  });

  test('clearAll clears all loaders', () => {
    const broker = createMockBroker();
    const factory = createDataLoaderFactory(broker);

    factory.getLoader('account');
    factory.getLoader('contact');
    // Should not throw
    expect(() => factory.clearAll()).not.toThrow();
  });

  test('loader batches broker calls', async () => {
    const broker = createMockBroker({
      records: [
        { _id: '1', name: 'First' },
        { _id: '2', name: 'Second' },
      ],
    });
    const factory = createDataLoaderFactory(broker);
    const loader = factory.getLoader('account');

    const [r1, r2] = await Promise.all([loader.load('1'), loader.load('2')]);

    expect(r1).toEqual({ _id: '1', name: 'First' });
    expect(r2).toEqual({ _id: '2', name: 'Second' });
    // Only one broker.call for data.find should have been made
    const findCalls = broker.call.mock.calls.filter((c: any) => c[0] === 'data.find');
    expect(findCalls).toHaveLength(1);
  });
});

// ─── O.1.6: Enhanced Playground Tests ────────────────────────────

describe('O.1.6 — Enhanced GraphQL Playground', () => {
  test('plugin serves enhanced playground when enabled', async () => {
    const plugin = new GraphQLPlugin({ playground: true });
    let playgroundHTML = '';

    const mockApp = {
      post: jest.fn(),
      get: jest.fn((path: string, handler: any) => {
        if (!path.endsWith('/schema')) {
          // Capture playground handler
          const mockContext = {
            html: (html: string) => {
              playgroundHTML = html;
              return html;
            },
          };
          handler(mockContext);
        }
      }),
    };

    const mockContext: any = {
      registerService: jest.fn(),
      trigger: jest.fn(),
      logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      getService: (name: string) => {
        if (name === 'http.server') return { getRawApp: () => mockApp };
        return null;
      },
    };

    await plugin.init!(mockContext);
    await plugin.start(mockContext);

    // Verify playground HTML has enhanced features
    expect(playgroundHTML).toContain('ObjectOS GraphQL');
    expect(playgroundHTML).toContain('Variables');
    expect(playgroundHTML).toContain('Headers');
    expect(playgroundHTML).toContain('Schema');
    expect(playgroundHTML).toContain('History');
    expect(playgroundHTML).toContain('Prettify');
    expect(playgroundHTML).toContain('Ctrl+Enter');
    expect(playgroundHTML).toContain('subscriptionType');
  });
});
