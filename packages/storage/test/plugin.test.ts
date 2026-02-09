/**
 * Tests for Storage Plugin
 */

import { StoragePlugin, ScopedStorage, getStorageAPI } from '../src/index.js';
import { MemoryStorageBackend } from '../src/memory-backend.js';
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

describe('Storage Plugin', () => {
    let plugin: StoragePlugin;
    let mockContext: PluginContext;
    let mockKernel: any;

    beforeEach(() => {
        const mock = createMockContext();
        mockContext = mock.context;
        mockKernel = mock.kernel;

        plugin = new StoragePlugin({
            backend: 'memory',
        });
    });

    afterEach(async () => {
        await plugin.destroy();
    });

    describe('Plugin Metadata', () => {
        it('should have correct plugin metadata', () => {
            expect(plugin.name).toBe('@objectos/storage');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual([]);
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('storage', plugin);
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

    describe('Storage Operations', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
        });

        it('should store and retrieve a value', async () => {
            await plugin.set('test-key', 'test-value');
            const value = await plugin.get('test-key');
            expect(value).toBe('test-value');
        });

        it('should store and retrieve complex objects', async () => {
            const data = { name: 'John', age: 30, tags: ['user', 'admin'] };
            await plugin.set('user:1', data);
            const retrieved = await plugin.get('user:1');
            expect(retrieved).toEqual(data);
        });

        it('should return undefined for non-existent keys', async () => {
            const value = await plugin.get('non-existent');
            expect(value).toBeUndefined();
        });

        it('should delete a value', async () => {
            await plugin.set('delete-me', 'value');
            await plugin.delete('delete-me');
            const value = await plugin.get('delete-me');
            expect(value).toBeUndefined();
        });

        it('should list all keys', async () => {
            await plugin.set('key1', 'value1');
            await plugin.set('key2', 'value2');
            await plugin.set('key3', 'value3');
            
            const keys = await plugin.keys();
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys).toContain('key3');
        });

        it('should list keys matching a pattern', async () => {
            await plugin.set('user:1', 'John');
            await plugin.set('user:2', 'Jane');
            await plugin.set('admin:1', 'Admin');
            
            const userKeys = await plugin.keys('user:*');
            expect(userKeys).toContain('user:1');
            expect(userKeys).toContain('user:2');
            expect(userKeys).not.toContain('admin:1');
        });

        it('should clear all data', async () => {
            await plugin.set('key1', 'value1');
            await plugin.set('key2', 'value2');
            
            await plugin.clear();
            
            const keys = await plugin.keys();
            expect(keys).toHaveLength(0);
        });
    });

    describe('TTL Support', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
        });

        it('should expire values after TTL', async () => {
            await plugin.set('expire-key', 'value', 1); // 1 second TTL
            
            let value = await plugin.get('expire-key');
            expect(value).toBe('value');
            
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            value = await plugin.get('expire-key');
            expect(value).toBeUndefined();
        });

        it('should not expire values without TTL', async () => {
            await plugin.set('no-expire', 'value');
            
            // Wait
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const value = await plugin.get('no-expire');
            expect(value).toBe('value');
        });
    });

    describe('Scoped Storage', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
        });

        it('should create scoped storage for a plugin', () => {
            const scoped = plugin.getScopedStorage('plugin1');
            expect(scoped).toBeInstanceOf(ScopedStorage);
        });

        it('should isolate data between plugins', async () => {
            const scoped1 = plugin.getScopedStorage('plugin1');
            const scoped2 = plugin.getScopedStorage('plugin2');
            
            await scoped1.set('shared-key', 'value1');
            await scoped2.set('shared-key', 'value2');
            
            const value1 = await scoped1.get('shared-key');
            const value2 = await scoped2.get('shared-key');
            
            expect(value1).toBe('value1');
            expect(value2).toBe('value2');
        });

        it('should list only scoped keys', async () => {
            const scoped1 = plugin.getScopedStorage('plugin1');
            const scoped2 = plugin.getScopedStorage('plugin2');
            
            await scoped1.set('key1', 'value1');
            await scoped1.set('key2', 'value2');
            await scoped2.set('key1', 'value3');
            
            const keys1 = await scoped1.keys();
            const keys2 = await scoped2.keys();
            
            expect(keys1).toEqual(['key1', 'key2']);
            expect(keys2).toEqual(['key1']);
        });

        it('should clear only scoped data', async () => {
            const scoped1 = plugin.getScopedStorage('plugin1');
            const scoped2 = plugin.getScopedStorage('plugin2');
            
            await scoped1.set('key1', 'value1');
            await scoped2.set('key2', 'value2');
            
            await scoped1.clear();
            
            const value1 = await scoped1.get('key1');
            const value2 = await scoped2.get('key2');
            
            expect(value1).toBeUndefined();
            expect(value2).toBe('value2');
        });
    });

    describe('Helper Functions', () => {
        it('should get storage API from kernel', async () => {
            await plugin.init(mockContext);
            
            const api = getStorageAPI(mockKernel);
            expect(api).toBe(plugin);
        });

        it('should return null if storage service not found', () => {
            const api = getStorageAPI({ getService: () => { throw new Error('Not found'); } });
            expect(api).toBeNull();
        });
    });
});

// ─── Kernel Compliance Tests ───────────────────────────────────────────────────

describe('Kernel Compliance', () => {
    let plugin: StoragePlugin;

    beforeEach(async () => {
        plugin = new StoragePlugin();
        const mock = createMockContext();
        await plugin.init(mock.context);
    });

    afterEach(async () => {
        await plugin.destroy();
    });

    describe('healthCheck()', () => {
        it('should return healthy status for operational backend', async () => {
            const report = await plugin.healthCheck();
            expect(report.status).toBe('healthy');
            expect(report.checks![0].name).toBe('storage-backend');
        });
    });

    describe('getManifest()', () => {
        it('should return capability and security manifests', () => {
            const manifest = plugin.getManifest();
            expect(manifest.capabilities).toBeDefined();
            expect(manifest.security).toBeDefined();
        });
    });

    describe('getStartupResult()', () => {
        it('should return successful startup result', () => {
            const result = plugin.getStartupResult();
            expect(result.plugin.name).toBe('@objectos/storage');
            expect(result.success).toBe(true);
        });
    });
});
