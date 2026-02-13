/**
 * Plugin Sandbox and Security Review (O.2.6)
 *
 * Provides security review, permission validation, dependency scanning,
 * sandbox configuration, and resource limit checking for plugins.
 */

import type { PluginManifest, PluginSecurityReport, SandboxConfig } from './types.js';

/**
 * Known dangerous permissions that require elevated trust
 */
const DANGEROUS_PERMISSIONS = [
  'fs.write',
  'fs.delete',
  'network.outbound',
  'process.spawn',
  'system.admin',
  'data.delete',
  'auth.manage',
];

/**
 * Known suspicious dependency patterns
 */
const SUSPICIOUS_PATTERNS = ['eval', 'exec', 'shell', 'crypto-miner', 'keylogger'];

/**
 * Default resource limits
 */
const DEFAULT_LIMITS = {
  maxMemory: 128 * 1024 * 1024, // 128 MB
  maxCpuTime: 30000, // 30 seconds
};

/**
 * Resource usage tracking (internal)
 */
interface ResourceUsage {
  pluginId: string;
  memoryUsage: number;
  cpuTime: number;
  lastChecked: string;
}

/**
 * Plugin Sandbox — security review and isolated execution management
 */
export class PluginSandbox {
  /** Resource usage tracking per plugin */
  private resourceUsage: Map<string, ResourceUsage> = new Map();

  /** Custom resource limits per plugin */
  private customLimits: Map<string, { maxMemory: number; maxCpuTime: number }> = new Map();

  /**
   * Perform a security review of a plugin manifest
   *
   * @param manifest - The plugin manifest to review
   * @returns Security report with safety assessment, warnings, and vulnerabilities
   */
  review(manifest: PluginManifest): PluginSecurityReport {
    const warnings: string[] = [];
    const vulnerabilities: string[] = [];

    // Check permissions
    const permWarnings = this.validatePermissions(manifest);
    warnings.push(...permWarnings);

    // Check dependencies
    const depWarnings = this.scanDependencies(manifest);
    for (const w of depWarnings) {
      if (w.startsWith('VULN:')) {
        vulnerabilities.push(w.slice(5).trim());
      } else {
        warnings.push(w);
      }
    }

    // Check for missing metadata (lower trust)
    if (!manifest.repository) {
      warnings.push('No repository URL — cannot verify source code');
    }
    if (!manifest.license) {
      warnings.push('No license specified');
    }

    // Check engine constraints
    if (!manifest.engine || Object.keys(manifest.engine).length === 0) {
      warnings.push('No engine constraints — may not be compatible with this runtime');
    }

    const safe = vulnerabilities.length === 0;

    return {
      safe,
      warnings,
      vulnerabilities,
      reviewedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate permissions requested by a plugin
   *
   * @param manifest - The plugin manifest
   * @returns Array of warning messages for dangerous permissions
   */
  validatePermissions(manifest: PluginManifest): string[] {
    const warnings: string[] = [];
    const permissions = manifest.permissions ?? [];

    if (permissions.length === 0) {
      return warnings;
    }

    for (const perm of permissions) {
      if (DANGEROUS_PERMISSIONS.includes(perm)) {
        warnings.push(`Dangerous permission requested: "${perm}"`);
      }
    }

    // Check for excessive permissions
    if (permissions.length > 10) {
      warnings.push(
        `Plugin requests ${permissions.length} permissions — excessive permission scope`,
      );
    }

    return warnings;
  }

  /**
   * Scan plugin dependencies for known vulnerabilities
   *
   * @param manifest - The plugin manifest
   * @returns Array of warning/vulnerability messages
   */
  scanDependencies(manifest: PluginManifest): string[] {
    const issues: string[] = [];
    const deps = manifest.dependencies ?? {};

    for (const depId of Object.keys(deps)) {
      // Check for suspicious dependency names
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (depId.toLowerCase().includes(pattern)) {
          issues.push(`VULN: Suspicious dependency "${depId}" matches pattern "${pattern}"`);
        }
      }
    }

    // Check for very large dependency trees
    const depCount = Object.keys(deps).length;
    if (depCount > 20) {
      issues.push(`Large dependency tree (${depCount} deps) — increases attack surface`);
    }

    return issues;
  }

  /**
   * Generate a sandbox configuration for isolated plugin execution
   *
   * @param manifest - The plugin manifest
   * @returns Sandbox configuration for the plugin runtime
   */
  createSandboxConfig(manifest: PluginManifest): SandboxConfig {
    const permissions = manifest.permissions ?? [];

    // Determine allowed APIs based on permissions
    const allowedAPIs: string[] = ['data.read', 'logger'];

    if (permissions.includes('data.write') || permissions.includes('data.create')) {
      allowedAPIs.push('data.write');
    }
    if (permissions.includes('data.delete')) {
      allowedAPIs.push('data.delete');
    }
    if (permissions.includes('network.outbound')) {
      allowedAPIs.push('network');
    }
    if (permissions.includes('fs.read')) {
      allowedAPIs.push('fs.read');
    }

    const customLimit = this.customLimits.get(manifest.id);

    return {
      pluginId: manifest.id,
      allowedAPIs,
      maxMemory: customLimit?.maxMemory ?? DEFAULT_LIMITS.maxMemory,
      maxCpuTime: customLimit?.maxCpuTime ?? DEFAULT_LIMITS.maxCpuTime,
      networkAccess: permissions.includes('network.outbound'),
      fsAccess: permissions.includes('fs.read') || permissions.includes('fs.write'),
    };
  }

  /**
   * Check if a plugin exceeds its resource limits
   *
   * @param pluginId - The plugin ID to check
   * @returns Object with exceeded flag and details
   */
  checkResourceLimits(pluginId: string): {
    exceeded: boolean;
    details: { memoryUsage: number; cpuTime: number; maxMemory: number; maxCpuTime: number };
  } {
    const usage = this.resourceUsage.get(pluginId) ?? {
      pluginId,
      memoryUsage: 0,
      cpuTime: 0,
      lastChecked: new Date().toISOString(),
    };

    const limits = this.customLimits.get(pluginId) ?? DEFAULT_LIMITS;

    return {
      exceeded: usage.memoryUsage > limits.maxMemory || usage.cpuTime > limits.maxCpuTime,
      details: {
        memoryUsage: usage.memoryUsage,
        cpuTime: usage.cpuTime,
        maxMemory: limits.maxMemory,
        maxCpuTime: limits.maxCpuTime,
      },
    };
  }

  /**
   * Update resource usage for a plugin (called by the runtime)
   */
  updateResourceUsage(pluginId: string, memoryUsage: number, cpuTime: number): void {
    this.resourceUsage.set(pluginId, {
      pluginId,
      memoryUsage,
      cpuTime,
      lastChecked: new Date().toISOString(),
    });
  }

  /**
   * Set custom resource limits for a plugin
   */
  setResourceLimits(pluginId: string, maxMemory: number, maxCpuTime: number): void {
    this.customLimits.set(pluginId, { maxMemory, maxCpuTime });
  }
}
