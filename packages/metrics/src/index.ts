/**
 * @objectos/plugin-metrics
 * 
 * System monitoring and metrics collection for ObjectOS with Prometheus support
 * 
 * Features:
 * - Counter, Gauge, and Histogram metrics
 * - Labels support for metric dimensions
 * - Prometheus text format export
 * - Built-in kernel metrics tracking:
 *   - plugin.load.duration (Histogram)
 *   - plugin.enable.duration (Histogram)
 *   - service.calls.total (Counter)
 *   - hook.execution.duration (Histogram)
 * 
 * @example
 * ```typescript
 * import { MetricsPlugin } from '@objectos/plugin-metrics';
 * 
 * // Use default plugin
 * const os = new ObjectOS({
 *   plugins: [new MetricsPlugin()]
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Create with custom configuration
 * const metricsPlugin = new MetricsPlugin({
 *   enabled: true,
 *   prefix: 'objectos_',
 *   defaultLabels: { environment: 'production' },
 *   trackBuiltInMetrics: true,
 *   maxHistogramObservations: 10000
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Use metrics API
 * import { getMetricsAPI } from '@objectos/plugin-metrics';
 * 
 * const metricsAPI = getMetricsAPI(kernel);
 * 
 * // Increment counter
 * metricsAPI.incrementCounter('api.requests.total', 1, {
 *   method: 'POST',
 *   endpoint: '/api/users'
 * });
 * 
 * // Set gauge
 * metricsAPI.setGauge('system.memory.used', process.memoryUsage().heapUsed);
 * 
 * // Record histogram
 * const startTime = Date.now();
 * await doSomething();
 * metricsAPI.recordHistogram('operation.duration', Date.now() - startTime, {
 *   operation: 'data.create'
 * });
 * 
 * // Export Prometheus metrics
 * const prometheusText = metricsAPI.exportPrometheus();
 * console.log(prometheusText);
 * ```
 */

export {
    MetricsPlugin,
    getMetricsAPI,
} from './plugin.js';

export {
    CounterCollector,
    GaugeCollector,
    HistogramCollector,
} from './collectors.js';

export {
    exportPrometheus,
    parsePrometheusLine,
} from './prometheus.js';

export {
    MetricType,
} from './types.js';

export type {
    MetricsConfig,
    Labels,
    Metric,
    CounterMetric,
    GaugeMetric,
    HistogramMetric,
    HistogramObservation,
    Percentiles,
    MetricCollector,
} from './types.js';
