/**
 * Span Exporters
 *
 * Implementations of SpanExporter for different backends:
 * - ConsoleSpanExporter — logs spans to the console (development)
 * - OTLPHttpSpanExporter — sends spans to an OTLP-compatible endpoint
 * - NoopSpanExporter — discards spans (for disabled telemetry)
 */

import type { Span, SpanExporter, OTLPExporterConfig } from './types.js';

// ─── Noop Exporter ─────────────────────────────────────────────────────────────

/**
 * No-op exporter that discards all spans
 */
export class NoopSpanExporter implements SpanExporter {
    async export(_spans: Span[]): Promise<void> {
        // intentionally empty
    }

    async flush(): Promise<void> {
        // intentionally empty
    }

    async shutdown(): Promise<void> {
        // intentionally empty
    }
}

// ─── Console Exporter ──────────────────────────────────────────────────────────

/**
 * Console exporter — writes spans to stdout for development and debugging
 */
export class ConsoleSpanExporter implements SpanExporter {
    async export(spans: Span[]): Promise<void> {
        for (const span of spans) {
            const statusIcon = span.status === 'ok' ? '✓' : span.status === 'error' ? '✗' : '?';
            console.log(
                `[TRACE] ${statusIcon} ${span.name} ` +
                `(${span.duration}ms) ` +
                `[${span.traceId.slice(0, 8)}…/${span.spanId.slice(0, 8)}…]` +
                (span.parentSpanId ? ` parent=${span.parentSpanId.slice(0, 8)}…` : ' ROOT'),
            );
        }
    }

    async flush(): Promise<void> {
        // Console output is immediate
    }

    async shutdown(): Promise<void> {
        // Nothing to clean up
    }
}

// ─── OTLP HTTP Exporter ────────────────────────────────────────────────────────

/**
 * Convert spans to OTLP JSON format (Trace v1)
 */
function toOTLPPayload(spans: Span[]): object {
    // Group spans by resource
    const resourceMap = new Map<string, Span[]>();
    for (const span of spans) {
        const key = JSON.stringify(span.resource);
        if (!resourceMap.has(key)) {
            resourceMap.set(key, []);
        }
        resourceMap.get(key)!.push(span);
    }

    const resourceSpans = [];
    for (const [, group] of resourceMap) {
        const resource = group[0].resource;
        resourceSpans.push({
            resource: {
                attributes: Object.entries(resource).map(([key, value]) => ({
                    key,
                    value: { stringValue: String(value) },
                })),
            },
            scopeSpans: [
                {
                    scope: { name: '@objectos/telemetry', version: '0.1.0' },
                    spans: group.map((span) => ({
                        traceId: span.traceId,
                        spanId: span.spanId,
                        parentSpanId: span.parentSpanId || '',
                        name: span.name,
                        kind: spanKindToOTLP(span.kind),
                        startTimeUnixNano: String(span.startTime * 1_000_000),
                        endTimeUnixNano: String(span.endTime * 1_000_000),
                        attributes: Object.entries(span.attributes).map(([key, value]) => ({
                            key,
                            value: attributeToOTLP(value),
                        })),
                        events: span.events.map((e) => ({
                            name: e.name,
                            timeUnixNano: String(e.timestamp * 1_000_000),
                            attributes: e.attributes
                                ? Object.entries(e.attributes).map(([key, value]) => ({
                                      key,
                                      value: attributeToOTLP(value),
                                  }))
                                : [],
                        })),
                        links: span.links.map((l) => ({
                            traceId: l.traceId,
                            spanId: l.spanId,
                            attributes: l.attributes
                                ? Object.entries(l.attributes).map(([key, value]) => ({
                                      key,
                                      value: attributeToOTLP(value),
                                  }))
                                : [],
                        })),
                        status: {
                            code: span.status === 'ok' ? 1 : span.status === 'error' ? 2 : 0,
                            message: span.statusMessage || '',
                        },
                    })),
                },
            ],
        });
    }

    return { resourceSpans };
}

function spanKindToOTLP(kind: string): number {
    switch (kind) {
        case 'internal': return 1;
        case 'server': return 2;
        case 'client': return 3;
        case 'producer': return 4;
        case 'consumer': return 5;
        default: return 0;
    }
}

function attributeToOTLP(value: string | number | boolean | string[] | number[] | boolean[]): object {
    if (typeof value === 'string') return { stringValue: value };
    if (typeof value === 'number') {
        return Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value };
    }
    if (typeof value === 'boolean') return { boolValue: value };
    if (Array.isArray(value)) {
        return {
            arrayValue: {
                values: value.map((v) => attributeToOTLP(v as string | number | boolean)),
            },
        };
    }
    return { stringValue: String(value) };
}

/**
 * OTLP HTTP span exporter — sends spans to an OTLP-compatible collector via HTTP
 */
export class OTLPHttpSpanExporter implements SpanExporter {
    private endpoint: string;
    private headers: Record<string, string>;
    private timeoutMs: number;

    constructor(config: OTLPExporterConfig) {
        this.endpoint = config.endpoint || 'http://localhost:4318/v1/traces';
        this.headers = config.headers || {};
        this.timeoutMs = config.timeoutMs || 10_000;
    }

    async export(spans: Span[]): Promise<void> {
        if (spans.length === 0) return;

        const payload = toOTLPPayload(spans);
        const body = JSON.stringify(payload);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.headers,
                },
                body,
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`OTLP export failed: ${response.status} ${response.statusText}`);
            }
        } finally {
            clearTimeout(timeout);
        }
    }

    async flush(): Promise<void> {
        // HTTP exports are immediate per batch
    }

    async shutdown(): Promise<void> {
        // Flush is handled by SpanManager
    }
}

// ─── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a span exporter from configuration
 */
export function createExporter(config?: OTLPExporterConfig): SpanExporter {
    if (!config) return new NoopSpanExporter();

    switch (config.protocol) {
        case 'console':
            return new ConsoleSpanExporter();
        case 'otlp-http':
            return new OTLPHttpSpanExporter(config);
        case 'none':
            return new NoopSpanExporter();
        default:
            return new NoopSpanExporter();
    }
}
