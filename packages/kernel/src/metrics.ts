/**
 * Plugin Metrics
 * 
 * Tracks performance metrics for plugins including load time,
 * execution time, resource usage, and event statistics.
 */

import { Logger, createLogger } from './logger';

/**
 * Metric types
 */
export enum MetricType {
    COUNTER = 'counter',
    GAUGE = 'gauge',
    HISTOGRAM = 'histogram',
    TIMER = 'timer',
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
    value: number;
    timestamp: Date;
    labels?: Record<string, string>;
}

/**
 * Metric summary
 */
export interface MetricSummary {
    count: number;
    sum: number;
    min: number;
    max: number;
    avg: number;
    p50?: number;
    p95?: number;
    p99?: number;
}

/**
 * Plugin performance metrics
 */
export interface PluginMetrics {
    pluginId: string;
    /** Load time in milliseconds */
    loadTime?: number;
    /** Install time in milliseconds */
    installTime?: number;
    /** Enable time in milliseconds */
    enableTime?: number;
    /** Number of lifecycle errors */
    errorCount: number;
    /** Total event emissions */
    eventCount: number;
    /** Total API calls */
    apiCallCount: number;
    /** Memory usage in bytes */
    memoryUsage?: number;
    /** Last updated timestamp */
    lastUpdated: Date;
}

/**
 * Performance timer
 */
export class PerformanceTimer {
    private startTime: number;
    private endTime?: number;

    constructor() {
        this.startTime = performance.now();
    }

    /**
     * Stop the timer and return duration in milliseconds
     */
    stop(): number {
        if (!this.endTime) {
            this.endTime = performance.now();
        }
        return this.endTime - this.startTime;
    }

    /**
     * Get elapsed time without stopping
     */
    elapsed(): number {
        const now = performance.now();
        return now - this.startTime;
    }
}

/**
 * Metrics Manager
 * 
 * Collects and manages plugin performance metrics.
 */
export class MetricsManager {
    private logger: Logger;
    private pluginMetrics: Map<string, PluginMetrics> = new Map();
    private customMetrics: Map<string, MetricDataPoint[]> = new Map();
    private timers: Map<string, PerformanceTimer> = new Map();
    private enabled: boolean;
    private maxDataPoints: number = 10000;

    constructor(options?: { enabled?: boolean; maxDataPoints?: number }) {
        this.logger = createLogger('MetricsManager');
        this.enabled = options?.enabled ?? true;
        this.maxDataPoints = options?.maxDataPoints ?? 10000;

        if (!this.enabled) {
            this.logger.warn('Metrics collection is disabled');
        }
    }

    /**
     * Start a performance timer
     */
    startTimer(name: string): void {
        if (!this.enabled) return;
        this.timers.set(name, new PerformanceTimer());
    }

    /**
     * Stop a timer and record the duration
     */
    stopTimer(name: string, labels?: Record<string, string>): number | undefined {
        if (!this.enabled) return undefined;

        const timer = this.timers.get(name);
        if (!timer) {
            this.logger.warn(`Timer '${name}' not found`);
            return undefined;
        }

        const duration = timer.stop();
        this.timers.delete(name);

        // Record as histogram
        this.recordMetric(name, duration, MetricType.HISTOGRAM, labels);

        return duration;
    }

    /**
     * Record a metric value
     */
    recordMetric(
        name: string,
        value: number,
        type: MetricType = MetricType.GAUGE,
        labels?: Record<string, string>
    ): void {
        if (!this.enabled) return;

        const key = this.getMetricKey(name, labels);

        if (!this.customMetrics.has(key)) {
            this.customMetrics.set(key, []);
        }

        const dataPoints = this.customMetrics.get(key)!;
        dataPoints.push({
            value,
            timestamp: new Date(),
            labels,
        });

        // Keep data points under limit
        if (dataPoints.length > this.maxDataPoints) {
            dataPoints.shift();
        }
    }

    /**
     * Increment a counter
     */
    incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
        this.recordMetric(name, value, MetricType.COUNTER, labels);
    }

    /**
     * Set a gauge value
     */
    setGauge(name: string, value: number, labels?: Record<string, string>): void {
        this.recordMetric(name, value, MetricType.GAUGE, labels);
    }

    /**
     * Record plugin load time
     */
    recordPluginLoad(pluginId: string, duration: number): void {
        const metrics = this.getOrCreatePluginMetrics(pluginId);
        metrics.loadTime = duration;
        metrics.lastUpdated = new Date();

        this.recordMetric('plugin.load.duration', duration, MetricType.HISTOGRAM, { pluginId });
    }

    /**
     * Record plugin install time
     */
    recordPluginInstall(pluginId: string, duration: number): void {
        const metrics = this.getOrCreatePluginMetrics(pluginId);
        metrics.installTime = duration;
        metrics.lastUpdated = new Date();

        this.recordMetric('plugin.install.duration', duration, MetricType.HISTOGRAM, { pluginId });
    }

    /**
     * Record plugin enable time
     */
    recordPluginEnable(pluginId: string, duration: number): void {
        const metrics = this.getOrCreatePluginMetrics(pluginId);
        metrics.enableTime = duration;
        metrics.lastUpdated = new Date();

        this.recordMetric('plugin.enable.duration', duration, MetricType.HISTOGRAM, { pluginId });
    }

    /**
     * Record plugin error
     */
    recordPluginError(pluginId: string): void {
        const metrics = this.getOrCreatePluginMetrics(pluginId);
        metrics.errorCount++;
        metrics.lastUpdated = new Date();

        this.incrementCounter('plugin.errors', 1, { pluginId });
    }

    /**
     * Record plugin event
     */
    recordPluginEvent(pluginId: string): void {
        const metrics = this.getOrCreatePluginMetrics(pluginId);
        metrics.eventCount++;
        metrics.lastUpdated = new Date();

        this.incrementCounter('plugin.events', 1, { pluginId });
    }

    /**
     * Record plugin API call
     */
    recordPluginApiCall(pluginId: string): void {
        const metrics = this.getOrCreatePluginMetrics(pluginId);
        metrics.apiCallCount++;
        metrics.lastUpdated = new Date();

        this.incrementCounter('plugin.api.calls', 1, { pluginId });
    }

    /**
     * Record plugin memory usage
     */
    recordPluginMemory(pluginId: string, bytes: number): void {
        const metrics = this.getOrCreatePluginMetrics(pluginId);
        metrics.memoryUsage = bytes;
        metrics.lastUpdated = new Date();

        this.setGauge('plugin.memory.bytes', bytes, { pluginId });
    }

    /**
     * Get plugin metrics
     */
    getPluginMetrics(pluginId: string): PluginMetrics | undefined {
        return this.pluginMetrics.get(pluginId);
    }

    /**
     * Get all plugin metrics
     */
    getAllPluginMetrics(): Map<string, PluginMetrics> {
        return new Map(this.pluginMetrics);
    }

    /**
     * Get metric summary
     */
    getMetricSummary(name: string, labels?: Record<string, string>): MetricSummary | undefined {
        const key = this.getMetricKey(name, labels);
        const dataPoints = this.customMetrics.get(key);

        if (!dataPoints || dataPoints.length === 0) {
            return undefined;
        }

        const values = dataPoints.map(dp => dp.value).sort((a, b) => a - b);

        return {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            min: values[0],
            max: values[values.length - 1],
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            p50: this.percentile(values, 0.5),
            p95: this.percentile(values, 0.95),
            p99: this.percentile(values, 0.99),
        };
    }

    /**
     * Get current metrics snapshot
     */
    getSnapshot(): {
        plugins: Record<string, PluginMetrics>;
        custom: Record<string, MetricSummary>;
        timestamp: Date;
    } {
        const snapshot: any = {
            plugins: {},
            custom: {},
            timestamp: new Date(),
        };

        // Plugin metrics
        for (const [pluginId, metrics] of this.pluginMetrics.entries()) {
            snapshot.plugins[pluginId] = { ...metrics };
        }

        // Custom metrics summaries
        for (const [key, _] of this.customMetrics.entries()) {
            const summary = this.getMetricSummary(key);
            if (summary) {
                snapshot.custom[key] = summary;
            }
        }

        return snapshot;
    }

    /**
     * Calculate percentile
     */
    private percentile(values: number[], p: number): number {
        if (values.length === 0) return 0;
        const index = Math.ceil(values.length * p) - 1;
        return values[Math.max(0, Math.min(index, values.length - 1))];
    }

    /**
     * Get or create plugin metrics
     */
    private getOrCreatePluginMetrics(pluginId: string): PluginMetrics {
        if (!this.pluginMetrics.has(pluginId)) {
            this.pluginMetrics.set(pluginId, {
                pluginId,
                errorCount: 0,
                eventCount: 0,
                apiCallCount: 0,
                lastUpdated: new Date(),
            });
        }
        return this.pluginMetrics.get(pluginId)!;
    }

    /**
     * Generate metric key with labels
     */
    private getMetricKey(name: string, labels?: Record<string, string>): string {
        if (!labels || Object.keys(labels).length === 0) {
            return name;
        }

        const labelStr = Object.entries(labels)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}="${v}"`)
            .join(',');

        return `${name}{${labelStr}}`;
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.pluginMetrics.clear();
        this.customMetrics.clear();
        this.timers.clear();
        this.logger.debug('Cleared all metrics');
    }

    /**
     * Enable or disable metrics collection
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.logger.info(`Metrics collection ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if metrics are enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }
}
