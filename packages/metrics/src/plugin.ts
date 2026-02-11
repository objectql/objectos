/**
 * Metrics Plugin for ObjectOS
 * 
 * Provides system monitoring and metrics collection with Prometheus support
 * 
 * Features:
 * - Counter, Gauge, and Histogram metrics
 * - Labels support for metric dimensions
 * - Prometheus text format export
 * - Built-in kernel metrics tracking
 * - Automatic hook into kernel lifecycle events
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { MetricsConfig, Labels, Metric, PluginHealthReport, PluginCapabilityManifest, PluginSecurityManifest, PluginStartupResult } from './types.js';
import { MetricType } from './types.js';
import { CounterCollector, GaugeCollector, HistogramCollector } from './collectors.js';
import { exportPrometheus } from './prometheus.js';

/**
 * Metric key for storage (name + labels)
 */
type MetricKey = string;

/**
 * Generate unique key for metric name and labels
 */
function getMetricKey(name: string, labels: Labels = {}): MetricKey {
    const labelPairs = Object.entries(labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}="${v}"`)
        .join(',');
    
    return labelPairs ? `${name}{${labelPairs}}` : name;
}

/**
 * Metrics Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class MetricsPlugin implements Plugin {
    name = '@objectos/metrics';
    version = '0.1.0';
    dependencies: string[] = [];

    private config: MetricsConfig;
    private counters = new Map<MetricKey, CounterCollector>();
    private gauges = new Map<MetricKey, GaugeCollector>();
    private histograms = new Map<MetricKey, HistogramCollector>();
    private context?: PluginContext;
    private startedAt?: number;

    constructor(config: MetricsConfig = {}) {
        this.config = {
            enabled: true,
            prefix: '',
            defaultLabels: {},
            trackBuiltInMetrics: true,
            maxHistogramObservations: 10000,
            ...config,
        };
    }

    /**
     * Initialize plugin - Register services and subscribe to events
     */
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;
        this.startedAt = Date.now();

        // Register metrics service
        context.registerService('metrics', this);

        // Set up built-in metrics tracking
        if (this.config.trackBuiltInMetrics) {
            await this.setupBuiltInMetrics(context);
        }

        context.logger.info('[Metrics] Initialized successfully');
        await context.trigger('plugin.initialized', { pluginId: this.name });
    }

    /**
     * Start plugin
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Metrics] Starting...');
        
        // Register HTTP routes for Metrics API
        try {
            const httpServer = context.getService('http.server') as any;
            const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
            if (rawApp) {
                // GET /api/v1/metrics - Get all metrics
                rawApp.get('/api/v1/metrics', async (c: any) => {
                    try {
                        const metrics = this.getMetrics();
                        return c.json({ success: true, data: metrics });
                    } catch (error: any) {
                        context.logger.error('[Metrics API] Get metrics error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/metrics/prometheus - Prometheus format export
                rawApp.get('/api/v1/metrics/prometheus', async (c: any) => {
                    try {
                        const prometheusText = this.exportPrometheus();
                        return c.text(prometheusText);
                    } catch (error: any) {
                        context.logger.error('[Metrics API] Prometheus export error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/metrics/type/:type - Get metrics by type
                rawApp.get('/api/v1/metrics/type/:type', async (c: any) => {
                    try {
                        const type = c.req.param('type');
                        const metrics = this.getMetricsByType(type as any);
                        return c.json({ success: true, data: metrics });
                    } catch (error: any) {
                        context.logger.error('[Metrics API] Get metrics by type error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/admin/plugins - List all loaded plugins with health status
                rawApp.get('/api/v1/admin/plugins', async (c: any) => {
                    try {
                        // Get all registered services (plugins register themselves as services)
                        const plugins: any[] = [];
                        
                        // Try to get plugin information from the kernel context
                        // This is a workaround since we don't have direct access to the kernel's plugin list
                        const knownPlugins = [
                            '@objectos/metrics',
                            '@objectos/cache',
                            '@objectos/storage',
                            '@objectos/auth',
                            '@objectos/permissions',
                            '@objectos/audit',
                            '@objectos/workflow',
                            '@objectos/automation',
                            '@objectos/jobs',
                            '@objectos/notification',
                            '@objectos/i18n',
                            '@objectos/realtime',
                        ];

                        for (const pluginName of knownPlugins) {
                            try {
                                // Try to get the service
                                const serviceName = pluginName.replace('@objectos/', '');
                                const service = context.getService(serviceName) as any;
                                
                                if (service) {
                                    let health: any = { status: 'unknown' };
                                    let manifest: any = {};
                                    
                                    // Try to get health check
                                    if (typeof service.healthCheck === 'function') {
                                        try {
                                            health = await service.healthCheck();
                                        } catch (e) {
                                            health = { status: 'error', error: String(e) };
                                        }
                                    }
                                    
                                    // Try to get manifest
                                    if (typeof service.getManifest === 'function') {
                                        try {
                                            manifest = service.getManifest();
                                        } catch (e) {
                                            manifest = { error: String(e) };
                                        }
                                    }
                                    
                                    plugins.push({
                                        name: service.name || pluginName,
                                        version: service.version || '0.1.0',
                                        status: health.status || 'unknown',
                                        uptime: health.metrics?.uptime ?? 0,
                                        health,
                                        manifest,
                                    });
                                }
                            } catch (e) {
                                // Plugin not loaded or service not available
                                context.logger.debug(`[Admin API] Plugin ${pluginName} not found: ${e}`);
                            }
                        }
                        
                        return c.json({ success: true, data: plugins });
                    } catch (error: any) {
                        context.logger.error('[Admin API] List plugins error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                context.logger.info('[Metrics] HTTP routes registered');
            }
        } catch (e: any) {
            context.logger.warn(`[Metrics] Could not register HTTP routes: ${e?.message}`);
        }
        
        context.logger.info('[Metrics] Started successfully');
        await context.trigger('plugin.started', { pluginId: this.name });
    }

    /**
     * Set up built-in metrics for kernel lifecycle events
     */
    private async setupBuiltInMetrics(context: PluginContext): Promise<void> {
        // Track plugin lifecycle events
        context.hook('plugin.load.start', async (data: any) => {
            const startTime = Date.now();
            
            context.hook('plugin.load.end', async (endData: any) => {
                if (endData.pluginName === data.pluginName) {
                    const duration = Date.now() - startTime;
                    this.recordHistogram('plugin.load.duration', duration, {
                        plugin: data.pluginName || 'unknown',
                    });
                }
            });
        });

        context.hook('plugin.enable.start', async (data: any) => {
            const startTime = Date.now();
            
            context.hook('plugin.enable.end', async (endData: any) => {
                if (endData.pluginName === data.pluginName) {
                    const duration = Date.now() - startTime;
                    this.recordHistogram('plugin.enable.duration', duration, {
                        plugin: data.pluginName || 'unknown',
                    });
                }
            });
        });

        // Track service calls
        context.hook('service.call', async (data: any) => {
            const { serviceName, method } = data;
            this.incrementCounter('service.calls.total', 1, {
                service: serviceName || 'unknown',
                method: method || 'unknown',
            });
        });

        // Track hook executions
        context.hook('hook.execute.start', async (data: any) => {
            const startTime = Date.now();
            const hookName = data.hookName;
            
            context.hook('hook.execute.end', async (endData: any) => {
                if (endData.hookName === hookName) {
                    const duration = Date.now() - startTime;
                    this.recordHistogram('hook.execution.duration', duration, {
                        hook: hookName || 'unknown',
                    });
                }
            });
        });

        this.context?.logger.info('[Metrics] Built-in metrics tracking enabled');
    }

    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, amount: number = 1, labels: Labels = {}): void {
        if (!this.config.enabled) return;

        const fullName = this.config.prefix ? `${this.config.prefix}${name}` : name;
        const fullLabels = { ...this.config.defaultLabels, ...labels };
        const key = getMetricKey(fullName, fullLabels);

        let counter = this.counters.get(key);
        if (!counter) {
            counter = new CounterCollector(fullName, `Counter: ${name}`, fullLabels);
            this.counters.set(key, counter);
        }

        counter.inc(amount);
    }

    /**
     * Set a gauge metric
     */
    setGauge(name: string, value: number, labels: Labels = {}): void {
        if (!this.config.enabled) return;

        const fullName = this.config.prefix ? `${this.config.prefix}${name}` : name;
        const fullLabels = { ...this.config.defaultLabels, ...labels };
        const key = getMetricKey(fullName, fullLabels);

        let gauge = this.gauges.get(key);
        if (!gauge) {
            gauge = new GaugeCollector(fullName, `Gauge: ${name}`, fullLabels);
            this.gauges.set(key, gauge);
        }

        gauge.set(value);
    }

    /**
     * Increment a gauge metric
     */
    incrementGauge(name: string, amount: number = 1, labels: Labels = {}): void {
        if (!this.config.enabled) return;

        const fullName = this.config.prefix ? `${this.config.prefix}${name}` : name;
        const fullLabels = { ...this.config.defaultLabels, ...labels };
        const key = getMetricKey(fullName, fullLabels);

        let gauge = this.gauges.get(key);
        if (!gauge) {
            gauge = new GaugeCollector(fullName, `Gauge: ${name}`, fullLabels);
            this.gauges.set(key, gauge);
        }

        gauge.inc(amount);
    }

    /**
     * Decrement a gauge metric
     */
    decrementGauge(name: string, amount: number = 1, labels: Labels = {}): void {
        if (!this.config.enabled) return;

        const fullName = this.config.prefix ? `${this.config.prefix}${name}` : name;
        const fullLabels = { ...this.config.defaultLabels, ...labels };
        const key = getMetricKey(fullName, fullLabels);

        let gauge = this.gauges.get(key);
        if (!gauge) {
            gauge = new GaugeCollector(fullName, `Gauge: ${name}`, fullLabels);
            this.gauges.set(key, gauge);
        }

        gauge.dec(amount);
    }

    /**
     * Record a histogram observation
     */
    recordHistogram(name: string, value: number, labels: Labels = {}): void {
        if (!this.config.enabled) return;

        const fullName = this.config.prefix ? `${this.config.prefix}${name}` : name;
        const fullLabels = { ...this.config.defaultLabels, ...labels };
        const key = getMetricKey(fullName, fullLabels);

        let histogram = this.histograms.get(key);
        if (!histogram) {
            histogram = new HistogramCollector(
                fullName,
                `Histogram: ${name}`,
                fullLabels,
                this.config.maxHistogramObservations
            );
            this.histograms.set(key, histogram);
        }

        histogram.observe(value);
    }

    /**
     * Get all metrics
     */
    getMetrics(): Metric[] {
        const metrics: Metric[] = [];

        // Collect counters
        for (const collector of this.counters.values()) {
            metrics.push(collector.get());
        }

        // Collect gauges
        for (const collector of this.gauges.values()) {
            metrics.push(collector.get());
        }

        // Collect histograms
        for (const collector of this.histograms.values()) {
            metrics.push(collector.get());
        }

        return metrics;
    }

    /**
     * Get metrics by type
     */
    getMetricsByType(type: MetricType): Metric[] {
        return this.getMetrics().filter(m => m.type === type);
    }

    /**
     * Get a specific metric by name and labels
     */
    getMetric(name: string, labels: Labels = {}): Metric | undefined {
        const fullName = this.config.prefix ? `${this.config.prefix}${name}` : name;
        const fullLabels = { ...this.config.defaultLabels, ...labels };
        const key = getMetricKey(fullName, fullLabels);

        const counter = this.counters.get(key);
        if (counter) return counter.get();

        const gauge = this.gauges.get(key);
        if (gauge) return gauge.get();

        const histogram = this.histograms.get(key);
        if (histogram) return histogram.get();

        return undefined;
    }

    /**
     * Export all metrics in Prometheus text format
     */
    exportPrometheus(): string {
        return exportPrometheus(this.getMetrics());
    }

    /**
     * Reset all metrics
     */
    resetAllMetrics(): void {
        for (const collector of this.counters.values()) {
            collector.reset();
        }
        for (const collector of this.gauges.values()) {
            collector.reset();
        }
        for (const collector of this.histograms.values()) {
            collector.reset();
        }
    }

    /**
     * Reset a specific metric
     */
    resetMetric(name: string, labels: Labels = {}): void {
        const fullName = this.config.prefix ? `${this.config.prefix}${name}` : name;
        const fullLabels = { ...this.config.defaultLabels, ...labels };
        const key = getMetricKey(fullName, fullLabels);

        this.counters.get(key)?.reset();
        this.gauges.get(key)?.reset();
        this.histograms.get(key)?.reset();
    }

    /**
     * Get the metric registry with all registered metric keys by type
     */
    getRegistry(): { counters: string[]; gauges: string[]; histograms: string[] } {
        return {
            counters: Array.from(this.counters.keys()),
            gauges: Array.from(this.gauges.keys()),
            histograms: Array.from(this.histograms.keys()),
        };
    }

    /**
     * Get all unique metric names across all types
     */
    getMetricNames(): string[] {
        const names = new Set<string>();
        for (const c of this.counters.values()) names.add(c.get().name);
        for (const g of this.gauges.values()) names.add(g.get().name);
        for (const h of this.histograms.values()) names.add(h.get().name);
        return Array.from(names);
    }

    /**
     * Health check with latency tracking
     */
    async healthCheck(): Promise<PluginHealthReport> {
        const start = performance.now();
        const status = this.config.enabled ? 'healthy' : 'degraded';
        const message = `${this.counters.size} counters, ${this.gauges.size} gauges, ${this.histograms.size} histograms`;
        const responseTime = performance.now() - start;
        return {
            status,
            timestamp: new Date().toISOString(),
            message,
            metrics: {
                uptime: this.startedAt ? Date.now() - this.startedAt : 0,
                responseTime,
            },
            checks: [
                {
                    name: 'metrics-collection',
                    status: status === 'healthy' ? 'passed' : 'warning',
                    message,
                },
            ],
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: {
                provides: [{
                    id: 'com.objectstack.service.metrics',
                    name: 'metrics',
                    version: { major: 0, minor: 1, patch: 0 },
                    methods: [
                        { name: 'incrementCounter', description: 'Increment a counter metric', async: false },
                        { name: 'setGauge', description: 'Set a gauge metric value', async: false },
                        { name: 'incrementGauge', description: 'Increment a gauge metric', async: false },
                        { name: 'decrementGauge', description: 'Decrement a gauge metric', async: false },
                        { name: 'recordHistogram', description: 'Record a histogram observation', async: false },
                        { name: 'getMetrics', description: 'Get all metrics', returnType: 'Metric[]', async: false },
                        { name: 'getMetric', description: 'Get a specific metric by name', async: false },
                        { name: 'exportPrometheus', description: 'Export metrics in Prometheus format', returnType: 'string', async: false },
                        { name: 'resetAllMetrics', description: 'Reset all metrics', async: false },
                    ],
                    stability: 'stable',
                }],
                requires: [],
            },
            security: {
                pluginId: 'metrics',
                trustLevel: 'trusted',
                permissions: { permissions: [], defaultGrant: 'deny' },
                sandbox: { enabled: false, level: 'none' },
            },
        };
    }

    /**
     * Startup result
     */
    getStartupResult(): PluginStartupResult {
        return { plugin: { name: this.name, version: this.version }, success: !!this.context, duration: 0 };
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        this.counters.clear();
        this.gauges.clear();
        this.histograms.clear();
        if (this.context) {
            await this.context.trigger('plugin.destroyed', { pluginId: this.name });
        }
        this.context?.logger.info('[Metrics] Destroyed');
    }
}

/**
 * Helper function to access the metrics API from kernel
 */
export function getMetricsAPI(kernel: any): MetricsPlugin | null {
    try {
        return kernel.getService('metrics');
    } catch {
        return null;
    }
}
