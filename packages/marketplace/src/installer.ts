/**
 * Plugin Installer (O.2.3 + O.2.4)
 *
 * Handles dynamic plugin installation, uninstallation, upgrades, and rollbacks.
 * Manages the installed plugin state and version history.
 */

import type {
  PluginManifest,
  PluginInstallResult,
  PluginRegistryEntry,
} from './types.js';
import type { PluginRegistry } from './registry.js';
import { validateManifest, resolveDependencies, checkCompatibility } from './manifest-validator.js';

/**
 * Installed plugin record (internal)
 */
interface InstalledPlugin {
  manifest: PluginManifest;
  installedAt: string;
  /** Version history for rollback support (newest last) */
  versionHistory: string[];
}

/**
 * Upgrade information
 */
export interface PluginUpgradeInfo {
  pluginId: string;
  currentVersion: string;
  latestVersion: string;
}

/**
 * Plugin Installer — manages install, uninstall, upgrade, and rollback
 */
export class PluginInstaller {
  /** Map of installed plugin ID → installed record */
  private installed: Map<string, InstalledPlugin> = new Map();

  /** Reference to the registry for resolving plugins */
  private registry: PluginRegistry;

  /** Runtime engine versions for compatibility checks */
  private runtimeVersions: Record<string, string>;

  constructor(registry: PluginRegistry, runtimeVersions: Record<string, string> = {}) {
    this.registry = registry;
    this.runtimeVersions = runtimeVersions;
  }

  /**
   * Install a plugin from the registry
   *
   * @param pluginId - The plugin ID to install
   * @param version - Specific version (default: latest)
   * @returns Installation result
   */
  install(pluginId: string, version?: string): PluginInstallResult {
    // Check if already installed
    if (this.installed.has(pluginId)) {
      return {
        success: false,
        pluginId,
        message: `Plugin "${pluginId}" is already installed. Use upgrade() to update.`,
      };
    }

    // Resolve from registry
    const entry = version
      ? this.registry.getPluginVersion(pluginId, version)
      : this.registry.getPlugin(pluginId);

    if (!entry) {
      return {
        success: false,
        pluginId,
        message: version
          ? `Plugin "${pluginId}" version ${version} not found in registry`
          : `Plugin "${pluginId}" not found in registry`,
      };
    }

    // Validate manifest
    const errors = validateManifest(entry.manifest);
    if (errors.length > 0) {
      return {
        success: false,
        pluginId,
        message: `Invalid manifest: ${errors.join('; ')}`,
      };
    }

    // Check engine compatibility
    const compatIssues = checkCompatibility(entry.manifest, this.runtimeVersions);
    if (compatIssues.length > 0) {
      return {
        success: false,
        pluginId,
        message: `Compatibility issues: ${compatIssues.join('; ')}`,
      };
    }

    // Resolve dependencies
    const installedVersions = new Map<string, string>();
    for (const [id, record] of this.installed) {
      installedVersions.set(id, record.manifest.version);
    }
    const deps = resolveDependencies(entry.manifest, installedVersions);

    if (deps.missing.length > 0) {
      return {
        success: false,
        pluginId,
        message: `Missing dependencies: ${deps.missing.join(', ')}`,
      };
    }

    if (deps.conflicts.length > 0) {
      return {
        success: false,
        pluginId,
        message: `Dependency conflicts: ${deps.conflicts.join('; ')}`,
      };
    }

    // Install
    this.installed.set(pluginId, {
      manifest: { ...entry.manifest },
      installedAt: new Date().toISOString(),
      versionHistory: [entry.manifest.version],
    });

    // Increment download counter in registry
    this.registry.incrementDownloads(pluginId);

    return {
      success: true,
      pluginId,
      version: entry.manifest.version,
      message: `Plugin "${pluginId}" v${entry.manifest.version} installed successfully`,
    };
  }

  /**
   * Uninstall a plugin
   *
   * @param pluginId - The plugin ID to uninstall
   * @returns Uninstall result
   */
  uninstall(pluginId: string): PluginInstallResult {
    const record = this.installed.get(pluginId);
    if (!record) {
      return {
        success: false,
        pluginId,
        message: `Plugin "${pluginId}" is not installed`,
      };
    }

    // Check if other plugins depend on this one
    for (const [id, other] of this.installed) {
      if (id === pluginId) continue;
      const deps = other.manifest.dependencies ?? {};
      if (deps[pluginId]) {
        return {
          success: false,
          pluginId,
          message: `Cannot uninstall "${pluginId}": plugin "${id}" depends on it`,
        };
      }
    }

    this.installed.delete(pluginId);

    return {
      success: true,
      pluginId,
      version: record.manifest.version,
      message: `Plugin "${pluginId}" uninstalled successfully`,
    };
  }

  /**
   * Upgrade a plugin to a newer version
   *
   * @param pluginId - The plugin ID to upgrade
   * @param targetVersion - Specific target version (default: latest)
   * @returns Upgrade result
   */
  upgrade(pluginId: string, targetVersion?: string): PluginInstallResult {
    const record = this.installed.get(pluginId);
    if (!record) {
      return {
        success: false,
        pluginId,
        message: `Plugin "${pluginId}" is not installed`,
      };
    }

    const previousVersion = record.manifest.version;

    // Resolve target from registry
    const entry = targetVersion
      ? this.registry.getPluginVersion(pluginId, targetVersion)
      : this.registry.getPlugin(pluginId);

    if (!entry) {
      return {
        success: false,
        pluginId,
        message: targetVersion
          ? `Version ${targetVersion} not found for "${pluginId}"`
          : `No versions found for "${pluginId}" in registry`,
      };
    }

    if (entry.manifest.version === previousVersion) {
      return {
        success: false,
        pluginId,
        message: `Plugin "${pluginId}" is already at version ${previousVersion}`,
      };
    }

    // Check engine compatibility
    const compatIssues = checkCompatibility(entry.manifest, this.runtimeVersions);
    if (compatIssues.length > 0) {
      return {
        success: false,
        pluginId,
        message: `Compatibility issues: ${compatIssues.join('; ')}`,
      };
    }

    // Update installed record
    record.versionHistory.push(entry.manifest.version);
    record.manifest = { ...entry.manifest };

    return {
      success: true,
      pluginId,
      version: entry.manifest.version,
      previousVersion,
      message: `Plugin "${pluginId}" upgraded from v${previousVersion} to v${entry.manifest.version}`,
    };
  }

  /**
   * Rollback a plugin to its previous version
   *
   * @param pluginId - The plugin ID to rollback
   * @returns Rollback result
   */
  rollback(pluginId: string): PluginInstallResult {
    const record = this.installed.get(pluginId);
    if (!record) {
      return {
        success: false,
        pluginId,
        message: `Plugin "${pluginId}" is not installed`,
      };
    }

    if (record.versionHistory.length < 2) {
      return {
        success: false,
        pluginId,
        message: `Plugin "${pluginId}" has no previous version to rollback to`,
      };
    }

    const currentVersion = record.versionHistory.pop()!;
    const previousVersion = record.versionHistory[record.versionHistory.length - 1];

    // Restore previous version from registry
    const entry = this.registry.getPluginVersion(pluginId, previousVersion);
    if (!entry) {
      // Re-add current version to history since rollback failed
      record.versionHistory.push(currentVersion);
      return {
        success: false,
        pluginId,
        message: `Previous version ${previousVersion} not found in registry`,
      };
    }

    record.manifest = { ...entry.manifest };

    return {
      success: true,
      pluginId,
      version: previousVersion,
      previousVersion: currentVersion,
      message: `Plugin "${pluginId}" rolled back from v${currentVersion} to v${previousVersion}`,
    };
  }

  /**
   * Get all installed plugins
   */
  getInstalled(): Array<{ pluginId: string; version: string; installedAt: string }> {
    const result: Array<{ pluginId: string; version: string; installedAt: string }> = [];
    for (const [id, record] of this.installed) {
      result.push({
        pluginId: id,
        version: record.manifest.version,
        installedAt: record.installedAt,
      });
    }
    return result;
  }

  /**
   * Check for available upgrades for all installed plugins
   */
  checkUpgrades(): PluginUpgradeInfo[] {
    const upgrades: PluginUpgradeInfo[] = [];

    for (const [id, record] of this.installed) {
      const latest = this.registry.getPlugin(id);
      if (latest && latest.manifest.version !== record.manifest.version) {
        upgrades.push({
          pluginId: id,
          currentVersion: record.manifest.version,
          latestVersion: latest.manifest.version,
        });
      }
    }

    return upgrades;
  }

  /**
   * Check if a plugin is installed
   */
  isInstalled(pluginId: string): boolean {
    return this.installed.has(pluginId);
  }
}
