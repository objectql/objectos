/**
 * @objectos/marketplace — Plugin Marketplace for ObjectOS
 *
 * Provides plugin discovery, installation, versioning, and security:
 * - O.2.1: Plugin registry API (search, listing, metadata)
 * - O.2.2: Manifest validation and dependency resolution
 * - O.2.3: Dynamic plugin installation
 * - O.2.4: Versioning, upgrades, and rollback
 * - O.2.6: Plugin sandboxing and security review
 */

export { MarketplacePlugin } from './plugin.js';
export { PluginRegistry } from './registry.js';
export { PluginInstaller } from './installer.js';
export type { PluginUpgradeInfo } from './installer.js';
export { PluginSandbox } from './sandbox.js';
export { validateManifest, resolveDependencies, checkCompatibility } from './manifest-validator.js';
export type {
  PluginManifest,
  PluginRegistryEntry,
  MarketplaceConfig,
  ResolvedMarketplaceConfig,
  PluginInstallResult,
  PluginVersionInfo,
  PluginSecurityReport,
  PluginDependencyGraph,
  PluginSearchOptions,
  PluginSearchResult,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
  SandboxConfig,
  RegistryStats,
} from './types.js';
