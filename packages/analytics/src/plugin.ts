/**
 * Analytics Plugin for ObjectOS
 *
 * Provides a metadata-driven analytics and reporting engine:
 *
 * - O.4.1: Aggregation pipeline engine (match, group, sort, etc.)
 * - O.4.2: Report definition format and execution
 * - O.4.3: Dashboard widget system
 * - O.4.4: Scheduled report generation
 *
 * The plugin registers HTTP routes under /api/v1/analytics/ and provides
 * an 'analytics' service for programmatic access.
 *
 * @example
 * ```typescript
 * import { AnalyticsPlugin } from '@objectos/analytics';
 *
 * new AnalyticsPlugin({ cacheResults: true, scheduledReportsEnabled: true });
 * ```
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  AnalyticsConfig,
  ResolvedAnalyticsConfig,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
import { AggregationEngine } from './aggregation.js';
import { ReportManager } from './reports.js';
import { DashboardManager } from './dashboards.js';
import { ReportScheduler } from './scheduler.js';

/**
 * Resolve user configuration with defaults
 */
function resolveConfig(config: AnalyticsConfig = {}): ResolvedAnalyticsConfig {
  return {
    maxPipelineStages: config.maxPipelineStages ?? 20,
    maxConcurrentQueries: config.maxConcurrentQueries ?? 10,
    cacheResults: config.cacheResults ?? false,
    cacheTTL: config.cacheTTL ?? 300,
    scheduledReportsEnabled: config.scheduledReportsEnabled ?? true,
  };
}

/**
 * Analytics Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class AnalyticsPlugin implements Plugin {
  name = '@objectos/analytics';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: ResolvedAnalyticsConfig;
  private context?: PluginContext;
  private startedAt?: number;
  private requestCount = 0;
  private errorCount = 0;

  /** Aggregation engine */
  private engine: AggregationEngine;
  /** Report manager */
  private reportManager: ReportManager;
  /** Dashboard manager */
  private dashboardManager: DashboardManager;
  /** Report scheduler */
  private scheduler: ReportScheduler;

  constructor(config: AnalyticsConfig = {}) {
    this.config = resolveConfig(config);
    this.engine = new AggregationEngine(this.config.maxPipelineStages);
    this.reportManager = new ReportManager(this.engine);
    this.dashboardManager = new DashboardManager(this.engine, this.reportManager);
    this.scheduler = new ReportScheduler(this.reportManager);
  }

  /**
   * Initialize plugin — register 'analytics' service
   */
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();

    // Register analytics service
    context.registerService('analytics', this);

    context.logger.info('[Analytics] Initialized successfully');
    await context.trigger('plugin.initialized', { pluginId: this.name });
  };

  /**
   * Start plugin — register HTTP routes for analytics API
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[Analytics] Starting...');

    // Register HTTP routes
    const httpServer = context.getService('http.server') as any;
    const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;

    if (rawApp) {
      this.registerRoutes(rawApp, context);
      context.logger.info('[Analytics] Routes registered at /api/v1/analytics');
    } else {
      context.logger.warn('[Analytics] HTTP server not available — routes not registered');
    }

    context.logger.info('[Analytics] Started successfully');
    await context.trigger('plugin.started', { pluginId: this.name });
  }

  /**
   * Stop plugin — cleanup
   */
  async stop(): Promise<void> {
    this.context?.logger.info('[Analytics] Stopped');
  }

  // ─── HTTP Route Registration ────────────────────────────────────

  private registerRoutes(app: any, context: PluginContext): void {
    const basePath = '/api/v1/analytics';
    const broker = (context as any).broker;

    // POST /api/v1/analytics/aggregate — execute aggregation pipeline
    app.post(`${basePath}/aggregate`, async (c: any) => {
      this.requestCount++;
      try {
        const body = await c.req.json();
        const result = await this.engine.execute(body, broker);
        return c.json(result);
      } catch (error: any) {
        this.errorCount++;
        const status = error.message.includes('must') ? 400 : 500;
        return c.json({ error: error.message }, status);
      }
    });

    // POST /api/v1/analytics/reports — create a report
    app.post(`${basePath}/reports`, async (c: any) => {
      this.requestCount++;
      try {
        const body = await c.req.json();
        const report = this.reportManager.create(body);
        return c.json(report, 201);
      } catch (error: any) {
        this.errorCount++;
        const status = error.message.includes('already exists') ? 409 : 400;
        return c.json({ error: error.message }, status);
      }
    });

    // GET /api/v1/analytics/reports — list reports
    app.get(`${basePath}/reports`, async (c: any) => {
      this.requestCount++;
      try {
        const url = new URL(c.req.url, 'http://localhost');
        const objectName = url.searchParams.get('objectName') ?? undefined;
        const createdBy = url.searchParams.get('createdBy') ?? undefined;
        const reports = this.reportManager.list({ objectName, createdBy });
        return c.json({ reports, total: reports.length });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/analytics/reports/:id — get report
    app.get(`${basePath}/reports/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const report = this.reportManager.get(id);
        if (!report) {
          return c.json({ error: `Report "${id}" not found` }, 404);
        }
        return c.json(report);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // POST /api/v1/analytics/reports/:id/execute — execute a report
    app.post(`${basePath}/reports/:id/execute`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const body = await c.req.json().catch(() => ({}));
        const result = await this.reportManager.execute(id, body.parameters, broker);
        return c.json(result);
      } catch (error: any) {
        this.errorCount++;
        const status = error.message.includes('not found') ? 404 : 500;
        return c.json({ error: error.message }, status);
      }
    });

    // DELETE /api/v1/analytics/reports/:id — delete a report
    app.delete(`${basePath}/reports/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const deleted = this.reportManager.delete(id);
        if (!deleted) {
          return c.json({ error: `Report "${id}" not found` }, 404);
        }
        return c.json({ success: true, id });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // POST /api/v1/analytics/dashboards — create dashboard
    app.post(`${basePath}/dashboards`, async (c: any) => {
      this.requestCount++;
      try {
        const body = await c.req.json();
        const dashboard = this.dashboardManager.create(body);
        return c.json(dashboard, 201);
      } catch (error: any) {
        this.errorCount++;
        const status = error.message.includes('already exists') ? 409 : 400;
        return c.json({ error: error.message }, status);
      }
    });

    // GET /api/v1/analytics/dashboards — list dashboards
    app.get(`${basePath}/dashboards`, async (c: any) => {
      this.requestCount++;
      try {
        const url = new URL(c.req.url, 'http://localhost');
        const userId = url.searchParams.get('userId') ?? undefined;
        const dashboards = this.dashboardManager.list(userId);
        return c.json({ dashboards, total: dashboards.length });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/analytics/dashboards/:id — get dashboard
    app.get(`${basePath}/dashboards/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const dashboard = this.dashboardManager.get(id);
        if (!dashboard) {
          return c.json({ error: `Dashboard "${id}" not found` }, 404);
        }
        return c.json(dashboard);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // POST /api/v1/analytics/dashboards/:id/execute — execute all widgets
    app.post(`${basePath}/dashboards/:id/execute`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const results = await this.dashboardManager.executeDashboard(id, broker);
        return c.json({ dashboardId: id, widgets: results });
      } catch (error: any) {
        this.errorCount++;
        const status = error.message.includes('not found') ? 404 : 500;
        return c.json({ error: error.message }, status);
      }
    });

    // DELETE /api/v1/analytics/dashboards/:id — delete dashboard
    app.delete(`${basePath}/dashboards/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const deleted = this.dashboardManager.delete(id);
        if (!deleted) {
          return c.json({ error: `Dashboard "${id}" not found` }, 404);
        }
        return c.json({ success: true, id });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // POST /api/v1/analytics/schedules — create scheduled report
    app.post(`${basePath}/schedules`, async (c: any) => {
      this.requestCount++;
      try {
        const body = await c.req.json();
        const schedule = this.scheduler.schedule(body);
        return c.json(schedule, 201);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 400);
      }
    });

    // GET /api/v1/analytics/schedules — list schedules
    app.get(`${basePath}/schedules`, async (c: any) => {
      this.requestCount++;
      try {
        const schedules = this.scheduler.listSchedules();
        return c.json({ schedules, total: schedules.length });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // DELETE /api/v1/analytics/schedules/:id — delete schedule
    app.delete(`${basePath}/schedules/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const deleted = this.scheduler.unschedule(id);
        if (!deleted) {
          return c.json({ error: `Schedule "${id}" not found` }, 404);
        }
        return c.json({ success: true, id });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });
  }

  // ─── Service API ────────────────────────────────────────────────

  /** Get the aggregation engine instance */
  getEngine(): AggregationEngine {
    return this.engine;
  }

  /** Get the report manager instance */
  getReportManager(): ReportManager {
    return this.reportManager;
  }

  /** Get the dashboard manager instance */
  getDashboardManager(): DashboardManager {
    return this.dashboardManager;
  }

  /** Get the report scheduler instance */
  getScheduler(): ReportScheduler {
    return this.scheduler;
  }

  // ─── Lifecycle Inspection ───────────────────────────────────────

  /**
   * Health check
   */
  getHealthReport(): PluginHealthReport {
    return {
      status: 'healthy',
      message: `Analytics operational (${this.requestCount} requests)`,
      details: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        config: this.config,
      },
    };
  }

  /**
   * Capability manifest
   */
  getCapabilities(): PluginCapabilityManifest {
    return {
      id: this.name,
      provides: [
        'analytics',
        'analytics.aggregation',
        'analytics.reports',
        'analytics.dashboards',
        'analytics.scheduler',
      ],
      consumes: ['http.server', 'data', 'notification'],
    };
  }

  /**
   * Security manifest
   */
  getSecurityManifest(): PluginSecurityManifest {
    return {
      permissions: [
        'analytics.aggregate',
        'analytics.reports.create',
        'analytics.reports.read',
        'analytics.reports.execute',
        'analytics.reports.delete',
        'analytics.dashboards.create',
        'analytics.dashboards.read',
        'analytics.dashboards.execute',
        'analytics.dashboards.delete',
        'analytics.schedules.create',
        'analytics.schedules.read',
        'analytics.schedules.delete',
      ],
      dataAccess: ['read'],
    };
  }

  /**
   * Startup result
   */
  getStartupResult(): PluginStartupResult {
    return {
      success: true,
      message: 'Analytics plugin started',
    };
  }
}
