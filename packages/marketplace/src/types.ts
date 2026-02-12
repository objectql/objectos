/**
 * Marketplace Plugin Types for ObjectOS
 *
 * Type definitions for the plugin marketplace system:
 * - Plugin manifests and registry entries
 * - Configuration and resolved defaults
 * - Installation, versioning, and security types
 */

// ─── Plugin Manifest ──────────────────────────────────────────────

/**
 * Describes a plugin available in the marketplace
 */
export interface PluginManifest {
  /** Unique plugin identifier (e.g., 'steedos-crm') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semver version string */
  version: string;
  /** Short description */
  description: string;
  /** Author name or organization */
  author: string;
  /** SPDX license identifier */
  license: string;
  /** Map of dependency plugin IDs to semver ranges */
  dependencies?: Record<string, string>;
  /** Searchable keywords/tags */
  keywords?: string[];
  /** Source repository URL */
  repository?: string;
  /** Homepage URL */
  homepage?: string;
  /** Engine compatibility (e.g., { objectos: '>=0.1.0' }) */
  engine?: Record<string, string>;
  /** Permissions requested by this plugin */
  permissions?: string[];
  /** Entry point file */
  main?: string;
}

// ─── Registry ─────────────────────────────────────────────────────

/**
 * A manifest enriched with marketplace metadata
 */
export interface PluginRegistryEntry {
  /** The plugin manifest */
  manifest: PluginManifest;
  /** Total download count */
  downloads: number;
  /** Average rating (0–5) */
  rating: number;
  /** ISO date the plugin was first published */
  publishedAt: string;
  /** ISO date the plugin was last updated */
  updatedAt: string;
  /** Whether the plugin has been verified by the ObjectOS team */
  verified: boolean;
  /** Whether the plugin is featured in the marketplace */
  featured: boolean;
}

// ─── Configuration ────────────────────────────────────────────────

/**
 * Marketplace configuration (user-provided, all optional)
 */
export interface MarketplaceConfig {
  /** Remote registry URL for plugin discovery */
  registryUrl?: string;
  /** Automatically check for plugin updates */
  autoUpdate?: boolean;
  /** Run plugins in a sandboxed environment */
  sandboxed?: boolean;
  /** Allow-list of plugin IDs (empty = allow all) */
  allowedPlugins?: string[];
  /** Block-list of plugin IDs */
  blockedPlugins?: string[];
  /** Maximum number of installed plugins */
  maxPlugins?: number;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedMarketplaceConfig {
  registryUrl: string;
  autoUpdate: boolean;
  sandboxed: boolean;
  allowedPlugins: string[];
  blockedPlugins: string[];
  maxPlugins: number;
}

// ─── Installation ─────────────────────────────────────────────────

/**
 * Result of a plugin install/uninstall/upgrade operation
 */
export interface PluginInstallResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Plugin ID */
  pluginId: string;
  /** Installed version (if applicable) */
  version?: string;
  /** Human-readable message */
  message: string;
  /** Previous version (for upgrades/rollbacks) */
  previousVersion?: string;
}

// ─── Versioning ───────────────────────────────────────────────────

/**
 * Detailed information about a specific plugin version
 */
export interface PluginVersionInfo {
  /** Semver version string */
  version: string;
  /** Changelog / release notes */
  changelog?: string;
  /** Engine compatibility for this version */
  compatibility?: Record<string, string>;
  /** Whether this version is deprecated */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
  /** ISO date this version was released */
  releasedAt: string;
}

// ─── Security ─────────────────────────────────────────────────────

/**
 * Result of a security review on a plugin manifest
 */
export interface PluginSecurityReport {
  /** Whether the plugin passed security review */
  safe: boolean;
  /** Non-critical warnings */
  warnings: string[];
  /** Critical vulnerabilities found */
  vulnerabilities: string[];
  /** Timestamp of the review */
  reviewedAt: string;
}

/**
 * Result of dependency graph resolution
 */
export interface PluginDependencyGraph {
  /** Successfully resolved dependencies (pluginId → version) */
  resolved: Record<string, string>;
  /** Dependency conflicts found */
  conflicts: string[];
  /** Missing (unresolvable) dependencies */
  missing: string[];
}

// ─── Search ───────────────────────────────────────────────────────

/**
 * Options for searching the plugin registry
 */
export interface PluginSearchOptions {
  /** Filter by keyword/tag */
  keyword?: string;
  /** Filter by author */
  author?: string;
  /** Page number (1-based) */
  page?: number;
  /** Page size */
  pageSize?: number;
  /** Sort field */
  sortBy?: 'downloads' | 'rating' | 'name' | 'updatedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated search results
 */
export interface PluginSearchResult {
  plugins: PluginRegistryEntry[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Plugin Lifecycle Manifests ───────────────────────────────────

/**
 * Plugin health report
 */
export interface PluginHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
}

/**
 * Plugin capability manifest
 */
export interface PluginCapabilityManifest {
  id: string;
  provides: string[];
  consumes: string[];
}

/**
 * Plugin security manifest
 */
export interface PluginSecurityManifest {
  permissions: string[];
  dataAccess: string[];
}

/**
 * Plugin startup result
 */
export interface PluginStartupResult {
  success: boolean;
  message?: string;
}

/**
 * Sandbox configuration for isolated plugin execution
 */
export interface SandboxConfig {
  /** Plugin ID */
  pluginId: string;
  /** Allowed API namespaces */
  allowedAPIs: string[];
  /** Maximum memory (bytes) */
  maxMemory: number;
  /** Maximum CPU time (ms) */
  maxCpuTime: number;
  /** Network access allowed */
  networkAccess: boolean;
  /** File system access allowed */
  fsAccess: boolean;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  totalPlugins: number;
  totalVersions: number;
  featuredCount: number;
  verifiedCount: number;
}
