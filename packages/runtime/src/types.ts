/**
 * @objectstack/runtime - Plugin Types
 * 
 * Type definitions for the micro-kernel plugin architecture.
 */

/**
 * Logger interface for plugins
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error | any, ...args: any[]): void;
}

/**
 * Plugin Context - Provides access to kernel services and hooks
 */
export interface PluginContext {
  /**
   * Service Registry
   */
  registerService(name: string, service: any): void;
  getService<T = any>(name: string): T;
  hasService(name: string): boolean;

  /**
   * Get all registered services
   */
  getServices(): Map<string, any>;

  /**
   * Event System (Hook System)
   */
  hook(name: string, handler: Function): void;
  trigger(name: string, ...args: any[]): Promise<void>;

  /**
   * Logger
   */
  logger: Logger;

  /**
   * Get the kernel instance (for advanced use cases)
   * @returns Kernel instance
   */
  getKernel(): any;
}

/**
 * Plugin Interface - All plugins must implement this
 */
export interface Plugin {
  /**
   * Unique plugin name (e.g., 'com.objectstack.engine.objectql')
   */
  name: string;

  /**
   * Plugin version (optional)
   */
  version?: string;

  /**
   * Plugin dependencies (optional)
   */
  dependencies?: string[];

  /**
   * Initialize plugin - Register services, subscribe to events
   */
  init?(ctx: PluginContext): Promise<void> | void;

  /**
   * Start plugin - Connect to databases, start servers
   */
  start?(ctx: PluginContext): Promise<void> | void;

  /**
   * Destroy plugin - Clean up resources
   */
  destroy?(): Promise<void> | void;
}
