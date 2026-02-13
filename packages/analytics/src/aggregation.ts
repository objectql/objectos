/**
 * O.4.1 — Aggregation Pipeline Engine
 *
 * In-memory aggregation engine that processes data through a sequence
 * of pipeline stages (match, group, sort, limit, skip, project,
 * unwind, lookup, addFields, count).
 */

import type {
  AggregationPipeline,
  AggregationResult,
  AggregationStage,
  AggregationStageType,
} from './types.js';

const VALID_STAGE_TYPES: AggregationStageType[] = [
  'match',
  'group',
  'sort',
  'limit',
  'skip',
  'project',
  'unwind',
  'lookup',
  'addFields',
  'count',
];

/**
 * Aggregation Engine — executes pipelines against in-memory data
 */
export class AggregationEngine {
  private maxStages: number;

  constructor(maxStages = 20) {
    this.maxStages = maxStages;
  }

  /**
   * Execute an aggregation pipeline
   */
  async execute(pipeline: AggregationPipeline, broker?: any): Promise<AggregationResult> {
    this.validatePipeline(pipeline);

    const startTime = Date.now();

    // Fetch initial data from broker
    let data: Record<string, any>[] = [];
    if (broker) {
      try {
        const result = await broker.call('data.find', { objectName: pipeline.objectName });
        data = Array.isArray(result) ? result : (result?.data ?? []);
      } catch {
        data = [];
      }
    }

    const recordsProcessed = data.length;
    let stagesExecuted = 0;

    // Apply each stage sequentially
    for (const stage of pipeline.stages) {
      data = this.applyStage(stage, data);
      stagesExecuted++;
    }

    return {
      data,
      metadata: {
        executionTime: Date.now() - startTime,
        recordsProcessed,
        stagesExecuted,
      },
    };
  }

  /**
   * Validate a pipeline definition
   */
  validatePipeline(pipeline: AggregationPipeline): void {
    if (!pipeline.objectName || typeof pipeline.objectName !== 'string') {
      throw new Error('Pipeline must specify a valid objectName');
    }

    if (!Array.isArray(pipeline.stages) || pipeline.stages.length === 0) {
      throw new Error('Pipeline must have at least one stage');
    }

    if (pipeline.stages.length > this.maxStages) {
      throw new Error(`Pipeline exceeds maximum of ${this.maxStages} stages`);
    }

    for (let i = 0; i < pipeline.stages.length; i++) {
      const stage = pipeline.stages[i];
      if (!stage.type || !VALID_STAGE_TYPES.includes(stage.type)) {
        throw new Error(`Invalid stage type "${stage.type}" at index ${i}`);
      }
      if (!stage.body || typeof stage.body !== 'object') {
        throw new Error(`Stage at index ${i} must have a body object`);
      }
    }
  }

  /**
   * Apply a single stage to the data
   */
  private applyStage(stage: AggregationStage, data: Record<string, any>[]): Record<string, any>[] {
    switch (stage.type) {
      case 'match':
        return this.applyMatch(stage.body, data);
      case 'group':
        return this.applyGroup(stage.body, data);
      case 'sort':
        return this.applySort(stage.body, data);
      case 'limit':
        return this.applyLimit(stage.body, data);
      case 'skip':
        return this.applySkip(stage.body, data);
      case 'project':
        return this.applyProject(stage.body, data);
      case 'unwind':
        return this.applyUnwind(stage.body, data);
      case 'lookup':
        return this.applyLookup(stage.body, data);
      case 'addFields':
        return this.applyAddFields(stage.body, data);
      case 'count':
        return this.applyCount(stage.body, data);
      default:
        return data;
    }
  }

  /**
   * Match — filter records matching all conditions
   */
  private applyMatch(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    return data.filter((record) => {
      for (const [key, value] of Object.entries(body)) {
        const recordValue = this.getNestedValue(record, key);
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Operator-based matching
          for (const [op, opVal] of Object.entries(value)) {
            switch (op) {
              case '$gt':
                if (!(recordValue > (opVal as any))) return false;
                break;
              case '$gte':
                if (!(recordValue >= (opVal as any))) return false;
                break;
              case '$lt':
                if (!(recordValue < (opVal as any))) return false;
                break;
              case '$lte':
                if (!(recordValue <= (opVal as any))) return false;
                break;
              case '$ne':
                if (recordValue === opVal) return false;
                break;
              case '$in':
                if (!Array.isArray(opVal) || !opVal.includes(recordValue)) return false;
                break;
              default:
                if (recordValue !== value) return false;
            }
          }
        } else {
          if (recordValue !== value) return false;
        }
      }
      return true;
    });
  }

  /**
   * Group — group records by a field and compute aggregations
   *
   * body: { _id: 'fieldName', fieldAlias: { $sum: 'fieldName' }, ... }
   */
  private applyGroup(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    const groupField = body._id;
    const groups = new Map<any, Record<string, any>[]>();

    for (const record of data) {
      const key = groupField ? this.getNestedValue(record, groupField) : '__all__';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(record);
    }

    const results: Record<string, any>[] = [];
    for (const [key, records] of groups) {
      const row: Record<string, any> = { _id: key === '__all__' ? null : key };

      for (const [alias, expr] of Object.entries(body)) {
        if (alias === '_id') continue;

        if (typeof expr === 'object' && expr !== null) {
          const [op, field] = Object.entries(expr)[0] as [string, any];
          switch (op) {
            case '$sum': {
              if (typeof field === 'number') {
                row[alias] = records.length * field;
              } else {
                row[alias] = records.reduce(
                  (sum, r) => sum + (Number(this.getNestedValue(r, field)) || 0),
                  0,
                );
              }
              break;
            }
            case '$avg': {
              const vals = records.map((r) => Number(this.getNestedValue(r, field)) || 0);
              row[alias] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
              break;
            }
            case '$min': {
              const vals = records
                .map((r) => this.getNestedValue(r, field))
                .filter((v) => v != null);
              row[alias] = vals.length > 0 ? Math.min(...vals.map(Number)) : null;
              break;
            }
            case '$max': {
              const vals = records
                .map((r) => this.getNestedValue(r, field))
                .filter((v) => v != null);
              row[alias] = vals.length > 0 ? Math.max(...vals.map(Number)) : null;
              break;
            }
            case '$count': {
              row[alias] = records.length;
              break;
            }
            default:
              row[alias] = null;
          }
        }
      }

      results.push(row);
    }

    return results;
  }

  /**
   * Sort — sort records by field(s)
   *
   * body: { fieldName: 1 (asc) | -1 (desc) }
   */
  private applySort(body: Record<string, any>, data: Record<string, any>[]): Record<string, any>[] {
    const entries = Object.entries(body);
    return [...data].sort((a, b) => {
      for (const [field, direction] of entries) {
        const aVal = this.getNestedValue(a, field);
        const bVal = this.getNestedValue(b, field);
        const dir = direction === -1 ? -1 : 1;

        if (aVal < bVal) return -1 * dir;
        if (aVal > bVal) return 1 * dir;
      }
      return 0;
    });
  }

  /**
   * Limit — return at most N records
   */
  private applyLimit(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    const n =
      typeof body.n === 'number'
        ? body.n
        : typeof body.limit === 'number'
          ? body.limit
          : data.length;
    return data.slice(0, n);
  }

  /**
   * Skip — skip first N records
   */
  private applySkip(body: Record<string, any>, data: Record<string, any>[]): Record<string, any>[] {
    const n = typeof body.n === 'number' ? body.n : typeof body.skip === 'number' ? body.skip : 0;
    return data.slice(n);
  }

  /**
   * Project — select/rename fields
   *
   * body: { fieldName: 1 (include) | 0 (exclude) | 'newName' (rename) }
   */
  private applyProject(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    const includes = Object.entries(body).filter(([, v]) => v === 1 || typeof v === 'string');
    const excludes = Object.entries(body)
      .filter(([, v]) => v === 0)
      .map(([k]) => k);

    return data.map((record) => {
      if (includes.length > 0) {
        const row: Record<string, any> = {};
        for (const [field, value] of includes) {
          const alias = typeof value === 'string' ? value : field;
          row[alias] = this.getNestedValue(record, field);
        }
        return row;
      }

      if (excludes.length > 0) {
        const row = { ...record };
        for (const field of excludes) {
          delete row[field];
        }
        return row;
      }

      return record;
    });
  }

  /**
   * Unwind — flatten an array field into multiple records
   */
  private applyUnwind(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    const field = body.path ?? body.field;
    if (!field) return data;

    const results: Record<string, any>[] = [];
    for (const record of data) {
      const arr = this.getNestedValue(record, field);
      if (Array.isArray(arr)) {
        for (const item of arr) {
          results.push({ ...record, [field]: item });
        }
      } else {
        results.push(record);
      }
    }
    return results;
  }

  /**
   * Lookup — join with another data source (simplified in-memory stub)
   */
  private applyLookup(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    // In-memory lookup is a no-op placeholder — real implementation
    // would call broker to fetch from another collection
    const { as } = body;
    return data.map((record) => ({ ...record, [as ?? '_lookup']: [] }));
  }

  /**
   * AddFields — compute new fields from expressions
   *
   * body: { newField: value | { $concat: [...] } | { $multiply: [...] } }
   */
  private applyAddFields(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    return data.map((record) => {
      const row = { ...record };
      for (const [field, expr] of Object.entries(body)) {
        if (typeof expr === 'object' && expr !== null) {
          const [op, args] = Object.entries(expr)[0] as [string, any];
          switch (op) {
            case '$concat':
              row[field] = (args as any[])
                .map((a) =>
                  typeof a === 'string' && a.startsWith('$')
                    ? this.getNestedValue(record, a.slice(1))
                    : a,
                )
                .join('');
              break;
            case '$multiply': {
              const vals = (args as any[]).map((a) =>
                typeof a === 'string' && a.startsWith('$')
                  ? Number(this.getNestedValue(record, a.slice(1))) || 0
                  : Number(a) || 0,
              );
              row[field] = vals.reduce((a, b) => a * b, 1);
              break;
            }
            case '$add': {
              const vals = (args as any[]).map((a) =>
                typeof a === 'string' && a.startsWith('$')
                  ? Number(this.getNestedValue(record, a.slice(1))) || 0
                  : Number(a) || 0,
              );
              row[field] = vals.reduce((a, b) => a + b, 0);
              break;
            }
            default:
              row[field] = null;
          }
        } else if (typeof expr === 'string' && expr.startsWith('$')) {
          row[field] = this.getNestedValue(record, expr.slice(1));
        } else {
          row[field] = expr;
        }
      }
      return row;
    });
  }

  /**
   * Count — return a single record with the count
   */
  private applyCount(
    body: Record<string, any>,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    const alias = body.as ?? body.field ?? 'count';
    return [{ [alias]: data.length }];
  }

  /**
   * Get a nested value from a record using dot notation
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current: any = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }
}
