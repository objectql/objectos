/**
 * Storage Tests
 * 
 * Tests for InMemoryAutomationStorage
 */

import { InMemoryAutomationStorage } from '../src/storage.js';
import type { AutomationRule, FormulaField } from '../src/types.js';

describe('InMemoryAutomationStorage', () => {
    let storage: InMemoryAutomationStorage;

    beforeEach(() => {
        storage = new InMemoryAutomationStorage();
    });

    describe('Automation Rules - Save and Retrieve', () => {
        it('should save and retrieve a rule', async () => {
            const rule: AutomationRule = {
                id: 'rule-1',
                name: 'Test Rule',
                description: 'A test automation rule',
                status: 'active',
                trigger: {
                    type: 'object.create',
                    objectName: 'Contact',
                },
                actions: [
                    {
                        type: 'update_field',
                        objectName: 'Contact',
                        recordId: '{{record.id}}',
                        fields: { status: 'new' },
                    },
                ],
                createdAt: new Date(),
            };

            await storage.saveRule(rule);
            const retrieved = await storage.getRule('rule-1');

            expect(retrieved).toEqual(rule);
        });

        it('should return null for non-existent rule', async () => {
            const result = await storage.getRule('non-existent');
            expect(result).toBeNull();
        });

        it('should update an existing rule', async () => {
            const rule: AutomationRule = {
                id: 'rule-1',
                name: 'Test Rule',
                status: 'active',
                trigger: { type: 'object.create', objectName: 'Contact' },
                actions: [],
                createdAt: new Date(),
            };

            await storage.saveRule(rule);
            await storage.updateRule('rule-1', { status: 'inactive', name: 'Updated Rule' });

            const updated = await storage.getRule('rule-1');
            expect(updated?.status).toBe('inactive');
            expect(updated?.name).toBe('Updated Rule');
            expect(updated?.updatedAt).toBeInstanceOf(Date);
        });

        it('should throw error when updating non-existent rule', async () => {
            await expect(
                storage.updateRule('non-existent', { status: 'inactive' })
            ).rejects.toThrow('Automation rule not found: non-existent');
        });

        it('should delete a rule', async () => {
            const rule: AutomationRule = {
                id: 'rule-1',
                name: 'Test Rule',
                status: 'active',
                trigger: { type: 'object.create', objectName: 'Contact' },
                actions: [],
                createdAt: new Date(),
            };

            await storage.saveRule(rule);
            await storage.deleteRule('rule-1');

            const result = await storage.getRule('rule-1');
            expect(result).toBeNull();
        });

        it('should throw error when deleting non-existent rule', async () => {
            await expect(storage.deleteRule('non-existent')).rejects.toThrow(
                'Automation rule not found: non-existent'
            );
        });
    });

    describe('Automation Rules - Filtering', () => {
        beforeEach(async () => {
            const rules: AutomationRule[] = [
                {
                    id: 'rule-1',
                    name: 'Active Create Rule',
                    status: 'active',
                    priority: 10,
                    trigger: { type: 'object.create', objectName: 'Contact' },
                    actions: [],
                    createdAt: new Date(),
                },
                {
                    id: 'rule-2',
                    name: 'Active Update Rule',
                    status: 'active',
                    priority: 5,
                    trigger: { type: 'object.update', objectName: 'Contact' },
                    actions: [],
                    createdAt: new Date(),
                },
                {
                    id: 'rule-3',
                    name: 'Inactive Rule',
                    status: 'inactive',
                    priority: 8,
                    trigger: { type: 'object.create', objectName: 'Account' },
                    actions: [],
                    createdAt: new Date(),
                },
                {
                    id: 'rule-4',
                    name: 'Error Rule',
                    status: 'error',
                    trigger: { type: 'scheduled', cronExpression: '0 0 * * *' },
                    actions: [],
                    createdAt: new Date(),
                },
            ];

            for (const rule of rules) {
                await storage.saveRule(rule);
            }
        });

        it('should list all rules when no filter', async () => {
            const rules = await storage.listRules();
            expect(rules).toHaveLength(4);
        });

        it('should filter by status', async () => {
            const rules = await storage.listRules({ status: 'active' });
            expect(rules).toHaveLength(2);
            expect(rules.every(r => r.status === 'active')).toBe(true);
        });

        it('should filter by trigger type', async () => {
            const rules = await storage.listRules({ triggerType: 'object.create' });
            expect(rules).toHaveLength(2);
            expect(rules.every(r => r.trigger.type === 'object.create')).toBe(true);
        });

        it('should filter by status and trigger type', async () => {
            const rules = await storage.listRules({
                status: 'active',
                triggerType: 'object.create',
            });
            expect(rules).toHaveLength(1);
            expect(rules[0].id).toBe('rule-1');
        });

        it('should sort by priority descending', async () => {
            const rules = await storage.listRules({ status: 'active' });
            expect(rules[0].priority).toBe(10);
            expect(rules[1].priority).toBe(5);
        });
    });

    describe('Formula Fields - Save and Retrieve', () => {
        it('should save and retrieve a formula', async () => {
            const formula: FormulaField = {
                name: 'totalAmount',
                objectName: 'Order',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{quantity} * {price}',
                    returnType: 'number',
                },
                createdAt: new Date(),
            };

            await storage.saveFormula(formula);
            const retrieved = await storage.getFormula('Order', 'totalAmount');

            expect(retrieved).toEqual(formula);
        });

        it('should return null for non-existent formula', async () => {
            const result = await storage.getFormula('Order', 'nonExistent');
            expect(result).toBeNull();
        });

        it('should list all formulas', async () => {
            const formulas: FormulaField[] = [
                {
                    name: 'totalAmount',
                    objectName: 'Order',
                    type: 'calculated',
                    config: {
                        type: 'calculated',
                        expression: '{quantity} * {price}',
                        returnType: 'number',
                    },
                    createdAt: new Date(),
                },
                {
                    name: 'orderNumber',
                    objectName: 'Order',
                    type: 'autonumber',
                    config: {
                        type: 'autonumber',
                        prefix: 'ORD-',
                        digits: 4,
                    },
                    createdAt: new Date(),
                },
                {
                    name: 'totalOrders',
                    objectName: 'Account',
                    type: 'rollup',
                    config: {
                        type: 'rollup',
                        relatedObject: 'Order',
                        relationshipField: 'accountId',
                        aggregateField: 'id',
                        operation: 'COUNT',
                    },
                    createdAt: new Date(),
                },
            ];

            for (const formula of formulas) {
                await storage.saveFormula(formula);
            }

            const allFormulas = await storage.listFormulas();
            expect(allFormulas).toHaveLength(3);
        });

        it('should filter formulas by object name', async () => {
            const formulas: FormulaField[] = [
                {
                    name: 'totalAmount',
                    objectName: 'Order',
                    type: 'calculated',
                    config: {
                        type: 'calculated',
                        expression: '{quantity} * {price}',
                        returnType: 'number',
                    },
                    createdAt: new Date(),
                },
                {
                    name: 'orderNumber',
                    objectName: 'Order',
                    type: 'autonumber',
                    config: {
                        type: 'autonumber',
                        prefix: 'ORD-',
                        digits: 4,
                    },
                    createdAt: new Date(),
                },
                {
                    name: 'totalOrders',
                    objectName: 'Account',
                    type: 'rollup',
                    config: {
                        type: 'rollup',
                        relatedObject: 'Order',
                        relationshipField: 'accountId',
                        aggregateField: 'id',
                        operation: 'COUNT',
                    },
                    createdAt: new Date(),
                },
            ];

            for (const formula of formulas) {
                await storage.saveFormula(formula);
            }

            const orderFormulas = await storage.listFormulas('Order');
            expect(orderFormulas).toHaveLength(2);
            expect(orderFormulas.every(f => f.objectName === 'Order')).toBe(true);
        });

        it('should delete a formula', async () => {
            const formula: FormulaField = {
                name: 'totalAmount',
                objectName: 'Order',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{quantity} * {price}',
                    returnType: 'number',
                },
                createdAt: new Date(),
            };

            await storage.saveFormula(formula);
            await storage.deleteFormula('Order', 'totalAmount');

            const result = await storage.getFormula('Order', 'totalAmount');
            expect(result).toBeNull();
        });

        it('should throw error when deleting non-existent formula', async () => {
            await expect(storage.deleteFormula('Order', 'nonExistent')).rejects.toThrow(
                'Formula field not found: Order.nonExistent'
            );
        });
    });

    describe('Clear', () => {
        it('should clear all data', async () => {
            const rule: AutomationRule = {
                id: 'rule-1',
                name: 'Test Rule',
                status: 'active',
                trigger: { type: 'object.create', objectName: 'Contact' },
                actions: [],
                createdAt: new Date(),
            };

            const formula: FormulaField = {
                name: 'totalAmount',
                objectName: 'Order',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{quantity} * {price}',
                    returnType: 'number',
                },
                createdAt: new Date(),
            };

            await storage.saveRule(rule);
            await storage.saveFormula(formula);

            await storage.clear();

            const retrievedRule = await storage.getRule('rule-1');
            const retrievedFormula = await storage.getFormula('Order', 'totalAmount');

            expect(retrievedRule).toBeNull();
            expect(retrievedFormula).toBeNull();
        });
    });
});
