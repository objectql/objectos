/**
 * Tests for Cache Plugin
 */

import { CachePlugin, ScopedCache, getCacheAPI } from '../src';
import { LruCacheBackend } from '../src/lru-backend';
import type { PluginContext } from '@objectstack/runtime';

// Mock context for testing
const createMockContext = (): { context: PluginContext; kernel: any } => {
    const kernel = {
        getService: jest.fn(),
        services: new Map(),
    };
    
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
};

describe('Cache Plugin', () => {
    let plugin: CachePlugin;
    let mockContext: PluginContext;
    let mockKernel: any;

    beforeEach(() => {
        const mock = createMockContext();
        mockContext = mock.context;
        mockKernel = mock.kernel;

        plugin = new CachePlugin({
            backend: 'lru',
            options: {
                maxSize: 100,
            },
        });
    });

    afterEach(async () => {
        await plugin.destroy();
    });

    describe('Plugin Metadata', () => {
        it('should have correct plugin metadata', () => {
            expect(plugin.name).toBe('com.objectos.cache');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual([]);
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('cache', plugin);
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Initialized successfully')
            );
        });

        it('should start successfully', async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Started successfully')
            );
        });

        it('should destroy successfully', async () => {
            await plugin.init(mockContext);
            await plugin.destroy();

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Destroyed')
            );
        });
    });

    describe('Cache Operations', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);
        });

        it('should set and get a value', async () => {
            await plugin.set('key1', 'value1');
            const value = await plugin.get('key1');
            expect(value).toBe('value1');
        });

        it('should return undefined for non-existent keys', async () => {
            const value = await plugin.get('nonexistent');
            expect(value).toBeUndefined();
        });

        it('should delete a value', async () => {
            await plugin.set('key1', 'value1');
            await plugin.delete('key1');
            const value = await plugin.get('key1');
            expect(value).toBeUndefined();
        });

        it('should check if key exists', async () => {
            await plugin.set('key1', 'value1');
            expect(await plugin.has('key1')).toBe(true);
            expect(await plugin.has('key2')).toBe(false);
        });

        it('should clear all values', async () => {
            await plugin.set('key1', 'value1');
            await plugin.set('key2', 'value2');
            await plugin.clear();
            
            expect(await plugin.get('key1')).toBeUndefined();
            expect(await plugin.get('key2')).toBeUndefined();
        });

        it('should handle complex data types', async () => {
            const complexData = {
                user: { id: 1, name: 'John' },
                items: [1, 2, 3],
                metadata: { created: new Date().toISOString() },
            };

            await plugin.set('complex', complexData);
            const retrieved = await plugin.get('complex');
            expect(retrieved).toEqual(complexData);
        });
    });

    describe('TTL Support', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);
        });

        it('should expire values after TTL', async () => {
            await plugin.set('temp', 'value', 1); // 1 second TTL
            
            // Should exist immediately
            expect(await plugin.get('temp')).toBe('value');
            
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            // Should be expired
            expect(await plugin.get('temp')).toBeUndefined();
        });

        it('should not expire values without TTL', async () => {
            await plugin.set('permanent', 'value');
            
            // Wait
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Should still exist
            expect(await plugin.get('permanent')).toBe('value');
        });
    });

    describe('Statistics', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);
        });

        it('should track cache hits and misses', async () => {
            await plugin.set('key1', 'value1');
            
            await plugin.get('key1'); // Hit
            await plugin.get('key2'); // Miss
            await plugin.get('key1'); // Hit
            
            const stats = plugin.getStats();
            expect(stats).toBeDefined();
            expect(stats!.hits).toBe(2);
            expect(stats!.misses).toBe(1);
            expect(stats!.hitRate).toBeCloseTo(0.667, 2);
        });

        it('should track cache size', async () => {
            await plugin.set('key1', 'value1');
            await plugin.set('key2', 'value2');
            
            const stats = plugin.getStats();
            expect(stats!.size).toBe(2);
        });

        it('should reset stats after clear', async () => {
            await plugin.set('key1', 'value1');
            await plugin.get('key1');
            await plugin.clear();
            
            const stats = plugin.getStats();
            expect(stats!.hits).toBe(0);
            expect(stats!.misses).toBe(0);
            expect(stats!.size).toBe(0);
        });
    });

    describe('Scoped Cache', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);
        });

        it('should create scoped cache instances', () => {
            const cache1 = plugin.getScopedCache('plugin1');
            const cache2 = plugin.getScopedCache('plugin2');
            
            expect(cache1).toBeInstanceOf(ScopedCache);
            expect(cache2).toBeInstanceOf(ScopedCache);
            expect(cache1).not.toBe(cache2);
        });

        it('should reuse scoped cache instances', () => {
            const cache1a = plugin.getScopedCache('plugin1');
            const cache1b = plugin.getScopedCache('plugin1');
            
            expect(cache1a).toBe(cache1b);
        });

        it('should isolate data between scoped caches', async () => {
            const cache1 = plugin.getScopedCache('plugin1');
            const cache2 = plugin.getScopedCache('plugin2');
            
            await cache1.set('key', 'value1');
            await cache2.set('key', 'value2');
            
            expect(await cache1.get('key')).toBe('value1');
            expect(await cache2.get('key')).toBe('value2');
        });

        it('should not allow clear on scoped caches', async () => {
            const cache = plugin.getScopedCache('plugin1');
            await expect(cache.clear()).rejects.toThrow('not supported');
        });
    });

    describe('Backend Access', () => {
        it('should provide direct backend access', () => {
            const backend = plugin.getBackend();
            expect(backend).toBeInstanceOf(LruCacheBackend);
        });
    });

    describe('Helper Functions', () => {
        it('should get cache API from kernel', async () => {
            await plugin.init(mockContext);
            
            const api = getCacheAPI(mockKernel);
            expect(api).toBe(plugin);
        });

        it('should return null if cache service not found', () => {
            const freshKernel = {
                getService: jest.fn(() => {
                    throw new Error('Service not found');
                }),
            };
            const api = getCacheAPI(freshKernel);
            expect(api).toBeNull();
        });
    });
});
