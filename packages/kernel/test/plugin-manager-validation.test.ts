/**
 * Plugin Manager Integration Tests
 * Tests for dependency validation and manifest validation
 */

import { PluginManager } from '../src/plugin-manager';
import { DependencyError } from '../src/dependency-resolver';
import type { ObjectStackManifest, PluginDefinition, PluginContextData } from '@objectstack/spec/system';

describe('PluginManager - Dependency & Validation', () => {
    let pluginManager: PluginManager;
    let mockContext: PluginContextData;

    beforeEach(() => {
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

        pluginManager = new PluginManager((pluginId: string) => mockContext);
    });

    const createManifest = (id: string, deps: string[] = []): any => {
        const manifest: any = {
            id,
            version: '1.0.0',
            type: 'plugin',
            name: `Plugin ${id}`,
            description: 'Test plugin',
        };
        
        if (deps.length > 0) {
            manifest.contributes = { dependencies: deps };
        }
        
        return manifest;
    };

    const createPlugin = (): PluginDefinition => ({
        onInstall: jest.fn(),
        onEnable: jest.fn(),
    });

    describe('manifest validation', () => {
        it('should validate manifest on registration', () => {
            const manifest = createManifest('valid-plugin');
            const plugin = createPlugin();

            expect(() => pluginManager.register(manifest, plugin)).not.toThrow();
        });

        it('should reject invalid manifest', () => {
            const invalidManifest = {
                id: 'test',
                // missing required fields
            } as any;
            const plugin = createPlugin();

            expect(() => pluginManager.register(invalidManifest, plugin)).toThrow();
        });

        it('should allow skipping validation', () => {
            const invalidManifest = {
                id: 'test',
            } as any;
            const plugin = createPlugin();

            expect(() => 
                pluginManager.register(invalidManifest, plugin, { skipValidation: true })
            ).not.toThrow();
        });

        it('should store validation results', () => {
            const manifest = createManifest('test-plugin');
            const plugin = createPlugin();

            pluginManager.register(manifest, plugin);

            const validationResult = pluginManager.getValidationResult('test-plugin');
            expect(validationResult).toBeDefined();
            expect(validationResult?.valid).toBe(true);
        });
    });

    describe('dependency validation', () => {
        it('should validate simple dependency chain', () => {
            pluginManager.register(createManifest('plugin-a'), createPlugin());
            pluginManager.register(createManifest('plugin-b', ['plugin-a']), createPlugin());

            const result = pluginManager.validateDependencies();
            expect(result.loadOrder).toEqual(['plugin-a', 'plugin-b']);
            expect(result.cycles).toEqual([]);
            expect(result.missing.size).toBe(0);
        });

        it('should detect missing dependencies', () => {
            pluginManager.register(createManifest('plugin-a', ['missing-plugin']), createPlugin());

            expect(() => pluginManager.validateDependencies()).toThrow(DependencyError);
        });

        it('should detect circular dependencies', () => {
            pluginManager.register(createManifest('plugin-a', ['plugin-b']), createPlugin());
            pluginManager.register(createManifest('plugin-b', ['plugin-a']), createPlugin());

            expect(() => pluginManager.validateDependencies()).toThrow(DependencyError);
        });

        it('should return dependency graph without throwing', () => {
            pluginManager.register(createManifest('plugin-a', ['missing']), createPlugin());

            const result = pluginManager.getDependencyGraph();
            expect(result.missing.size).toBe(1);
            expect(result.missing.get('plugin-a')).toContain('missing');
        });
    });

    describe('load order', () => {
        it('should determine correct load order for complex graph', () => {
            // Create dependency graph:
            //     A
            //    / \
            //   B   C
            //    \ /
            //     D
            pluginManager.register(createManifest('plugin-a'), createPlugin());
            pluginManager.register(createManifest('plugin-b', ['plugin-a']), createPlugin());
            pluginManager.register(createManifest('plugin-c', ['plugin-a']), createPlugin());
            pluginManager.register(createManifest('plugin-d', ['plugin-b', 'plugin-c']), createPlugin());

            const result = pluginManager.validateDependencies();

            // A must be first
            expect(result.loadOrder[0]).toBe('plugin-a');

            // D must be last
            expect(result.loadOrder[3]).toBe('plugin-d');

            // B and C must be between A and D
            const bIndex = result.loadOrder.indexOf('plugin-b');
            const cIndex = result.loadOrder.indexOf('plugin-c');
            const dIndex = result.loadOrder.indexOf('plugin-d');

            expect(bIndex).toBeLessThan(dIndex);
            expect(cIndex).toBeLessThan(dIndex);
        });

        it('should handle independent plugins', () => {
            pluginManager.register(createManifest('plugin-a'), createPlugin());
            pluginManager.register(createManifest('plugin-b'), createPlugin());
            pluginManager.register(createManifest('plugin-c'), createPlugin());

            const result = pluginManager.validateDependencies();
            expect(result.loadOrder.length).toBe(3);
        });
    });

    describe('integration with lifecycle', () => {
        it('should register and enable plugins in dependency order', async () => {
            const installA = jest.fn();
            const enableA = jest.fn();
            const installB = jest.fn();
            const enableB = jest.fn();

            pluginManager.register(createManifest('plugin-a'), {
                onInstall: installA,
                onEnable: enableA,
            });

            pluginManager.register(createManifest('plugin-b', ['plugin-a']), {
                onInstall: installB,
                onEnable: enableB,
            });

            // Validate dependencies first
            pluginManager.validateDependencies();

            // Enable both plugins
            await pluginManager.enable('plugin-a');
            await pluginManager.enable('plugin-b');

            expect(installA).toHaveBeenCalled();
            expect(enableA).toHaveBeenCalled();
            expect(installB).toHaveBeenCalled();
            expect(enableB).toHaveBeenCalled();
        });

        it('should fail to enable plugin with missing dependencies', async () => {
            pluginManager.register(
                createManifest('plugin-b', ['plugin-a']), 
                createPlugin(),
                { skipValidation: true }
            );

            // This should fail because plugin-a is not registered
            expect(() => pluginManager.validateDependencies()).toThrow();
        });
    });

    describe('backward compatibility', () => {
        it('should work without validation options', () => {
            const oldStyleManager = new PluginManager((id) => mockContext);
            const manifest = createManifest('test');
            const plugin = createPlugin();

            expect(() => oldStyleManager.register(manifest, plugin)).not.toThrow();
        });

        it('should maintain existing API', () => {
            const manifest = createManifest('test');
            const plugin = createPlugin();

            pluginManager.register(manifest, plugin);

            expect(pluginManager.hasPlugin('test')).toBe(true);
            expect(pluginManager.getPlugin('test')).toBeDefined();
            expect(pluginManager.isEnabled('test')).toBe(false);
            expect(pluginManager.isInstalled('test')).toBe(false);
        });
    });
});
