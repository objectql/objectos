/**
 * Hot Reload Manager Tests
 */

import { HotReloadManager, HotReloadOptions, HotReloadResult } from '../src/hot-reload';
import type { ObjectStackManifest, PluginDefinition } from '@objectstack/spec/system';

describe('HotReloadManager', () => {
    let hotReloadManager: HotReloadManager;
    let mockManifest: ObjectStackManifest;
    let mockDefinition: PluginDefinition;

    beforeEach(() => {
        hotReloadManager = new HotReloadManager({ enabled: true });

        mockManifest = {
            id: 'test-plugin',
            name: 'Test Plugin',
            version: '1.0.0',
            type: 'plugin',
            description: 'Test plugin',
        };

        mockDefinition = {
            onInstall: jest.fn(),
            onEnable: jest.fn(),
            onDisable: jest.fn(),
            onUninstall: jest.fn(),
        };
    });

    describe('Plugin Registration', () => {
        it('should register a plugin for hot reload', () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            expect(hotReloadManager.canReload('test-plugin')).toBe(true);
        });

        it('should register plugin with state', () => {
            const state = { count: 42 };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, state);

            expect(hotReloadManager.getState('test-plugin')).toEqual(state);
        });

        it('should track multiple plugins', () => {
            hotReloadManager.register('plugin-1', mockManifest, mockDefinition);
            hotReloadManager.register('plugin-2', { ...mockManifest, id: 'plugin-2' }, mockDefinition);

            expect(hotReloadManager.canReload('plugin-1')).toBe(true);
            expect(hotReloadManager.canReload('plugin-2')).toBe(true);
        });

        it('should update registration if plugin already exists', () => {
            const state1 = { value: 'old' };
            const state2 = { value: 'new' };

            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, state1);
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, state2);

            expect(hotReloadManager.getState('test-plugin')).toEqual(state2);
        });
    });

    describe('Hot Reload with State Preservation', () => {
        it('should preserve state during reload by default', async () => {
            const initialState = { count: 42, data: 'test' };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, initialState);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(true);
            expect(hotReloadManager.getState('test-plugin')).toEqual(initialState);
        });

        it('should deep clone state to prevent mutation', async () => {
            const initialState = { nested: { value: 'test' } };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, initialState);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            // Mutate original
            initialState.nested.value = 'changed';

            // State should be preserved with original value
            expect(hotReloadManager.getState('test-plugin')).toEqual({ nested: { value: 'test' } });
        });

        it('should handle state with arrays', async () => {
            const initialState = { items: [1, 2, 3], tags: ['a', 'b'] };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, initialState);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(hotReloadManager.getState('test-plugin')).toEqual(initialState);
        });

        it('should handle complex state structures', async () => {
            const initialState = {
                users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
                settings: { theme: 'dark', notifications: true },
                cache: new Map([['key', 'value']]),
            };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, initialState);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            const state = hotReloadManager.getState('test-plugin');
            expect(state.users).toEqual(initialState.users);
            expect(state.settings).toEqual(initialState.settings);
        });
    });

    describe('Hot Reload without State Preservation', () => {
        it('should not preserve state when disabled', async () => {
            const initialState = { count: 42 };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, initialState);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition, {
                preserveState: false,
            });

            expect(result.success).toBe(true);
            expect(hotReloadManager.getState('test-plugin')).toBeUndefined();
        });

        it('should clear state when explicitly requested', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, { data: 'test' });

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition, {
                preserveState: false,
            });

            expect(hotReloadManager.getState('test-plugin')).toBeUndefined();
        });
    });

    describe('Version Compatibility Checking', () => {
        it('should accept compatible version changes (same major)', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const newManifest = { ...mockManifest, version: '1.1.0' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(true);
            expect(result.oldVersion).toBe('1.0.0');
            expect(result.newVersion).toBe('1.1.0');
        });

        it('should warn on major version change', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const newManifest = { ...mockManifest, version: '2.0.0' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(true);
            // Should still succeed but with warning
        });

        it('should handle patch version updates', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(true);
            expect(result.newVersion).toBe('1.0.1');
        });

        it('should handle prerelease versions', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const newManifest = { ...mockManifest, version: '1.0.1-beta.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(true);
            expect(result.newVersion).toBe('1.0.1-beta.1');
        });
    });

    describe('Reload Callbacks', () => {
        it('should call registered callbacks on reload', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const callback = jest.fn();
            hotReloadManager.onReload('test-plugin', callback);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    pluginId: 'test-plugin',
                    oldVersion: '1.0.0',
                    newVersion: '1.0.1',
                })
            );
        });

        it('should support multiple callbacks', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const callback1 = jest.fn();
            const callback2 = jest.fn();
            hotReloadManager.onReload('test-plugin', callback1);
            hotReloadManager.onReload('test-plugin', callback2);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should remove callbacks', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const callback = jest.fn();
            hotReloadManager.onReload('test-plugin', callback);
            hotReloadManager.offReload('test-plugin', callback);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(callback).not.toHaveBeenCalled();
        });

        it('should handle callback errors gracefully', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const errorCallback = jest.fn(() => {
                throw new Error('Callback error');
            });
            const successCallback = jest.fn();

            hotReloadManager.onReload('test-plugin', errorCallback);
            hotReloadManager.onReload('test-plugin', successCallback);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            // Both should be called despite error
            expect(errorCallback).toHaveBeenCalled();
            expect(successCallback).toHaveBeenCalled();
        });

        it('should not call callbacks for other plugins', async () => {
            hotReloadManager.register('plugin-1', mockManifest, mockDefinition);
            hotReloadManager.register('plugin-2', { ...mockManifest, id: 'plugin-2' }, mockDefinition);

            const callback1 = jest.fn();
            const callback2 = jest.fn();
            hotReloadManager.onReload('plugin-1', callback1);
            hotReloadManager.onReload('plugin-2', callback2);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            await hotReloadManager.reload('plugin-1', newManifest, mockDefinition);

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should throw error when reloading unregistered plugin', async () => {
            const newManifest = { ...mockManifest, version: '1.0.1' };

            await expect(
                hotReloadManager.reload('unknown-plugin', newManifest, mockDefinition)
            ).rejects.toThrow('not registered for hot reload');
        });

        it('should restore old version on reload failure', async () => {
            const initialState = { count: 42 };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, initialState);

            // Mock clearModuleCache to throw error
            const originalClearModuleCache = (hotReloadManager as any).clearModuleCache;
            (hotReloadManager as any).clearModuleCache = jest.fn(() => {
                throw new Error('Clear cache failed');
            });

            const newManifest = { ...mockManifest, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(hotReloadManager.getState('test-plugin')).toEqual(initialState);

            // Restore original method
            (hotReloadManager as any).clearModuleCache = originalClearModuleCache;
        });

        it('should return error in result on failure', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const originalClearModuleCache = (hotReloadManager as any).clearModuleCache;
            const testError = new Error('Test error');
            (hotReloadManager as any).clearModuleCache = jest.fn(() => {
                throw testError;
            });

            const newManifest = { ...mockManifest, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(false);
            expect(result.error).toBe(testError);

            (hotReloadManager as any).clearModuleCache = originalClearModuleCache;
        });

        it('should throw when hot reload is disabled', async () => {
            const disabledManager = new HotReloadManager({ enabled: false });
            disabledManager.register('test-plugin', mockManifest, mockDefinition);

            const newManifest = { ...mockManifest, version: '1.0.1' };

            await expect(
                disabledManager.reload('test-plugin', newManifest, mockDefinition)
            ).rejects.toThrow('Hot reload is disabled');
        });
    });

    describe('State Management', () => {
        it('should get plugin state', () => {
            const state = { count: 42 };
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition, state);

            expect(hotReloadManager.getState('test-plugin')).toEqual(state);
        });

        it('should return undefined for unregistered plugin state', () => {
            expect(hotReloadManager.getState('unknown-plugin')).toBeUndefined();
        });

        it('should update plugin state', () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const newState = { count: 100 };
            hotReloadManager.setState('test-plugin', newState);

            expect(hotReloadManager.getState('test-plugin')).toEqual(newState);
        });

        it('should handle setState for unregistered plugin', () => {
            // Should not throw
            hotReloadManager.setState('unknown-plugin', { data: 'test' });
            expect(hotReloadManager.getState('unknown-plugin')).toBeUndefined();
        });
    });

    describe('Stats and Management', () => {
        it('should return correct stats', () => {
            hotReloadManager.register('plugin-1', mockManifest, mockDefinition);
            hotReloadManager.register('plugin-2', { ...mockManifest, id: 'plugin-2' }, mockDefinition);

            const callback = jest.fn();
            hotReloadManager.onReload('plugin-1', callback);

            const stats = hotReloadManager.getStats();

            expect(stats.enabled).toBe(true);
            expect(stats.trackedPlugins).toBe(2);
            expect(stats.listeners).toBe(1);
        });

        it('should clear all caches', () => {
            hotReloadManager.register('plugin-1', mockManifest, mockDefinition);
            hotReloadManager.register('plugin-2', { ...mockManifest, id: 'plugin-2' }, mockDefinition);
            hotReloadManager.onReload('plugin-1', jest.fn());

            hotReloadManager.clear();

            const stats = hotReloadManager.getStats();
            expect(stats.trackedPlugins).toBe(0);
            expect(stats.listeners).toBe(0);
        });

        it('should enable/disable hot reload', () => {
            hotReloadManager.setEnabled(false);
            expect(hotReloadManager.getStats().enabled).toBe(false);

            hotReloadManager.setEnabled(true);
            expect(hotReloadManager.getStats().enabled).toBe(true);
        });

        it('should not allow reload when disabled', () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);
            hotReloadManager.setEnabled(false);

            expect(hotReloadManager.canReload('test-plugin')).toBe(false);
        });
    });

    describe('Dependency Reloading', () => {
        it('should track dependencies when reloadDependencies is true', async () => {
            const manifestWithDeps: ObjectStackManifest = {
                ...mockManifest,
                dependencies: {
                    dep1: '1.0.0',
                    dep2: '2.0.0',
                },
            };

            hotReloadManager.register('test-plugin', manifestWithDeps, mockDefinition);

            const newManifest = { ...manifestWithDeps, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition, {
                reloadDependencies: true,
            });

            expect(result.success).toBe(true);
            expect(result.dependencies).toEqual(['dep1', 'dep2']);
        });

        it('should handle dependencies as object', async () => {
            const manifestWithDeps: ObjectStackManifest = {
                ...mockManifest,
                dependencies: {
                    dep1: '1.0.0',
                    dep2: '2.0.0',
                },
            };

            hotReloadManager.register('test-plugin', manifestWithDeps, mockDefinition);

            const newManifest = { ...manifestWithDeps, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition, {
                reloadDependencies: true,
            });

            expect(result.success).toBe(true);
            expect(result.dependencies).toEqual(['dep1', 'dep2']);
        });

        it('should not track dependencies by default', async () => {
            const manifestWithDeps: ObjectStackManifest = {
                ...mockManifest,
                dependencies: {
                    dep1: '1.0.0',
                    dep2: '2.0.0',
                },
            };

            hotReloadManager.register('test-plugin', manifestWithDeps, mockDefinition);

            const newManifest = { ...manifestWithDeps, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.dependencies).toBeUndefined();
        });
    });

    describe('canReload', () => {
        it('should return true for registered plugins', () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);
            expect(hotReloadManager.canReload('test-plugin')).toBe(true);
        });

        it('should return false for unregistered plugins', () => {
            expect(hotReloadManager.canReload('unknown-plugin')).toBe(false);
        });

        it('should return false when hot reload is disabled', () => {
            const disabledManager = new HotReloadManager({ enabled: false });
            disabledManager.register('test-plugin', mockManifest, mockDefinition);

            expect(disabledManager.canReload('test-plugin')).toBe(false);
        });
    });

    describe('Reload Result', () => {
        it('should include all result fields on success', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const newManifest = { ...mockManifest, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result).toMatchObject({
                success: true,
                pluginId: 'test-plugin',
                oldVersion: '1.0.0',
                newVersion: '1.0.1',
            });
            expect(result.reloadedAt).toBeInstanceOf(Date);
        });

        it('should include error in result on failure', async () => {
            hotReloadManager.register('test-plugin', mockManifest, mockDefinition);

            const testError = new Error('Test error');
            (hotReloadManager as any).clearModuleCache = jest.fn(() => {
                throw testError;
            });

            const newManifest = { ...mockManifest, version: '1.0.1' };
            const result = await hotReloadManager.reload('test-plugin', newManifest, mockDefinition);

            expect(result.success).toBe(false);
            expect(result.error).toBe(testError);
        });
    });
});
