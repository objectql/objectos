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

// ─── Kernel Compliance Types (from @objectstack/spec) ──────────────────────────

import type { z } from 'zod';
import type {
  PluginHealthStatusSchema,
  PluginHealthReportSchema,
  PluginCapabilityManifestSchema,
  PluginSecurityManifestSchema,
  PluginStartupResultSchema,
  EventBusConfigSchema,
} from '@objectstack/spec/kernel';

/** Plugin health status — from @objectstack/spec */
export type HealthStatus = z.infer<typeof PluginHealthStatusSchema>;

/** Aggregate health report — from @objectstack/spec */
export type PluginHealthReport = z.infer<typeof PluginHealthReportSchema>;

/** Plugin capability manifest — from @objectstack/spec */
export type PluginCapabilityManifest = z.infer<typeof PluginCapabilityManifestSchema>;

/** Plugin security manifest — from @objectstack/spec */
export type PluginSecurityManifest = z.infer<typeof PluginSecurityManifestSchema>;

/** Plugin startup result — from @objectstack/spec */
export type PluginStartupResult = z.infer<typeof PluginStartupResultSchema>;

/** Event bus configuration — from @objectstack/spec */
export type EventBusConfig = z.infer<typeof EventBusConfigSchema>;
