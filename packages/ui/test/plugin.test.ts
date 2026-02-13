/**
 * Tests for UI Plugin
 */

import { UIPlugin, getUIAPI } from '../src/index.js';
import type { PluginContext } from '@objectstack/runtime';

// ─── Mock helpers ──────────────────────────────────────────────────────────────

/** In-memory store used by the mock ObjectQL service */
function createInMemoryObjectQL() {
  const collections = new Map<string, Map<string, any>>();
  let idCounter = 0;

  const ensureCollection = (name: string) => {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name)!;
  };

  return {
    registerObject: jest.fn(),

    async insert(objectName: string, record: any) {
      const col = ensureCollection(objectName);
      const id = `id-${++idCounter}`;
      const doc = { ...record, _id: id };
      col.set(id, doc);
      return doc;
    },

    async update(objectName: string, id: string, data: any) {
      const col = ensureCollection(objectName);
      const existing = col.get(id);
      if (!existing) throw new Error('Not found');
      const updated = { ...existing, ...data, _id: id };
      col.set(id, updated);
      return updated;
    },

    async delete(objectName: string, id: string) {
      const col = ensureCollection(objectName);
      col.delete(id);
      return { _id: id };
    },

    async findOne(objectName: string, options: any) {
      const col = ensureCollection(objectName);
      const filters: any[][] = options?.filters ?? [];

      for (const doc of col.values()) {
        let match = true;
        for (const [field, op, value] of filters) {
          if (op === '=' && doc[field] !== value) match = false;
        }
        if (match) return doc;
      }
      return null;
    },

    async find(objectName: string, options: any) {
      const col = ensureCollection(objectName);
      const filters: any[][] = options?.filters ?? [];
      const results: any[] = [];

      for (const doc of col.values()) {
        let match = true;
        for (const [field, op, value] of filters) {
          if (op === '=' && doc[field] !== value) match = false;
        }
        if (match) results.push(doc);
      }

      const sort = options?.sort;
      if (sort && sort.length > 0) {
        const { field, order } = sort[0];
        results.sort((a, b) => {
          const cmp = String(a[field] ?? '').localeCompare(String(b[field] ?? ''));
          return order === 'desc' ? -cmp : cmp;
        });
      }

      return results;
    },
  };
}

function createMockContext(objectql?: ReturnType<typeof createInMemoryObjectQL>): {
  context: PluginContext;
  kernel: any;
} {
  const kernel = {
    getService: jest.fn(),
    services: new Map<string, any>(),
  };

  if (objectql) {
    kernel.services.set('objectql', objectql);
  }

  const context: PluginContext = {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    registerService: jest.fn((name: string, service: any) => {
      kernel.services.set(name, service);
      kernel.getService.mockImplementation((n: string) => {
        if (kernel.services.has(n)) return kernel.services.get(n);
        throw new Error(`Service ${n} not found`);
      });
    }),
    getService: jest.fn((name: string) => {
      if (kernel.services.has(name)) return kernel.services.get(name);
      throw new Error(`Service ${name} not found`);
    }),
    hasService: jest.fn((name: string) => kernel.services.has(name)),
    getServices: jest.fn(() => kernel.services),
    hook: jest.fn(),
    trigger: jest.fn(),
    getKernel: jest.fn(() => kernel),
  } as any;

  return { context, kernel };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('UI Plugin', () => {
  let plugin: UIPlugin;
  let objectql: ReturnType<typeof createInMemoryObjectQL>;
  let mockContext: PluginContext;
  let mockKernel: any;

  beforeEach(async () => {
    objectql = createInMemoryObjectQL();
    const mock = createMockContext(objectql);
    mockContext = mock.context;
    mockKernel = mock.kernel;

    plugin = new UIPlugin();
    await plugin.init(mockContext);
    await plugin.start(mockContext);
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  // ─── Plugin Metadata ───────────────────────────────────────────────────────

  describe('Plugin Metadata', () => {
    it('should have correct plugin metadata', () => {
      expect(plugin.name).toBe('@objectos/ui');
      expect(plugin.version).toBe('0.1.0');
      expect(plugin.dependencies).toEqual([]);
    });
  });

  // ─── Plugin Lifecycle ──────────────────────────────────────────────────────

  describe('Plugin Lifecycle', () => {
    it('should initialize and register the ui service', async () => {
      expect(mockContext.registerService).toHaveBeenCalledWith('ui', plugin);
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initialized successfully'),
      );
    });

    it('should start successfully', async () => {
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Started successfully'),
      );
    });

    it('should destroy successfully', async () => {
      await plugin.destroy();
      expect(mockContext.logger.info).toHaveBeenCalledWith(expect.stringContaining('Destroyed'));
    });
  });

  // ─── View CRUD ─────────────────────────────────────────────────────────────

  describe('View CRUD', () => {
    it('should save a new view definition', async () => {
      const def = { type: 'grid', columns: ['name', 'status'] };
      const result = await plugin.saveView('test_list', 'account', def);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.name).toBe('test_list');
      expect(result.object_name).toBe('account');
      expect(result.definition).toEqual(def);
    });

    it('should update an existing view definition', async () => {
      const def1 = { type: 'grid', columns: ['name'] };
      await plugin.saveView('update_view', 'account', def1);

      const def2 = { type: 'grid', columns: ['name', 'status', 'owner'] };
      const updated = await plugin.saveView('update_view', 'account', def2);

      expect(updated.definition).toEqual(def2);
    });

    it('should load a view by name', async () => {
      const def = { type: 'kanban', columns: ['name'] };
      await plugin.saveView('kanban_view', 'opportunity', def);

      const loaded = await plugin.loadView('kanban_view');
      expect(loaded).toBeDefined();
      expect(loaded!.name).toBe('kanban_view');
      expect(loaded!.definition).toEqual(def);
    });

    it('should return null for non-existent view', async () => {
      const loaded = await plugin.loadView('does_not_exist');
      expect(loaded).toBeNull();
    });

    it('should list views for an object', async () => {
      await plugin.saveView('view_a', 'contact', { type: 'grid', columns: ['name'] });
      await plugin.saveView('view_b', 'contact', { type: 'kanban', columns: ['name'] });
      await plugin.saveView('other_view', 'account', { type: 'grid', columns: ['name'] });

      const views = await plugin.listViewsByObject('contact');
      expect(views).toHaveLength(2);
      // sorted by name ascending
      expect(views[0].name).toBe('view_a');
      expect(views[1].name).toBe('view_b');
    });

    it('should delete a view', async () => {
      await plugin.saveView('to_delete', 'account', { type: 'grid', columns: [] });
      const deleted = await plugin.deleteView('to_delete');
      expect(deleted).toBe(true);

      const loaded = await plugin.loadView('to_delete');
      expect(loaded).toBeNull();
    });

    it('should return false when deleting non-existent view', async () => {
      const deleted = await plugin.deleteView('nope');
      expect(deleted).toBe(false);
    });

    it('should preserve complex nested definition', async () => {
      const def = {
        type: 'kanban',
        columns: ['name', 'amount'],
        kanban: { groupByField: 'stage', summarizeField: 'amount', columns: ['name'] },
        pagination: { pageSize: 50, pageSizeOptions: [25, 50, 100] },
        virtualScroll: true,
      };

      await plugin.saveView('complex_view', 'opportunity', def);
      const loaded = await plugin.loadView('complex_view');

      expect(loaded!.definition).toEqual(def);
      expect((loaded!.definition as any).kanban.groupByField).toBe('stage');
      expect((loaded!.definition as any).pagination.pageSize).toBe(50);
      expect((loaded!.definition as any).virtualScroll).toBe(true);
    });
  });

  // ─── Error handling ────────────────────────────────────────────────────────

  describe('Error handling', () => {
    it('should throw if ObjectQL not available', async () => {
      const noOqlPlugin = new UIPlugin();
      const { context } = createMockContext(); // no objectql
      await noOqlPlugin.init(context);

      await expect(noOqlPlugin.saveView('x', 'y', {})).rejects.toThrow(
        'ObjectQL service not available',
      );
    });
  });
});

// ─── Kernel Compliance ─────────────────────────────────────────────────────────

describe('Kernel Compliance', () => {
  let plugin: UIPlugin;
  let context: PluginContext;

  beforeEach(async () => {
    const objectql = createInMemoryObjectQL();
    const mock = createMockContext(objectql);
    context = mock.context;
    plugin = new UIPlugin();
    await plugin.init(context);
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  describe('healthCheck()', () => {
    it('should return healthy when ObjectQL is available', async () => {
      const report = await plugin.healthCheck();
      expect(report.status).toBe('healthy');
      expect(report.metrics?.uptime).toBeGreaterThanOrEqual(0);
      expect(report.checks).toHaveLength(1);
      expect(report.checks![0].name).toBe('objectql-backend');
    });

    it('should return degraded when ObjectQL is not available', async () => {
      const noOqlPlugin = new UIPlugin();
      const { context: ctx } = createMockContext();
      await noOqlPlugin.init(ctx);

      const report = await noOqlPlugin.healthCheck();
      expect(report.status).toBe('degraded');
    });
  });

  describe('getManifest()', () => {
    it('should return capability and security manifests', () => {
      const manifest = plugin.getManifest();
      expect(manifest.capabilities).toBeDefined();
      expect(manifest.security).toBeDefined();
      expect(manifest.security.pluginId).toBe('ui');
    });
  });

  describe('getStartupResult()', () => {
    it('should return successful startup result', () => {
      const result = plugin.getStartupResult();
      expect(result.plugin.name).toBe('@objectos/ui');
      expect(result.success).toBe(true);
    });
  });
});

// ─── Helper ────────────────────────────────────────────────────────────────────

describe('getUIAPI helper', () => {
  it('should return the UI service from kernel', async () => {
    const objectql = createInMemoryObjectQL();
    const { context, kernel } = createMockContext(objectql);
    const plugin = new UIPlugin();
    await plugin.init(context);

    const api = getUIAPI(kernel);
    expect(api).toBe(plugin);
  });

  it('should return null when UI service is not registered', () => {
    const kernel = {
      getService: jest.fn(() => {
        throw new Error('not found');
      }),
    };
    const api = getUIAPI(kernel);
    expect(api).toBeNull();
  });
});

// ─── Contract Compliance (IUIService) ──────────────────────────────────────────

describe('Contract Compliance (IUIService)', () => {
  let plugin: UIPlugin;

  beforeEach(async () => {
    const objectql = createInMemoryObjectQL();
    const { context } = createMockContext(objectql);
    plugin = new UIPlugin();
    await plugin.init(context);
    await plugin.start(context);
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  describe('registerView() / getView()', () => {
    it('should register and retrieve a view definition', () => {
      const def = { type: 'grid', columns: ['name'] };
      plugin.registerView('contract-view', def);
      const retrieved = plugin.getView('contract-view');
      expect(retrieved).toEqual(def);
    });

    it('should return undefined for unregistered view', () => {
      expect(plugin.getView('nonexistent')).toBeUndefined();
    });
  });

  describe('listViews()', () => {
    it('should return an array', () => {
      const views = plugin.listViews();
      expect(Array.isArray(views)).toBe(true);
    });

    it('should include registered views', () => {
      plugin.registerView('lv-1', { type: 'grid', object_name: 'account' });
      const views = plugin.listViews();
      expect(views.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('registerDashboard() / getDashboard() / listDashboards()', () => {
    it('should register and retrieve a dashboard', () => {
      const def = { title: 'Sales', widgets: [] };
      plugin.registerDashboard('sales-dash', def);
      expect(plugin.getDashboard('sales-dash')).toEqual(def);
    });

    it('should list dashboards as an array', () => {
      plugin.registerDashboard('d1', { title: 'D1' });
      const dashboards = plugin.listDashboards();
      expect(Array.isArray(dashboards)).toBe(true);
      expect(dashboards.length).toBeGreaterThanOrEqual(1);
    });
  });
});
