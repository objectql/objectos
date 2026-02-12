// ---------------------------------------------------------------------------
// @objectos/federation — O.5.3 Shared Dependency Management
// ---------------------------------------------------------------------------

import type { SharedDependency } from './types.js';

export class SharedDependencyManager {
  private deps = new Map<string, SharedDependency>();

  /**
   * Register a shared dependency.
   */
  register(dep: SharedDependency): void {
    this.deps.set(dep.name, dep);
  }

  /**
   * Get a shared dependency by name.
   */
  get(name: string): SharedDependency | undefined {
    return this.deps.get(name);
  }

  /**
   * Resolve a shared dependency, optionally checking version compatibility.
   */
  resolve(
    name: string,
    requiredVersion?: string,
  ): { compatible: boolean; dependency?: SharedDependency; reason?: string } {
    const dep = this.deps.get(name);
    if (!dep) {
      return { compatible: false, reason: `Dependency "${name}" not registered` };
    }
    if (requiredVersion && !isVersionCompatible(dep.version, requiredVersion)) {
      return {
        compatible: false,
        dependency: dep,
        reason: `Version ${dep.version} is not compatible with required ${requiredVersion}`,
      };
    }
    return { compatible: true, dependency: dep };
  }

  /**
   * Get all registered shared dependencies.
   */
  getAll(): SharedDependency[] {
    return Array.from(this.deps.values());
  }

  /**
   * Detect version conflicts across registered dependencies.
   * Returns list of conflict descriptions.
   */
  checkConflicts(): string[] {
    const conflicts: string[] = [];
    const byName = new Map<string, SharedDependency[]>();

    for (const dep of this.deps.values()) {
      const list = byName.get(dep.name) ?? [];
      list.push(dep);
      byName.set(dep.name, list);
    }

    for (const [name, list] of byName) {
      if (list.length > 1) {
        const versions = list.map((d) => d.version);
        conflicts.push(`Conflict for "${name}": versions ${versions.join(', ')}`);
      }
      // Check requiredVersion against version
      for (const dep of list) {
        if (dep.requiredVersion && !isVersionCompatible(dep.version, dep.requiredVersion)) {
          conflicts.push(
            `"${name}" v${dep.version} does not satisfy required ${dep.requiredVersion}`,
          );
        }
      }
    }

    return conflicts;
  }

  /**
   * Get all singleton dependencies.
   */
  getSingletons(): SharedDependency[] {
    return this.getAll().filter((d) => d.singleton);
  }

  /**
   * Build a shared scope object for remote containers.
   */
  buildSharedScope(): Record<string, { version: string; singleton: boolean; eager: boolean }> {
    const scope: Record<string, { version: string; singleton: boolean; eager: boolean }> = {};
    for (const dep of this.deps.values()) {
      scope[dep.name] = {
        version: dep.version,
        singleton: dep.singleton,
        eager: dep.eager,
      };
    }
    return scope;
  }
}

// ---------------------------------------------------------------------------
// Version compatibility (basic semver-like check)
// ---------------------------------------------------------------------------

/**
 * Check if `actual` satisfies `required`.
 *
 * Supported formats:
 *   - Exact: "1.2.3"
 *   - Caret: "^1.2.3"  → same major, minor >= required minor
 *   - Tilde: "~1.2.3"  → same major.minor, patch >= required patch
 */
export function isVersionCompatible(actual: string, required: string): boolean {
  const a = parseVersion(actual);
  if (!a) return false;

  if (required.startsWith('^')) {
    const r = parseVersion(required.slice(1));
    if (!r) return false;
    if (a.major !== r.major) return false;
    if (a.major === 0) {
      // ^0.x.y — minor must match
      return a.minor === r.minor && a.patch >= r.patch;
    }
    if (a.minor < r.minor) return false;
    if (a.minor === r.minor && a.patch < r.patch) return false;
    return true;
  }

  if (required.startsWith('~')) {
    const r = parseVersion(required.slice(1));
    if (!r) return false;
    return a.major === r.major && a.minor === r.minor && a.patch >= r.patch;
  }

  // Exact match
  const r = parseVersion(required);
  if (!r) return false;
  return a.major === r.major && a.minor === r.minor && a.patch === r.patch;
}

interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

function parseVersion(v: string): SemVer | null {
  const parts = v.split('.');
  if (parts.length < 3) return null;
  const major = Number(parts[0]);
  const minor = Number(parts[1]);
  const patch = Number(parts[2]);
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) return null;
  return { major, minor, patch };
}
