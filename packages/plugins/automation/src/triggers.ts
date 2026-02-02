/**
 * Trigger Engine
 * 
 * Handles trigger evaluation and execution
 */

import * as cronParser from 'cron-parser';
import type {
    TriggerConfig,
    ObjectTriggerConfig,
    ScheduledTriggerConfig,
    WebhookTriggerConfig,
    TriggerCondition,
    AutomationRule,
} from './types';

/**
 * Trigger engine for evaluating trigger conditions
 */
export class TriggerEngine {
    private scheduledJobs: Map<string, any> = new Map();
    private logger: any;

    constructor(logger?: any) {
        this.logger = logger || console;
    }

    /**
     * Evaluate if an object trigger should fire
     */
    evaluateObjectTrigger(
        trigger: ObjectTriggerConfig,
        eventType: 'object.create' | 'object.update' | 'object.delete',
        objectName: string,
        record: any,
        oldRecord?: any
    ): boolean {
        // Check if trigger type matches
        if (trigger.type !== eventType) {
            return false;
        }

        // Check if object name matches
        if (trigger.objectName !== objectName) {
            return false;
        }

        // For update triggers, check conditions and field changes
        if (eventType === 'object.update') {
            // If specific fields are specified, check if any changed
            if (trigger.fields && trigger.fields.length > 0) {
                const hasFieldChange = trigger.fields.some(
                    field => oldRecord && record[field] !== oldRecord[field]
                );
                if (!hasFieldChange) {
                    return false;
                }
            }

            // Evaluate conditions
            if (trigger.conditions && trigger.conditions.length > 0) {
                return this.evaluateConditions(trigger.conditions, record, oldRecord);
            }
        }

        return true;
    }

    /**
     * Evaluate trigger conditions
     */
    private evaluateConditions(
        conditions: TriggerCondition[],
        record: any,
        oldRecord?: any
    ): boolean {
        for (const condition of conditions) {
            if (!this.evaluateCondition(condition, record, oldRecord)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Evaluate a single condition
     */
    private evaluateCondition(
        condition: TriggerCondition,
        record: any,
        oldRecord?: any
    ): boolean {
        const fieldValue = record[condition.field];
        const oldValue = oldRecord?.[condition.field];

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

            case 'changed':
                return oldValue !== undefined && fieldValue !== oldValue;

            default:
                this.logger.warn(`Unknown condition operator: ${condition.operator}`);
                return false;
        }
    }

    /**
     * Register a scheduled trigger
     */
    registerScheduledTrigger(
        ruleId: string,
        trigger: ScheduledTriggerConfig,
        callback: () => void | Promise<void>
    ): void {
        try {
            // Parse cron expression
            const interval = cronParser.parseExpression(trigger.cronExpression, {
                tz: trigger.timezone,
            });

            // Schedule the job
            const scheduleNext = () => {
                try {
                    const next = interval.next();
                    const delay = next.getTime() - Date.now();

                    const timeout = setTimeout(async () => {
                        try {
                            await callback();
                        } catch (error) {
                            this.logger.error(`Error executing scheduled trigger for rule ${ruleId}:`, error);
                        }
                        // Schedule next execution
                        scheduleNext();
                    }, delay);

                    this.scheduledJobs.set(ruleId, {
                        timeout,
                        nextRun: next.toDate(),
                    });
                } catch (error) {
                    this.logger.error(`Error scheduling next execution for rule ${ruleId}:`, error);
                }
            };

            scheduleNext();
            this.logger.info(`Scheduled trigger registered for rule: ${ruleId}`);
        } catch (error) {
            this.logger.error(`Failed to register scheduled trigger for rule ${ruleId}:`, error);
            throw error;
        }
    }

    /**
     * Unregister a scheduled trigger
     */
    unregisterScheduledTrigger(ruleId: string): void {
        const job = this.scheduledJobs.get(ruleId);
        if (job?.timeout) {
            clearTimeout(job.timeout);
            this.scheduledJobs.delete(ruleId);
            this.logger.info(`Scheduled trigger unregistered for rule: ${ruleId}`);
        }
    }

    /**
     * Get next run time for a scheduled trigger
     */
    getNextRunTime(ruleId: string): Date | null {
        const job = this.scheduledJobs.get(ruleId);
        return job?.nextRun || null;
    }

    /**
     * Validate a webhook trigger (basic validation)
     */
    validateWebhookTrigger(trigger: WebhookTriggerConfig): boolean {
        if (!trigger.path) {
            return false;
        }

        // Path should start with /
        if (!trigger.path.startsWith('/')) {
            return false;
        }

        return true;
    }

    /**
     * Shutdown and cleanup
     */
    shutdown(): void {
        // Clear all scheduled jobs
        for (const [ruleId, job] of this.scheduledJobs.entries()) {
            if (job.timeout) {
                clearTimeout(job.timeout);
            }
        }
        this.scheduledJobs.clear();
        this.logger.info('Trigger engine shutdown');
    }
}
