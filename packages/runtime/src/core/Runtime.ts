/**
 * ObjectStack Runtime
 * 
 * Microkernel for plugin management and lifecycle control.
 */

import {
  Runtime,
  RuntimeConfig,
  Plugin,
  PluginManifest,
  PluginState,
  PluginContext,
  PluginError,
  ServiceRegistry,
  EventBus,
  PluginStorage
} from '../types';
import { ServiceRegistryImpl } from './ServiceRegistry';
import { EventBusImpl } from './EventBus';
import { LoggerImpl } from './Logger';
import { MemoryStorage, StorageFactory } from './Storage';
import { DependencyResolver } from '../utils/DependencyResolver';

export class ObjectStackRuntime implements Runtime {
  public readonly services: ServiceRegistry;
  public readonly events: EventBus;
  private plugins = new Map<string, Plugin>();
  private storage: PluginStorage;
  private logger: LoggerImpl;
  private started = false;

  constructor(public readonly config: RuntimeConfig = {}) {
    // Initialize core services
    this.services = new ServiceRegistryImpl();
    this.events = new EventBusImpl();
    this.logger = new LoggerImpl('Runtime', config.debug);
    
    // Initialize storage backend
    this.storage = this.createStorage();
    
    // Register core services
    this.services.register('runtime', this);
    this.services.register('services', this.services);
    this.services.register('events', this.events);
  }

  /**
   * Create storage backend based on configuration
   */
  private createStorage(): PluginStorage {
    const type = this.config.storage?.type || 'memory';
    
    switch (type) {
      case 'memory':
        return new MemoryStorage();
      
      // Future: SQLite, Redis implementations
      default:
        this.logger.warn(`Unknown storage type '${type}', using memory`);
        return new MemoryStorage();
    }
  }

  /**
   * Load a plugin
   */
  async loadPlugin(input: PluginManifest | string): Promise<Plugin> {
    // Parse manifest
    const manifest = typeof input === 'string' 
      ? await this.loadManifestFromFile(input)
      : input;

    // Validate manifest
    this.validateManifest(manifest);

    // Check if already loaded
    if (this.plugins.has(manifest.id)) {
      throw new PluginError(
        `Plugin '${manifest.id}' is already loaded`,
        manifest.id
      );
    }

    this.logger.info(`Loading plugin: ${manifest.id}@${manifest.version}`);

    // Create plugin instance
    const plugin: Plugin = {
      manifest,
      state: PluginState.INSTALLED,
      context: this.createPluginContext(manifest),
      hooks: {}
    };

    // Load plugin hooks
    if (manifest.hooks) {
      try {
        plugin.hooks = await this.loadPluginHooks(manifest);
      } catch (error) {
        plugin.state = PluginState.ERROR;
        plugin.error = error as Error;
        throw new PluginError(
          `Failed to load hooks for plugin '${manifest.id}': ${error}`,
          manifest.id
        );
      }
    }

    // Call onLoad hook
    try {
      if (plugin.hooks?.onLoad) {
        await plugin.hooks.onLoad(plugin.context);
      }
      plugin.state = PluginState.LOADED;
    } catch (error) {
      plugin.state = PluginState.ERROR;
      plugin.error = error as Error;
      throw new PluginError(
        `onLoad hook failed for plugin '${manifest.id}': ${error}`,
        manifest.id
      );
    }

    // Store plugin
    this.plugins.set(manifest.id, plugin);
    this.events.emit('plugin:loaded', { plugin });

    this.logger.info(`Plugin loaded: ${manifest.id}`);
    return plugin;
  }

  /**
   * Get a plugin by ID
   */
  getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }

  /**
   * Get all loaded plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new PluginError(`Plugin '${id}' not found`, id);
    }

    if (plugin.state === PluginState.ENABLED) {
      this.logger.warn(`Plugin '${id}' is already enabled`);
      return;
    }

    if (plugin.state !== PluginState.LOADED) {
      throw new PluginError(
        `Cannot enable plugin '${id}' in state '${plugin.state}'`,
        id
      );
    }

    this.logger.info(`Enabling plugin: ${id}`);

    try {
      if (plugin.hooks?.onEnable) {
        await plugin.hooks.onEnable(plugin.context);
      }
      plugin.state = PluginState.ENABLED;
      this.events.emit('plugin:enabled', { plugin });
      this.logger.info(`Plugin enabled: ${id}`);
    } catch (error) {
      plugin.state = PluginState.ERROR;
      plugin.error = error as Error;
      throw new PluginError(
        `onEnable hook failed for plugin '${id}': ${error}`,
        id
      );
    }
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new PluginError(`Plugin '${id}' not found`, id);
    }

    if (plugin.state !== PluginState.ENABLED) {
      this.logger.warn(`Plugin '${id}' is not enabled`);
      return;
    }

    this.logger.info(`Disabling plugin: ${id}`);

    try {
      if (plugin.hooks?.onDisable) {
        await plugin.hooks.onDisable(plugin.context);
      }
      plugin.state = PluginState.DISABLED;
      this.events.emit('plugin:disabled', { plugin });
      this.logger.info(`Plugin disabled: ${id}`);
    } catch (error) {
      plugin.error = error as Error;
      throw new PluginError(
        `onDisable hook failed for plugin '${id}': ${error}`,
        id
      );
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new PluginError(`Plugin '${id}' not found`, id);
    }

    // Disable first if enabled
    if (plugin.state === PluginState.ENABLED) {
      await this.disablePlugin(id);
    }

    this.logger.info(`Unloading plugin: ${id}`);

    try {
      if (plugin.hooks?.onUninstall) {
        await plugin.hooks.onUninstall(plugin.context);
      }
      this.plugins.delete(id);
      this.events.emit('plugin:unloaded', { plugin });
      this.logger.info(`Plugin unloaded: ${id}`);
    } catch (error) {
      throw new PluginError(
        `onUninstall hook failed for plugin '${id}': ${error}`,
        id
      );
    }
  }

  /**
   * Start the runtime
   */
  async start(): Promise<void> {
    if (this.started) {
      this.logger.warn('Runtime is already started');
      return;
    }

    this.logger.info('Starting ObjectStack Runtime...');

    // Load configured plugins
    const configPlugins = this.config.plugins || [];
    const manifests: PluginManifest[] = [];

    for (const pluginConfig of configPlugins) {
      const manifest = typeof pluginConfig === 'string'
        ? await this.loadManifestFromFile(pluginConfig)
        : pluginConfig;
      manifests.push(manifest);
    }

    // Resolve dependency order
    const graph = DependencyResolver.buildGraph(manifests);
    const loadOrder = DependencyResolver.resolve(graph);

    this.logger.info(`Plugin load order: ${loadOrder.join(' -> ')}`);

    // Load plugins in dependency order
    for (const pluginId of loadOrder) {
      const manifest = manifests.find(m => m.id === pluginId);
      if (manifest) {
        await this.loadPlugin(manifest);
      }
    }

    // Enable all loaded plugins
    for (const pluginId of loadOrder) {
      await this.enablePlugin(pluginId);
    }

    this.started = true;
    this.events.emit('runtime:started');
    this.logger.info('Runtime started successfully');
  }

  /**
   * Stop the runtime
   */
  async stop(): Promise<void> {
    if (!this.started) {
      this.logger.warn('Runtime is not started');
      return;
    }

    this.logger.info('Stopping ObjectStack Runtime...');

    // Disable all plugins in reverse order
    const plugins = this.getPlugins().reverse();
    for (const plugin of plugins) {
      if (plugin.state === PluginState.ENABLED) {
        await this.disablePlugin(plugin.manifest.id);
      }
    }

    this.started = false;
    this.events.emit('runtime:stopped');
    this.logger.info('Runtime stopped');
  }

  /**
   * Create plugin context
   */
  private createPluginContext(manifest: PluginManifest): PluginContext {
    return {
      runtime: this,
      services: this.services,
      events: this.events,
      logger: new LoggerImpl(manifest.id, this.config.debug),
      config: manifest.config || {},
      storage: StorageFactory.createScoped(manifest.id, this.storage)
    };
  }

  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): void {
    if (!manifest.id) {
      throw new Error('Plugin manifest must have an id');
    }
    if (!manifest.name) {
      throw new Error('Plugin manifest must have a name');
    }
    if (!manifest.version) {
      throw new Error('Plugin manifest must have a version');
    }
  }

  /**
   * Load manifest from file
   */
  private async loadManifestFromFile(path: string): Promise<PluginManifest> {
    // Future: implement file loading
    throw new Error('Loading manifest from file is not yet implemented');
  }

  /**
   * Load plugin hooks
   */
  private async loadPluginHooks(manifest: PluginManifest): Promise<any> {
    // Future: implement dynamic hook loading
    return {};
  }
}
