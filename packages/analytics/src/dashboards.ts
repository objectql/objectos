/**
 * O.4.3 — Dashboard Widget System
 *
 * Manages dashboards with widgets that display analytics data.
 * Widgets reference report definitions or inline aggregation pipelines.
 */

import type { DashboardDefinition, DashboardWidget, AggregationResult } from './types.js';
import { AggregationEngine } from './aggregation.js';
import { ReportManager } from './reports.js';

/**
 * Dashboard Manager — CRUD and execution for dashboards and widgets
 */
export class DashboardManager {
  private dashboards = new Map<string, DashboardDefinition>();
  private engine: AggregationEngine;
  private reportManager: ReportManager;

  constructor(engine: AggregationEngine, reportManager: ReportManager) {
    this.engine = engine;
    this.reportManager = reportManager;
  }

  /**
   * Create a new dashboard
   */
  create(definition: DashboardDefinition): DashboardDefinition {
    if (!definition.id || typeof definition.id !== 'string') {
      throw new Error('Dashboard must have a valid id');
    }
    if (!definition.name || typeof definition.name !== 'string') {
      throw new Error('Dashboard must have a valid name');
    }
    if (this.dashboards.has(definition.id)) {
      throw new Error(`Dashboard "${definition.id}" already exists`);
    }

    const dashboard: DashboardDefinition = {
      ...definition,
      widgets: definition.widgets ?? [],
      createdAt: definition.createdAt || new Date().toISOString(),
    };

    this.dashboards.set(dashboard.id, dashboard);
    return dashboard;
  }

  /**
   * Get a dashboard by ID
   */
  get(dashboardId: string): DashboardDefinition | undefined {
    return this.dashboards.get(dashboardId);
  }

  /**
   * Update a dashboard
   */
  update(dashboardId: string, changes: Partial<DashboardDefinition>): DashboardDefinition {
    const existing = this.dashboards.get(dashboardId);
    if (!existing) {
      throw new Error(`Dashboard "${dashboardId}" not found`);
    }

    const updated: DashboardDefinition = { ...existing, ...changes, id: dashboardId };
    this.dashboards.set(dashboardId, updated);
    return updated;
  }

  /**
   * Delete a dashboard
   */
  delete(dashboardId: string): boolean {
    return this.dashboards.delete(dashboardId);
  }

  /**
   * List dashboards, optionally filtered by user (includes shared)
   */
  list(userId?: string): DashboardDefinition[] {
    const all = Array.from(this.dashboards.values());
    if (!userId) return all;
    return all.filter((d) => d.owner === userId || d.shared);
  }

  /**
   * Add a widget to a dashboard
   */
  addWidget(dashboardId: string, widget: DashboardWidget): DashboardDefinition {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard "${dashboardId}" not found`);
    }

    if (!widget.id || typeof widget.id !== 'string') {
      throw new Error('Widget must have a valid id');
    }
    if (dashboard.widgets.some((w) => w.id === widget.id)) {
      throw new Error(`Widget "${widget.id}" already exists in dashboard`);
    }

    dashboard.widgets.push(widget);
    return dashboard;
  }

  /**
   * Remove a widget from a dashboard
   */
  removeWidget(dashboardId: string, widgetId: string): DashboardDefinition {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard "${dashboardId}" not found`);
    }

    const index = dashboard.widgets.findIndex((w) => w.id === widgetId);
    if (index === -1) {
      throw new Error(`Widget "${widgetId}" not found in dashboard`);
    }

    dashboard.widgets.splice(index, 1);
    return dashboard;
  }

  /**
   * Update a widget in a dashboard
   */
  updateWidget(
    dashboardId: string,
    widgetId: string,
    changes: Partial<DashboardWidget>,
  ): DashboardDefinition {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard "${dashboardId}" not found`);
    }

    const index = dashboard.widgets.findIndex((w) => w.id === widgetId);
    if (index === -1) {
      throw new Error(`Widget "${widgetId}" not found in dashboard`);
    }

    dashboard.widgets[index] = { ...dashboard.widgets[index], ...changes, id: widgetId };
    return dashboard;
  }

  /**
   * Execute a single widget's pipeline
   */
  async executeWidget(
    dashboardId: string,
    widgetId: string,
    broker?: any,
  ): Promise<AggregationResult> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard "${dashboardId}" not found`);
    }

    const widget = dashboard.widgets.find((w) => w.id === widgetId);
    if (!widget) {
      throw new Error(`Widget "${widgetId}" not found in dashboard`);
    }

    // Execute from report or inline pipeline
    if (widget.reportId) {
      const result = await this.reportManager.execute(widget.reportId, undefined, broker);
      return { data: result.data, metadata: result.metadata };
    }

    if (widget.pipeline) {
      return this.engine.execute(widget.pipeline, broker);
    }

    return { data: [], metadata: { executionTime: 0, recordsProcessed: 0, stagesExecuted: 0 } };
  }

  /**
   * Execute all widgets in a dashboard in parallel
   */
  async executeDashboard(
    dashboardId: string,
    broker?: any,
  ): Promise<Record<string, AggregationResult>> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard "${dashboardId}" not found`);
    }

    const results: Record<string, AggregationResult> = {};

    const executions = dashboard.widgets.map(async (widget) => {
      try {
        results[widget.id] = await this.executeWidget(dashboardId, widget.id, broker);
      } catch {
        results[widget.id] = {
          data: [],
          metadata: { executionTime: 0, recordsProcessed: 0, stagesExecuted: 0 },
        };
      }
    });

    await Promise.all(executions);
    return results;
  }
}
