/**
 * Plugin Manager
 * 
 * Manages the plugin lifecycle according to @objectstack/spec/system.
 * Handles plugin registration, initialization, and lifecycle hooks.
 */

import type { 
    PluginDefinition, 
    PluginContextData, 
    ObjectStackManifest 
} from '@objectstack/spec/system';
import { Logger, createLogger } from './logger';
import { ScopedStorage } from './scoped-storage';

export interface PluginEntry {
    manifest: ObjectStackManifest;
    definition: PluginDefinition;
    enabled: boolean;
    installed: boolean;
}

export type PluginLifecycleHook = 'onInstall' | 'onEnable' | 'onLoad' | 'onDisable' | 'onUninstall';

/**
 * Plugin Manager
 * 
 * Coordinates plugin lifecycle and maintains the plugin registry.
 */
export class PluginManager {
    private plugins: Map<string, PluginEntry> = new Map();
    private logger: Logger;
    private contextBuilder: (pluginId: string) => PluginContextData;

    constructor(contextBuilder: (pluginId: string) => PluginContextData) {
        this.logger = createLogger('PluginManager');
        this.contextBuilder = contextBuilder;
    }

    /**
     * Register a plugin with its manifest.
     * 
     * @param manifest - Plugin manifest (static configuration)
     * @param definition - Plugin definition (lifecycle hooks)
     */
    register(manifest: ObjectStackManifest, definition: PluginDefinition): void {
        const { id } = manifest;

        if (this.plugins.has(id)) {
            this.logger.warn(`Plugin '${id}' is already registered. Skipping.`);
            return;
        }

        this.plugins.set(id, {
            manifest,
            definition,
            enabled: false,
            installed: false,
        });

        this.logger.info(`Registered plugin: ${id} v${manifest.version}`);
    }

    /**
     * Install a plugin (first-time setup).
     * Calls the onInstall lifecycle hook.
     */
    async install(pluginId: string): Promise<void> {
        const entry = this.plugins.get(pluginId);
        if (!entry) {
            throw new Error(`Plugin '${pluginId}' not found`);
        }

        if (entry.installed) {
            this.logger.warn(`Plugin '${pluginId}' is already installed`);
            return;
        }

        this.logger.info(`Installing plugin: ${pluginId}`);

        try {
            const context = this.contextBuilder(pluginId);
            
            if (entry.definition.onInstall) {
                await entry.definition.onInstall(context);
            }

            entry.installed = true;
            this.logger.info(`Installed plugin: ${pluginId}`);
        } catch (error) {
            this.logger.error(`Failed to install plugin '${pluginId}'`, error as Error);
            throw error;
        }
    }

    /**
     * Enable a plugin.
     * Calls the onEnable lifecycle hook.
     */
    async enable(pluginId: string): Promise<void> {
        const entry = this.plugins.get(pluginId);
        if (!entry) {
            throw new Error(`Plugin '${pluginId}' not found`);
        }

        if (!entry.installed) {
            this.logger.info(`Plugin '${pluginId}' not installed, installing first`);
            await this.install(pluginId);
        }

        if (entry.enabled) {
            this.logger.warn(`Plugin '${pluginId}' is already enabled`);
            return;
        }

        this.logger.info(`Enabling plugin: ${pluginId}`);

        try {
            const context = this.contextBuilder(pluginId);
            
            if (entry.definition.onEnable) {
                await entry.definition.onEnable(context);
            }

            entry.enabled = true;
            this.logger.info(`Enabled plugin: ${pluginId}`);
        } catch (error) {
            this.logger.error(`Failed to enable plugin '${pluginId}'`, error as Error);
            throw error;
        }
    }

    /**
     * Load plugin metadata.
     * Note: onLoad is optional in the spec and not all plugins may implement it.
     */
    async load(pluginId: string): Promise<void> {
        const entry = this.plugins.get(pluginId);
        if (!entry) {
            throw new Error(`Plugin '${pluginId}' not found`);
        }

        this.logger.debug(`Loading metadata for plugin: ${pluginId}`);

        try {
            const context = this.contextBuilder(pluginId);
            
            // onLoad is optional, check if it exists before calling
            const onLoadHook = (entry.definition as any).onLoad;
            if (onLoadHook && typeof onLoadHook === 'function') {
                await onLoadHook(context);
            }
        } catch (error) {
            this.logger.error(`Failed to load plugin '${pluginId}'`, error as Error);
            throw error;
        }
    }

    /**
     * Disable a plugin.
     * Calls the onDisable lifecycle hook.
     */
    async disable(pluginId: string): Promise<void> {
        const entry = this.plugins.get(pluginId);
        if (!entry) {
            throw new Error(`Plugin '${pluginId}' not found`);
        }

        if (!entry.enabled) {
            this.logger.warn(`Plugin '${pluginId}' is not enabled`);
            return;
        }

        this.logger.info(`Disabling plugin: ${pluginId}`);

        try {
            const context = this.contextBuilder(pluginId);
            
            if (entry.definition.onDisable) {
                await entry.definition.onDisable(context);
            }

            entry.enabled = false;
            this.logger.info(`Disabled plugin: ${pluginId}`);
        } catch (error) {
            this.logger.error(`Failed to disable plugin '${pluginId}'`, error as Error);
            throw error;
        }
    }

    /**
     * Uninstall a plugin.
     * Calls the onUninstall lifecycle hook.
     */
    async uninstall(pluginId: string): Promise<void> {
        const entry = this.plugins.get(pluginId);
        if (!entry) {
            throw new Error(`Plugin '${pluginId}' not found`);
        }

        if (entry.enabled) {
            this.logger.info(`Plugin '${pluginId}' is enabled, disabling first`);
            await this.disable(pluginId);
        }

        this.logger.info(`Uninstalling plugin: ${pluginId}`);

        try {
            const context = this.contextBuilder(pluginId);
            
            if (entry.definition.onUninstall) {
                await entry.definition.onUninstall(context);
            }

            entry.installed = false;
            this.plugins.delete(pluginId);
            this.logger.info(`Uninstalled plugin: ${pluginId}`);
        } catch (error) {
            this.logger.error(`Failed to uninstall plugin '${pluginId}'`, error as Error);
            throw error;
        }
    }

    /**
     * Get a plugin entry by ID.
     */
    getPlugin(pluginId: string): PluginEntry | undefined {
        return this.plugins.get(pluginId);
    }

    /**
     * Get all registered plugins.
     */
    getAllPlugins(): Map<string, PluginEntry> {
        return new Map(this.plugins);
    }

    /**
     * Get enabled plugins only.
     */
    getEnabledPlugins(): PluginEntry[] {
        return Array.from(this.plugins.values()).filter(p => p.enabled);
    }

    /**
     * Check if a plugin is registered.
     */
    hasPlugin(pluginId: string): boolean {
        return this.plugins.has(pluginId);
    }

    /**
     * Check if a plugin is enabled.
     */
    isEnabled(pluginId: string): boolean {
        const entry = this.plugins.get(pluginId);
        return entry ? entry.enabled : false;
    }

    /**
     * Check if a plugin is installed.
     */
    isInstalled(pluginId: string): boolean {
        const entry = this.plugins.get(pluginId);
        return entry ? entry.installed : false;
    }
}
