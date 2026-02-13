/**
 * Telemetry Plugin for ObjectOS
 *
 * Provides OpenTelemetry-compatible distributed tracing with:
 * - Automatic HTTP request instrumentation
 * - Data operation span creation
 * - Plugin lifecycle tracing
 * - W3C Trace Context propagation
 * - OTLP export (HTTP/console)
 *
 * @example
 * ```typescript
 * const telemetry = new TelemetryPlugin({
 *   serviceName: 'objectos',
 *   exporter: { protocol: 'otlp-http', endpoint: 'http://localhost:4318/v1/traces' },
 * });
 * ```
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  TelemetryConfig,
  SpanContext,
  Span,
  SpanAttributes,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
import {
  SpanManager,
  SpanBuilder,
  NOOP_SPAN_BUILDER,
  extractTraceContext,
  injectTraceContext,
} from './span-manager.js';
import { createExporter } from './exporters.js';

/**
 * Telemetry Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class TelemetryPlugin implements Plugin {
  name = '@objectos/telemetry';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: TelemetryConfig;
  private spanManager!: SpanManager;
  private context?: PluginContext;
  private startedAt?: number;

  constructor(config: TelemetryConfig = {}) {
    this.config = {
      enabled: true,
      serviceName: 'objectos',
      serviceVersion: '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      instrumentHttp: true,
      instrumentData: true,
      instrumentPlugins: true,
      samplingRate: 1.0,
      maxBufferSize: 2048,
      maxAttributes: 128,
      maxEvents: 128,
      ...config,
    };
  }

  /**
   * Initialize plugin — set up span manager and register services
   */
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();

    // Create exporter from config
    const exporter = createExporter(this.config.exporter);
    this.spanManager = new SpanManager(this.config, exporter);

    // Register telemetry service
    context.registerService('telemetry', this);

    // Set up automatic instrumentation
    if (this.config.enabled) {
      if (this.config.instrumentData) {
        await this.setupDataInstrumentation(context);
      }
      if (this.config.instrumentPlugins) {
        await this.setupPluginInstrumentation(context);
      }
    }

    context.logger.info('[Telemetry] Initialized successfully');
    await context.trigger('plugin.initialized', { pluginId: this.name });
  };

  /**
   * Start plugin — register HTTP middleware for request tracing
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[Telemetry] Starting...');

    // Register HTTP tracing middleware
    if (this.config.enabled && this.config.instrumentHttp) {
      try {
        const httpServer = context.getService('http.server') as any;
        const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
        if (rawApp) {
          this.setupHttpInstrumentation(rawApp);
          context.logger.info('[Telemetry] HTTP instrumentation registered');
        }
      } catch (e: any) {
        context.logger.warn(`[Telemetry] Could not register HTTP instrumentation: ${e?.message}`);
      }
    }

    // Register telemetry API routes
    try {
      const httpServer = context.getService('http.server') as any;
      const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
      if (rawApp) {
        // GET /api/v1/telemetry/stats — telemetry statistics
        rawApp.get('/api/v1/telemetry/stats', (c: any) => {
          const stats = this.spanManager.getStats();
          return c.json({
            success: true,
            data: {
              ...stats,
              config: {
                enabled: this.config.enabled,
                serviceName: this.config.serviceName,
                samplingRate: this.config.samplingRate,
                exportProtocol: this.config.exporter?.protocol ?? 'none',
              },
            },
          });
        });

        // GET /api/v1/telemetry/spans — recent buffered spans (dev/debug only)
        rawApp.get('/api/v1/telemetry/spans', (c: any) => {
          const spans = this.spanManager.getBufferedSpans();
          return c.json({ success: true, data: spans });
        });

        context.logger.info('[Telemetry] API routes registered');
      }
    } catch (e: any) {
      context.logger.warn(`[Telemetry] Could not register API routes: ${e?.message}`);
    }

    context.logger.info('[Telemetry] Started successfully');
    await context.trigger('plugin.started', { pluginId: this.name });
  }

  // ─── Public Tracing API ────────────────────────────────────────────────────

  /**
   * Start a new span
   */
  startSpan(name: string, parentContext?: SpanContext): SpanBuilder {
    return this.spanManager.startSpan(name, parentContext);
  }

  /**
   * Execute a function within a traced span
   */
  async trace<T>(
    name: string,
    fn: (span: SpanBuilder) => Promise<T>,
    options?: {
      kind?: 'internal' | 'server' | 'client';
      attributes?: SpanAttributes;
      parentContext?: SpanContext;
    },
  ): Promise<T> {
    if (!this.config.enabled || !this.spanManager.shouldSample()) {
      return fn(NOOP_SPAN_BUILDER);
    }

    const span = this.spanManager.startSpan(name, options?.parentContext);
    if (options?.kind) span.setKind(options.kind);
    if (options?.attributes) span.setAttributes(options.attributes);

    try {
      const result = await fn(span);
      span.end('ok');
      return result;
    } catch (error: any) {
      span.addEvent('exception', {
        'exception.type': error?.constructor?.name || 'Error',
        'exception.message': error?.message || 'Unknown error',
      });
      span.end('error', error?.message);
      throw error;
    }
  }

  /**
   * Extract W3C trace context from carrier (e.g., incoming HTTP headers)
   */
  extractContext(carrier: { traceparent?: string; tracestate?: string }): SpanContext | null {
    return extractTraceContext(carrier);
  }

  /**
   * Inject W3C trace context into carrier (e.g., outgoing HTTP headers)
   */
  injectContext(ctx: SpanContext, carrier: { traceparent?: string; tracestate?: string }): void {
    injectTraceContext(ctx, carrier);
  }

  /**
   * Get telemetry statistics
   */
  getStats(): { created: number; exported: number; dropped: number; buffered: number } {
    return this.spanManager.getStats();
  }

  /**
   * Get buffered spans (for debugging)
   */
  getBufferedSpans(): Span[] {
    return this.spanManager.getBufferedSpans();
  }

  /**
   * Flush pending spans to the exporter
   */
  async flush(): Promise<void> {
    await this.spanManager.flush();
  }

  // ─── Automatic Instrumentation ─────────────────────────────────────────────

  /**
   * Set up HTTP request tracing middleware
   */
  private setupHttpInstrumentation(app: any): void {
    app.use('/api/*', async (c: any, next: any) => {
      if (!this.spanManager.shouldSample()) {
        return next();
      }

      // Extract parent context from incoming headers
      const parentContext = this.extractContext({
        traceparent: c.req.header('traceparent'),
        tracestate: c.req.header('tracestate'),
      });

      const method = c.req.method;
      const path = new URL(c.req.url, 'http://localhost').pathname;
      const span = this.spanManager.startSpan(`${method} ${path}`, parentContext ?? undefined);
      span.setKind('server');
      span.setAttributes({
        'http.method': method,
        'http.url': path,
        'http.scheme': 'http',
        'http.user_agent': c.req.header('user-agent') || '',
        'net.peer.ip': c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '',
      });

      // Inject trace context into response headers
      const ctx = span.getContext();
      c.header('traceparent', `00-${ctx.traceId}-${ctx.spanId}-01`);

      try {
        await next();
        const status = c.res?.status ?? 200;
        span.setAttribute('http.status_code', status);
        span.end(status >= 400 ? 'error' : 'ok');
      } catch (error: any) {
        span.addEvent('exception', {
          'exception.type': error?.constructor?.name || 'Error',
          'exception.message': error?.message || 'Unknown error',
        });
        span.setAttribute('http.status_code', 500);
        span.end('error', error?.message);
        throw error;
      }
    });
  }

  /**
   * Set up data operation tracing via kernel hooks
   */
  private async setupDataInstrumentation(context: PluginContext): Promise<void> {
    const operations = ['Create', 'Update', 'Delete', 'Find'] as const;

    for (const op of operations) {
      const hookName = `data.before${op}`;
      const endHookName = `data.after${op}`;
      const spanMap = new Map<string, SpanBuilder>();

      context.hook(hookName, async (data: any) => {
        if (!this.spanManager.shouldSample()) return;

        const spanKey = `${data.objectName}-${data.userId || 'system'}-${Date.now()}`;
        const span = this.spanManager.startSpan(`data.${op.toLowerCase()}`);
        span.setKind('internal');
        span.setAttributes({
          'db.operation': op.toLowerCase(),
          'db.objectName': data.objectName || 'unknown',
          'objectos.user_id': data.userId || 'system',
        });
        if (data.recordId) {
          span.setAttribute('db.record_id', data.recordId);
        }
        spanMap.set(spanKey, span);

        // Attach span key to data for correlation in afterHook
        data._telemetrySpanKey = spanKey;
      });

      context.hook(endHookName, async (data: any) => {
        const spanKey = data._telemetrySpanKey;
        if (spanKey && spanMap.has(spanKey)) {
          const span = spanMap.get(spanKey)!;
          span.end('ok');
          spanMap.delete(spanKey);
        }
      });
    }

    context.logger.info('[Telemetry] Data operation instrumentation registered');
  }

  /**
   * Set up plugin lifecycle tracing via kernel hooks
   */
  private async setupPluginInstrumentation(context: PluginContext): Promise<void> {
    context.hook('plugin.load.start', async (data: any) => {
      if (!this.spanManager.shouldSample()) return;

      const span = this.spanManager.startSpan(`plugin.load:${data.pluginName || 'unknown'}`);
      span.setKind('internal');
      span.setAttribute('plugin.name', data.pluginName || 'unknown');

      // Store span reference on data for end hook
      data._telemetrySpan = span;
    });

    context.hook('plugin.load.end', async (data: any) => {
      if (data._telemetrySpan) {
        (data._telemetrySpan as SpanBuilder).end('ok');
      }
    });

    context.hook('plugin.enable.start', async (data: any) => {
      if (!this.spanManager.shouldSample()) return;

      const span = this.spanManager.startSpan(`plugin.enable:${data.pluginName || 'unknown'}`);
      span.setKind('internal');
      span.setAttribute('plugin.name', data.pluginName || 'unknown');
      data._telemetrySpan = span;
    });

    context.hook('plugin.enable.end', async (data: any) => {
      if (data._telemetrySpan) {
        (data._telemetrySpan as SpanBuilder).end('ok');
      }
    });

    context.logger.info('[Telemetry] Plugin lifecycle instrumentation registered');
  }

  // ─── Kernel Compliance ─────────────────────────────────────────────────────

  /**
   * Health check
   */
  async healthCheck(): Promise<PluginHealthReport> {
    const start = performance.now();
    const stats = this.spanManager.getStats();
    const responseTime = performance.now() - start;
    const status = this.config.enabled ? 'healthy' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      message: `${stats.created} spans created, ${stats.exported} exported, ${stats.buffered} buffered`,
      metrics: {
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        responseTime,
      },
      checks: [
        {
          name: 'telemetry-pipeline',
          status: status === 'healthy' ? 'passed' : 'warning',
          message: `Exporter: ${this.config.exporter?.protocol ?? 'none'}`,
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
        provides: [
          {
            id: 'com.objectstack.service.telemetry',
            name: 'telemetry',
            version: { major: 0, minor: 1, patch: 0 },
            methods: [
              { name: 'startSpan', description: 'Start a new trace span', async: false },
              { name: 'trace', description: 'Execute function within a traced span', async: true },
              { name: 'extractContext', description: 'Extract W3C trace context', async: false },
              { name: 'injectContext', description: 'Inject W3C trace context', async: false },
              { name: 'getStats', description: 'Get telemetry statistics', async: false },
              { name: 'flush', description: 'Flush pending spans', async: true },
            ],
            stability: 'stable',
          },
        ],
        requires: [],
      },
      security: {
        pluginId: 'telemetry',
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
    return {
      plugin: { name: this.name, version: this.version },
      success: !!this.context,
      duration: 0,
    };
  }

  /**
   * Cleanup and shutdown
   */
  async destroy(): Promise<void> {
    await this.spanManager.shutdown();
    if (this.context) {
      await this.context.trigger('plugin.destroyed', { pluginId: this.name });
    }
    this.context?.logger.info('[Telemetry] Destroyed');
  }
}

/**
 * Helper function to access the telemetry API from kernel
 */
export function getTelemetryAPI(kernel: any): TelemetryPlugin | null {
  try {
    return kernel.getService('telemetry');
  } catch {
    return null;
  }
}
