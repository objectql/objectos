/**
 * Formula Tests
 * 
 * Tests for FormulaEngine
 */

import { FormulaEngine } from '../src/formulas';
import type {
    FormulaField,
    CalculatedFormulaConfig,
    RollupFormulaConfig,
    AutoNumberFormulaConfig,
} from '../src/types';

describe('FormulaEngine', () => {
    let engine: FormulaEngine;
    let mockLogger: any;

    beforeEach(() => {
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        };
        engine = new FormulaEngine(mockLogger);
    });

    describe('Calculated Fields', () => {
        it('should calculate simple arithmetic expression', async () => {
            const formula: FormulaField = {
                name: 'totalAmount',
                objectName: 'Order',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{quantity} * {price}',
                    returnType: 'number',
                } as CalculatedFormulaConfig,
                createdAt: new Date(),
            };

            const record = { quantity: 5, price: 100 };
            const result = await engine.calculateFormula(formula, record);

            expect(result).toBe(500);
        });

        it('should calculate numeric addition', async () => {
            const formula: FormulaField = {
                name: 'total',
                objectName: 'Contact',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{score1} + {score2}',
                    returnType: 'number',
                } as CalculatedFormulaConfig,
                createdAt: new Date(),
            };

            const record = { score1: 75, score2: 85 };
            const result = await engine.calculateFormula(formula, record);

            expect(result).toBe(160);
        });

        it('should cast result to correct type', async () => {
            const formula: FormulaField = {
                name: 'isHighValue',
                objectName: 'Order',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{total} > 1000',
                    returnType: 'boolean',
                } as CalculatedFormulaConfig,
                createdAt: new Date(),
            };

            const record = { total: 1500 };
            const result = await engine.calculateFormula(formula, record);

            expect(result).toBe(true);
        });

        it('should handle missing fields with default values', async () => {
            const formula: FormulaField = {
                name: 'total',
                objectName: 'Order',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{price} * {quantity}',
                    returnType: 'number',
                } as CalculatedFormulaConfig,
                createdAt: new Date(),
            };

            const record = { price: 100 };
            const result = await engine.calculateFormula(formula, record);

            expect(result).toBe(0);
        });
    });

    describe('Rollup Summary - SUM', () => {
        it('should calculate SUM rollup', async () => {
            const formula: FormulaField = {
                name: 'totalOrderAmount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'amount',
                    operation: 'SUM',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp', accountId: 'acc-1' };
            const relatedRecords = [
                { accountId: 'acc-1', amount: 100 },
                { accountId: 'acc-1', amount: 200 },
                { accountId: 'acc-1', amount: 300 },
            ];

            const result = await engine.calculateFormula(formula, record, relatedRecords);

            expect(result).toBe(600);
        });
    });

    describe('Rollup Summary - COUNT', () => {
        it('should calculate COUNT rollup', async () => {
            const formula: FormulaField = {
                name: 'orderCount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'id',
                    operation: 'COUNT',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp', accountId: 'acc-1' };
            const relatedRecords = [
                { accountId: 'acc-1', id: 'ord-1' },
                { accountId: 'acc-1', id: 'ord-2' },
                { accountId: 'acc-1', id: 'ord-3' },
                { accountId: 'acc-2', id: 'ord-4' },
            ];

            const result = await engine.calculateFormula(formula, record, relatedRecords);

            expect(result).toBe(3);
        });

        it('should return 0 for COUNT when no records', async () => {
            const formula: FormulaField = {
                name: 'orderCount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'id',
                    operation: 'COUNT',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp' };
            const relatedRecords: any[] = [];

            const result = await engine.calculateFormula(formula, record, relatedRecords);

            expect(result).toBe(0);
        });
    });

    describe('Rollup Summary - AVG', () => {
        it('should calculate AVG rollup', async () => {
            const formula: FormulaField = {
                name: 'averageOrderAmount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'amount',
                    operation: 'AVG',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp', accountId: 'acc-1' };
            const relatedRecords = [
                { accountId: 'acc-1', amount: 100 },
                { accountId: 'acc-1', amount: 200 },
                { accountId: 'acc-1', amount: 300 },
            ];

            const result = await engine.calculateFormula(formula, record, relatedRecords);

            expect(result).toBe(200);
        });
    });

    describe('Rollup Summary - MIN', () => {
        it('should calculate MIN rollup', async () => {
            const formula: FormulaField = {
                name: 'minOrderAmount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'amount',
                    operation: 'MIN',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp', accountId: 'acc-1' };
            const relatedRecords = [
                { accountId: 'acc-1', amount: 500 },
                { accountId: 'acc-1', amount: 200 },
                { accountId: 'acc-1', amount: 800 },
            ];

            const result = await engine.calculateFormula(formula, record, relatedRecords);

            expect(result).toBe(200);
        });
    });

    describe('Rollup Summary - MAX', () => {
        it('should calculate MAX rollup', async () => {
            const formula: FormulaField = {
                name: 'maxOrderAmount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'amount',
                    operation: 'MAX',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp', accountId: 'acc-1' };
            const relatedRecords = [
                { accountId: 'acc-1', amount: 500 },
                { accountId: 'acc-1', amount: 200 },
                { accountId: 'acc-1', amount: 800 },
            ];

            const result = await engine.calculateFormula(formula, record, relatedRecords);

            expect(result).toBe(800);
        });
    });

    describe('Rollup with Conditions', () => {
        it('should filter records before aggregation', async () => {
            const formula: FormulaField = {
                name: 'completedOrderTotal',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'amount',
                    operation: 'SUM',
                    conditions: [
                        { field: 'status', operator: 'equals', value: 'completed' }
                    ],
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp', accountId: 'acc-1' };
            const relatedRecords = [
                { accountId: 'acc-1', amount: 100, status: 'completed' },
                { accountId: 'acc-1', amount: 200, status: 'pending' },
                { accountId: 'acc-1', amount: 300, status: 'completed' },
            ];

            const result = await engine.calculateFormula(formula, record, relatedRecords);

            expect(result).toBe(400);
        });
    });

    describe('Auto-number Fields', () => {
        it('should generate sequential numbers', async () => {
            const formula: FormulaField = {
                name: 'orderNumber',
                objectName: 'Order',
                type: 'autonumber',
                config: {
                    type: 'autonumber',
                    prefix: 'ORD-',
                    startingNumber: 1,
                    digits: 4,
                } as AutoNumberFormulaConfig,
                createdAt: new Date(),
            };

            const result1 = await engine.calculateFormula(formula, {});
            const result2 = await engine.calculateFormula(formula, {});
            const result3 = await engine.calculateFormula(formula, {});

            expect(result1).toBe('ORD-0001');
            expect(result2).toBe('ORD-0002');
            expect(result3).toBe('ORD-0003');
        });

        it('should support prefix and suffix', async () => {
            const formula: FormulaField = {
                name: 'invoiceNumber',
                objectName: 'Invoice',
                type: 'autonumber',
                config: {
                    type: 'autonumber',
                    prefix: 'INV-',
                    suffix: '-2026',
                    startingNumber: 100,
                    digits: 3,
                } as AutoNumberFormulaConfig,
                createdAt: new Date(),
            };

            const result = await engine.calculateFormula(formula, {});

            expect(result).toBe('INV-100-2026');
        });

        it('should pad numbers correctly', async () => {
            const formula: FormulaField = {
                name: 'caseNumber',
                objectName: 'Case',
                type: 'autonumber',
                config: {
                    type: 'autonumber',
                    prefix: 'CASE-',
                    startingNumber: 1,
                    digits: 6,
                } as AutoNumberFormulaConfig,
                createdAt: new Date(),
            };

            const result = await engine.calculateFormula(formula, {});

            expect(result).toBe('CASE-000001');
        });

        it('should reset counter when requested', async () => {
            const formula: FormulaField = {
                name: 'orderNumber',
                objectName: 'Order',
                type: 'autonumber',
                config: {
                    type: 'autonumber',
                    prefix: 'ORD-',
                    startingNumber: 1,
                    digits: 4,
                } as AutoNumberFormulaConfig,
                createdAt: new Date(),
            };

            await engine.calculateFormula(formula, {});
            await engine.calculateFormula(formula, {});

            engine.resetAutoNumberCounter('Order', 'orderNumber');

            const result = await engine.calculateFormula(formula, {});
            expect(result).toBe('ORD-0001');
        });
    });

    describe('Query Handler Integration', () => {
        it('should use query handler for rollup when no records provided', async () => {
            const mockQueryHandler = vi.fn().mockResolvedValue([
                { accountId: 'acc-1', amount: 100 },
                { accountId: 'acc-1', amount: 200 },
            ]);

            engine.setQueryRecordsHandler(mockQueryHandler);

            const formula: FormulaField = {
                name: 'totalOrderAmount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'amount',
                    operation: 'SUM',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp' };
            const result = await engine.calculateFormula(formula, record);

            expect(mockQueryHandler).toHaveBeenCalledWith('Order', { accountId: 'acc-1' });
            expect(result).toBe(300);
        });

        it('should return null when no query handler and no records', async () => {
            const formula: FormulaField = {
                name: 'totalOrderAmount',
                objectName: 'Account',
                type: 'rollup',
                config: {
                    type: 'rollup',
                    relatedObject: 'Order',
                    relationshipField: 'accountId',
                    aggregateField: 'amount',
                    operation: 'SUM',
                } as RollupFormulaConfig,
                createdAt: new Date(),
            };

            const record = { id: 'acc-1', name: 'ACME Corp' };

            const result = await engine.calculateFormula(formula, record);
            expect(result).toBeNull();
        });
    });

    describe('Error Handling', () => {
        it('should return null for invalid formula expressions', async () => {
            const formula: FormulaField = {
                name: 'badFormula',
                objectName: 'Test',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: 'invalid javascript syntax }{',
                    returnType: 'number',
                } as CalculatedFormulaConfig,
                createdAt: new Date(),
            };

            const result = await engine.calculateFormula(formula, {});

            expect(result).not.toBeNull();
            expect(mockLogger.error).toHaveBeenCalled();
        });

        it('should throw error for unknown formula type', async () => {
            const formula: FormulaField = {
                name: 'unknownFormula',
                objectName: 'Test',
                type: 'calculated',
                config: {
                    type: 'unknown',
                } as any,
                createdAt: new Date(),
            };

            await expect(engine.calculateFormula(formula, {})).rejects.toThrow(
                'Unknown formula type: unknown'
            );
        });
    });
});
