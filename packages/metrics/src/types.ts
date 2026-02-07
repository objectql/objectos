/**
 * Metrics Types
 * 
 * Type definitions for the metrics system
 */

/**
 * Metric type enumeration
 */
export enum MetricType {
    /** Counter - monotonically increasing value */
    Counter = 'counter',
    /** Gauge - arbitrary value that can go up or down */
    Gauge = 'gauge',
    /** Histogram - tracks distribution of values with percentiles */
    Histogram = 'histogram',
}

/**
 * Labels for metric dimensions
 */
export type Labels = Record<string, string>;

/**
 * Base metric interface
 */
export interface Metric {
    /** Metric name */
    name: string;
    /** Metric type */
    type: MetricType;
    /** Help text describing the metric */
    help: string;
    /** Labels attached to this metric */
    labels: Labels;
    /** Timestamp of last update */
    timestamp: number;
}

/**
 * Counter metric - monotonically increasing value
 */
export interface CounterMetric extends Metric {
    type: MetricType.Counter;
    /** Current counter value */
    value: number;
}

/**
 * Gauge metric - arbitrary value that can go up or down
 */
export interface GaugeMetric extends Metric {
    type: MetricType.Gauge;
    /** Current gauge value */
    value: number;
}

/**
 * Histogram observation for percentile calculation
 */
export interface HistogramObservation {
    value: number;
    timestamp: number;
}

/**
 * Histogram metric - tracks distribution of values
 */
export interface HistogramMetric extends Metric {
    type: MetricType.Histogram;
    /** Sum of all observed values */
    sum: number;
    /** Count of observations */
    count: number;
    /** All observations */
    observations: HistogramObservation[];
}

/**
 * Percentile calculation result
 */
export interface Percentiles {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
}

/**
 * Configuration options for the metrics plugin
 */
export interface MetricsConfig {
    /** Whether to enable metrics collection */
    enabled?: boolean;
    /** Prefix for all metric names */
    prefix?: string;
    /** Default labels to attach to all metrics */
    defaultLabels?: Labels;
    /** Whether to track built-in kernel metrics */
    trackBuiltInMetrics?: boolean;
    /** Maximum number of observations to keep for histograms */
    maxHistogramObservations?: number;
}

/**
 * Metric collector factory interface
 */
export interface MetricCollector {
    /** Get current metric value */
    get(): Metric;
    /** Reset the metric */
    reset(): void;
}

// ─── Kernel Compliance Types ───────────────────────────────────────────────────

/** Plugin health status */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/** Health check result for a single check */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  latency?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Aggregate health report for a plugin */
export interface PluginHealthReport {
  pluginName: string;
  pluginVersion: string;
  status: HealthStatus;
  uptime: number;
  checks: HealthCheckResult[];
  timestamp: string;
}

/** Plugin capability declaration */
export interface PluginCapabilityManifest {
  services?: string[];
  emits?: string[];
  listens?: string[];
  routes?: string[];
  objects?: string[];
}

/** Plugin security manifest */
export interface PluginSecurityManifest {
  requiredPermissions?: string[];
  handlesSensitiveData?: boolean;
  makesExternalCalls?: boolean;
  allowedDomains?: string[];
  executesUserScripts?: boolean;
  sandboxConfig?: {
    timeout?: number;
    maxMemory?: number;
    allowedModules?: string[];
  };
}

/** Plugin startup result */
export interface PluginStartupResult {
  pluginName: string;
  success: boolean;
  duration: number;
  servicesRegistered: string[];
  warnings?: string[];
  errors?: string[];
}

/** Event bus configuration */
export interface EventBusConfig {
  persistence?: {
    enabled: boolean;
    storage?: 'memory' | 'redis' | 'sqlite';
    maxEvents?: number;
    ttl?: number;
  };
  retry?: {
    enabled: boolean;
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
  };
  deadLetterQueue?: {
    enabled: boolean;
    maxSize?: number;
    storage?: 'memory' | 'redis' | 'sqlite';
  };
  webhooks?: {
    enabled: boolean;
    endpoints?: Array<{
      url: string;
      events: string[];
      secret?: string;
      timeout?: number;
    }>;
  };
}
