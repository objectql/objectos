/**
 * O.4.2 — Report Definition Format and Manager
 *
 * Manages report definitions with CRUD operations, parameter
 * interpolation, and report execution via the aggregation engine.
 */

import type {
  ReportDefinition,
  ReportResult,
  ReportListOptions,
  AggregationPipeline,
  AggregationStage,
} from './types.js';
import { AggregationEngine } from './aggregation.js';

/**
 * Report Manager — CRUD and execution for report definitions
 */
export class ReportManager {
  private reports = new Map<string, ReportDefinition>();
  private engine: AggregationEngine;

  constructor(engine: AggregationEngine) {
    this.engine = engine;
  }

  /**
   * Create a new report definition
   */
  create(definition: ReportDefinition): ReportDefinition {
    this.validateDefinition(definition);

    if (this.reports.has(definition.id)) {
      throw new Error(`Report "${definition.id}" already exists`);
    }

    const report: ReportDefinition = {
      ...definition,
      createdAt: definition.createdAt || new Date().toISOString(),
    };

    this.reports.set(report.id, report);
    return report;
  }

  /**
   * Get a report definition by ID
   */
  get(reportId: string): ReportDefinition | undefined {
    return this.reports.get(reportId);
  }

  /**
   * Update a report definition
   */
  update(reportId: string, changes: Partial<ReportDefinition>): ReportDefinition {
    const existing = this.reports.get(reportId);
    if (!existing) {
      throw new Error(`Report "${reportId}" not found`);
    }

    const updated: ReportDefinition = { ...existing, ...changes, id: reportId };
    this.validateDefinition(updated);

    this.reports.set(reportId, updated);
    return updated;
  }

  /**
   * Delete a report definition
   */
  delete(reportId: string): boolean {
    return this.reports.delete(reportId);
  }

  /**
   * List reports with optional filtering
   */
  list(options?: ReportListOptions): ReportDefinition[] {
    let results = Array.from(this.reports.values());

    if (options?.objectName) {
      results = results.filter((r) => r.objectName === options.objectName);
    }
    if (options?.createdBy) {
      results = results.filter((r) => r.createdBy === options.createdBy);
    }
    if (options?.format) {
      results = results.filter((r) => r.format === options.format);
    }

    return results;
  }

  /**
   * Execute a report by ID with optional parameter values
   */
  async execute(
    reportId: string,
    parameters?: Record<string, any>,
    broker?: any,
  ): Promise<ReportResult> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error(`Report "${reportId}" not found`);
    }

    // Resolve parameter values
    const resolvedParams = this.resolveParameters(report, parameters);

    // Interpolate parameters into pipeline stages
    const stages = this.interpolateStages(report.stages, resolvedParams);

    const pipeline: AggregationPipeline = {
      objectName: report.objectName,
      stages,
    };

    const result = await this.engine.execute(pipeline, broker);

    return {
      reportId: report.id,
      reportName: report.name,
      data: result.data,
      metadata: result.metadata,
      parameters: resolvedParams,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate a report definition
   */
  validateDefinition(definition: ReportDefinition): void {
    if (!definition.id || typeof definition.id !== 'string') {
      throw new Error('Report must have a valid id');
    }
    if (!definition.name || typeof definition.name !== 'string') {
      throw new Error('Report must have a valid name');
    }
    if (!definition.objectName || typeof definition.objectName !== 'string') {
      throw new Error('Report must specify an objectName');
    }
    if (!Array.isArray(definition.stages) || definition.stages.length === 0) {
      throw new Error('Report must have at least one pipeline stage');
    }
    if (!definition.format || !['table', 'chart', 'summary'].includes(definition.format)) {
      throw new Error('Report format must be "table", "chart", or "summary"');
    }
    if (!definition.createdBy || typeof definition.createdBy !== 'string') {
      throw new Error('Report must specify createdBy');
    }
  }

  /**
   * Resolve parameter values with defaults
   */
  private resolveParameters(
    report: ReportDefinition,
    provided?: Record<string, any>,
  ): Record<string, any> {
    const resolved: Record<string, any> = {};

    if (!report.parameters) return provided ?? {};

    for (const param of report.parameters) {
      if (provided && param.name in provided) {
        resolved[param.name] = provided[param.name];
      } else if (param.defaultValue !== undefined) {
        resolved[param.name] = param.defaultValue;
      } else if (param.required) {
        throw new Error(`Required parameter "${param.name}" is missing`);
      }
    }

    return resolved;
  }

  /**
   * Interpolate $param.xxx references in pipeline stages
   */
  private interpolateStages(
    stages: AggregationStage[],
    params: Record<string, any>,
  ): AggregationStage[] {
    return stages.map((stage) => ({
      type: stage.type,
      body: this.interpolateObject(stage.body, params),
    }));
  }

  /**
   * Recursively interpolate parameter references in an object
   */
  private interpolateObject(
    obj: Record<string, any>,
    params: Record<string, any>,
  ): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.startsWith('$param.')) {
        const paramName = value.slice('$param.'.length);
        result[key] = params[paramName] ?? value;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.interpolateObject(value, params);
      } else if (Array.isArray(value)) {
        result[key] = value.map((item) => {
          if (typeof item === 'string' && item.startsWith('$param.')) {
            return params[item.slice('$param.'.length)] ?? item;
          }
          if (typeof item === 'object' && item !== null) {
            return this.interpolateObject(item, params);
          }
          return item;
        });
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
