/**
 * Formula Engine
 *
 * Handles formula field calculations
 */

import type {
  FormulaField,
  FormulaConfig,
  CalculatedFormulaConfig,
  RollupFormulaConfig,
  AutoNumberFormulaConfig,
  RollupOperation,
  TriggerCondition,
} from './types.js';

/**
 * Formula engine for calculating field values
 */
export class FormulaEngine {
  private logger: any;
  private autoNumberCounters: Map<string, number> = new Map();

  // External handlers
  private queryRecordsHandler?: (objectName: string, filter: any) => Promise<any[]>;

  constructor(logger?: any) {
    this.logger = logger || console;
  }

  /**
   * Set query records handler
   */
  setQueryRecordsHandler(handler: (objectName: string, filter: any) => Promise<any[]>): void {
    this.queryRecordsHandler = handler;
  }

  /**
   * Calculate a formula field value
   */
  async calculateFormula(formula: FormulaField, record: any, allRecords?: any[]): Promise<any> {
    switch (formula.config.type) {
      case 'calculated':
        return this.calculateCalculatedField(formula.config, record);

      case 'rollup':
        return this.calculateRollupField(formula.config, record, allRecords);

      case 'autonumber':
        return this.calculateAutoNumberField(formula.config, formula);

      default:
        throw new Error(`Unknown formula type: ${(formula.config as any).type}`);
    }
  }

  /**
   * Calculate a calculated field
   */
  private calculateCalculatedField(config: CalculatedFormulaConfig, record: any): any {
    try {
      // Create a safe evaluation context
      const context = { ...record };

      // Parse and evaluate the expression
      // Note: This is a simplified implementation. In production, you'd want:
      // - Proper expression parser (e.g., mathjs, expr-eval)
      // - Type checking
      // - Security sandboxing
      const result = this.evaluateExpression(config.expression, context);

      // Cast to the expected return type
      return this.castValue(result, config.returnType);
    } catch (error) {
      this.logger.error(`Error calculating formula: ${config.expression}`, error);
      return null;
    }
  }

  /**
   * Calculate a rollup field
   */
  private async calculateRollupField(
    config: RollupFormulaConfig,
    record: any,
    allRecords?: any[],
  ): Promise<any> {
    try {
      // Get related records
      let relatedRecords: any[];

      if (allRecords) {
        // Filter from provided records
        const relationshipValue = record[config.relationshipField];
        relatedRecords = allRecords.filter(
          (r) => r[config.relationshipField] === relationshipValue,
        );
      } else if (this.queryRecordsHandler) {
        // Query from data source
        const filter = {
          [config.relationshipField]: record.id,
        };
        relatedRecords = await this.queryRecordsHandler(config.relatedObject, filter);
      } else {
        throw new Error('No data source available for rollup calculation');
      }

      // Apply additional conditions
      if (config.conditions && config.conditions.length > 0) {
        relatedRecords = relatedRecords.filter((r) =>
          this.evaluateConditions(config.conditions!, r),
        );
      }

      // Perform the rollup operation
      return this.performRollupOperation(config.operation, relatedRecords, config.aggregateField);
    } catch (error) {
      this.logger.error('Error calculating rollup field:', error);
      return null;
    }
  }

  /**
   * Calculate an auto-number field
   */
  private calculateAutoNumberField(config: AutoNumberFormulaConfig, formula: FormulaField): string {
    const key = `${formula.objectName}.${formula.name}`;
    const currentNumber = this.autoNumberCounters.get(key) || config.startingNumber || 1;

    // Increment the counter
    this.autoNumberCounters.set(key, currentNumber + 1);

    // Format the number
    const digits = config.digits || 4;
    const numberStr = currentNumber.toString().padStart(digits, '0');

    // Build the final value
    let result = '';
    if (config.prefix) {
      result += config.prefix;
    }
    result += numberStr;
    if (config.suffix) {
      result += config.suffix;
    }

    return result;
  }

  /**
   * Evaluate a simple expression
   * This is a basic implementation - in production use a proper expression parser
   */
  private evaluateExpression(expression: string, context: any): any {
    // Replace field references with values
    let processedExpr = expression;

    // Replace {fieldName} with actual values
    processedExpr = processedExpr.replace(/\{([^}]+)\}/g, (match, field) => {
      const value = context[field.trim()];
      if (value === undefined) {
        return '0';
      }
      return typeof value === 'string' ? `"${value}"` : String(value);
    });

    // Evaluate basic mathematical expressions
    // Note: In production, use a proper expression evaluator like mathjs
    try {
      // Simple arithmetic evaluation (UNSAFE - for demo only)
      // eslint-disable-next-line no-new-func
      const fn = new Function('return ' + processedExpr);
      return fn();
    } catch (error) {
      this.logger.error(`Failed to evaluate expression: ${expression}`, error);
      return null;
    }
  }

  /**
   * Cast value to expected type
   */
  private castValue(value: any, type: string): any {
    switch (type) {
      case 'string':
        return String(value);

      case 'number':
        return Number(value);

      case 'boolean':
        return Boolean(value);

      case 'date':
        return value instanceof Date ? value : new Date(value);

      default:
        return value;
    }
  }

  /**
   * Perform rollup operation
   */
  private performRollupOperation(operation: RollupOperation, records: any[], field: string): any {
    if (records.length === 0) {
      return operation === 'COUNT' ? 0 : null;
    }

    const values = records.map((r) => r[field]).filter((v) => v !== null && v !== undefined);

    switch (operation) {
      case 'COUNT':
        return values.length;

      case 'SUM':
        return values.reduce((sum, val) => sum + Number(val), 0);

      case 'AVG':
        if (values.length === 0) return null;
        return values.reduce((sum, val) => sum + Number(val), 0) / values.length;

      case 'MIN':
        if (values.length === 0) return null;
        return Math.min(...values.map((v) => Number(v)));

      case 'MAX':
        if (values.length === 0) return null;
        return Math.max(...values.map((v) => Number(v)));

      default:
        throw new Error(`Unknown rollup operation: ${operation}`);
    }
  }

  /**
   * Evaluate conditions for filtering
   */
  private evaluateConditions(conditions: TriggerCondition[], record: any): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, record)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: TriggerCondition, record: any): boolean {
    const fieldValue = record[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;

      case 'not_equals':
        return fieldValue !== condition.value;

      case 'greater_than':
        return fieldValue > condition.value;

      case 'less_than':
        return fieldValue < condition.value;

      case 'contains':
        return String(fieldValue).includes(String(condition.value));

      case 'starts_with':
        return String(fieldValue).startsWith(String(condition.value));

      case 'ends_with':
        return String(fieldValue).endsWith(String(condition.value));

      default:
        return false;
    }
  }

  /**
   * Reset auto-number counter (for testing)
   */
  resetAutoNumberCounter(objectName: string, fieldName: string): void {
    const key = `${objectName}.${fieldName}`;
    this.autoNumberCounters.delete(key);
  }

  /**
   * Get current auto-number counter value
   */
  getAutoNumberCounter(objectName: string, fieldName: string): number {
    const key = `${objectName}.${fieldName}`;
    return this.autoNumberCounters.get(key) || 0;
  }
}
