/**
 * Standard Library for Workflow Actions and Guards
 *
 * Built-in functions that can be used in workflow definitions
 */

import type { WorkflowContext } from './types.js';

/**
 * Standard Actions
 */
export const StandardActions = {
  /**
   * Log a message to the console
   */
  log: (context: WorkflowContext, params?: any) => {
    // Handle direct string param (backward compat) or object (new style)
    let message: string;
    if (typeof params === 'string') {
      message = params;
    } else if (params && params.message) {
      message = params.message;
    } else {
      message = 'Workflow Action Triggered';
    }

    const msg = message.replace(/\{\{\s*(\w+)\s*\}\}/g, (_: string, key: string) =>
      String(context.getData(key) || ''),
    );
    context.logger.info(`[Workflow Action] ${msg}`);
  },

  /**
   * Send an email (mock implementation)
   */
  sendEmail: (context: WorkflowContext, params?: any) => {
    const to = params?.to || '';
    const subject = params?.subject || '';
    // Unused body for now, but would be params.body

    const resolvedTo = to.replace(
      /\{\{\s*(\w+)\s*\}\}/g,
      (_: string, key: string) => context.getData(key) || '',
    );
    context.logger.info(`[Workflow Action] Sending email to ${resolvedTo}: ${subject}`);
  },

  /**
   * Update a record (mock implementation for now)
   */
  updateRecord: (context: WorkflowContext, params?: any) => {
    const updates = params || {};
    context.logger.info(`[Workflow Action] Updating record ${context.instance.id}`, updates);
    // Simulate update in context data
    for (const [key, value] of Object.entries(updates)) {
      context.setData(key, value);
    }
  },

  /**
   * Webhook call (mock implementation)
   */
  webhook: (context: WorkflowContext, params?: any) => {
    const url = params?.url || '';
    const method = params?.method || 'POST';
    context.logger.info(`[Workflow Action] Calling Webhook ${method} ${url}`);
  },
};

/**
 * Standard Guards
 */
export const StandardGuards = {
  /**
   * Check if a field equals a value
   */
  fieldEquals: (context: WorkflowContext, params?: any) => {
    if (!params || !params.field) return false;

    const actualValue = context.getData(params.field);
    return actualValue === params.value;
  },

  /**
   * Check if a value is greater than a threshold
   */
  greaterThan: (context: WorkflowContext, params?: any) => {
    if (!params || !params.field) return false;
    const val = Number(context.getData(params.field));
    const threshold = Number(params.value);
    return !isNaN(val) && !isNaN(threshold) && val > threshold;
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
