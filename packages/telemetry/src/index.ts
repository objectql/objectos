/**
 * @objectos/telemetry
 *
 * OpenTelemetry-compatible distributed tracing for ObjectOS.
 *
 * Features:
 * - W3C Trace Context propagation (traceparent / tracestate)
 * - Automatic HTTP request instrumentation
 * - Data operation span creation (CRUD)
 * - Plugin lifecycle tracing
 * - OTLP HTTP export for Jaeger, Zipkin, Grafana Tempo, etc.
 * - Console exporter for development
 * - Probabilistic sampling
 * - Buffered span export with configurable batch size
 *
 * @example
 * ```typescript
 * import { TelemetryPlugin } from '@objectos/telemetry';
 *
 * const telemetry = new TelemetryPlugin({
 *   serviceName: 'objectos',
 *   environment: 'production',
 *   exporter: {
 *     protocol: 'otlp-http',
 *     endpoint: 'http://localhost:4318/v1/traces',
 *   },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Manual span creation
 * const telemetryAPI = getTelemetryAPI(kernel);
 *
 * await telemetryAPI.trace('process-order', async (span) => {
 *   span.setAttribute('order.id', orderId);
 *   span.addEvent('validation-complete');
 *   await processOrder(orderId);
 * });
 * ```
 */

export {
    TelemetryPlugin,
    getTelemetryAPI,
} from './plugin.js';

export {
    SpanManager,
    SpanBuilder,
    generateTraceId,
    generateSpanId,
    parseTraceparent,
    formatTraceparent,
    extractTraceContext,
    injectTraceContext,
} from './span-manager.js';

export {
    NoopSpanExporter,
    ConsoleSpanExporter,
    OTLPHttpSpanExporter,
    createExporter,
} from './exporters.js';

export type {
    TelemetryConfig,
    Span,
    SpanContext,
    SpanAttributes,
    SpanEvent,
    SpanLink,
    SpanKind,
    SpanStatus,
    SpanExporter,
    TraceContextCarrier,
    OTLPExporterConfig,
    ExportProtocol,
    AttributeValue,
} from './types.js';
