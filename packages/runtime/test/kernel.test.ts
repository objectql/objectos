/**
 * ObjectKernel Tests
 */

import { ObjectKernel } from '../src/kernel';
import type { Plugin, PluginContext } from '../src/types';

describe('ObjectKernel', () => {
  let kernel: ObjectKernel;

  beforeEach(() => {
    kernel = new ObjectKernel();
  });

  afterEach(async () => {
    if (kernel) {
      await kernel.shutdown();
    }
  });

  describe('Plugin Registration', () => {
    it('should register a plugin', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
      };

      kernel.use(plugin);
      expect(kernel.hasService).toBeDefined();
    });

    it('should allow chaining', () => {
      const plugin1: Plugin = { name: 'plugin1' };
      const plugin2: Plugin = { name: 'plugin2' };

      const result = kernel.use(plugin1).use(plugin2);
      expect(result).toBe(kernel);
    });

    it('should not register duplicate plugins', () => {
      const plugin: Plugin = { name: 'test-plugin' };

      kernel.use(plugin);
      kernel.use(plugin);

      // Should only log a warning, not throw
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should call init and start hooks', async () => {
      const initMock = jest.fn();
      const startMock = jest.fn();

      const plugin: Plugin = {
        name: 'test-plugin',
        init: initMock,
        start: startMock,
      };

      kernel.use(plugin);
      await kernel.bootstrap();

      expect(initMock).toHaveBeenCalled();
      expect(startMock).toHaveBeenCalled();
    });

    it('should call destroy hook on shutdown', async () => {
      const destroyMock = jest.fn();

      const plugin: Plugin = {
        name: 'test-plugin',
        destroy: destroyMock,
      };

      kernel.use(plugin);
      await kernel.bootstrap();
      await kernel.shutdown();

      expect(destroyMock).toHaveBeenCalled();
    });

    it('should handle plugins without hooks', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
      };

      kernel.use(plugin);
      await expect(kernel.bootstrap()).resolves.not.toThrow();
    });
  });

  describe('Service Registry', () => {
    it('should register and retrieve services', async () => {
      const testService = { value: 'test' };

      const plugin: Plugin = {
        name: 'test-plugin',
        init: (ctx: PluginContext) => {
          ctx.registerService('test-service', testService);
        },
      };

      kernel.use(plugin);
      await kernel.bootstrap();

      expect(kernel.hasService('test-service')).toBe(true);
      expect(kernel.getService('test-service')).toBe(testService);
    });

    it('should throw when getting non-existent service', async () => {
      await kernel.bootstrap();
      expect(() => kernel.getService('non-existent')).toThrow();
    });
  });

  describe('Event System', () => {
    it('should trigger hooks', async () => {
      const hookMock = jest.fn();

      const plugin: Plugin = {
        name: 'test-plugin',
        init: (ctx: PluginContext) => {
          ctx.hook('kernel:ready', hookMock);
        },
      };

      kernel.use(plugin);
      await kernel.bootstrap();

      expect(hookMock).toHaveBeenCalled();
    });

    it('should handle multiple hook handlers', async () => {
      const hook1Mock = jest.fn();
      const hook2Mock = jest.fn();

      const plugin1: Plugin = {
        name: 'plugin1',
        init: (ctx: PluginContext) => {
          ctx.hook('custom-event', hook1Mock);
        },
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        init: (ctx: PluginContext) => {
          ctx.hook('custom-event', hook2Mock);
        },
      };

      kernel.use(plugin1).use(plugin2);
      await kernel.bootstrap();
      
      await kernel.pluginContext.trigger('custom-event');

      expect(hook1Mock).toHaveBeenCalled();
      expect(hook2Mock).toHaveBeenCalled();
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve plugin dependencies', async () => {
      const initOrder: string[] = [];

      const plugin1: Plugin = {
        name: 'plugin1',
        init: () => { initOrder.push('plugin1'); },
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        dependencies: ['plugin1'],
        init: () => { initOrder.push('plugin2'); },
      };

      kernel.use(plugin2).use(plugin1);
      await kernel.bootstrap();

      expect(initOrder).toEqual(['plugin1', 'plugin2']);
    });

    it('should detect circular dependencies', async () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        dependencies: ['plugin2'],
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        dependencies: ['plugin1'],
      };

      kernel.use(plugin1).use(plugin2);
      await expect(kernel.bootstrap()).rejects.toThrow('Circular dependency');
    });

    it('should throw for missing dependencies', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        dependencies: ['non-existent'],
      };

      kernel.use(plugin);
      await expect(kernel.bootstrap()).rejects.toThrow('not registered');
    });
  });
});
