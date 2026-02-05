/**
 * Standard Library for Workflow Actions and Guards
 * 
 * Built-in functions that can be used in workflow definitions
 */

import type { WorkflowContext } from './types';

/**
 * Standard Actions
 */
export const StandardActions = {
    /**
     * Log a message to the console
     */
    log: (message: string) => {
        return async (context: WorkflowContext) => {
            const msg = typeof message === 'string' 
                ? message.replace(/\{\{(\w+)\}\}/g, (_, key) => context.getData(key) || '')
                : message;
            context.logger.info(`[Workflow Action] ${msg}`);
        };
    },

    /**
     * Send an email (mock implementation)
     */
    sendEmail: (to: string, subject: string, body: string) => {
        return async (context: WorkflowContext) => {
            const resolvedTo = to.replace(/\{\{(\w+)\}\}/g, (_, key) => context.getData(key) || '');
            context.logger.info(`[Workflow Action] Sending email to ${resolvedTo}: ${subject}`);
            // In a real implementation, this would call the NotificationService
        };
    },

    /**
     * Update a record (mock implementation for now)
     * In a real system, this would use the ObjectQL service
     */
    updateRecord: (updates: Record<string, any>) => {
        return async (context: WorkflowContext) => {
            context.logger.info(`[Workflow Action] Updating record ${context.instance.id}`, updates);
            // Simulate update in context data
            for (const [key, value] of Object.entries(updates)) {
                context.setData(key, value);
            }
        };
    },
    
    /**
     * Webhook call (mock implementation)
     */
    webhook: (url: string, method: string = 'POST') => {
        return async (context: WorkflowContext) => {
             context.logger.info(`[Workflow Action] Calling Webhook ${method} ${url}`);
             // fetch(url, ...)
        };
    }
};

/**
 * Standard Guards
 */
export const StandardGuards = {
    /**
     * Check if a field equals a value
     */
    fieldEquals: (field: string, value: any) => {
        return (context: WorkflowContext) => {
            const actualValue = context.getData(field);
            return actualValue === value;
        };
    },

    /**
     * Always allow
     */
    always: () => true,

    /**
     * Always deny
     */
    never: () => false,
};
