/**
 * Tests for Permissions Plugin
 */

import {
    PermissionsPlugin,
    getPermissionsAPI,
} from '../src/index.js';
import { vi } from 'vitest';
import type { PluginContext } from '@objectstack/runtime';

// Mock context for testing
const createMockContext = (): { context: PluginContext; kernel: any; hooks: Map<string, Function[]> } => {
    const hooks: Map<string, Function[]> = new Map();
    const kernel = {
        getService: vi.fn(),
        services: new Map(),
    };
    
    const context: PluginContext = {
        logger: {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        },
        registerService: vi.fn((name: string, service: any) => {
            kernel.services.set(name, service);
            kernel.getService.mockImplementation((n: string) => {
                if (kernel.services.has(n)) return kernel.services.get(n);
                throw new Error(`Service ${n} not found`);
            });
        }),
        getService: vi.fn((name: string) => {
            if (kernel.services.has(name)) return kernel.services.get(name);
            throw new Error(`Service ${name} not found`);
        }),
        hasService: vi.fn((name: string) => kernel.services.has(name)),
        getServices: vi.fn(() => kernel.services),
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
        getKernel: vi.fn(() => kernel),
    } as any;
    
    return { context, kernel, hooks };
};

describe('Permissions Plugin', () => {
    let plugin: PermissionsPlugin;
    let mockContext: PluginContext;
    let mockKernel: any;
    let hooks: Map<string, Function[]>;

    beforeEach(() => {
        const mock = createMockContext();
        mockContext = mock.context;
        mockKernel = mock.kernel;
        hooks = mock.hooks;

        plugin = new PermissionsPlugin({
            enabled: true,
            defaultDeny: true,
            permissionsDir: './test-permissions-non-existent',
        });
    });

    describe('Plugin Metadata', () => {
        it('should have correct plugin metadata', () => {
            expect(plugin.name).toBe('@objectos/permissions');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual(['@objectos/audit']);
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('permissions', plugin);
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

        it('should register event listeners during init', async () => {
            await plugin.init(mockContext);

            expect(mockContext.hook).toHaveBeenCalledWith('data.beforeCreate', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.beforeUpdate', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.beforeDelete', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.beforeFind', expect.any(Function));
        });
    });

    describe('Permission Enforcement', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);

            // Set up a permission set for testing
            const permissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    admin: {
                        objectName: 'contacts',
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: true,
                        allowDelete: true,
                    },
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: false,
                        allowDelete: false,
                    },
                },
            };

            await plugin.getStorage().storePermissionSet(permissionSet);
        });

        it('should allow data.create with proper permissions', async () => {
            const createHook = hooks.get('data.beforeCreate')![0];

            const data = {
                objectName: 'contacts',
                userId: 'user1',
                userProfiles: ['admin'],
            };

            await expect(createHook(data)).resolves.not.toThrow();
        });

        it('should deny data.create without proper permissions', async () => {
            const createHook = hooks.get('data.beforeCreate')![0];

            const data = {
                objectName: 'contacts',
                userId: 'user1',
                userProfiles: ['guest'],
            };

            await expect(createHook(data)).rejects.toThrow('No permission for action');
        });

        it('should allow data.update with proper permissions', async () => {
            const updateHook = hooks.get('data.beforeUpdate')![0];

            const data = {
                objectName: 'contacts',
                userId: 'user1',
                userProfiles: ['admin'],
            };

            await expect(updateHook(data)).resolves.not.toThrow();
        });

        it('should deny data.update without proper permissions', async () => {
            const updateHook = hooks.get('data.beforeUpdate')![0];

            const data = {
                objectName: 'contacts',
                userId: 'user1',
                userProfiles: ['sales'],
            };

            await expect(updateHook(data)).rejects.toThrow('No permission for action');
        });

        it('should allow data.delete with proper permissions', async () => {
            const deleteHook = hooks.get('data.beforeDelete')![0];

            const data = {
                objectName: 'contacts',
                userId: 'user1',
                userProfiles: ['admin'],
            };

            await expect(deleteHook(data)).resolves.not.toThrow();
        });

        it('should deny data.delete without proper permissions', async () => {
            const deleteHook = hooks.get('data.beforeDelete')![0];

            const data = {
                objectName: 'contacts',
                userId: 'user1',
                userProfiles: ['sales'],
            };

            await expect(deleteHook(data)).rejects.toThrow('No permission for action');
        });

        it('should skip permission check when no user context', async () => {
            const createHook = hooks.get('data.beforeCreate')![0];

            const data = {
                objectName: 'contacts',
                // No userId
            };

            await expect(createHook(data)).resolves.not.toThrow();
        });
    });

    describe('Record-Level Security', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);

            const permissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        viewFilters: {
                            owner: '{{ userId }}',
                        },
                    },
                },
            };

            await plugin.getStorage().storePermissionSet(permissionSet);
        });

        it('should apply record-level filters for data.find', async () => {
            const findHook = hooks.get('data.beforeFind')![0];

            const data: any = {
                objectName: 'contacts',
                userId: 'user123',
                userProfiles: ['sales'],
                filters: {},
            };

            await findHook(data);

            expect(data.filters.owner).toBe('user123');
        });

        it('should skip RLS when no user context', async () => {
            const findHook = hooks.get('data.beforeFind')![0];

            const data = {
                objectName: 'contacts',
                filters: {},
                // No userId
            };

            await findHook(data);

            expect(data.filters).toEqual({});
        });
    });

    describe('API Access', () => {
        it('should provide access to permission engine', async () => {
            await plugin.init(mockContext);

            const engine = plugin.getEngine();
            expect(engine).toBeDefined();
        });

        it('should provide access to permission storage', async () => {
            await plugin.init(mockContext);

            const storage = plugin.getStorage();
            expect(storage).toBeDefined();
        });

        it('should support reloading permissions', async () => {
            await plugin.init(mockContext);

            const permissionSet = {
                name: 'test-permissions',
                objectName: 'test',
                profiles: {},
            };

            await plugin.getStorage().storePermissionSet(permissionSet);

            await plugin.reloadPermissions();

            const sets = await plugin.getStorage().getAllPermissionSets();
            expect(sets).toHaveLength(0); // Should be cleared after reload
        });
    });

    describe('getPermissionsAPI', () => {
        it('should return permissions plugin after init', async () => {
            await plugin.init(mockContext);

            const api = getPermissionsAPI(mockKernel);
            expect(api).toBe(plugin);
        });

        it('should return null when service not found', () => {
            const api = getPermissionsAPI({ getService: () => { throw new Error('not found'); } });
            expect(api).toBeNull();
        });
    });

    describe('Configuration', () => {
        it('should respect enabled flag', async () => {
            const disabledPlugin = new PermissionsPlugin({
                enabled: false,
            });

            await disabledPlugin.init(mockContext);

            // Hooks should not be registered when disabled
            expect(mockContext.hook).not.toHaveBeenCalled();
        });

        it('should handle non-existent permissions directory', async () => {
            const customPlugin = new PermissionsPlugin({
                permissionsDir: './custom-permissions-non-existent',
            });

            await customPlugin.init(mockContext);

            // Should initialize successfully even if directory doesn't exist
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Initialized successfully')
            );
        });
    });
});
