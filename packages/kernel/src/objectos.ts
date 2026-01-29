import { ObjectQL } from '@objectql/core';
import { ObjectQLConfig, ObjectQLPlugin } from '@objectql/types';
import type { PluginDefinition, ObjectStackManifest, KernelContext } from '@objectstack/spec/system';
import { ObjectOSPlugin } from './plugins/objectql';
import { KernelContextManager } from './kernel-context';
import { StorageManager } from './scoped-storage';
import { PluginManager } from './plugin-manager';
import { PluginContextBuilder } from './plugin-context';
import { createLogger, Logger } from './logger';
import { PermissionManager, PermissionManagerConfig } from './permissions';

export interface ObjectOSConfig extends ObjectQLConfig {
    /**
     * Kernel context configuration
     */
    kernelContext?: Partial<KernelContext>;
    
    /**
     * Spec-compliant plugins (new style)
     */
    specPlugins?: Array<{
        manifest: ObjectStackManifest;
        definition: PluginDefinition;
    }>;
    
    /**
     * Permission system configuration
     */
    permissions?: PermissionManagerConfig;
}

/**
 * ObjectOS - The Enterprise Operating System
 * 
 * Implements the @objectstack/spec protocol for plugin lifecycle,
 * context management, and system orchestration.
 */
export class ObjectOS extends ObjectQL {
    private kernelContext: KernelContextManager;
    private storageManager: StorageManager;
    private pluginManager: PluginManager;
    private contextBuilder: PluginContextBuilder;
    private logger: Logger;
    private permissionManager: PermissionManager;

    constructor(config: ObjectOSConfig = {}) {
        // Initialize ObjectQL base with ObjectOS plugin
        super({
            datasources: config.datasources || {},
            presets: config.presets || config.packages,
            plugins: [ObjectOSPlugin, ...(config.plugins || [])],
            source: config.source,
            objects: config.objects,
            connection: config.connection,
            remotes: config.remotes,
        });

        // Initialize kernel components
        this.kernelContext = new KernelContextManager(config.kernelContext);
        this.storageManager = new StorageManager();
        this.logger = createLogger('ObjectOS');
        
        // Initialize permission manager
        this.permissionManager = new PermissionManager(config.permissions);
        
        // Create plugin context builder
        this.contextBuilder = new PluginContextBuilder(
            this,
            (pluginId: string) => this.storageManager.createScopedStorage(pluginId)
        );

        // Create plugin manager with context builder
        this.pluginManager = new PluginManager(
            (pluginId: string) => this.contextBuilder.build(pluginId)
        );

        // Register spec-compliant plugins if provided
        if (config.specPlugins) {
            for (const { manifest, definition } of config.specPlugins) {
                this.registerPlugin(manifest, definition);
            }
        }
    }
    
    /**
     * Initialize the ObjectOS kernel.
     * Boots ObjectQL and enables all registered plugins.
     */
    async init(options?: any): Promise<void> {
        this.logger.info('Initializing ObjectOS kernel...');
        
        // Initialize ObjectQL base
        await super.init();
        
        // Initialize permission manager
        await this.permissionManager.init();
        
        // Enable all registered plugins
        const plugins = this.pluginManager.getAllPlugins();
        for (const [pluginId, entry] of plugins) {
            try {
                await this.pluginManager.enable(pluginId);
            } catch (error) {
                this.logger.error(`Failed to enable plugin '${pluginId}'`, error as Error);
                // Continue with other plugins
            }
        }
        
        this.logger.info(`ObjectOS kernel initialized (${plugins.size} plugins)`);
    }

    /**
     * Register a spec-compliant plugin.
     * 
     * @param manifest - Plugin manifest (static configuration)
     * @param definition - Plugin definition (lifecycle hooks)
     */
    registerPlugin(manifest: ObjectStackManifest, definition: PluginDefinition): void {
        this.pluginManager.register(manifest, definition);
    }

    /**
     * Get the kernel context.
     */
    getKernelContext(): KernelContext {
        return this.kernelContext.getContext();
    }

    /**
     * Get the plugin manager.
     */
    getPluginManager(): PluginManager {
        return this.pluginManager;
    }

    /**
     * Get the context builder (for advanced use cases).
     */
    getContextBuilder(): PluginContextBuilder {
        return this.contextBuilder;
    }

    /**
     * Get the storage manager.
     */
    getStorageManager(): StorageManager {
        return this.storageManager;
    }

    /**
     * Get the permission manager.
     */
    getPermissionManager(): PermissionManager {
        return this.permissionManager;
    }

    /**
     * Set a database driver for the default datasource.
     * 
     * @deprecated since v0.2.0. Use datasources configuration in constructor instead.
     * Will be removed in v1.0.0.
     * 
     * @example
     * ```typescript
     * // Instead of:
     * const os = new ObjectOS();
     * os.useDriver(driver);
     * 
     * // Use:
     * const os = new ObjectOS({
     *   datasources: {
     *     default: driver
     *   }
     * });
     * ```
     */
    useDriver(driver: any): void {
        (this as any).datasources['default'] = driver;
    }
}

