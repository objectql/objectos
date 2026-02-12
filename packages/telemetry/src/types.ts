/**
 * Telemetry Types
 *
 * Type definitions for the OpenTelemetry integration plugin.
 * Provides distributed tracing, span collection, and OTLP export
 * without requiring the full OpenTelemetry SDK as a hard dependency.
 */

// ─── Span & Trace Types ────────────────────────────────────────────────────────

/**
 * Span status — outcome of a traced operation
 */
export type SpanStatus = 'ok' | 'error' | 'unset';

/**
 * Span kind — role of the span in the trace
 */
export type SpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

/**
 * Span attribute value
 */
export type AttributeValue = string | number | boolean | string[] | number[] | boolean[];

/**
 * Span attributes — key-value pairs attached to a span
 */
export type SpanAttributes = Record<string, AttributeValue>;

/**
 * Span event — a timestamped annotation within a span
 */
export interface SpanEvent {
    /** Event name */
    name: string;
    /** Timestamp in milliseconds */
    timestamp: number;
    /** Event attributes */
    attributes?: SpanAttributes;
}

/**
 * Span link — a causal reference to another span
 */
export interface SpanLink {
    /** Trace ID of the linked span */
    traceId: string;
    /** Span ID of the linked span */
    spanId: string;
    /** Link attributes */
    attributes?: SpanAttributes;
}

/**
 * A completed span representing a unit of work
 */
export interface Span {
    /** Globally unique trace ID (32 hex chars) */
    traceId: string;
    /** Unique span ID within the trace (16 hex chars) */
    spanId: string;
    /** Parent span ID (16 hex chars), undefined for root spans */
    parentSpanId?: string;
    /** Human-readable span name (e.g. "POST /api/v1/data/lead") */
    name: string;
    /** Span kind */
    kind: SpanKind;
    /** Start time in milliseconds */
    startTime: number;
    /** End time in milliseconds */
    endTime: number;
    /** Duration in milliseconds */
    duration: number;
    /** Span status */
    status: SpanStatus;
    /** Status message (typically for errors) */
    statusMessage?: string;
    /** Span attributes */
    attributes: SpanAttributes;
    /** Span events (annotations) */
    events: SpanEvent[];
    /** Links to other spans */
    links: SpanLink[];
    /** Resource attributes (service.name, service.version, etc.) */
    resource: SpanAttributes;
}

/**
 * Active span context for propagation
 */
export interface SpanContext {
    /** Trace ID */
    traceId: string;
    /** Span ID */
    spanId: string;
    /** W3C trace flags */
    traceFlags: number;
}

// ─── Trace Context Propagation ─────────────────────────────────────────────────

/**
 * W3C Trace Context carrier for propagation
 */
export interface TraceContextCarrier {
    /** W3C traceparent header value */
    traceparent?: string;
    /** W3C tracestate header value */
    tracestate?: string;
}

// ─── Exporter Types ────────────────────────────────────────────────────────────

/**
 * Supported export protocols
 */
export type ExportProtocol = 'otlp-http' | 'otlp-grpc' | 'console' | 'none';

/**
 * OTLP exporter configuration
 */
export interface OTLPExporterConfig {
    /** Export protocol */
    protocol: ExportProtocol;
    /** OTLP endpoint URL (e.g. "http://localhost:4318/v1/traces") */
    endpoint?: string;
    /** Additional headers for OTLP requests */
    headers?: Record<string, string>;
    /** Export timeout in milliseconds */
    timeoutMs?: number;
    /** Batch size for span export */
    batchSize?: number;
    /** Export interval in milliseconds */
    exportIntervalMs?: number;
}

/**
 * Span exporter interface — implementations send spans to backends
 */
export interface SpanExporter {
    /** Export a batch of spans */
    export(spans: Span[]): Promise<void>;
    /** Flush any pending spans */
    flush(): Promise<void>;
    /** Shutdown the exporter */
    shutdown(): Promise<void>;
}

// ─── Plugin Configuration ──────────────────────────────────────────────────────

/**
 * Telemetry plugin configuration
 */
export interface TelemetryConfig {
    /** Whether telemetry is enabled */
    enabled?: boolean;
    /** Service name for resource attribution */
    serviceName?: string;
    /** Service version */
    serviceVersion?: string;
    /** Deployment environment (production, staging, development) */
    environment?: string;
    /** Exporter configuration */
    exporter?: OTLPExporterConfig;
    /** Whether to instrument HTTP requests */
    instrumentHttp?: boolean;
    /** Whether to instrument data operations */
    instrumentData?: boolean;
    /** Whether to instrument plugin lifecycle */
    instrumentPlugins?: boolean;
    /** Sampling rate (0.0 to 1.0, default 1.0 = 100%) */
    samplingRate?: number;
    /** Maximum number of spans to buffer before export */
    maxBufferSize?: number;
    /** Maximum number of attributes per span */
    maxAttributes?: number;
    /** Maximum number of events per span */
    maxEvents?: number;
    /** Additional resource attributes */
    resourceAttributes?: SpanAttributes;
}

// ─── Kernel Compliance Types (from @objectstack/spec) ──────────────────────────

import type {
    PluginHealthReport as SpecPluginHealthReport,
    PluginCapabilityManifest as SpecPluginCapabilityManifest,
    PluginSecurityManifest as SpecPluginSecurityManifest,
    PluginStartupResult as SpecPluginStartupResult,
} from '@objectstack/spec/kernel';

/** Aggregate health report — from @objectstack/spec */
export type PluginHealthReport = SpecPluginHealthReport;

/** Plugin capability manifest — from @objectstack/spec */
export type PluginCapabilityManifest = SpecPluginCapabilityManifest;

/** Plugin security manifest — from @objectstack/spec */
export type PluginSecurityManifest = SpecPluginSecurityManifest;

/** Plugin startup result — from @objectstack/spec */
export type PluginStartupResult = SpecPluginStartupResult;
