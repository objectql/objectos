/**
 * Dependency Resolver Tests
 */

import { DependencyResolver, DependencyError } from '../src/dependency-resolver';
import type { ObjectStackManifest } from '@objectstack/spec/system';

describe('DependencyResolver', () => {
    let resolver: DependencyResolver;

    beforeEach(() => {
        resolver = new DependencyResolver();
    });

    const createManifest = (id: string, dependencies: string[] = []): any => {
        const manifest: any = {
            id,
            version: '1.0.0',
            type: 'plugin',
            name: `Plugin ${id}`,
        };
        
        if (dependencies.length > 0) {
            manifest.contributes = { dependencies };
        }
        
        return manifest;
    };

    describe('addPlugin', () => {
        it('should add a plugin to the graph', () => {
            const manifest = createManifest('plugin-a');
            resolver.addPlugin(manifest);
            
            const result = resolver.resolve();
            expect(result.loadOrder).toContain('plugin-a');
        });

        it('should extract dependencies from contributes.dependencies array', () => {
            const manifest = createManifest('plugin-b', ['plugin-a']);
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(manifest);
            
            const result = resolver.resolve();
            expect(result.loadOrder.indexOf('plugin-a')).toBeLessThan(result.loadOrder.indexOf('plugin-b'));
        });

        it('should extract dependencies from contributes.dependencies object', () => {
            const manifest: any = {
                id: 'plugin-b',
                version: '1.0.0',
                type: 'plugin',
                name: 'Plugin B',
                contributes: {
                    dependencies: {
                        'plugin-a': '^1.0.0'
                    }
                }
            };
            
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(manifest);
            
            const result = resolver.resolve();
            expect(result.loadOrder.indexOf('plugin-a')).toBeLessThan(result.loadOrder.indexOf('plugin-b'));
        });

        it('should handle legacy top-level dependencies', () => {
            const manifest: any = {
                id: 'plugin-b',
                version: '1.0.0',
                type: 'plugin',
                name: 'Plugin B',
                dependencies: ['plugin-a']
            };
            
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(manifest);
            
            const result = resolver.resolve();
            expect(result.loadOrder.indexOf('plugin-a')).toBeLessThan(result.loadOrder.indexOf('plugin-b'));
        });
    });

    describe('resolve', () => {
        it('should return empty load order for no plugins', () => {
            const result = resolver.resolve();
            expect(result.loadOrder).toEqual([]);
            expect(result.cycles).toEqual([]);
            expect(result.missing.size).toBe(0);
        });

        it('should return single plugin for independent plugin', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            
            const result = resolver.resolve();
            expect(result.loadOrder).toEqual(['plugin-a']);
        });

        it('should resolve simple dependency chain', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            resolver.addPlugin(createManifest('plugin-c', ['plugin-b']));
            
            const result = resolver.resolve();
            expect(result.loadOrder).toEqual(['plugin-a', 'plugin-b', 'plugin-c']);
        });

        it('should resolve complex dependency graph', () => {
            //     A
            //    / \
            //   B   C
            //    \ /
            //     D
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            resolver.addPlugin(createManifest('plugin-c', ['plugin-a']));
            resolver.addPlugin(createManifest('plugin-d', ['plugin-b', 'plugin-c']));
            
            const result = resolver.resolve();
            
            // A must be first
            expect(result.loadOrder[0]).toBe('plugin-a');
            
            // D must be last
            expect(result.loadOrder[3]).toBe('plugin-d');
            
            // B and C must be before D and after A
            const bIndex = result.loadOrder.indexOf('plugin-b');
            const cIndex = result.loadOrder.indexOf('plugin-c');
            const dIndex = result.loadOrder.indexOf('plugin-d');
            
            expect(bIndex).toBeLessThan(dIndex);
            expect(cIndex).toBeLessThan(dIndex);
        });

        it('should handle multiple independent plugins', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b'));
            resolver.addPlugin(createManifest('plugin-c'));
            
            const result = resolver.resolve();
            expect(result.loadOrder.length).toBe(3);
            expect(result.loadOrder).toContain('plugin-a');
            expect(result.loadOrder).toContain('plugin-b');
            expect(result.loadOrder).toContain('plugin-c');
        });
    });

    describe('detectCycles', () => {
        it('should detect simple circular dependency', () => {
            resolver.addPlugin(createManifest('plugin-a', ['plugin-b']));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            
            const result = resolver.resolve();
            expect(result.cycles.length).toBeGreaterThan(0);
        });

        it('should detect three-way circular dependency', () => {
            resolver.addPlugin(createManifest('plugin-a', ['plugin-b']));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-c']));
            resolver.addPlugin(createManifest('plugin-c', ['plugin-a']));
            
            const result = resolver.resolve();
            expect(result.cycles.length).toBeGreaterThan(0);
        });

        it('should not detect cycles in valid graph', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            resolver.addPlugin(createManifest('plugin-c', ['plugin-b']));
            
            const result = resolver.resolve();
            expect(result.cycles).toEqual([]);
        });
    });

    describe('detectMissing', () => {
        it('should detect missing dependencies', () => {
            resolver.addPlugin(createManifest('plugin-a', ['plugin-missing']));
            
            const result = resolver.resolve();
            expect(result.missing.size).toBe(1);
            expect(result.missing.get('plugin-a')).toEqual(['plugin-missing']);
        });

        it('should detect multiple missing dependencies', () => {
            resolver.addPlugin(createManifest('plugin-a', ['plugin-x', 'plugin-y']));
            
            const result = resolver.resolve();
            expect(result.missing.size).toBe(1);
            expect(result.missing.get('plugin-a')).toEqual(['plugin-x', 'plugin-y']);
        });

        it('should not report missing for satisfied dependencies', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            
            const result = resolver.resolve();
            expect(result.missing.size).toBe(0);
        });
    });

    describe('validate', () => {
        it('should pass validation for valid graph', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            
            expect(() => resolver.validate()).not.toThrow();
        });

        it('should throw for missing dependencies', () => {
            resolver.addPlugin(createManifest('plugin-a', ['plugin-missing']));
            
            expect(() => resolver.validate()).toThrow(DependencyError);
            expect(() => resolver.validate()).toThrow(/Missing dependencies/);
        });

        it('should throw for circular dependencies', () => {
            resolver.addPlugin(createManifest('plugin-a', ['plugin-b']));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            
            expect(() => resolver.validate()).toThrow(DependencyError);
            expect(() => resolver.validate()).toThrow(/Circular dependencies/);
        });

        it('should include plugin IDs in error', () => {
            resolver.addPlugin(createManifest('plugin-a', ['plugin-missing']));
            
            try {
                resolver.validate();
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(DependencyError);
                const depError = error as DependencyError;
                expect(depError.type).toBe('MISSING');
                expect(depError.plugins).toContain('plugin-a');
            }
        });
    });

    describe('clear', () => {
        it('should clear all plugins', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b'));
            
            resolver.clear();
            
            const result = resolver.resolve();
            expect(result.loadOrder).toEqual([]);
        });
    });

    describe('getGraphDescription', () => {
        it('should return graph description', () => {
            resolver.addPlugin(createManifest('plugin-a'));
            resolver.addPlugin(createManifest('plugin-b', ['plugin-a']));
            
            const description = resolver.getGraphDescription();
            expect(description).toContain('plugin-a');
            expect(description).toContain('plugin-b');
        });
    });
});
