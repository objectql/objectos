/**
 * Kernel Health Aggregator
 *
 * Aggregates health check results from all registered plugins
 * to provide an overall system health report.
 *
 * Used by:
 * - GET /api/v1/health endpoint
 * - Admin console system status page
 * - Monitoring and alerting integrations
 */

import type { HealthStatus, PluginHealthReport } from './types.js';

/**
 * System-wide health report
 */
export interface SystemHealthReport {
  /** Overall system status */
  status: HealthStatus;
  /** System uptime in milliseconds */
  uptime: number;
  /** Number of registered plugins */
  totalPlugins: number;
  /** Number of healthy plugins */
  healthyPlugins: number;
  /** Number of degraded plugins */
  degradedPlugins: number;
  /** Number of unhealthy plugins */
  unhealthyPlugins: number;
  /** Individual plugin reports */
  plugins: PluginHealthReport[];
  /** Report timestamp */
  timestamp: string;
  /** Node.js version */
  nodeVersion: string;
  /** Memory usage */
  memory?: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
}

/**
 * Aggregate health reports from multiple plugins into a system report
 */
export function aggregateHealth(
  reports: PluginHealthReport[],
  systemStartedAt?: number,
): SystemHealthReport {
  let healthyCount = 0;
  let degradedCount = 0;
  let unhealthyCount = 0;

  for (const report of reports) {
    switch (report.status) {
      case 'healthy':
        healthyCount++;
        break;
      case 'degraded':
        degradedCount++;
        break;
      case 'unhealthy':
      default:
        unhealthyCount++;
        break;
    }
  }

  // Determine overall system status
  let status: HealthStatus = 'healthy';
  if (unhealthyCount > 0) {
    status = 'unhealthy';
  } else if (degradedCount > 0) {
    status = 'degraded';
  }

  // Get memory usage if running in Node.js
  let memory: SystemHealthReport['memory'];
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    memory = {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
    };
  }

  return {
    status,
    uptime: systemStartedAt ? Date.now() - systemStartedAt : 0,
    totalPlugins: reports.length,
    healthyPlugins: healthyCount,
    degradedPlugins: degradedCount,
    unhealthyPlugins: unhealthyCount,
    plugins: reports,
    timestamp: new Date().toISOString(),
    nodeVersion: typeof process !== 'undefined' ? process.version : 'unknown',
    memory,
  };
}

/**
 * Check if system health is acceptable (healthy or degraded)
 */
export function isSystemOperational(report: SystemHealthReport): boolean {
  return report.status !== 'unhealthy';
}
