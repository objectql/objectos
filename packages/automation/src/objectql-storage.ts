/**
 * ObjectQL Automation Storage Implementation
 * 
 * Storage adapter that persists automation rules and formulas to ObjectOS/ObjectQL database
 */

import type { PluginContext } from '@objectstack/runtime';
import type {
    AutomationStorage,
    AutomationRule,
    FormulaField,
    AutomationRuleStatus,
    TriggerType,
} from './types.js';

export class ObjectQLAutomationStorage implements AutomationStorage {
    private context: PluginContext;

    constructor(context: PluginContext) {
        this.context = context;
    }

    /**
     * Save an automation rule
     */
    async saveRule(rule: AutomationRule): Promise<void> {
        await (this.context as any).broker.call('data.create', {
            object: 'automation_rule',
            doc: this.mapRuleToDoc(rule)
        });
    }

    /**
     * Get an automation rule
     */
    async getRule(id: string): Promise<AutomationRule | null> {
        try {
            const result = await (this.context as any).broker.call('data.get', {
                object: 'automation_rule',
                id: id
            });
            return result ? this.mapDocToRule(result) : null;
        } catch (err: any) {
            if (err.message && err.message.includes('not found')) return null;
            throw err;
        }
    }

    /**
     * List automation rules
     */
    async listRules(filter?: { 
        status?: AutomationRuleStatus; 
        triggerType?: TriggerType 
    }): Promise<AutomationRule[]> {
        const query: any = {};

        if (filter?.status) {
            query.status = filter.status;
        }

        // Note: triggerType is nested in the trigger object
        // We'll need to filter after fetching or use a different approach
        const results = await (this.context as any).broker.call('data.find', {
            object: 'automation_rule',
            query: query,
            sort: '-priority'
        });

        let rules = results.map((doc: any) => this.mapDocToRule(doc));

        // Filter by trigger type if specified (post-query filtering)
        if (filter?.triggerType) {
            rules = rules.filter(r => r.trigger.type === filter.triggerType);
        }

        return rules;
    }

    /**
     * Update an automation rule
     */
    async updateRule(id: string, updates: Partial<AutomationRule>): Promise<void> {
        const docUpdates: any = {};

        if (updates.name !== undefined) docUpdates.name = updates.name;
        if (updates.objectName !== undefined) docUpdates.object_name = updates.objectName;
        if (updates.trigger !== undefined) docUpdates.trigger = updates.trigger;
        if (updates.conditions !== undefined) docUpdates.conditions = updates.conditions;
        if (updates.actions !== undefined) docUpdates.actions = updates.actions;
        if (updates.status !== undefined) docUpdates.status = updates.status;
        if (updates.priority !== undefined) docUpdates.priority = updates.priority;
        if (updates.executionCount !== undefined) docUpdates.execution_count = updates.executionCount;
        if (updates.lastExecutedAt !== undefined) docUpdates.last_executed_at = updates.lastExecutedAt;
        if (updates.error !== undefined) docUpdates.error = updates.error;
        
        docUpdates.updated_at = new Date();

        await (this.context as any).broker.call('data.update', {
            object: 'automation_rule',
            id: id,
            doc: docUpdates
        });
    }

    /**
     * Delete an automation rule
     */
    async deleteRule(id: string): Promise<void> {
        await (this.context as any).broker.call('data.delete', {
            object: 'automation_rule',
            id: id
        });
    }

    /**
     * Save a formula field
     * Note: Formula fields are typically part of object metadata,
     * but we can store them separately if needed
     */
    async saveFormula(formula: FormulaField): Promise<void> {
        // For now, we could use a generic metadata storage or a separate object
        // This is a simplified implementation
        const key = `${formula.objectName}.${formula.name}`;
        await (this.context as any).broker.call('data.create', {
            object: 'formula_field',
            doc: {
                _id: key,
                id: key,
                object_name: formula.objectName,
                name: formula.name,
                formula: formula,
            }
        });
    }

    /**
     * Get a formula field
     */
    async getFormula(objectName: string, fieldName: string): Promise<FormulaField | null> {
        try {
            const key = `${objectName}.${fieldName}`;
            const result = await (this.context as any).broker.call('data.get', {
                object: 'formula_field',
                id: key
            });
            return result ? result.formula : null;
        } catch (err: any) {
            if (err.message && err.message.includes('not found')) return null;
            throw err;
        }
    }

    /**
     * List formula fields
     */
    async listFormulas(objectName?: string): Promise<FormulaField[]> {
        const query: any = {};
        
        if (objectName) {
            query.object_name = objectName;
        }

        const results = await (this.context as any).broker.call('data.find', {
            object: 'formula_field',
            query: query,
        });

        return results.map((doc: any) => doc.formula);
    }

    /**
     * Delete a formula field
     */
    async deleteFormula(objectName: string, fieldName: string): Promise<void> {
        const key = `${objectName}.${fieldName}`;
        await (this.context as any).broker.call('data.delete', {
            object: 'formula_field',
            id: key
        });
    }

    /**
     * Clear all data (for testing)
     */
    async clear(): Promise<void> {
        // Clear all rules
        const allRules = await this.listRules();
        for (const rule of allRules) {
            await this.deleteRule(rule.id);
        }

        // Clear all formulas
        const allFormulas = await this.listFormulas();
        for (const formula of allFormulas) {
            await this.deleteFormula(formula.objectName, formula.name);
        }
    }

    /**
     * Map AutomationRule to document
     */
    private mapRuleToDoc(rule: AutomationRule): any {
        return {
            _id: rule.id,
            id: rule.id,
            name: rule.name,
            object_name: rule.objectName,
            trigger: rule.trigger,
            conditions: rule.conditions,
            actions: rule.actions,
            status: rule.status,
            priority: rule.priority,
            execution_count: rule.executionCount || 0,
            last_executed_at: rule.lastExecutedAt,
            error: rule.error,
            created_at: rule.createdAt,
            updated_at: rule.updatedAt,
        };
    }

    /**
     * Map document to AutomationRule
     */
    private mapDocToRule(doc: any): AutomationRule {
        return {
            id: doc.id || doc._id,
            name: doc.name,
            objectName: doc.object_name,
            trigger: doc.trigger,
            conditions: doc.conditions,
            actions: doc.actions,
            status: doc.status,
            priority: doc.priority,
            executionCount: doc.execution_count || 0,
            lastExecutedAt: doc.last_executed_at ? new Date(doc.last_executed_at) : undefined,
            error: doc.error,
            createdAt: new Date(doc.created_at || Date.now()),
            updatedAt: new Date(doc.updated_at || Date.now()),
        } as AutomationRule;
    }
}
