/**
 * Metrics Plugin Tests
 * 
 * Comprehensive test suite for the metrics plugin
 */

import { MetricsPlugin, getMetricsAPI } from '../src/plugin.js';
import { MetricType } from '../src/types.js';
import { CounterCollector, GaugeCollector, HistogramCollector } from '../src/collectors.js';
import { exportPrometheus, parsePrometheusLine } from '../src/prometheus.js';
import type { PluginContext } from '@objectstack/runtime';

// Mock PluginContext
function createMockContext(): PluginContext {
    const services = new Map<string, any>();
    const hooks = new Map<string, Array<(...args: any[]) => void | Promise<void>>>();

    const getService = <T>(name: string): T => {
        const service = services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        return service as T;
    };

    return {
        registerService: jest.fn((name: string, service: any) => {
            services.set(name, service);
        }),
        getService: jest.fn(getService) as any,
        getServices: jest.fn(() => services),
        hook: jest.fn((name: string, handler: (...args: any[]) => void | Promise<void>) => {
            if (!hooks.has(name)) {
                hooks.set(name, []);
            }
            hooks.get(name)!.push(handler);
        }),
        trigger: jest.fn(async (name: string, ...args: any[]) => {
            const handlers = hooks.get(name) || [];
            for (const handler of handlers) {
                await handler(...args);
            }
        }),
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        },
        getKernel: jest.fn(),
        replaceService: jest.fn((name: string, service: any) => {
            services.set(name, service);
        }),
    };
}

describe('MetricsPlugin', () => {
    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();

            await plugin.init(context);

            expect(context.registerService).toHaveBeenCalledWith('metrics', plugin);
            expect(context.logger.info).toHaveBeenCalledWith('[Metrics] Initialized successfully');
        });

        it('should start successfully', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();

            await plugin.init(context);
            await plugin.start(context);

            expect(context.logger.info).toHaveBeenCalledWith('[Metrics] Started successfully');
        });

        it('should destroy cleanly', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();

            await plugin.init(context);
            await plugin.destroy();

            expect(context.logger.info).toHaveBeenCalledWith('[Metrics] Destroyed');
        });

        it('should have correct plugin metadata', () => {
            const plugin = new MetricsPlugin();

            expect(plugin.name).toBe('@objectos/metrics');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual([]);
        });
    });

    describe('Counter Operations', () => {
        it('should increment counter', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test.counter', 5);

            const metrics = plugin.getMetrics();
            const counter = metrics.find(m => m.name === 'test.counter');

            expect(counter).toBeDefined();
            expect(counter?.type).toBe(MetricType.Counter);
            expect((counter as any).value).toBe(5);
        });

        it('should increment counter multiple times', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test.counter', 3);
            plugin.incrementCounter('test.counter', 2);
            plugin.incrementCounter('test.counter', 1);

            const metrics = plugin.getMetrics();
            const counter = metrics.find(m => m.name === 'test.counter');

            expect((counter as any).value).toBe(6);
        });

        it('should support counter with labels', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('http.requests', 1, { method: 'GET', status: '200' });
            plugin.incrementCounter('http.requests', 1, { method: 'POST', status: '201' });

            const metrics = plugin.getMetrics();
            const counters = metrics.filter(m => m.name === 'http.requests');

            expect(counters.length).toBe(2);
            expect(counters[0].labels).toEqual({ method: 'GET', status: '200' });
            expect(counters[1].labels).toEqual({ method: 'POST', status: '201' });
        });

        it('should apply metric prefix', async () => {
            const plugin = new MetricsPlugin({ prefix: 'objectos_' });
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test.counter', 1);

            const metrics = plugin.getMetrics();
            const counter = metrics.find(m => m.name === 'objectos_test.counter');

            expect(counter).toBeDefined();
        });

        it('should apply default labels', async () => {
            const plugin = new MetricsPlugin({
                defaultLabels: { environment: 'test', region: 'us-east' }
            });
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test.counter', 1);

            const metrics = plugin.getMetrics();
            const counter = metrics.find(m => m.name === 'test.counter');

            expect(counter?.labels).toMatchObject({
                environment: 'test',
                region: 'us-east'
            });
        });
    });

    describe('Gauge Operations', () => {
        it('should set gauge value', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.setGauge('test.gauge', 42);

            const metrics = plugin.getMetrics();
            const gauge = metrics.find(m => m.name === 'test.gauge');

            expect(gauge).toBeDefined();
            expect(gauge?.type).toBe(MetricType.Gauge);
            expect((gauge as any).value).toBe(42);
        });

        it('should increment gauge', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.setGauge('test.gauge', 10);
            plugin.incrementGauge('test.gauge', 5);

            const metrics = plugin.getMetrics();
            const gauge = metrics.find(m => m.name === 'test.gauge');

            expect((gauge as any).value).toBe(15);
        });

        it('should decrement gauge', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.setGauge('test.gauge', 20);
            plugin.decrementGauge('test.gauge', 7);

            const metrics = plugin.getMetrics();
            const gauge = metrics.find(m => m.name === 'test.gauge');

            expect((gauge as any).value).toBe(13);
        });

        it('should support gauge with labels', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.setGauge('memory.usage', 1024, { type: 'heap' });
            plugin.setGauge('memory.usage', 512, { type: 'stack' });

            const metrics = plugin.getMetrics();
            const gauges = metrics.filter(m => m.name === 'memory.usage');

            expect(gauges.length).toBe(2);
        });
    });

    describe('Histogram Operations', () => {
        it('should record histogram observations', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.recordHistogram('request.duration', 100);
            plugin.recordHistogram('request.duration', 200);
            plugin.recordHistogram('request.duration', 150);

            const metrics = plugin.getMetrics();
            const histogram = metrics.find(m => m.name === 'request.duration');

            expect(histogram).toBeDefined();
            expect(histogram?.type).toBe(MetricType.Histogram);
            expect((histogram as any).count).toBe(3);
            expect((histogram as any).sum).toBe(450);
        });

        it('should calculate correct percentiles', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            // Record values: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
            for (let i = 1; i <= 10; i++) {
                plugin.recordHistogram('test.histogram', i * 10);
            }

            const metrics = plugin.getMetrics();
            const histogram = metrics.find(m => m.name === 'test.histogram') as any;

            expect(histogram).toBeDefined();
            expect(histogram.count).toBe(10);
            expect(histogram.sum).toBe(550);
        });

        it('should support histogram with labels', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.recordHistogram('api.latency', 100, { endpoint: '/users' });
            plugin.recordHistogram('api.latency', 200, { endpoint: '/orders' });

            const metrics = plugin.getMetrics();
            const histograms = metrics.filter(m => m.name === 'api.latency');

            expect(histograms.length).toBe(2);
        });

        it('should respect max observations limit', async () => {
            const plugin = new MetricsPlugin({ maxHistogramObservations: 5 });
            const context = createMockContext();
            await plugin.init(context);

            for (let i = 0; i < 10; i++) {
                plugin.recordHistogram('test.histogram', i);
            }

            const metrics = plugin.getMetrics();
            const histogram = metrics.find(m => m.name === 'test.histogram') as any;

            expect(histogram.observations.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Labels Support', () => {
        it('should differentiate metrics with different labels', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('requests', 1, { method: 'GET' });
            plugin.incrementCounter('requests', 2, { method: 'POST' });

            const metrics = plugin.getMetrics();
            const getCounter = metrics.find(m => 
                m.name === 'requests' && m.labels.method === 'GET'
            ) as any;
            const postCounter = metrics.find(m => 
                m.name === 'requests' && m.labels.method === 'POST'
            ) as any;

            expect(getCounter.value).toBe(1);
            expect(postCounter.value).toBe(2);
        });

        it('should merge default labels with custom labels', async () => {
            const plugin = new MetricsPlugin({
                defaultLabels: { env: 'test' }
            });
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test', 1, { custom: 'value' });

            const metrics = plugin.getMetrics();
            const metric = metrics[0];

            expect(metric.labels).toMatchObject({
                env: 'test',
                custom: 'value'
            });
        });
    });

    describe('Prometheus Export', () => {
        it('should export counter in Prometheus format', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test_counter', 42);

            const exported = plugin.exportPrometheus();

            expect(exported).toContain('# HELP test_counter Counter: test_counter');
            expect(exported).toContain('# TYPE test_counter counter');
            expect(exported).toContain('test_counter 42');
        });

        it('should export gauge in Prometheus format', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.setGauge('test_gauge', 3.14);

            const exported = plugin.exportPrometheus();

            expect(exported).toContain('# HELP test_gauge Gauge: test_gauge');
            expect(exported).toContain('# TYPE test_gauge gauge');
            expect(exported).toContain('test_gauge 3.14');
        });

        it('should export histogram in Prometheus format', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.recordHistogram('test_histogram', 100);
            plugin.recordHistogram('test_histogram', 200);

            const exported = plugin.exportPrometheus();

            expect(exported).toContain('# HELP test_histogram Histogram: test_histogram');
            expect(exported).toContain('# TYPE test_histogram histogram');
            expect(exported).toContain('test_histogram_sum');
            expect(exported).toContain('test_histogram_count');
            expect(exported).toContain('test_histogram_p50');
            expect(exported).toContain('test_histogram_p90');
            expect(exported).toContain('test_histogram_p95');
            expect(exported).toContain('test_histogram_p99');
        });

        it('should export metrics with labels', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('http_requests', 5, {
                method: 'GET',
                status: '200'
            });

            const exported = plugin.exportPrometheus();

            expect(exported).toContain('http_requests{method="GET",status="200"}');
        });
    });

    describe('Built-in Metrics Tracking', () => {
        it('should track plugin load duration when enabled', async () => {
            const plugin = new MetricsPlugin({ trackBuiltInMetrics: true });
            const context = createMockContext();
            await plugin.init(context);

            // Simulate plugin load events
            await context.trigger('plugin.load.start', { pluginName: 'test-plugin' });
            await new Promise(resolve => setTimeout(resolve, 50));
            await context.trigger('plugin.load.end', { pluginName: 'test-plugin' });

            const metrics = plugin.getMetrics();
            const loadMetric = metrics.find(m => m.name === 'plugin.load.duration');

            expect(loadMetric).toBeDefined();
            expect(loadMetric?.type).toBe(MetricType.Histogram);
        });

        it('should track service calls when enabled', async () => {
            const plugin = new MetricsPlugin({ trackBuiltInMetrics: true });
            const context = createMockContext();
            await plugin.init(context);

            // Simulate service calls
            await context.trigger('service.call', {
                serviceName: 'data',
                method: 'find'
            });

            const metrics = plugin.getMetrics();
            const serviceMetric = metrics.find(m => m.name === 'service.calls.total');

            expect(serviceMetric).toBeDefined();
            expect(serviceMetric?.type).toBe(MetricType.Counter);
        });

        it('should not track built-in metrics when disabled', async () => {
            const plugin = new MetricsPlugin({ trackBuiltInMetrics: false });
            const context = createMockContext();
            await plugin.init(context);

            await context.trigger('service.call', {
                serviceName: 'data',
                method: 'find'
            });

            const metrics = plugin.getMetrics();

            expect(metrics.length).toBe(0);
        });
    });

    describe('Metric Retrieval', () => {
        it('should get all metrics', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('counter1', 1);
            plugin.setGauge('gauge1', 10);
            plugin.recordHistogram('histogram1', 100);

            const metrics = plugin.getMetrics();

            expect(metrics.length).toBe(3);
        });

        it('should get metrics by type', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('counter1', 1);
            plugin.setGauge('gauge1', 10);
            plugin.recordHistogram('histogram1', 100);

            const counters = plugin.getMetricsByType(MetricType.Counter);
            const gauges = plugin.getMetricsByType(MetricType.Gauge);
            const histograms = plugin.getMetricsByType(MetricType.Histogram);

            expect(counters.length).toBe(1);
            expect(gauges.length).toBe(1);
            expect(histograms.length).toBe(1);
        });

        it('should get specific metric by name and labels', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test', 5, { env: 'prod' });

            const metric = plugin.getMetric('test', { env: 'prod' });

            expect(metric).toBeDefined();
            expect((metric as any).value).toBe(5);
        });
    });

    describe('Metric Reset', () => {
        it('should reset all metrics', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('counter', 10);
            plugin.setGauge('gauge', 20);
            plugin.recordHistogram('histogram', 30);

            plugin.resetAllMetrics();

            const counter = plugin.getMetric('counter') as any;
            const gauge = plugin.getMetric('gauge') as any;
            const histogram = plugin.getMetric('histogram') as any;

            expect(counter.value).toBe(0);
            expect(gauge.value).toBe(0);
            expect(histogram.count).toBe(0);
            expect(histogram.sum).toBe(0);
        });

        it('should reset specific metric', async () => {
            const plugin = new MetricsPlugin();
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('counter1', 10);
            plugin.incrementCounter('counter2', 20);

            plugin.resetMetric('counter1');

            const counter1 = plugin.getMetric('counter1') as any;
            const counter2 = plugin.getMetric('counter2') as any;

            expect(counter1.value).toBe(0);
            expect(counter2.value).toBe(20);
        });
    });

    describe('Configuration', () => {
        it('should not collect metrics when disabled', async () => {
            const plugin = new MetricsPlugin({ enabled: false });
            const context = createMockContext();
            await plugin.init(context);

            plugin.incrementCounter('test', 1);

            const metrics = plugin.getMetrics();

            expect(metrics.length).toBe(0);
        });
    });

    describe('Helper Functions', () => {
        it('should retrieve metrics API from kernel', () => {
            const plugin = new MetricsPlugin();
            const mockKernel = {
                getService: jest.fn().mockReturnValue(plugin)
            };

            const api = getMetricsAPI(mockKernel);

            expect(api).toBe(plugin);
            expect(mockKernel.getService).toHaveBeenCalledWith('metrics');
        });

        it('should return null when service not found', () => {
            const mockKernel = {
                getService: jest.fn().mockImplementation(() => {
                    throw new Error('Not found');
                })
            };

            const api = getMetricsAPI(mockKernel);

            expect(api).toBeNull();
        });
    });
});

describe('CounterCollector', () => {
    it('should create counter with initial value 0', () => {
        const counter = new CounterCollector('test', 'Test counter');
        const metric = counter.get();

        expect(metric.value).toBe(0);
    });

    it('should increment counter', () => {
        const counter = new CounterCollector('test', 'Test counter');
        counter.inc(5);

        expect(counter.get().value).toBe(5);
    });

    it('should throw error on negative increment', () => {
        const counter = new CounterCollector('test', 'Test counter');

        expect(() => counter.inc(-1)).toThrow();
    });
});

describe('GaugeCollector', () => {
    it('should create gauge with initial value 0', () => {
        const gauge = new GaugeCollector('test', 'Test gauge');
        const metric = gauge.get();

        expect(metric.value).toBe(0);
    });

    it('should set gauge value', () => {
        const gauge = new GaugeCollector('test', 'Test gauge');
        gauge.set(42);

        expect(gauge.get().value).toBe(42);
    });

    it('should increment and decrement gauge', () => {
        const gauge = new GaugeCollector('test', 'Test gauge');
        gauge.set(10);
        gauge.inc(5);
        gauge.dec(3);

        expect(gauge.get().value).toBe(12);
    });
});

describe('HistogramCollector', () => {
    it('should track observations', () => {
        const histogram = new HistogramCollector('test', 'Test histogram');
        histogram.observe(100);
        histogram.observe(200);
        histogram.observe(150);

        const metric = histogram.get();

        expect(metric.count).toBe(3);
        expect(metric.sum).toBe(450);
        expect(metric.observations.length).toBe(3);
    });

    it('should calculate percentiles correctly', () => {
        const histogram = new HistogramCollector('test', 'Test histogram');
        
        for (let i = 1; i <= 100; i++) {
            histogram.observe(i);
        }

        const percentiles = histogram.calculatePercentiles();

        expect(percentiles.p50).toBeGreaterThanOrEqual(45);
        expect(percentiles.p50).toBeLessThanOrEqual(55);
        expect(percentiles.p90).toBeGreaterThanOrEqual(85);
        expect(percentiles.p99).toBeGreaterThanOrEqual(95);
    });

    it('should calculate average', () => {
        const histogram = new HistogramCollector('test', 'Test histogram');
        histogram.observe(100);
        histogram.observe(200);

        expect(histogram.getAverage()).toBe(150);
    });

    it('should limit observations', () => {
        const histogram = new HistogramCollector('test', 'Test histogram', {}, 5);

        for (let i = 0; i < 10; i++) {
            histogram.observe(i);
        }

        expect(histogram.get().observations.length).toBe(5);
    });
});

describe('Prometheus Export', () => {
    it('should parse Prometheus line', () => {
        const line = 'http_requests{method="GET",status="200"} 42 1234567890';
        const parsed = parsePrometheusLine(line);

        expect(parsed).not.toBeNull();
        expect(parsed?.name).toBe('http_requests');
        expect(parsed?.labels).toEqual({ method: 'GET', status: '200' });
        expect(parsed?.value).toBe(42);
    });

    it('should skip comments', () => {
        const line = '# HELP http_requests Total requests';
        const parsed = parsePrometheusLine(line);

        expect(parsed).toBeNull();
    });

    it('should handle metrics without labels', () => {
        const line = 'test_metric 3.14';
        const parsed = parsePrometheusLine(line);

        expect(parsed).not.toBeNull();
        expect(parsed?.name).toBe('test_metric');
        expect(parsed?.labels).toEqual({});
        expect(parsed?.value).toBe(3.14);
    });
});

// ─── Kernel Compliance Tests ───────────────────────────────────────────────────

describe('Kernel Compliance', () => {
    let plugin: MetricsPlugin;
    let context: PluginContext;

    beforeEach(async () => {
        plugin = new MetricsPlugin();
        context = createMockContext();
        await plugin.init(context);
    });

    afterEach(async () => {
        await plugin.destroy();
    });

    describe('healthCheck()', () => {
        it('should return healthy status when enabled', async () => {
            const report = await plugin.healthCheck();
            expect(report.status).toBe('healthy');
            expect(report.metrics?.uptime).toBeGreaterThanOrEqual(0);
            expect(report.checks).toHaveLength(1);
            expect(report.checks![0].name).toBe('metrics-collection');
            expect(report.checks![0].status).toBe('passed');
            expect(report.timestamp).toBeDefined();
        });

        it('should return degraded status when disabled', async () => {
            const disabledPlugin = new MetricsPlugin({ enabled: false });
            const ctx = createMockContext();
            await disabledPlugin.init(ctx);
            const report = await disabledPlugin.healthCheck();
            expect(report.status).toBe('degraded');
            await disabledPlugin.destroy();
        });

        it('should include metric counts in check message', async () => {
            plugin.incrementCounter('test_counter');
            plugin.setGauge('test_gauge', 42);
            const report = await plugin.healthCheck();
            expect(report.checks![0].message).toContain('1 counters');
            expect(report.checks![0].message).toContain('1 gauges');
        });
    });

    describe('getManifest()', () => {
        it('should return capability and security manifests', () => {
            const manifest = plugin.getManifest();
            expect(manifest.capabilities).toBeDefined();
            expect(manifest.security).toBeDefined();
        });
    });

    describe('getStartupResult()', () => {
        it('should return successful startup result after init', () => {
            const result = plugin.getStartupResult();
            expect(result.plugin.name).toBe('@objectos/metrics');
            expect(result.success).toBe(true);
        });
    });
});

// ─── Health Aggregator Tests ───────────────────────────────────────────────────

import { aggregateHealth, isSystemOperational } from '../src/health.js';
import type { PluginHealthReport } from '../src/types.js';

describe('Health Aggregator', () => {
    const makeReport = (name: string, status: 'healthy' | 'degraded' | 'unhealthy'): PluginHealthReport => ({
        status,
        timestamp: new Date().toISOString(),
        message: `${name} is ${status}`,
        metrics: {
            uptime: 1000,
        },
        checks: [{ name: 'test', status: status === 'healthy' ? 'passed' : status === 'degraded' ? 'warning' : 'failed' }],
    });

    describe('aggregateHealth()', () => {
        it('should report healthy when all plugins are healthy', () => {
            const reports = [
                makeReport('@objectos/metrics', 'healthy'),
                makeReport('@objectos/cache', 'healthy'),
                makeReport('@objectos/storage', 'healthy'),
            ];

            const system = aggregateHealth(reports, Date.now() - 60000);
            expect(system.status).toBe('healthy');
            expect(system.totalPlugins).toBe(3);
            expect(system.healthyPlugins).toBe(3);
            expect(system.degradedPlugins).toBe(0);
            expect(system.unhealthyPlugins).toBe(0);
        });

        it('should report degraded when any plugin is degraded', () => {
            const reports = [
                makeReport('@objectos/metrics', 'healthy'),
                makeReport('@objectos/cache', 'degraded'),
            ];

            const system = aggregateHealth(reports);
            expect(system.status).toBe('degraded');
            expect(system.degradedPlugins).toBe(1);
        });

        it('should report unhealthy when any plugin is unhealthy', () => {
            const reports = [
                makeReport('@objectos/metrics', 'healthy'),
                makeReport('@objectos/cache', 'degraded'),
                makeReport('@objectos/auth', 'unhealthy'),
            ];

            const system = aggregateHealth(reports);
            expect(system.status).toBe('unhealthy');
            expect(system.unhealthyPlugins).toBe(1);
        });

        it('should include memory and node version', () => {
            const system = aggregateHealth([makeReport('@objectos/metrics', 'healthy')]);
            expect(system.nodeVersion).toBeDefined();
            expect(system.memory).toBeDefined();
            expect(system.memory!.heapUsed).toBeGreaterThan(0);
        });

        it('should track uptime', () => {
            const system = aggregateHealth([], Date.now() - 5000);
            expect(system.uptime).toBeGreaterThanOrEqual(4000);
        });
    });

    describe('isSystemOperational()', () => {
        it('should return true for healthy system', () => {
            const system = aggregateHealth([makeReport('test', 'healthy')]);
            expect(isSystemOperational(system)).toBe(true);
        });

        it('should return true for degraded system', () => {
            const system = aggregateHealth([makeReport('test', 'degraded')]);
            expect(isSystemOperational(system)).toBe(true);
        });

        it('should return false for unhealthy system', () => {
            const system = aggregateHealth([makeReport('test', 'unhealthy')]);
            expect(isSystemOperational(system)).toBe(false);
        });
    });
});
