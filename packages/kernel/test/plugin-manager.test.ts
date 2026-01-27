/**
 * Plugin Manager Tests
 */

import { PluginManager } from '../src/plugin-manager';
import type { ObjectStackManifest, PluginDefinition, PluginContextData } from '@objectstack/spec/system';

describe('PluginManager', () => {
    let pluginManager: PluginManager;
    let mockContext: PluginContextData;
    let lifecycleHooks: {
        onInstall?: jest.Mock;
        onEnable?: jest.Mock;
        onDisable?: jest.Mock;
        onUninstall?: jest.Mock;
    };

    beforeEach(() => {
        // Create mock context
        mockContext = {
            ql: {
                object: jest.fn(),
                query: jest.fn(),
            },
            os: {
                getCurrentUser: jest.fn(),
                getConfig: jest.fn(),
            },
            logger: {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            },
            storage: {
                get: jest.fn(),
                set: jest.fn(),
                delete: jest.fn(),
            },
            i18n: {
                t: jest.fn(),
                getLocale: jest.fn(),
            },
            events: {
                on: jest.fn(),
                emit: jest.fn(),
            },
            app: {
                router: {
                    get: jest.fn(),
                    post: jest.fn(),
                    use: jest.fn(),
                },
                scheduler: {
                    schedule: jest.fn(),
                },
            },
            metadata: {
                getObject: jest.fn(),
                listObjects: jest.fn(),
            },
            drivers: {
                get: jest.fn(),
                register: jest.fn(),
            },
        } as any;

        // Create plugin manager with mock context builder
        pluginManager = new PluginManager((pluginId: string) => mockContext);

        // Create lifecycle hooks
        lifecycleHooks = {
            onInstall: jest.fn(),
            onEnable: jest.fn(),
            onDisable: jest.fn(),
            onUninstall: jest.fn(),
        };
    });

    const createTestManifest = (id: string): ObjectStackManifest => ({
        id,
        version: '1.0.0',
        type: 'plugin',
        name: 'Test Plugin',
    });

    const createTestPlugin = (): PluginDefinition => ({
        onInstall: lifecycleHooks.onInstall,
        onEnable: lifecycleHooks.onEnable,
        onDisable: lifecycleHooks.onDisable,
        onUninstall: lifecycleHooks.onUninstall,
    });

    describe('register', () => {
        it('should register a plugin', () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);

            expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
        });

        it('should not register duplicate plugins', () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            pluginManager.register(manifest, definition);

            const plugins = pluginManager.getAllPlugins();
            expect(plugins.size).toBe(1);
        });
    });

    describe('install', () => {
        it('should install a plugin', async () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            await pluginManager.install('test-plugin');

            expect(lifecycleHooks.onInstall).toHaveBeenCalledWith(mockContext);
            expect(pluginManager.isInstalled('test-plugin')).toBe(true);
        });

        it('should not install already installed plugin', async () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            await pluginManager.install('test-plugin');
            await pluginManager.install('test-plugin');

            expect(lifecycleHooks.onInstall).toHaveBeenCalledTimes(1);
        });

        it('should throw error for non-existent plugin', async () => {
            await expect(pluginManager.install('non-existent')).rejects.toThrow();
        });
    });

    describe('enable', () => {
        it('should enable a plugin', async () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            await pluginManager.enable('test-plugin');

            expect(lifecycleHooks.onInstall).toHaveBeenCalled();
            expect(lifecycleHooks.onEnable).toHaveBeenCalled();
            expect(pluginManager.isEnabled('test-plugin')).toBe(true);
        });

        it('should install before enabling if not installed', async () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            await pluginManager.enable('test-plugin');

            expect(lifecycleHooks.onInstall).toHaveBeenCalled();
            expect(lifecycleHooks.onEnable).toHaveBeenCalled();
        });
    });

    describe('disable', () => {
        it('should disable an enabled plugin', async () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            await pluginManager.enable('test-plugin');
            await pluginManager.disable('test-plugin');

            expect(lifecycleHooks.onDisable).toHaveBeenCalled();
            expect(pluginManager.isEnabled('test-plugin')).toBe(false);
        });
    });

    describe('uninstall', () => {
        it('should uninstall a plugin', async () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            await pluginManager.enable('test-plugin');
            await pluginManager.uninstall('test-plugin');

            expect(lifecycleHooks.onDisable).toHaveBeenCalled();
            expect(lifecycleHooks.onUninstall).toHaveBeenCalled();
            expect(pluginManager.hasPlugin('test-plugin')).toBe(false);
        });

        it('should disable before uninstalling if enabled', async () => {
            const manifest = createTestManifest('test-plugin');
            const definition = createTestPlugin();

            pluginManager.register(manifest, definition);
            await pluginManager.enable('test-plugin');
            await pluginManager.uninstall('test-plugin');

            expect(lifecycleHooks.onDisable).toHaveBeenCalled();
            expect(lifecycleHooks.onUninstall).toHaveBeenCalled();
        });
    });

    describe('getEnabledPlugins', () => {
        it('should return only enabled plugins', async () => {
            const manifest1 = createTestManifest('plugin1');
            const manifest2 = createTestManifest('plugin2');
            const definition = createTestPlugin();

            pluginManager.register(manifest1, definition);
            pluginManager.register(manifest2, definition);
            
            await pluginManager.enable('plugin1');

            const enabled = pluginManager.getEnabledPlugins();
            expect(enabled.length).toBe(1);
            expect(enabled[0].manifest.id).toBe('plugin1');
        });
    });
});
