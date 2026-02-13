/**
 * Object Trigger Examples
 *
 * Demonstrates how to use object triggers (onCreate, onUpdate, onDelete)
 */

import type { AutomationRule } from '@objectos/plugin-automation';

// Example 1: onCreate trigger - Welcome new users
export const newUserWelcomeRule: AutomationRule = {
  id: 'new_user_welcome',
  name: 'Welcome New Users',
  description: 'Send welcome email when a new user is created',
  status: 'active',
  trigger: {
    type: 'object.create',
    objectName: 'users',
  },
  actions: [
    {
      type: 'send_email',
      to: '{{email}}',
      subject: 'Welcome to ObjectStack!',
      body: "Hi {{name}},\n\nWelcome to ObjectStack! We're excited to have you on board.",
      isHtml: false,
    },
    {
      type: 'create_record',
      objectName: 'onboarding_tasks',
      fields: {
        userId: '{{id}}',
        status: 'pending',
        dueDate: '{{#now}}{{#addDays}}7{{/addDays}}{{/now}}',
      },
    },
  ],
  priority: 100,
  createdAt: new Date(),
};

// Example 2: onUpdate trigger with conditions - High value opportunity alert
export const highValueOpportunityRule: AutomationRule = {
  id: 'high_value_opportunity',
  name: 'High Value Opportunity Alert',
  description: 'Alert sales manager when opportunity value exceeds $100,000',
  status: 'active',
  trigger: {
    type: 'object.update',
    objectName: 'opportunities',
    fields: ['amount'], // Only trigger on amount changes
    conditions: [
      {
        field: 'amount',
        operator: 'greater_than',
        value: 100000,
      },
    ],
  },
  actions: [
    {
      type: 'update_field',
      objectName: 'opportunities',
      recordId: '{{id}}',
      fields: {
        highValue: true,
        flaggedAt: '{{#now}}{{/now}}',
      },
    },
    {
      type: 'send_email',
      to: 'sales.manager@company.com',
      subject: 'High Value Opportunity: {{name}}',
      body: 'A high-value opportunity ({{amount}}) has been updated.\n\nOpportunity: {{name}}\nAccount: {{account.name}}\nAmount: ${{amount}}',
    },
    {
      type: 'http_request',
      url: 'https://slack.com/api/chat.postMessage',
      method: 'POST',
      headers: {
        Authorization: 'Bearer {{slack_token}}',
        'Content-Type': 'application/json',
      },
      body: {
        channel: '#sales-alerts',
        text: 'High value opportunity alert: {{name}} - ${{amount}}',
      },
    },
  ],
  priority: 90,
  createdAt: new Date(),
};

// Example 3: onUpdate trigger with field tracking - Status change notification
export const caseStatusChangeRule: AutomationRule = {
  id: 'case_status_change',
  name: 'Case Status Change Notification',
  description: 'Notify customer when case status changes',
  status: 'active',
  trigger: {
    type: 'object.update',
    objectName: 'cases',
    fields: ['status'], // Only trigger when status changes
  },
  actions: [
    {
      type: 'send_email',
      to: '{{customer.email}}',
      subject: 'Case Update: {{caseNumber}}',
      body: `Hi {{customer.name}},

Your support case ({{caseNumber}}) status has been updated to: {{status}}

{{#if}}{{status}}{{equals}}"resolved"{{/equals}}
Your case has been resolved. If you have any further questions, please let us know.
{{/if}}

Best regards,
Support Team`,
      isHtml: false,
    },
  ],
  priority: 80,
  createdAt: new Date(),
};

// Example 4: onDelete trigger - Cleanup related records
export const accountDeletionCleanupRule: AutomationRule = {
  id: 'account_deletion_cleanup',
  name: 'Account Deletion Cleanup',
  description: 'Clean up related records when an account is deleted',
  status: 'active',
  trigger: {
    type: 'object.delete',
    objectName: 'accounts',
  },
  actions: [
    {
      type: 'execute_script',
      script: `
                // Archive related opportunities
                const opportunities = await ctx.context.opportunities.filter({ accountId: ctx.context.id });
                for (const opp of opportunities) {
                    await ctx.context.opportunities.update(opp.id, { 
                        status: 'archived',
                        archivedReason: 'Account deleted'
                    });
                }
                
                // Cancel related tasks
                const tasks = await ctx.context.tasks.filter({ accountId: ctx.context.id });
                for (const task of tasks) {
                    await ctx.context.tasks.update(task.id, { status: 'cancelled' });
                }
                
                ctx.logger.info('Cleanup completed for account: ' + ctx.context.name);
            `,
      language: 'javascript',
      timeout: 10000,
    },
  ],
  priority: 70,
  createdAt: new Date(),
};

// Example 5: onUpdate with multiple conditions - Lead qualification
export const leadQualificationRule: AutomationRule = {
  id: 'lead_qualification',
  name: 'Auto-Qualify Leads',
  description: 'Automatically qualify leads that meet criteria',
  status: 'active',
  trigger: {
    type: 'object.update',
    objectName: 'leads',
    conditions: [
      {
        field: 'annualRevenue',
        operator: 'greater_than',
        value: 1000000,
      },
      {
        field: 'employeeCount',
        operator: 'greater_than',
        value: 50,
      },
      {
        field: 'status',
        operator: 'equals',
        value: 'new',
      },
    ],
  },
  actions: [
    {
      type: 'update_field',
      objectName: 'leads',
      recordId: '{{id}}',
      fields: {
        status: 'qualified',
        qualifiedAt: '{{#now}}{{/now}}',
        qualificationReason: 'Auto-qualified: High revenue and employee count',
      },
    },
    {
      type: 'create_record',
      objectName: 'tasks',
      fields: {
        subject: 'Follow up with qualified lead: {{company}}',
        leadId: '{{id}}',
        priority: 'high',
        dueDate: '{{#now}}{{#addDays}}1{{/addDays}}{{/now}}',
      },
    },
  ],
  priority: 85,
  createdAt: new Date(),
};

// Example 6: onUpdate with changed operator - Field change tracking
export const importantFieldChangeRule: AutomationRule = {
  id: 'important_field_change',
  name: 'Important Field Change Audit',
  description: 'Track changes to important fields',
  status: 'active',
  trigger: {
    type: 'object.update',
    objectName: 'contracts',
    fields: ['amount', 'endDate', 'status'],
    conditions: [
      {
        field: 'amount',
        operator: 'changed',
      },
    ],
  },
  actions: [
    {
      type: 'create_record',
      objectName: 'audit_log',
      fields: {
        entityType: 'contract',
        entityId: '{{id}}',
        fieldName: 'amount',
        oldValue: '{{oldValue}}',
        newValue: '{{amount}}',
        changedBy: '{{modifiedBy}}',
        changedAt: '{{#now}}{{/now}}',
      },
    },
    {
      type: 'send_email',
      to: 'finance@company.com',
      subject: 'Contract Amount Changed: {{contractNumber}}',
      body: 'Contract {{contractNumber}} amount has been changed from ${{oldValue}} to ${{amount}}.',
    },
  ],
  priority: 95,
  createdAt: new Date(),
};
