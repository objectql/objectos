/**
 * Automation Storage Implementation
 *
 * In-memory storage for automation rules and formula fields
 */

import type {
  AutomationStorage,
  AutomationRule,
  FormulaField,
  AutomationRuleStatus,
  TriggerType,
} from './types.js';

/**
 * In-memory automation storage
 */
export class InMemoryAutomationStorage implements AutomationStorage {
  private rules: Map<string, AutomationRule> = new Map();
  private formulas: Map<string, FormulaField> = new Map();

  /**
   * Save an automation rule
   */
  async saveRule(rule: AutomationRule): Promise<void> {
    this.rules.set(rule.id, { ...rule });
  }

  /**
   * Get an automation rule
   */
  async getRule(id: string): Promise<AutomationRule | null> {
    const rule = this.rules.get(id);
    return rule ? { ...rule } : null;
  }

  /**
   * List automation rules
   */
  async listRules(filter?: {
    status?: AutomationRuleStatus;
    triggerType?: TriggerType;
  }): Promise<AutomationRule[]> {
    let results = Array.from(this.rules.values());

    if (filter?.status) {
      results = results.filter((r) => r.status === filter.status);
    }

    if (filter?.triggerType) {
      results = results.filter((r) => r.trigger.type === filter.triggerType);
    }

    // Sort by priority (higher first)
    results.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return results.map((r) => ({ ...r }));
  }

  /**
   * Update an automation rule
   */
  async updateRule(id: string, updates: Partial<AutomationRule>): Promise<void> {
    const rule = this.rules.get(id);
    if (!rule) {
      throw new Error(`Automation rule not found: ${id}`);
    }

    Object.assign(rule, updates, { updatedAt: new Date() });
  }

  /**
   * Delete an automation rule
   */
  async deleteRule(id: string): Promise<void> {
    if (!this.rules.has(id)) {
      throw new Error(`Automation rule not found: ${id}`);
    }
    this.rules.delete(id);
  }

  /**
   * Save a formula field
   */
  async saveFormula(formula: FormulaField): Promise<void> {
    const key = `${formula.objectName}.${formula.name}`;
    this.formulas.set(key, { ...formula });
  }

  /**
   * Get a formula field
   */
  async getFormula(objectName: string, fieldName: string): Promise<FormulaField | null> {
    const key = `${objectName}.${fieldName}`;
    const formula = this.formulas.get(key);
    return formula ? { ...formula } : null;
  }

  /**
   * List formula fields
   */
  async listFormulas(objectName?: string): Promise<FormulaField[]> {
    let results = Array.from(this.formulas.values());

    if (objectName) {
      results = results.filter((f) => f.objectName === objectName);
    }

    return results.map((f) => ({ ...f }));
  }

  /**
   * Delete a formula field
   */
  async deleteFormula(objectName: string, fieldName: string): Promise<void> {
    const key = `${objectName}.${fieldName}`;
    if (!this.formulas.has(key)) {
      throw new Error(`Formula field not found: ${objectName}.${fieldName}`);
    }
    this.formulas.delete(key);
  }

  /**
   * Clear all data (for testing)
   */
  async clear(): Promise<void> {
    this.rules.clear();
    this.formulas.clear();
  }
}
