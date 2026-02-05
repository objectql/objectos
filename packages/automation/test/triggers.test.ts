/**
 * Trigger Tests
 * 
 * Tests for TriggerEngine
 */

import { TriggerEngine } from '../src/triggers';
import type {
    ObjectTriggerConfig,
    ScheduledTriggerConfig,
    WebhookTriggerConfig,
} from '../src/types';

describe('TriggerEngine', () => {
    let engine: TriggerEngine;
    let mockLogger: any;

    beforeEach(() => {
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        };
        engine = new TriggerEngine(mockLogger);
    });

    afterEach(() => {
        engine.shutdown();
    });

    describe('Object Triggers - onCreate', () => {
        it('should fire onCreate trigger when object matches', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.create',
                objectName: 'Contact',
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.create',
                'Contact',
                { id: '1', name: 'John Doe' }
            );

            expect(result).toBe(true);
        });

        it('should not fire onCreate trigger when object does not match', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.create',
                objectName: 'Contact',
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.create',
                'Account',
                { id: '1', name: 'ACME Corp' }
            );

            expect(result).toBe(false);
        });

        it('should not fire onCreate trigger on update event', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.create',
                objectName: 'Contact',
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', name: 'John Doe' }
            );

            expect(result).toBe(false);
        });
    });

    describe('Object Triggers - onUpdate', () => {
        it('should fire onUpdate trigger when field changes', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Contact',
                fields: ['status'],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', status: 'active' },
                { id: '1', status: 'inactive' }
            );

            expect(result).toBe(true);
        });

        it('should not fire onUpdate trigger when monitored field does not change', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Contact',
                fields: ['status'],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', status: 'active', name: 'Jane' },
                { id: '1', status: 'active', name: 'John' }
            );

            expect(result).toBe(false);
        });

        it('should fire onUpdate trigger when any monitored field changes', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Contact',
                fields: ['status', 'priority'],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', status: 'active', priority: 'high' },
                { id: '1', status: 'active', priority: 'low' }
            );

            expect(result).toBe(true);
        });
    });

    describe('Object Triggers - onDelete', () => {
        it('should fire onDelete trigger when object matches', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.delete',
                objectName: 'Contact',
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.delete',
                'Contact',
                { id: '1', name: 'John Doe' }
            );

            expect(result).toBe(true);
        });
    });

    describe('Condition Evaluation', () => {
        it('should evaluate equals condition', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Contact',
                conditions: [
                    { field: 'status', operator: 'equals', value: 'active' }
                ],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', status: 'active' },
                { id: '1', status: 'inactive' }
            );

            expect(result).toBe(true);
        });

        it('should evaluate greater_than condition', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Order',
                conditions: [
                    { field: 'total', operator: 'greater_than', value: 1000 }
                ],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Order',
                { id: '1', total: 1500 },
                { id: '1', total: 500 }
            );

            expect(result).toBe(true);
        });

        it('should evaluate contains condition', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Contact',
                conditions: [
                    { field: 'email', operator: 'contains', value: '@company.com' }
                ],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', email: 'john@company.com' },
                { id: '1', email: 'john@personal.com' }
            );

            expect(result).toBe(true);
        });

        it('should evaluate changed condition', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Contact',
                conditions: [
                    { field: 'status', operator: 'changed' }
                ],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', status: 'active' },
                { id: '1', status: 'inactive' }
            );

            expect(result).toBe(true);
        });

        it('should fail when condition does not match', () => {
            const trigger: ObjectTriggerConfig = {
                type: 'object.update',
                objectName: 'Contact',
                conditions: [
                    { field: 'status', operator: 'equals', value: 'inactive' }
                ],
            };

            const result = engine.evaluateObjectTrigger(
                trigger,
                'object.update',
                'Contact',
                { id: '1', status: 'active' },
                { id: '1', status: 'pending' }
            );

            expect(result).toBe(false);
        });
    });

    describe('Scheduled Triggers (Cron)', () => {
        it('should register a scheduled trigger', () => {
            const trigger: ScheduledTriggerConfig = {
                type: 'scheduled',
                cronExpression: '0 0 * * *', // Daily at midnight
            };

            const callback = vi.fn();

            expect(() => {
                engine.registerScheduledTrigger('rule-1', trigger, callback);
            }).not.toThrow();

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Scheduled trigger registered for rule: rule-1'
            );
        });

        it('should get next run time for scheduled trigger', () => {
            const trigger: ScheduledTriggerConfig = {
                type: 'scheduled',
                cronExpression: '0 0 * * *',
            };

            engine.registerScheduledTrigger('rule-1', trigger, vi.fn());

            const nextRun = engine.getNextRunTime('rule-1');
            expect(nextRun).toBeInstanceOf(Date);
            expect(nextRun!.getTime()).toBeGreaterThan(Date.now());
        });

        it('should unregister a scheduled trigger', () => {
            const trigger: ScheduledTriggerConfig = {
                type: 'scheduled',
                cronExpression: '0 0 * * *',
            };

            engine.registerScheduledTrigger('rule-1', trigger, vi.fn());
            engine.unregisterScheduledTrigger('rule-1');

            expect(mockLogger.info).toHaveBeenCalledWith(
                'Scheduled trigger unregistered for rule: rule-1'
            );

            const nextRun = engine.getNextRunTime('rule-1');
            expect(nextRun).toBeNull();
        });

        it('should handle invalid cron expression', () => {
            const trigger: ScheduledTriggerConfig = {
                type: 'scheduled',
                cronExpression: 'invalid-cron',
            };

            expect(() => {
                engine.registerScheduledTrigger('rule-1', trigger, vi.fn());
            }).toThrow();
        });
    });

    describe('Webhook Validation', () => {
        it('should validate valid webhook trigger', () => {
            const trigger: WebhookTriggerConfig = {
                type: 'webhook',
                path: '/api/webhooks/contact',
                method: 'POST',
                authRequired: true,
            };

            const result = engine.validateWebhookTrigger(trigger);
            expect(result).toBe(true);
        });

        it('should reject webhook trigger without path', () => {
            const trigger: WebhookTriggerConfig = {
                type: 'webhook',
                path: '',
            };

            const result = engine.validateWebhookTrigger(trigger);
            expect(result).toBe(false);
        });

        it('should reject webhook trigger with invalid path', () => {
            const trigger: WebhookTriggerConfig = {
                type: 'webhook',
                path: 'invalid-path',
            };

            const result = engine.validateWebhookTrigger(trigger);
            expect(result).toBe(false);
        });
    });

    describe('Shutdown', () => {
        it('should clear all scheduled jobs on shutdown', () => {
            const trigger: ScheduledTriggerConfig = {
                type: 'scheduled',
                cronExpression: '0 0 * * *',
            };

            engine.registerScheduledTrigger('rule-1', trigger, vi.fn());
            engine.registerScheduledTrigger('rule-2', trigger, vi.fn());

            engine.shutdown();

            expect(mockLogger.info).toHaveBeenCalledWith('Trigger engine shutdown');

            const nextRun1 = engine.getNextRunTime('rule-1');
            const nextRun2 = engine.getNextRunTime('rule-2');
            expect(nextRun1).toBeNull();
            expect(nextRun2).toBeNull();
        });
    });
});
