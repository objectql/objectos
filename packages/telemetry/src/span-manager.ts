/**
 * Span Manager
 *
 * Core tracing logic — creates, manages, and exports spans.
 * Implements W3C Trace Context for distributed trace propagation.
 */

import type {
    Span,
    SpanContext,
    SpanAttributes,
    SpanEvent,
    SpanLink,
    SpanKind,
    SpanStatus,
    SpanExporter,
    TraceContextCarrier,
    TelemetryConfig,
} from './types.js';

/**
 * Generate a random hex string of the given byte length
 */
function randomHex(bytes: number): string {
    const array = new Uint8Array(bytes);
    // Use crypto.getRandomValues in browser, or fallback to Math.random
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
        globalThis.crypto.getRandomValues(array);
    } else {
        for (let i = 0; i < bytes; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a new trace ID (32 hex chars = 16 bytes)
 */
export function generateTraceId(): string {
    return randomHex(16);
}

/**
 * Generate a new span ID (16 hex chars = 8 bytes)
 */
export function generateSpanId(): string {
    return randomHex(8);
}

// ─── W3C Trace Context Propagation ─────────────────────────────────────────────

const TRACEPARENT_REGEX = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

/**
 * Parse W3C traceparent header into SpanContext
 */
export function parseTraceparent(header: string): SpanContext | null {
    const match = header.match(TRACEPARENT_REGEX);
    if (!match) return null;

    return {
        traceId: match[1],
        spanId: match[2],
        traceFlags: parseInt(match[3], 16),
    };
}

/**
 * Format SpanContext as W3C traceparent header
 */
export function formatTraceparent(ctx: SpanContext): string {
    return `00-${ctx.traceId}-${ctx.spanId}-${ctx.traceFlags.toString(16).padStart(2, '0')}`;
}

/**
 * Extract trace context from a carrier (e.g., HTTP headers)
 */
export function extractTraceContext(carrier: TraceContextCarrier): SpanContext | null {
    if (!carrier.traceparent) return null;
    return parseTraceparent(carrier.traceparent);
}

/**
 * Inject trace context into a carrier (e.g., HTTP headers)
 */
export function injectTraceContext(ctx: SpanContext, carrier: TraceContextCarrier): void {
    carrier.traceparent = formatTraceparent(ctx);
}

// ─── Active Span Builder ───────────────────────────────────────────────────────

/**
 * Builder for creating spans with a fluent API
 */
export class SpanBuilder {
    private _traceId: string;
    private _spanId: string;
    private _parentSpanId?: string;
    private _name: string;
    private _kind: SpanKind = 'internal';
    private _startTime: number;
    private _attributes: SpanAttributes = {};
    private _events: SpanEvent[] = [];
    private _links: SpanLink[] = [];
    private _resource: SpanAttributes;
    private _onEnd: (span: Span) => void;

    constructor(
        name: string,
        resource: SpanAttributes,
        onEnd: (span: Span) => void,
        parentContext?: SpanContext,
    ) {
        this._name = name;
        this._resource = resource;
        this._onEnd = onEnd;
        this._startTime = Date.now();
        this._spanId = generateSpanId();

        if (parentContext) {
            this._traceId = parentContext.traceId;
            this._parentSpanId = parentContext.spanId;
        } else {
            this._traceId = generateTraceId();
        }
    }

    /** Set span kind */
    setKind(kind: SpanKind): this {
        this._kind = kind;
        return this;
    }

    /** Set a single attribute */
    setAttribute(key: string, value: string | number | boolean): this {
        this._attributes[key] = value;
        return this;
    }

    /** Set multiple attributes */
    setAttributes(attributes: SpanAttributes): this {
        Object.assign(this._attributes, attributes);
        return this;
    }

    /** Add an event */
    addEvent(name: string, attributes?: SpanAttributes): this {
        this._events.push({ name, timestamp: Date.now(), attributes });
        return this;
    }

    /** Add a link to another span */
    addLink(traceId: string, spanId: string, attributes?: SpanAttributes): this {
        this._links.push({ traceId, spanId, attributes });
        return this;
    }

    /** Get the span context for propagation */
    getContext(): SpanContext {
        return {
            traceId: this._traceId,
            spanId: this._spanId,
            traceFlags: 1, // sampled
        };
    }

    /** End the span with success status */
    end(status: SpanStatus = 'ok', statusMessage?: string): Span {
        const endTime = Date.now();
        const span: Span = {
            traceId: this._traceId,
            spanId: this._spanId,
            parentSpanId: this._parentSpanId,
            name: this._name,
            kind: this._kind,
            startTime: this._startTime,
            endTime,
            duration: endTime - this._startTime,
            status,
            statusMessage,
            attributes: this._attributes,
            events: this._events,
            links: this._links,
            resource: this._resource,
        };

        this._onEnd(span);
        return span;
    }
}

// ─── No-op Span Builder ────────────────────────────────────────────────────────

const NOOP_SPAN: Span = {
    traceId: '0'.repeat(32),
    spanId: '0'.repeat(16),
    name: 'noop',
    kind: 'internal',
    startTime: 0,
    endTime: 0,
    duration: 0,
    status: 'unset',
    attributes: {},
    events: [],
    links: [],
    resource: {},
};

/**
 * No-op SpanBuilder — all methods are safe to call but do nothing.
 * Used when sampling is disabled to avoid null-checks in caller code.
 */
export class NoopSpanBuilder extends SpanBuilder {
    constructor() {
        super('noop', {}, () => {});
    }

    override setKind(): this { return this; }
    override setAttribute(): this { return this; }
    override setAttributes(): this { return this; }
    override addEvent(): this { return this; }
    override addLink(): this { return this; }
    override getContext(): SpanContext { return { traceId: '0'.repeat(32), spanId: '0'.repeat(16), traceFlags: 0 }; }
    override end(): Span { return NOOP_SPAN; }
}

/** Singleton no-op span builder */
export const NOOP_SPAN_BUILDER = new NoopSpanBuilder();

// ─── Span Manager ──────────────────────────────────────────────────────────────

/**
 * SpanManager — orchestrates span creation, buffering, and export
 */
export class SpanManager {
    private buffer: Span[] = [];
    private exporter?: SpanExporter;
    private resource: SpanAttributes;
    private config: Required<Pick<TelemetryConfig, 'samplingRate' | 'maxBufferSize' | 'maxAttributes' | 'maxEvents'>> & { batchSize: number };
    private exportTimer?: ReturnType<typeof setInterval>;
    private totalSpansCreated = 0;
    private totalSpansExported = 0;
    private totalSpansDropped = 0;

    constructor(config: TelemetryConfig, exporter?: SpanExporter) {
        this.exporter = exporter;
        this.config = {
            samplingRate: config.samplingRate ?? 1.0,
            maxBufferSize: config.maxBufferSize ?? 2048,
            maxAttributes: config.maxAttributes ?? 128,
            maxEvents: config.maxEvents ?? 128,
            batchSize: config.exporter?.batchSize ?? 512,
        };

        this.resource = {
            'service.name': config.serviceName ?? 'objectos',
            'service.version': config.serviceVersion ?? '0.1.0',
            'deployment.environment': config.environment ?? 'development',
            ...config.resourceAttributes,
        };

        // Start periodic export
        const interval = config.exporter?.exportIntervalMs ?? 5000;
        if (exporter && interval > 0) {
            this.exportTimer = setInterval(() => {
                this.flush().catch(() => { /* swallow export errors */ });
            }, interval);
        }
    }

    /**
     * Whether to sample this trace (probabilistic)
     */
    shouldSample(): boolean {
        if (this.config.samplingRate >= 1.0) return true;
        if (this.config.samplingRate <= 0.0) return false;
        return Math.random() < this.config.samplingRate;
    }

    /**
     * Start a new span
     */
    startSpan(name: string, parentContext?: SpanContext): SpanBuilder {
        return new SpanBuilder(name, this.resource, (span) => this.onSpanEnd(span), parentContext);
    }

    /**
     * Record a completed span
     */
    private onSpanEnd(span: Span): void {
        this.totalSpansCreated++;

        // Enforce attribute limits
        const attrKeys = Object.keys(span.attributes);
        if (attrKeys.length > this.config.maxAttributes) {
            const trimmed: SpanAttributes = {};
            for (let i = 0; i < this.config.maxAttributes; i++) {
                trimmed[attrKeys[i]] = span.attributes[attrKeys[i]];
            }
            span.attributes = trimmed;
        }

        // Enforce event limits
        if (span.events.length > this.config.maxEvents) {
            span.events = span.events.slice(0, this.config.maxEvents);
        }

        // Buffer the span
        if (this.buffer.length >= this.config.maxBufferSize) {
            this.totalSpansDropped++;
            this.buffer.shift(); // drop oldest
        }
        this.buffer.push(span);

        // Auto-flush when batch size is reached
        if (this.buffer.length >= this.config.batchSize && this.exporter) {
            this.flush().catch(() => { /* swallow */ });
        }
    }

    /**
     * Flush buffered spans to the exporter
     */
    async flush(): Promise<void> {
        if (!this.exporter || this.buffer.length === 0) return;

        const batch = this.buffer.splice(0);
        try {
            await this.exporter.export(batch);
            this.totalSpansExported += batch.length;
        } catch {
            // Put them back on error (up to buffer limit)
            this.buffer.unshift(...batch.slice(0, this.config.maxBufferSize - this.buffer.length));
        }
    }

    /**
     * Get all buffered spans (for testing/debugging)
     */
    getBufferedSpans(): Span[] {
        return [...this.buffer];
    }

    /**
     * Get telemetry stats
     */
    getStats(): { created: number; exported: number; dropped: number; buffered: number } {
        return {
            created: this.totalSpansCreated,
            exported: this.totalSpansExported,
            dropped: this.totalSpansDropped,
            buffered: this.buffer.length,
        };
    }

    /**
     * Shutdown — flush remaining spans and stop periodic export
     */
    async shutdown(): Promise<void> {
        if (this.exportTimer) {
            clearInterval(this.exportTimer);
            this.exportTimer = undefined;
        }
        await this.flush();
        if (this.exporter) {
            await this.exporter.shutdown();
        }
    }
}
