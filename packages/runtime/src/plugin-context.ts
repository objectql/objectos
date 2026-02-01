/**
 * @objectstack/runtime - Plugin Context Implementation
 */

import type { PluginContext, Logger } from './types';

export class PluginContextImpl implements PluginContext {
  private services: Map<string, any> = new Map();
  private hooks: Map<string, Function[]> = new Map();
  public logger: Logger;
  private kernel?: any;

  constructor(
    logger: Logger,
    initialServices?: Map<string, any>,
    initialHooks?: Map<string, Function[]>
  ) {
    this.logger = logger;
    if (initialServices) {
      this.services = new Map(initialServices);
    }
    if (initialHooks) {
      this.hooks = new Map(initialHooks);
    }
  }

  registerService(name: string, service: any): void {
    if (this.services.has(name)) {
      this.logger.warn(`Service '${name}' is already registered. Overwriting.`);
    }
    this.services.set(name, service);
    this.logger.debug(`Registered service: ${name}`);
  }

  getService<T = any>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service as T;
  }

  hasService(name: string): boolean {
    return this.services.has(name);
  }

  hook(name: string, handler: Function): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name)!.push(handler);
    this.logger.debug(`Registered hook: ${name}`);
  }

  async trigger(name: string, ...args: any[]): Promise<void> {
    const handlers = this.hooks.get(name);
    if (!handlers || handlers.length === 0) {
      return;
    }

    this.logger.debug(`Triggering hook: ${name} (${handlers.length} handlers)`);
    
    // Execute all handlers, collecting any errors
    const errors: Error[] = [];
    
    for (const handler of handlers) {
      try {
        await handler(...args);
      } catch (error) {
        this.logger.error(`Error in hook '${name}':`, error);
        // Collect error but continue with other handlers
        // This allows the system to be resilient to individual plugin failures
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
    
    // If any handlers failed, we still executed all of them
    // Plugins should handle their own critical errors within their handlers
    // The kernel continues to operate even if some plugins fail
  }

  /**
   * Get all registered services (for internal use)
   */
  getServices(): Map<string, any> {
    return this.services;
  }

  /**
   * Get all registered hooks (for internal use)
   */
  getHooks(): Map<string, Function[]> {
    return this.hooks;
  }

  /**
   * Get the kernel instance (for advanced use cases)
   */
  getKernel(): any {
    return this.kernel;
  }

  /**
   * Set the kernel instance (for internal use)
   */
  setKernel(kernel: any): void {
    this.kernel = kernel;
  }
}
