/**
 * Hook System Integration Tests
 *
 * Tests the standardized hook naming convention and hook execution
 */

import type { PluginContext } from '@objectstack/runtime';

// Mock context for testing hooks
const createMockContext = (): { context: PluginContext; hooks: Map<string, Function[]> } => {
  const hooks: Map<string, Function[]> = new Map();
  const services = new Map();

  const context: PluginContext = {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
    registerService: vi.fn((name: string, service: any) => {
      services.set(name, service);
    }),
    getService: vi.fn((name: string) => {
      if (services.has(name)) return services.get(name);
      throw new Error(`Service ${name} not found`);
    }),
    hasService: vi.fn((name: string) => services.has(name)),
    getServices: vi.fn(() => services),
    hook: vi.fn((name: string, handler: Function) => {
      if (!hooks.has(name)) {
        hooks.set(name, []);
      }
      hooks.get(name)!.push(handler);
    }),
    trigger: vi.fn(async (name: string, ...args: any[]) => {
      const handlers = hooks.get(name) || [];
      for (const handler of handlers) {
        await handler(...args);
      }
    }),
    getKernel: vi.fn(() => ({ getService: context.getService })),
  } as any;

  return { context, hooks };
};

describe('Hook System Integration Tests', () => {
  let context: PluginContext;
  let hooks: Map<string, Function[]>;

  beforeEach(() => {
    const mock = createMockContext();
    context = mock.context;
    hooks = mock.hooks;
  });

  describe('Data Hooks - Standard Names', () => {
    it('should register and trigger data.beforeInsert hook', async () => {
      const hookHandler = vi.fn(async (payload) => {
        expect(payload.object).toBe('accounts');
        expect(payload.data).toBeDefined();
      });

      context.hook('data.beforeInsert', hookHandler);

      await context.trigger('data.beforeInsert', {
        object: 'accounts',
        data: { name: 'Test Account' },
        userId: 'user123',
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and trigger data.afterInsert hook', async () => {
      const hookHandler = vi.fn(async (payload) => {
        expect(payload.object).toBe('contacts');
        expect(payload.id).toBe('contact123');
      });

      context.hook('data.afterInsert', hookHandler);

      await context.trigger('data.afterInsert', {
        object: 'contacts',
        id: 'contact123',
        data: { name: 'John Doe' },
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and trigger data.beforeUpdate hook', async () => {
      const hookHandler = vi.fn(async (payload) => {
        expect(payload.previousData).toBeDefined();
        expect(payload.data).toBeDefined();
      });

      context.hook('data.beforeUpdate', hookHandler);

      await context.trigger('data.beforeUpdate', {
        object: 'accounts',
        id: 'acc123',
        data: { status: 'active' },
        previousData: { status: 'inactive' },
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and trigger data.afterDelete hook', async () => {
      const hookHandler = vi.fn();

      context.hook('data.afterDelete', hookHandler);

      await context.trigger('data.afterDelete', {
        object: 'contacts',
        id: 'contact123',
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('HTTP Hooks - Standard Names', () => {
    it('should register and trigger http.beforeStart hook', async () => {
      const hookHandler = vi.fn(async (payload) => {
        expect(payload.port).toBe(3000);
      });

      context.hook('http.beforeStart', hookHandler);

      await context.trigger('http.beforeStart', {
        port: 3000,
        host: 'localhost',
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and trigger http.beforeRequest hook', async () => {
      const hookHandler = vi.fn();

      context.hook('http.beforeRequest', hookHandler);

      await context.trigger('http.beforeRequest', {
        method: 'GET',
        path: '/api/users',
        headers: { 'content-type': 'application/json' },
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and trigger http.error hook', async () => {
      const hookHandler = vi.fn();

      context.hook('http.error', hookHandler);

      await context.trigger('http.error', {
        method: 'GET',
        path: '/api/users',
        statusCode: 500,
        error: new Error('Internal Server Error'),
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Job Hooks - Standard Names', () => {
    it('should register and trigger job.beforeExecute hook', async () => {
      const hookHandler = vi.fn();

      context.hook('job.beforeExecute', hookHandler);

      await context.trigger('job.beforeExecute', {
        jobId: 'job123',
        jobType: 'email-campaign',
        data: { campaignId: 'campaign456' },
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and trigger job.afterExecute hook', async () => {
      const hookHandler = vi.fn();

      context.hook('job.afterExecute', hookHandler);

      await context.trigger('job.afterExecute', {
        jobId: 'job123',
        jobType: 'data-import',
        result: { recordsImported: 100 },
        duration: 5000,
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });

    it('should register and trigger job.failed hook', async () => {
      const hookHandler = vi.fn();

      context.hook('job.failed', hookHandler);

      await context.trigger('job.failed', {
        jobId: 'job123',
        jobType: 'email-send',
        error: new Error('SMTP connection failed'),
        retryCount: 2,
        timestamp: new Date().toISOString(),
      });

      expect(hookHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook Execution Order', () => {
    it('should execute multiple hooks in registration order', async () => {
      const executionOrder: number[] = [];

      context.hook('data.beforeInsert', async () => {
        executionOrder.push(1);
      });

      context.hook('data.beforeInsert', async () => {
        executionOrder.push(2);
      });

      context.hook('data.beforeInsert', async () => {
        executionOrder.push(3);
      });

      await context.trigger('data.beforeInsert', {
        object: 'accounts',
        data: {},
        timestamp: new Date().toISOString(),
      });

      expect(executionOrder).toEqual([1, 2, 3]);
    });
  });
});
