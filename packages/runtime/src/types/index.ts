/**
 * ObjectStack Runtime - Core Type Definitions
 * 
 * This file defines the core types for the microkernel plugin system.
 * These types are based on @objectstack/spec protocol.
 */

/**
 * Plugin lifecycle states
 */
export enum PluginState {
  /** Plugin is installed but not loaded */
  INSTALLED = 'installed',
  /** Plugin manifest is loaded and validated */
  LOADED = 'loaded',
  /** Plugin is initialized and ready to use */
  ENABLED = 'enabled',
  /** Plugin is disabled but can be re-enabled */
  DISABLED = 'disabled',
  /** Plugin has encountered an error */
  ERROR = 'error'
}

/**
 * Plugin metadata from manifest
 */
export interface PluginManifest {
  /** Unique plugin identifier (e.g., 'objectos-crm') */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Semantic version (e.g., '1.0.0') */
  version: string;
  
  /** Plugin description */
  description?: string;
  
  /** Author information */
  author?: string | {
    name: string;
    email?: string;
    url?: string;
  };
  
  /** License identifier (e.g., 'AGPL-3.0') */
  license?: string;
  
  /** Plugin dependencies (other plugins) */
  dependencies?: Record<string, string>;
  
  /** Peer dependencies (optional dependencies) */
  peerDependencies?: Record<string, string>;
  
  /** Capabilities provided by this plugin */
  provides?: {
    /** ObjectQL object definitions */
    objects?: string[];
    /** Workflow definitions */
    workflows?: string[];
    /** Trigger definitions */
    triggers?: string[];
    /** API endpoint definitions */
    apis?: string[];
    /** Services exposed by this plugin */
    services?: string[];
  };
  
  /** Lifecycle hook file paths */
  hooks?: {
    /** Called when plugin is first installed */
    onInstall?: string;
    /** Called when plugin manifest is loaded */
    onLoad?: string;
    /** Called when plugin is enabled */
    onEnable?: string;
    /** Called when plugin is disabled */
    onDisable?: string;
    /** Called when plugin is uninstalled */
    onUninstall?: string;
  };
  
  /** Plugin configuration schema */
  config?: Record<string, any>;
}

/**
 * Plugin instance
 */
export interface Plugin {
  /** Plugin manifest */
  manifest: PluginManifest;
  
  /** Current state */
  state: PluginState;
  
  /** Plugin context */
  context: PluginContext;
  
  /** Plugin instance (the loaded module) */
  instance?: any;
  
  /** Error if state is ERROR */
  error?: Error;
  
  /** Lifecycle hooks */
  hooks?: PluginHooks;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /** Called when plugin is first installed */
  onInstall?: (ctx: PluginContext) => Promise<void> | void;
  
  /** Called when plugin manifest is loaded */
  onLoad?: (ctx: PluginContext) => Promise<void> | void;
  
  /** Called when plugin is enabled */
  onEnable?: (ctx: PluginContext) => Promise<void> | void;
  
  /** Called when plugin is disabled */
  onDisable?: (ctx: PluginContext) => Promise<void> | void;
  
  /** Called when plugin is uninstalled */
  onUninstall?: (ctx: PluginContext) => Promise<void> | void;
}

/**
 * Plugin execution context
 * 
 * This is passed to all plugin hooks and provides access to runtime services.
 */
export interface PluginContext {
  /** Runtime instance */
  runtime: Runtime;
  
  /** Service registry */
  services: ServiceRegistry;
  
  /** Event bus */
  events: EventBus;
  
  /** Logger for this plugin */
  logger: Logger;
  
  /** Plugin configuration */
  config: Record<string, any>;
  
  /** Storage scoped to this plugin */
  storage: PluginStorage;
}

/**
 * Service registry for dependency injection
 */
export interface ServiceRegistry {
  /** Register a service */
  register<T = any>(name: string, service: T): void;
  
  /** Get a service */
  get<T = any>(name: string): T | undefined;
  
  /** Check if service exists */
  has(name: string): boolean;
  
  /** Unregister a service */
  unregister(name: string): void;
  
  /** Get all service names */
  list(): string[];
}

/**
 * Event bus for inter-plugin communication
 */
export interface EventBus {
  /** Subscribe to an event */
  on(event: string, handler: EventHandler): void;
  
  /** Subscribe to an event (one-time) */
  once(event: string, handler: EventHandler): void;
  
  /** Unsubscribe from an event */
  off(event: string, handler: EventHandler): void;
  
  /** Emit an event */
  emit(event: string, data?: any): void;
  
  /** Emit an event and wait for all handlers */
  emitAsync(event: string, data?: any): Promise<void>;
}

/**
 * Event handler function
 */
export type EventHandler = (data: any) => void | Promise<void>;

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}

/**
 * Plugin-scoped storage
 */
export interface PluginStorage {
  /** Get a value */
  get<T = any>(key: string): Promise<T | undefined>;
  
  /** Set a value */
  set<T = any>(key: string, value: T): Promise<void>;
  
  /** Delete a value */
  delete(key: string): Promise<void>;
  
  /** Check if key exists */
  has(key: string): Promise<boolean>;
  
  /** Get all keys */
  keys(): Promise<string[]>;
  
  /** Clear all values */
  clear(): Promise<void>;
}

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /** Runtime mode */
  mode?: 'development' | 'production' | 'test';
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Plugin directories to scan */
  pluginDirs?: string[];
  
  /** Plugins to auto-load */
  plugins?: Array<string | PluginManifest>;
  
  /** Storage backend */
  storage?: {
    type: 'memory' | 'sqlite' | 'redis';
    options?: Record<string, any>;
  };
}

/**
 * Runtime interface
 */
export interface Runtime {
  /** Configuration */
  config: RuntimeConfig;
  
  /** Service registry */
  services: ServiceRegistry;
  
  /** Event bus */
  events: EventBus;
  
  /** Load a plugin */
  loadPlugin(manifest: PluginManifest | string): Promise<Plugin>;
  
  /** Get a plugin by ID */
  getPlugin(id: string): Plugin | undefined;
  
  /** Get all loaded plugins */
  getPlugins(): Plugin[];
  
  /** Enable a plugin */
  enablePlugin(id: string): Promise<void>;
  
  /** Disable a plugin */
  disablePlugin(id: string): Promise<void>;
  
  /** Unload a plugin */
  unloadPlugin(id: string): Promise<void>;
  
  /** Start the runtime */
  start(): Promise<void>;
  
  /** Stop the runtime */
  stop(): Promise<void>;
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  id: string;
  dependencies: string[];
}

/**
 * Runtime error types
 */
export class RuntimeError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export class PluginError extends RuntimeError {
  constructor(message: string, public pluginId: string) {
    super(message, 'PLUGIN_ERROR');
    this.name = 'PluginError';
  }
}

export class DependencyError extends RuntimeError {
  constructor(message: string) {
    super(message, 'DEPENDENCY_ERROR');
    this.name = 'DependencyError';
  }
}
