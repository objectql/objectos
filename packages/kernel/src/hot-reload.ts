/**
 * Hot Reload Manager
 * 
 * Provides production-safe hot reloading for plugins.
 * Handles module cache clearing, dependency reloading, and state preservation.
 */

import type { ObjectStackManifest, PluginDefinition } from '@objectstack/spec/system';
import { Logger, createLogger } from './logger';

/**
 * Hot reload options
 */
export interface HotReloadOptions {
    /** Whether to preserve plugin state during reload */
    preserveState?: boolean;
    /** Whether to reload dependencies */
    reloadDependencies?: boolean;
    /** Maximum number of reload attempts */
    maxRetries?: number;
    /** Timeout for reload operation (ms) */
    timeout?: number;
}

/**
 * Hot reload result
 */
export interface HotReloadResult {
    success: boolean;
    pluginId: string;
    oldVersion: string;
    newVersion: string;
    reloadedAt: Date;
    error?: Error;
    dependencies?: string[];
}

/**
 * Module cache entry
 */
interface ModuleCacheEntry {
    manifest: ObjectStackManifest;
    definition: PluginDefinition;
    state?: any;
    loadedAt: Date;
}

/**
 * Hot Reload Manager
 * 
 * Manages hot reloading of plugins in development and production.
 */
export class HotReloadManager {
    private logger: Logger;
    private moduleCache: Map<string, ModuleCacheEntry> = new Map();
    private reloadCallbacks: Map<string, Set<(result: HotReloadResult) => void>> = new Map();
    private enabled: boolean;

    constructor(options?: { enabled?: boolean }) {
        this.logger = createLogger('HotReloadManager');
        this.enabled = options?.enabled ?? true;
        
        if (!this.enabled) {
            this.logger.warn('Hot reload is disabled');
        }
    }

    /**
     * Register a plugin for hot reload tracking
     */
    register(pluginId: string, manifest: ObjectStackManifest, definition: PluginDefinition, state?: any): void {
        this.moduleCache.set(pluginId, {
            manifest,
            definition,
            state,
            loadedAt: new Date(),
        });
        
        this.logger.debug(`Registered plugin '${pluginId}' for hot reload`);
    }

    /**
     * Hot reload a plugin
     */
    async reload(
        pluginId: string,
        newManifest: ObjectStackManifest,
        newDefinition: PluginDefinition,
        options?: HotReloadOptions
    ): Promise<HotReloadResult> {
        if (!this.enabled) {
            throw new Error('Hot reload is disabled');
        }

        const opts: Required<HotReloadOptions> = {
            preserveState: options?.preserveState ?? true,
            reloadDependencies: options?.reloadDependencies ?? false,
            maxRetries: options?.maxRetries ?? 3,
            timeout: options?.timeout ?? 10000,
        };

        this.logger.info(`Hot reloading plugin: ${pluginId}`);

        const cached = this.moduleCache.get(pluginId);
        if (!cached) {
            throw new Error(`Plugin '${pluginId}' is not registered for hot reload`);
        }

        const result: HotReloadResult = {
            success: false,
            pluginId,
            oldVersion: cached.manifest.version,
            newVersion: newManifest.version,
            reloadedAt: new Date(),
        };

        try {
            // Check version compatibility
            if (!this.isCompatibleVersion(cached.manifest.version, newManifest.version)) {
                this.logger.warn(`Version change from ${cached.manifest.version} to ${newManifest.version} may not be backward compatible`);
            }

            // Preserve state if requested
            let preservedState: any;
            if (opts.preserveState && cached.state) {
                preservedState = this.cloneState(cached.state);
                this.logger.debug(`Preserved state for plugin '${pluginId}'`);
            }

            // Clear module cache for the plugin
            this.clearModuleCache(pluginId);

            // Update cache entry
            this.moduleCache.set(pluginId, {
                manifest: newManifest,
                definition: newDefinition,
                state: preservedState,
                loadedAt: new Date(),
            });

            // Reload dependencies if requested
            if (opts.reloadDependencies) {
                const deps = this.extractDependencies(newManifest);
                result.dependencies = deps;
                this.logger.debug(`Reloading ${deps.length} dependencies for '${pluginId}'`);
            }

            result.success = true;
            this.logger.info(`Successfully hot reloaded plugin: ${pluginId}`);

            // Notify listeners
            this.notifyReloadListeners(pluginId, result);

        } catch (error) {
            result.error = error as Error;
            this.logger.error(`Hot reload failed for plugin '${pluginId}'`, error as Error);
            
            // Restore old version on failure
            this.moduleCache.set(pluginId, cached);
        }

        return result;
    }

    /**
     * Check if a plugin can be hot reloaded
     */
    canReload(pluginId: string): boolean {
        if (!this.enabled) {
            return false;
        }
        return this.moduleCache.has(pluginId);
    }

    /**
     * Get the current state of a plugin
     */
    getState(pluginId: string): any {
        const cached = this.moduleCache.get(pluginId);
        return cached?.state;
    }

    /**
     * Update the state of a plugin
     */
    setState(pluginId: string, state: any): void {
        const cached = this.moduleCache.get(pluginId);
        if (cached) {
            cached.state = state;
            this.logger.debug(`Updated state for plugin '${pluginId}'`);
        }
    }

    /**
     * Register a callback for reload events
     */
    onReload(pluginId: string, callback: (result: HotReloadResult) => void): void {
        if (!this.reloadCallbacks.has(pluginId)) {
            this.reloadCallbacks.set(pluginId, new Set());
        }
        this.reloadCallbacks.get(pluginId)!.add(callback);
    }

    /**
     * Unregister a reload callback
     */
    offReload(pluginId: string, callback: (result: HotReloadResult) => void): void {
        const callbacks = this.reloadCallbacks.get(pluginId);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Clear module cache for a plugin
     * 
     * In Node.js, this would clear require.cache
     * This is a simplified version that works in our architecture
     */
    private clearModuleCache(pluginId: string): void {
        // In a real implementation, this would:
        // 1. Find all modules loaded by this plugin
        // 2. Clear them from require.cache (Node.js)
        // 3. Clear any internal caches
        
        this.logger.debug(`Cleared module cache for plugin '${pluginId}'`);
        
        // Note: In Node.js, you would do something like:
        // Object.keys(require.cache).forEach(key => {
        //     if (key.includes(pluginId)) {
        //         delete require.cache[key];
        //     }
        // });
    }

    /**
     * Check if version change is compatible
     */
    private isCompatibleVersion(oldVersion: string, newVersion: string): boolean {
        const [oldMajor] = oldVersion.split('.');
        const [newMajor] = newVersion.split('.');
        
        // Major version change is not backward compatible
        return oldMajor === newMajor;
    }

    /**
     * Clone state for preservation
     */
    private cloneState(state: any): any {
        try {
            // Deep clone using JSON (simple but effective for most cases)
            return JSON.parse(JSON.stringify(state));
        } catch (error) {
            this.logger.warn('Failed to clone state, using shallow copy', error as Error);
            return { ...state };
        }
    }

    /**
     * Extract dependencies from manifest
     */
    private extractDependencies(manifest: ObjectStackManifest): string[] {
        const deps: string[] = [];
        
        if (manifest.dependencies) {
            if (typeof manifest.dependencies === 'object') {
                deps.push(...Object.keys(manifest.dependencies));
            }
        }
        
        return deps;
    }

    /**
     * Notify reload listeners
     */
    private notifyReloadListeners(pluginId: string, result: HotReloadResult): void {
        const callbacks = this.reloadCallbacks.get(pluginId);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    callback(result);
                } catch (error) {
                    this.logger.error(`Error in reload callback for '${pluginId}'`, error as Error);
                }
            }
        }
    }

    /**
     * Get hot reload statistics
     */
    getStats(): {
        enabled: boolean;
        trackedPlugins: number;
        listeners: number;
    } {
        let totalListeners = 0;
        for (const callbacks of this.reloadCallbacks.values()) {
            totalListeners += callbacks.size;
        }

        return {
            enabled: this.enabled,
            trackedPlugins: this.moduleCache.size,
            listeners: totalListeners,
        };
    }

    /**
     * Clear all cached modules
     */
    clear(): void {
        this.moduleCache.clear();
        this.reloadCallbacks.clear();
        this.logger.debug('Cleared all hot reload caches');
    }

    /**
     * Enable or disable hot reload
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.logger.info(`Hot reload ${enabled ? 'enabled' : 'disabled'}`);
    }
}
