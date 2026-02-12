// ---------------------------------------------------------------------------
// @objectos/federation — Type Definitions
// ---------------------------------------------------------------------------

/**
 * Configuration for Module Federation host.
 */
export interface FederationConfig {
  remotes?: RemoteEntry[];
  shared?: SharedDependency[];
  hotReload?: boolean;
  hotReloadPort?: number;
  cacheDir?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Resolved configuration with all defaults applied.
 */
export interface ResolvedFederationConfig {
  remotes: RemoteEntry[];
  shared: SharedDependency[];
  hotReload: boolean;
  hotReloadPort: number;
  cacheDir: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * A remote plugin entry — describes where to load a plugin from.
 */
export interface RemoteEntry {
  name: string;
  url: string;
  format: 'esm' | 'cjs' | 'system';
  integrity?: string;
  scope?: string;
  metadata?: Record<string, unknown>;
}

/**
 * A shared dependency between host and remotes.
 */
export interface SharedDependency {
  name: string;
  version: string;
  singleton: boolean;
  eager: boolean;
  requiredVersion?: string;
}

/**
 * A successfully loaded remote module.
 */
export interface RemoteModule {
  name: string;
  exports: Record<string, unknown>;
  remote: RemoteEntry;
  loadedAt: number;
  version?: string;
}

/**
 * Result of attempting to load a remote module.
 */
export interface ModuleLoadResult {
  success: boolean;
  module?: RemoteModule;
  error?: string;
  loadTime: number;
}

/**
 * JSON-serializable host configuration for build tools (Vite / Webpack).
 */
export interface FederationHostConfig {
  name: string;
  remotes: Record<string, string>;
  shared: Record<string, SharedHostEntry>;
}

export interface SharedHostEntry {
  singleton: boolean;
  eager: boolean;
  requiredVersion: string;
}

/**
 * Runtime state of a remote plugin.
 */
export interface RemotePluginState {
  name: string;
  status: 'idle' | 'loading' | 'loaded' | 'error' | 'unloaded';
  lastError?: string;
  loadedAt?: number;
  module?: RemoteModule;
}

/**
 * Hot-reload event emitted when a remote changes.
 */
export interface HotReloadEvent {
  type: 'add' | 'change' | 'remove';
  remoteName: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Plugin manifests
// ---------------------------------------------------------------------------

export interface PluginHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details: Record<string, unknown>;
}

export interface PluginCapability {
  name: string;
  description: string;
}

export interface PluginSecurityManifest {
  permissions: string[];
  scopes: string[];
  dataAccess: string[];
}

// ---------------------------------------------------------------------------
// Module Resolver (for testability)
// ---------------------------------------------------------------------------

export interface ModuleResolver {
  resolve(url: string): Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const DEFAULT_FEDERATION_CONFIG: ResolvedFederationConfig = {
  remotes: [],
  shared: [],
  hotReload: false,
  hotReloadPort: 9100,
  cacheDir: '.federation-cache',
  timeout: 30_000,
  retryAttempts: 3,
  retryDelay: 1_000,
};

export function resolveConfig(config: FederationConfig): ResolvedFederationConfig {
  return {
    remotes: config.remotes ?? DEFAULT_FEDERATION_CONFIG.remotes,
    shared: config.shared ?? DEFAULT_FEDERATION_CONFIG.shared,
    hotReload: config.hotReload ?? DEFAULT_FEDERATION_CONFIG.hotReload,
    hotReloadPort: config.hotReloadPort ?? DEFAULT_FEDERATION_CONFIG.hotReloadPort,
    cacheDir: config.cacheDir ?? DEFAULT_FEDERATION_CONFIG.cacheDir,
    timeout: config.timeout ?? DEFAULT_FEDERATION_CONFIG.timeout,
    retryAttempts: config.retryAttempts ?? DEFAULT_FEDERATION_CONFIG.retryAttempts,
    retryDelay: config.retryDelay ?? DEFAULT_FEDERATION_CONFIG.retryDelay,
  };
}
