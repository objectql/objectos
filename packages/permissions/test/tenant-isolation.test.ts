/**
 * Tests for Multi-tenancy Data Isolation
 *
 * Validates that the PermissionsPlugin correctly applies tenant-scoped
 * filtering and stamping when tenantIsolation is enabled.
 */

import { PermissionsPlugin } from '../src/plugin.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { PluginContext } from '@objectstack/runtime';

// Mock PluginContext (vitest pattern — matches plugin.test.ts)
function createMockContext(): { context: PluginContext; hooks: Map<string, Function[]> } {
  const services = new Map<string, any>();
  const hooks = new Map<string, Function[]>();

  const context: PluginContext = {
    registerService: vi.fn((name: string, service: any) => {
      services.set(name, service);
    }),
    getService: vi.fn((name: string) => {
      const service = services.get(name);
      if (!service) throw new Error(`Service ${name} not found`);
      return service;
    }) as any,
    getServices: vi.fn(() => services),
    hook: vi.fn((name: string, handler: Function) => {
      if (!hooks.has(name)) hooks.set(name, []);
      hooks.get(name)!.push(handler);
    }),
    trigger: vi.fn(async (name: string, ...args: any[]) => {
      const handlers = hooks.get(name) || [];
      for (const handler of handlers) {
        await handler(...args);
      }
    }),
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    getKernel: vi.fn(),
    replaceService: vi.fn((name: string, service: any) => {
      services.set(name, service);
    }),
  } as any;

  return { context, hooks };
}

/**
 * Fire the named hook with data, return (possibly-mutated) data
 */
async function fireHook(hooks: Map<string, Function[]>, name: string, data: any): Promise<any> {
  const handlers = hooks.get(name) || [];
  for (const handler of handlers) {
    await handler(data);
  }
  return data;
}

describe('Multi-tenancy Data Isolation', () => {
  describe('when tenantIsolation is enabled', () => {
    let plugin: PermissionsPlugin;
    let hooks: Map<string, Function[]>;

    beforeEach(async () => {
      plugin = new PermissionsPlugin({
        enabled: false, // disable permission checking so we only test tenant isolation
        tenantIsolation: true,
        tenantField: '_organizationId',
      });

      const mock = createMockContext();
      hooks = mock.hooks;
      await plugin.init(mock.context);
    });

    // ─── Write Operations ──────────────────────────────────────────

    it('should stamp tenant field on create (doc)', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-123',
        doc: { name: 'Acme Corp' },
      };

      await fireHook(hooks, 'data.beforeCreate', data);

      expect(data.doc._organizationId).toBe('org-123');
    });

    it('should stamp tenant field on create (record)', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-456',
        record: { name: 'Globex' },
      };

      await fireHook(hooks, 'data.beforeCreate', data);

      expect(data.record._organizationId).toBe('org-456');
    });

    it('should stamp tenant field on update', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-789',
        doc: { name: 'Updated Name' },
      };

      await fireHook(hooks, 'data.beforeUpdate', data);

      expect(data.doc._organizationId).toBe('org-789');
    });

    // ─── Read Operations ───────────────────────────────────────────

    it('should add tenant filter on find', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-123',
        filters: { status: 'active' },
      };

      await fireHook(hooks, 'data.beforeFind', data);

      expect(data.filters._organizationId).toBe('org-123');
      // Existing filters should be preserved
      expect(data.filters.status).toBe('active');
    });

    it('should add tenant filter on delete', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-123',
        filters: {},
      };

      await fireHook(hooks, 'data.beforeDelete', data);

      expect(data.filters._organizationId).toBe('org-123');
    });

    // ─── Metadata Fallback ─────────────────────────────────────────

    it('should extract organizationId from metadata if not top-level', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        metadata: { organizationId: 'org-meta-1' },
        filters: {},
      };

      await fireHook(hooks, 'data.beforeFind', data);

      expect(data.filters._organizationId).toBe('org-meta-1');
    });

    // ─── No Organization ──────────────────────────────────────────

    it('should not add tenant filter when no organizationId is present', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        filters: { status: 'active' },
      };

      await fireHook(hooks, 'data.beforeFind', data);

      expect(data.filters._organizationId).toBeUndefined();
      expect(data.filters.status).toBe('active');
    });

    it('should not stamp doc when no organizationId is present', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        doc: { name: 'No Org' },
      };

      await fireHook(hooks, 'data.beforeCreate', data);

      expect(data.doc._organizationId).toBeUndefined();
    });
  });

  describe('when tenantIsolation is disabled', () => {
    let plugin: PermissionsPlugin;
    let hooks: Map<string, Function[]>;

    beforeEach(async () => {
      plugin = new PermissionsPlugin({
        enabled: false,
        tenantIsolation: false,
      });

      const mock = createMockContext();
      hooks = mock.hooks;
      await plugin.init(mock.context);
    });

    it('should not add tenant filter on find', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-123',
        filters: { status: 'active' },
      };

      await fireHook(hooks, 'data.beforeFind', data);

      expect(data.filters._organizationId).toBeUndefined();
    });

    it('should not stamp doc on create', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-123',
        doc: { name: 'Test' },
      };

      await fireHook(hooks, 'data.beforeCreate', data);

      expect(data.doc._organizationId).toBeUndefined();
    });
  });

  describe('custom tenantField', () => {
    let plugin: PermissionsPlugin;
    let hooks: Map<string, Function[]>;

    beforeEach(async () => {
      plugin = new PermissionsPlugin({
        enabled: false,
        tenantIsolation: true,
        tenantField: 'tenant_id',
      });

      const mock = createMockContext();
      hooks = mock.hooks;
      await plugin.init(mock.context);
    });

    it('should use custom tenant field name on write', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-custom',
        doc: { name: 'Custom Field' },
      };

      await fireHook(hooks, 'data.beforeCreate', data);

      expect(data.doc.tenant_id).toBe('org-custom');
      expect(data.doc._organizationId).toBeUndefined();
    });

    it('should use custom tenant field name on read', async () => {
      const data: any = {
        objectName: 'lead',
        userId: 'user-1',
        organizationId: 'org-custom',
        filters: {},
      };

      await fireHook(hooks, 'data.beforeFind', data);

      expect(data.filters.tenant_id).toBe('org-custom');
      expect(data.filters._organizationId).toBeUndefined();
    });
  });
});
