/**
 * Telemetry Plugin Tests
 *
 * Comprehensive test suite for the OpenTelemetry integration plugin
 */

import { TelemetryPlugin, getTelemetryAPI } from '../src/plugin.js';
import { SpanManager, SpanBuilder, generateTraceId, generateSpanId, parseTraceparent, formatTraceparent, extractTraceContext, injectTraceContext } from '../src/span-manager.js';
import { NoopSpanExporter, ConsoleSpanExporter, createExporter } from '../src/exporters.js';
import type { PluginContext } from '@objectstack/runtime';
import type { Span, SpanContext, TelemetryConfig } from '../src/types.js';

// ─── Mock PluginContext (matches pattern from other ObjectOS packages) ──────────

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

// ─── TelemetryPlugin ───────────────────────────────────────────────────────────

describe('TelemetryPlugin', () => {
    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            const plugin = new TelemetryPlugin();
            const context = createMockContext();

            await plugin.init(context);

            expect(context.registerService).toHaveBeenCalledWith('telemetry', plugin);
            expect(context.logger.info).toHaveBeenCalledWith('[Telemetry] Initialized successfully');
        });

        it('should start successfully', async () => {
            const plugin = new TelemetryPlugin();
            const context = createMockContext();

            await plugin.init(context);
            await plugin.start(context);

            expect(context.logger.info).toHaveBeenCalledWith('[Telemetry] Started successfully');
        });

        it('should destroy cleanly', async () => {
            const plugin = new TelemetryPlugin();
            const context = createMockContext();

            await plugin.init(context);
            await plugin.destroy();

            expect(context.logger.info).toHaveBeenCalledWith('[Telemetry] Destroyed');
        });

        it('should have correct plugin metadata', () => {
            const plugin = new TelemetryPlugin();

            expect(plugin.name).toBe('@objectos/telemetry');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual([]);
        });

        it('should register data hooks when instrumentData is true', async () => {
            const plugin = new TelemetryPlugin({ instrumentData: true, instrumentPlugins: false });
            const context = createMockContext();

            await plugin.init(context);

            // Should register hooks for beforeCreate, afterCreate, beforeUpdate, afterUpdate, etc.
            expect(context.hook).toHaveBeenCalled();
            const hookCalls = (context.hook as jest.Mock).mock.calls.map((c: any) => c[0]);
            expect(hookCalls).toContain('data.beforeCreate');
            expect(hookCalls).toContain('data.afterCreate');
            expect(hookCalls).toContain('data.beforeFind');
            expect(hookCalls).toContain('data.afterFind');
        });

        it('should register plugin lifecycle hooks when instrumentPlugins is true', async () => {
            const plugin = new TelemetryPlugin({ instrumentData: false, instrumentPlugins: true });
            const context = createMockContext();

            await plugin.init(context);

            const hookCalls = (context.hook as jest.Mock).mock.calls.map((c: any) => c[0]);
            expect(hookCalls).toContain('plugin.load.start');
            expect(hookCalls).toContain('plugin.load.end');
            expect(hookCalls).toContain('plugin.enable.start');
            expect(hookCalls).toContain('plugin.enable.end');
        });
    });

    describe('Span Creation', () => {
        it('should create and end a span', async () => {
            const plugin = new TelemetryPlugin({ exporter: { protocol: 'none' } });
            const context = createMockContext();
            await plugin.init(context);

            const span = plugin.startSpan('test-operation');
            span.setAttribute('test.key', 'test-value');
            const completedSpan = span.end('ok');

            expect(completedSpan.name).toBe('test-operation');
            expect(completedSpan.status).toBe('ok');
            expect(completedSpan.attributes['test.key']).toBe('test-value');
            expect(completedSpan.duration).toBeGreaterThanOrEqual(0);
        });

        it('should create child spans with parent context', async () => {
            const plugin = new TelemetryPlugin({ exporter: { protocol: 'none' } });
            const context = createMockContext();
            await plugin.init(context);

            const parent = plugin.startSpan('parent-op');
            const parentCtx = parent.getContext();
            const child = plugin.startSpan('child-op', parentCtx);

            const parentSpan = parent.end('ok');
            const childSpan = child.end('ok');

            expect(childSpan.traceId).toBe(parentSpan.traceId);
            expect(childSpan.parentSpanId).toBe(parentSpan.spanId);
        });

        it('should support the trace() helper for automatic error handling', async () => {
            const plugin = new TelemetryPlugin({ exporter: { protocol: 'none' } });
            const context = createMockContext();
            await plugin.init(context);

            const result = await plugin.trace('compute', async (span) => {
                span.setAttribute('compute.input', 42);
                return 42 * 2;
            });

            expect(result).toBe(84);
            const spans = plugin.getBufferedSpans();
            expect(spans.length).toBeGreaterThanOrEqual(1);
            const lastSpan = spans[spans.length - 1];
            expect(lastSpan.name).toBe('compute');
            expect(lastSpan.status).toBe('ok');
        });

        it('should record error in trace() when function throws', async () => {
            const plugin = new TelemetryPlugin({ exporter: { protocol: 'none' } });
            const context = createMockContext();
            await plugin.init(context);

            await expect(
                plugin.trace('failing-op', async () => {
                    throw new Error('test failure');
                }),
            ).rejects.toThrow('test failure');

            const spans = plugin.getBufferedSpans();
            const lastSpan = spans[spans.length - 1];
            expect(lastSpan.name).toBe('failing-op');
            expect(lastSpan.status).toBe('error');
            expect(lastSpan.statusMessage).toBe('test failure');
            expect(lastSpan.events.some((e) => e.name === 'exception')).toBe(true);
        });
    });

    describe('Health Check', () => {
        it('should return healthy status when enabled', async () => {
            const plugin = new TelemetryPlugin({ enabled: true });
            const context = createMockContext();
            await plugin.init(context);

            const health = await plugin.healthCheck();

            expect(health.status).toBe('healthy');
            expect(health.metrics?.uptime).toBeGreaterThanOrEqual(0);
        });

        it('should return degraded status when disabled', async () => {
            const plugin = new TelemetryPlugin({ enabled: false });
            const context = createMockContext();
            await plugin.init(context);

            const health = await plugin.healthCheck();

            expect(health.status).toBe('degraded');
        });
    });

    describe('Manifest', () => {
        it('should return correct capability manifest', () => {
            const plugin = new TelemetryPlugin();
            const manifest = plugin.getManifest();

            expect(manifest.capabilities.provides![0].name).toBe('telemetry');
            expect(manifest.security.pluginId).toBe('telemetry');
            expect(manifest.security.trustLevel).toBe('trusted');
        });

        it('should return correct startup result', async () => {
            const plugin = new TelemetryPlugin();
            const context = createMockContext();
            await plugin.init(context);

            const result = plugin.getStartupResult();
            expect(result.plugin.name).toBe('@objectos/telemetry');
            expect(result.success).toBe(true);
        });
    });

    describe('Statistics', () => {
        it('should track span creation stats', async () => {
            const plugin = new TelemetryPlugin({ exporter: { protocol: 'none' } });
            const context = createMockContext();
            await plugin.init(context);

            plugin.startSpan('op1').end('ok');
            plugin.startSpan('op2').end('ok');
            plugin.startSpan('op3').end('error');

            const stats = plugin.getStats();
            expect(stats.created).toBe(3);
            expect(stats.buffered).toBe(3);
        });
    });
});

// ─── SpanManager ───────────────────────────────────────────────────────────────

describe('SpanManager', () => {
    it('should create spans and buffer them', () => {
        const config: TelemetryConfig = { serviceName: 'test' };
        const manager = new SpanManager(config);

        const span = manager.startSpan('test-span');
        span.end('ok');

        const buffered = manager.getBufferedSpans();
        expect(buffered.length).toBe(1);
        expect(buffered[0].name).toBe('test-span');
    });

    it('should respect sampling rate', () => {
        const config: TelemetryConfig = { samplingRate: 0.0 };
        const manager = new SpanManager(config);

        expect(manager.shouldSample()).toBe(false);
    });

    it('should always sample at rate 1.0', () => {
        const config: TelemetryConfig = { samplingRate: 1.0 };
        const manager = new SpanManager(config);

        expect(manager.shouldSample()).toBe(true);
    });

    it('should drop oldest spans when buffer is full', () => {
        const config: TelemetryConfig = { maxBufferSize: 3 };
        const manager = new SpanManager(config);

        manager.startSpan('span-1').end('ok');
        manager.startSpan('span-2').end('ok');
        manager.startSpan('span-3').end('ok');
        manager.startSpan('span-4').end('ok');

        const buffered = manager.getBufferedSpans();
        expect(buffered.length).toBe(3);
        expect(buffered[0].name).toBe('span-2');
        expect(buffered[2].name).toBe('span-4');

        const stats = manager.getStats();
        expect(stats.created).toBe(4);
        expect(stats.dropped).toBe(1);
    });

    it('should flush spans to exporter', async () => {
        const exported: Span[] = [];
        const exporter = {
            export: jest.fn(async (spans: Span[]) => { exported.push(...spans); }),
            flush: jest.fn(async () => {}),
            shutdown: jest.fn(async () => {}),
        };

        const config: TelemetryConfig = {
            exporter: { protocol: 'none', exportIntervalMs: 0 },
        };
        const manager = new SpanManager(config, exporter);

        manager.startSpan('span-a').end('ok');
        manager.startSpan('span-b').end('ok');

        await manager.flush();

        expect(exported.length).toBe(2);
        expect(manager.getBufferedSpans().length).toBe(0);
        expect(manager.getStats().exported).toBe(2);
    });

    it('should enforce max attributes per span', () => {
        const config: TelemetryConfig = { maxAttributes: 2 };
        const manager = new SpanManager(config);

        const span = manager.startSpan('limited');
        span.setAttributes({ a: '1', b: '2', c: '3', d: '4' });
        span.end('ok');

        const buffered = manager.getBufferedSpans();
        expect(Object.keys(buffered[0].attributes).length).toBeLessThanOrEqual(2);
    });

    it('should shutdown cleanly', async () => {
        const exporter = {
            export: jest.fn(async () => {}),
            flush: jest.fn(async () => {}),
            shutdown: jest.fn(async () => {}),
        };

        const config: TelemetryConfig = {
            exporter: { protocol: 'none', exportIntervalMs: 0 },
        };
        const manager = new SpanManager(config, exporter);
        manager.startSpan('pending').end('ok');

        await manager.shutdown();

        expect(exporter.export).toHaveBeenCalled();
        expect(exporter.shutdown).toHaveBeenCalled();
    });
});

// ─── W3C Trace Context ─────────────────────────────────────────────────────────

describe('W3C Trace Context', () => {
    describe('generateTraceId', () => {
        it('should generate a 32-character hex string', () => {
            const traceId = generateTraceId();
            expect(traceId).toMatch(/^[0-9a-f]{32}$/);
        });

        it('should generate unique IDs', () => {
            const ids = new Set(Array.from({ length: 100 }, () => generateTraceId()));
            expect(ids.size).toBe(100);
        });
    });

    describe('generateSpanId', () => {
        it('should generate a 16-character hex string', () => {
            const spanId = generateSpanId();
            expect(spanId).toMatch(/^[0-9a-f]{16}$/);
        });
    });

    describe('parseTraceparent', () => {
        it('should parse valid traceparent', () => {
            const ctx = parseTraceparent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
            expect(ctx).not.toBeNull();
            expect(ctx!.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
            expect(ctx!.spanId).toBe('b7ad6b7169203331');
            expect(ctx!.traceFlags).toBe(1);
        });

        it('should return null for invalid traceparent', () => {
            expect(parseTraceparent('invalid')).toBeNull();
            expect(parseTraceparent('')).toBeNull();
            expect(parseTraceparent('00-short-short-01')).toBeNull();
        });
    });

    describe('formatTraceparent', () => {
        it('should format context as traceparent', () => {
            const ctx: SpanContext = {
                traceId: '0af7651916cd43dd8448eb211c80319c',
                spanId: 'b7ad6b7169203331',
                traceFlags: 1,
            };

            expect(formatTraceparent(ctx)).toBe('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
        });
    });

    describe('extractTraceContext / injectTraceContext', () => {
        it('should round-trip trace context through carrier', () => {
            const original: SpanContext = {
                traceId: '0af7651916cd43dd8448eb211c80319c',
                spanId: 'b7ad6b7169203331',
                traceFlags: 1,
            };

            const carrier: { traceparent?: string; tracestate?: string } = {};
            injectTraceContext(original, carrier);

            const extracted = extractTraceContext(carrier);
            expect(extracted).not.toBeNull();
            expect(extracted!.traceId).toBe(original.traceId);
            expect(extracted!.spanId).toBe(original.spanId);
            expect(extracted!.traceFlags).toBe(original.traceFlags);
        });

        it('should return null when carrier has no traceparent', () => {
            expect(extractTraceContext({})).toBeNull();
        });
    });
});

// ─── Exporters ─────────────────────────────────────────────────────────────────

describe('Exporters', () => {
    describe('NoopSpanExporter', () => {
        it('should accept and discard spans', async () => {
            const exporter = new NoopSpanExporter();
            await exporter.export([{} as Span]);
            await exporter.flush();
            await exporter.shutdown();
            // No errors = success
        });
    });

    describe('ConsoleSpanExporter', () => {
        it('should log spans to console', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            const exporter = new ConsoleSpanExporter();

            const span: Span = {
                traceId: 'a'.repeat(32),
                spanId: 'b'.repeat(16),
                name: 'test-span',
                kind: 'server',
                startTime: Date.now() - 100,
                endTime: Date.now(),
                duration: 100,
                status: 'ok',
                attributes: {},
                events: [],
                links: [],
                resource: { 'service.name': 'test' },
            };

            await exporter.export([span]);

            expect(consoleSpy).toHaveBeenCalledTimes(1);
            expect(consoleSpy.mock.calls[0][0]).toContain('test-span');
            expect(consoleSpy.mock.calls[0][0]).toContain('✓');

            consoleSpy.mockRestore();
        });
    });

    describe('createExporter', () => {
        it('should return NoopSpanExporter when no config', () => {
            const exporter = createExporter();
            expect(exporter).toBeInstanceOf(NoopSpanExporter);
        });

        it('should return ConsoleSpanExporter for console protocol', () => {
            const exporter = createExporter({ protocol: 'console' });
            expect(exporter).toBeInstanceOf(ConsoleSpanExporter);
        });

        it('should return NoopSpanExporter for none protocol', () => {
            const exporter = createExporter({ protocol: 'none' });
            expect(exporter).toBeInstanceOf(NoopSpanExporter);
        });
    });
});

// ─── getTelemetryAPI ───────────────────────────────────────────────────────────

describe('getTelemetryAPI', () => {
    it('should return the telemetry service from kernel', () => {
        const mockService = new TelemetryPlugin();
        const kernel = {
            getService: (name: string) => {
                if (name === 'telemetry') return mockService;
                throw new Error('not found');
            },
        };

        expect(getTelemetryAPI(kernel)).toBe(mockService);
    });

    it('should return null when service not found', () => {
        const kernel = {
            getService: () => { throw new Error('not found'); },
        };

        expect(getTelemetryAPI(kernel)).toBeNull();
    });
});
