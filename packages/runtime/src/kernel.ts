/**
 * @objectstack/runtime - ObjectKernel
 * 
 * The core kernel that manages plugin lifecycle and provides essential services.
 */

import type { Plugin, PluginContext, Logger } from './types';
import { PluginContextImpl } from './plugin-context';
import { createLogger } from './logger';

interface PluginEntry {
  plugin: Plugin;
  initialized: boolean;
  started: boolean;
}

/**
 * ObjectKernel - The micro-kernel for ObjectStack
 * 
 * Manages plugin lifecycle and provides core services:
 * - Plugin Lifecycle Manager
 * - Service Registry (DI Container)
 * - Event Bus (Hook System)
 * - Dependency Resolver
 */
export class ObjectKernel {
  private plugins: Map<string, PluginEntry> = new Map();
  private context: PluginContextImpl;
  private logger: Logger;
  private bootstrapped: boolean = false;

  constructor() {
    this.logger = createLogger('ObjectKernel');
    this.context = new PluginContextImpl(this.logger);
  }

  /**
   * Register a plugin with the kernel.
   * Plugins should be registered before bootstrap.
   * 
   * @param plugin - The plugin instance to register
   * @returns this (for chaining)
   */
  use(plugin: Plugin): this {
    if (this.bootstrapped) {
      this.logger.warn('Adding plugin after bootstrap. Plugin will need to be manually initialized.');
    }

    if (this.plugins.has(plugin.name)) {
      this.logger.warn(`Plugin '${plugin.name}' is already registered. Skipping.`);
      return this;
    }

    this.plugins.set(plugin.name, {
      plugin,
      initialized: false,
      started: false,
    });

    this.logger.info(`Registered plugin: ${plugin.name}${plugin.version ? ` v${plugin.version}` : ''}`);
    return this;
  }

  /**
   * Bootstrap the kernel.
   * - Resolves plugin dependencies (topological sort)
   * - Calls init() on all plugins
   * - Calls start() on all plugins
   * - Triggers 'kernel:ready' event
   */
  async bootstrap(): Promise<void> {
    this.logger.info('Bootstrapping ObjectKernel...');
    
    // Trigger kernel:init event
    await this.context.trigger('kernel:init');

    // Resolve dependencies and get initialization order
    const initOrder = this.resolveDependencies();
    
    // Initialize plugins in dependency order
    for (const pluginName of initOrder) {
      await this.initializePlugin(pluginName);
    }

    // Start all plugins
    for (const pluginName of initOrder) {
      await this.startPlugin(pluginName);
    }

    this.bootstrapped = true;
    
    // Trigger kernel:ready event
    await this.context.trigger('kernel:ready');
    
    this.logger.info(`ObjectKernel ready (${this.plugins.size} plugins loaded)`);
  }

  /**
   * Shutdown the kernel.
   * Calls destroy() on all plugins in reverse order.
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down ObjectKernel...');
    
    // Trigger kernel:shutdown event
    await this.context.trigger('kernel:shutdown');

    // Get plugins in reverse order
    const pluginNames = Array.from(this.plugins.keys()).reverse();
    
    for (const pluginName of pluginNames) {
      const entry = this.plugins.get(pluginName)!;
      
      if (entry.plugin.destroy) {
        try {
          this.logger.debug(`Destroying plugin: ${pluginName}`);
          await entry.plugin.destroy();
        } catch (error) {
          this.logger.error(`Error destroying plugin '${pluginName}':`, error);
        }
      }
    }

    this.bootstrapped = false;
    this.logger.info('ObjectKernel shutdown complete');
  }

  /**
   * Get a service from the service registry.
   */
  getService<T = any>(name: string): T {
    return this.context.getService<T>(name);
  }

  /**
   * Check if a service is registered.
   */
  hasService(name: string): boolean {
    return this.context.hasService(name);
  }

  /**
   * Get the plugin context (for advanced use cases).
   */
  get pluginContext(): PluginContext {
    return this.context;
  }

  /**
   * Initialize a single plugin.
   */
  private async initializePlugin(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    if (entry.initialized) {
      return;
    }

    // Check dependencies
    const deps = entry.plugin.dependencies || [];
    for (const dep of deps) {
      const depEntry = this.plugins.get(dep);
      if (!depEntry) {
        throw new Error(`Plugin '${pluginName}' depends on '${dep}', but it is not registered`);
      }
      if (!depEntry.initialized) {
        throw new Error(`Plugin '${pluginName}' depends on '${dep}', but it is not initialized yet`);
      }
    }

    this.logger.debug(`Initializing plugin: ${pluginName}`);
    
    if (entry.plugin.init) {
      try {
        await entry.plugin.init(this.context);
      } catch (error) {
        this.logger.error(`Error initializing plugin '${pluginName}':`, error);
        throw error;
      }
    }

    entry.initialized = true;
    this.logger.debug(`Initialized plugin: ${pluginName}`);
  }

  /**
   * Start a single plugin.
   */
  private async startPlugin(pluginName: string): Promise<void> {
    const entry = this.plugins.get(pluginName);
    if (!entry) {
      throw new Error(`Plugin '${pluginName}' not found`);
    }

    if (entry.started) {
      return;
    }

    if (!entry.initialized) {
      throw new Error(`Cannot start plugin '${pluginName}' - not initialized`);
    }

    this.logger.debug(`Starting plugin: ${pluginName}`);
    
    if (entry.plugin.start) {
      try {
        await entry.plugin.start(this.context);
      } catch (error) {
        this.logger.error(`Error starting plugin '${pluginName}':`, error);
        throw error;
      }
    }

    entry.started = true;
    this.logger.debug(`Started plugin: ${pluginName}`);
  }

  /**
   * Resolve plugin dependencies using topological sort.
   * Returns plugin names in initialization order.
   */
  private resolveDependencies(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (pluginName: string) => {
      if (visited.has(pluginName)) {
        return;
      }

      if (visiting.has(pluginName)) {
        throw new Error(`Circular dependency detected: ${pluginName}`);
      }

      visiting.add(pluginName);

      const entry = this.plugins.get(pluginName);
      if (!entry) {
        throw new Error(`Plugin '${pluginName}' not found`);
      }

      const deps = entry.plugin.dependencies || [];
      for (const dep of deps) {
        if (!this.plugins.has(dep)) {
          throw new Error(`Plugin '${pluginName}' depends on '${dep}', but it is not registered`);
        }
        visit(dep);
      }

      visiting.delete(pluginName);
      visited.add(pluginName);
      order.push(pluginName);
    };

    for (const pluginName of this.plugins.keys()) {
      visit(pluginName);
    }

    return order;
  }
}
