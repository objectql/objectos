// ---------------------------------------------------------------------------
// @objectos/federation — O.5.1 Module Federation Host Configuration
// ---------------------------------------------------------------------------

import type {
  FederationHostConfig,
  RemoteEntry,
  ResolvedFederationConfig,
  SharedDependency,
  SharedHostEntry,
} from './types.js';

/**
 * Generates Module Federation host configurations for Vite and Webpack.
 */
export class FederationHostConfigurator {
  private config: ResolvedFederationConfig;

  constructor(config: ResolvedFederationConfig) {
    this.config = config;
  }

  /**
   * Generate a Vite Module Federation host config object.
   */
  generateViteConfig(
    config?: ResolvedFederationConfig,
  ): FederationHostConfig {
    const c = config ?? this.config;
    return {
      name: 'objectos-host',
      remotes: this.resolveRemotes(c.remotes),
      shared: this.resolveShared(c.shared),
    };
  }

  /**
   * Generate a Webpack Module Federation host config object.
   */
  generateWebpackConfig(
    config?: ResolvedFederationConfig,
  ): FederationHostConfig & { filename: string } {
    const c = config ?? this.config;
    return {
      name: 'objectos-host',
      filename: 'remoteEntry.js',
      remotes: this.resolveRemotes(c.remotes),
      shared: this.resolveShared(c.shared),
    };
  }

  /**
   * Resolve remote entries into URL-based import mappings.
   */
  resolveRemotes(entries: RemoteEntry[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const entry of entries) {
      const scope = entry.scope ?? entry.name;
      out[scope] = entry.url;
    }
    return out;
  }

  /**
   * Resolve shared dependency specs with version constraints.
   */
  resolveShared(deps: SharedDependency[]): Record<string, SharedHostEntry> {
    const out: Record<string, SharedHostEntry> = {};
    for (const dep of deps) {
      out[dep.name] = {
        singleton: dep.singleton,
        eager: dep.eager,
        requiredVersion: dep.requiredVersion ?? `^${dep.version}`,
      };
    }
    return out;
  }

  /**
   * Validate the host configuration.
   * Returns an array of error messages (empty = valid).
   */
  validate(config?: ResolvedFederationConfig): string[] {
    const c = config ?? this.config;
    const errors: string[] = [];

    // Unique remote names
    const names = new Set<string>();
    for (const remote of c.remotes) {
      if (!remote.name) {
        errors.push('Remote entry is missing a name');
      }
      if (names.has(remote.name)) {
        errors.push(`Duplicate remote name: ${remote.name}`);
      }
      names.add(remote.name);

      if (!remote.url) {
        errors.push(`Remote "${remote.name}" is missing a URL`);
      } else if (!isValidUrl(remote.url)) {
        errors.push(`Remote "${remote.name}" has an invalid URL: ${remote.url}`);
      }

      if (!['esm', 'cjs', 'system'].includes(remote.format)) {
        errors.push(`Remote "${remote.name}" has an invalid format: ${remote.format}`);
      }
    }

    // Shared dependency version format
    for (const dep of c.shared) {
      if (!dep.name) {
        errors.push('Shared dependency is missing a name');
      }
      if (!dep.version || !isValidVersion(dep.version)) {
        errors.push(`Shared dependency "${dep.name}" has an invalid version: ${dep.version}`);
      }
    }

    return errors;
  }

  /**
   * Serialize the current configuration to a JSON-serializable object.
   */
  toJSON(): FederationHostConfig {
    return this.generateViteConfig();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+/.test(version);
}
