/**
 * Plugin Manifest Validation and Dependency Resolution (O.2.2)
 *
 * Validates plugin manifests for correctness and resolves dependency graphs.
 * Uses basic regex for semver validation — no external dependencies.
 */

import type { PluginManifest, PluginDependencyGraph } from './types.js';

/**
 * Basic semver regex: major.minor.patch with optional pre-release/build
 */
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;

/**
 * Basic semver range regex: supports ^x.y.z, ~x.y.z, >=x.y.z, x.y.z
 */
const SEMVER_RANGE_REGEX = /^[\^~>=<]*\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;

/**
 * Plugin ID format: lowercase alphanumeric with hyphens
 */
const PLUGIN_ID_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/**
 * Validate a plugin manifest for required fields and format correctness
 *
 * @param manifest - The manifest to validate
 * @returns Array of error messages (empty if valid)
 */
export function validateManifest(manifest: Partial<PluginManifest>): string[] {
  const errors: string[] = [];

  // Required fields
  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push('Manifest must have a non-empty string "id"');
  } else if (!PLUGIN_ID_REGEX.test(manifest.id)) {
    errors.push(`Invalid plugin ID "${manifest.id}": must be lowercase alphanumeric with hyphens, at least 2 characters`);
  }

  if (!manifest.name || typeof manifest.name !== 'string') {
    errors.push('Manifest must have a non-empty string "name"');
  }

  if (!manifest.version || typeof manifest.version !== 'string') {
    errors.push('Manifest must have a non-empty string "version"');
  } else if (!SEMVER_REGEX.test(manifest.version)) {
    errors.push(`Invalid version "${manifest.version}": must be valid semver (e.g., 1.0.0)`);
  }

  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push('Manifest must have a non-empty string "description"');
  }

  if (!manifest.author || typeof manifest.author !== 'string') {
    errors.push('Manifest must have a non-empty string "author"');
  }

  if (!manifest.license || typeof manifest.license !== 'string') {
    errors.push('Manifest must have a non-empty string "license"');
  }

  // Optional field validation
  if (manifest.dependencies) {
    if (typeof manifest.dependencies !== 'object' || Array.isArray(manifest.dependencies)) {
      errors.push('Dependencies must be an object mapping plugin IDs to semver ranges');
    } else {
      for (const [depId, range] of Object.entries(manifest.dependencies)) {
        if (!PLUGIN_ID_REGEX.test(depId)) {
          errors.push(`Invalid dependency ID "${depId}": must be lowercase alphanumeric with hyphens`);
        }
        if (typeof range !== 'string' || !SEMVER_RANGE_REGEX.test(range)) {
          errors.push(`Invalid version range "${range}" for dependency "${depId}": must be a valid semver range`);
        }
      }
    }
  }

  if (manifest.keywords !== undefined) {
    if (!Array.isArray(manifest.keywords)) {
      errors.push('Keywords must be an array of strings');
    } else {
      for (const kw of manifest.keywords) {
        if (typeof kw !== 'string') {
          errors.push('Each keyword must be a string');
          break;
        }
      }
    }
  }

  if (manifest.engine !== undefined) {
    if (typeof manifest.engine !== 'object' || Array.isArray(manifest.engine)) {
      errors.push('Engine must be an object mapping engine names to semver ranges');
    } else {
      for (const [eng, range] of Object.entries(manifest.engine)) {
        if (typeof range !== 'string' || !SEMVER_RANGE_REGEX.test(range)) {
          errors.push(`Invalid engine range "${range}" for engine "${eng}"`);
        }
      }
    }
  }

  return errors;
}

/**
 * Resolve the dependency graph for a plugin against installed plugins
 *
 * @param manifest - The plugin manifest with dependencies
 * @param installed - Map of installed plugin IDs to their versions
 * @returns Dependency graph with resolved, conflicting, and missing deps
 */
export function resolveDependencies(
  manifest: PluginManifest,
  installed: Map<string, string>,
): PluginDependencyGraph {
  const resolved: Record<string, string> = {};
  const conflicts: string[] = [];
  const missing: string[] = [];

  if (!manifest.dependencies) {
    return { resolved, conflicts, missing };
  }

  for (const [depId, requiredRange] of Object.entries(manifest.dependencies)) {
    const installedVersion = installed.get(depId);

    if (!installedVersion) {
      missing.push(depId);
      continue;
    }

    // Basic compatibility check: parse the range and compare
    if (satisfiesRange(installedVersion, requiredRange)) {
      resolved[depId] = installedVersion;
    } else {
      conflicts.push(
        `${depId}: installed ${installedVersion} does not satisfy required ${requiredRange}`,
      );
    }
  }

  return { resolved, conflicts, missing };
}

/**
 * Check if a plugin manifest is compatible with the current runtime
 *
 * @param manifest - The plugin manifest
 * @param runtimeVersions - Map of engine names to current versions
 * @returns Array of incompatibility messages (empty if compatible)
 */
export function checkCompatibility(
  manifest: PluginManifest,
  runtimeVersions: Record<string, string>,
): string[] {
  const issues: string[] = [];

  if (!manifest.engine) {
    return issues;
  }

  for (const [engine, requiredRange] of Object.entries(manifest.engine)) {
    const currentVersion = runtimeVersions[engine];

    if (!currentVersion) {
      issues.push(`Unknown engine "${engine}" — cannot verify compatibility`);
      continue;
    }

    if (!satisfiesRange(currentVersion, requiredRange)) {
      issues.push(
        `Engine "${engine}" version ${currentVersion} does not satisfy required ${requiredRange}`,
      );
    }
  }

  return issues;
}

// ─── Internal Helpers ─────────────────────────────────────────────

/**
 * Parse a semver version string into components
 */
function parseSemver(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Basic semver range satisfier
 *
 * Supports: ^x.y.z (compatible), ~x.y.z (patch-level), >=x.y.z, x.y.z (exact)
 */
function satisfiesRange(version: string, range: string): boolean {
  const ver = parseSemver(version);
  if (!ver) return false;

  // Strip operator prefix
  let operator = '';
  let rangeVersion = range;

  if (range.startsWith('>=')) {
    operator = '>=';
    rangeVersion = range.slice(2);
  } else if (range.startsWith('^')) {
    operator = '^';
    rangeVersion = range.slice(1);
  } else if (range.startsWith('~')) {
    operator = '~';
    rangeVersion = range.slice(1);
  }

  const req = parseSemver(rangeVersion);
  if (!req) return false;

  const verNum = ver.major * 1000000 + ver.minor * 1000 + ver.patch;
  const reqNum = req.major * 1000000 + req.minor * 1000 + req.patch;

  switch (operator) {
    case '>=':
      return verNum >= reqNum;

    case '^':
      // Compatible: same major, >= minor.patch
      if (req.major === 0) {
        // ^0.x.y — same major and minor
        return ver.major === req.major && ver.minor === req.minor && ver.patch >= req.patch;
      }
      return ver.major === req.major && verNum >= reqNum;

    case '~':
      // Patch-level: same major.minor, >= patch
      return ver.major === req.major && ver.minor === req.minor && ver.patch >= req.patch;

    default:
      // Exact match
      return verNum === reqNum;
  }
}
