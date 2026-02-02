# @objectos/plugin-automation

A comprehensive automation plugin for ObjectOS, providing triggers, actions, and formula fields to automate business processes.

## Features

- ✅ **Object Triggers** - Respond to data changes (onCreate, onUpdate, onDelete)
- ✅ **Scheduled Triggers** - Execute actions on a schedule using cron expressions
- ✅ **Webhook Triggers** - Trigger automations via HTTP webhooks
- ✅ **Powerful Actions**:
  - **Update Field** - Modify record field values
  - **Create Record** - Create new records
  - **Send Email** - Send email notifications
  - **HTTP Request** - Call external APIs
  - **Execute Script** - Run custom JavaScript/TypeScript code
- ✅ **Formula Fields**:
  - **Calculated Fields** - Runtime calculations
  - **Rollup Summary** - Aggregate data (SUM, COUNT, AVG, MIN, MAX)
  - **Auto-Number** - Generate sequential numbers
- ✅ **Template Interpolation** - Use {{field}} syntax in actions
- ✅ **Condition Evaluation** - Filter triggers with multiple conditions
- ✅ **Event Integration** - Emit events for automation lifecycle

## Installation

```bash
npm install @objectos/plugin-automation
```

## Quick Start

### 1. Install and Enable the Plugin

```typescript
import { createAutomationPlugin } from '@objectos/plugin-automation';

const automationPlugin = createAutomationPlugin({
    enabled: true,
    enableEmail: true,
    enableHttp: true,
    enableScriptExecution: true,
    maxExecutionTime: 30000,
});

// Install and enable
await automationPlugin.onInstall(context);
await automationPlugin.onEnable(context);
```

### 2. Create an Object Trigger Rule

```typescript
import type { AutomationRule } from '@objectos/plugin-automation';

const newUserWelcomeRule: AutomationRule = {
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
            body: 'Hi {{name}},\n\nWelcome aboard!',
        },
    ],
    priority: 100,
    createdAt: new Date(),
};

// Register the rule
await automationPlugin.registerRule(newUserWelcomeRule);
```

### 3. Create a Scheduled Trigger Rule

```typescript
const dailyReportRule: AutomationRule = {
    id: 'daily_report',
    name: 'Daily Sales Report',
    description: 'Generate daily sales report at 8 AM',
    status: 'active',
    trigger: {
        type: 'scheduled',
        cronExpression: '0 8 * * *', // Every day at 8:00 AM
        timezone: 'America/New_York',
    },
    actions: [
        {
            type: 'execute_script',
            script: `
                const sales = await ctx.context.getSalesData();
                ctx.logger.info('Sales report generated');
            `,
            language: 'javascript',
        },
    ],
    priority: 100,
    createdAt: new Date(),
};

await automationPlugin.registerRule(dailyReportRule);
```

## Object Triggers

### onCreate Trigger

Execute actions when a record is created:

```typescript
const rule: AutomationRule = {
    id: 'lead_created',
    name: 'New Lead Notification',
    status: 'active',
    trigger: {
        type: 'object.create',
        objectName: 'leads',
    },
    actions: [
        {
            type: 'create_record',
            objectName: 'tasks',
            fields: {
                subject: 'Follow up with {{name}}',
                leadId: '{{id}}',
                priority: 'high',
            },
        },
    ],
    createdAt: new Date(),
};
```

### onUpdate Trigger

Execute actions when a record is updated:

```typescript
const rule: AutomationRule = {
    id: 'high_value_opportunity',
    name: 'High Value Opportunity Alert',
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
            type: 'send_email',
            to: 'sales.manager@company.com',
            subject: 'High Value Opportunity: {{name}}',
            body: 'Amount: ${{amount}}',
        },
    ],
    createdAt: new Date(),
};
```

### onDelete Trigger

Execute actions when a record is deleted:

```typescript
const rule: AutomationRule = {
    id: 'account_deleted',
    name: 'Account Deletion Cleanup',
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
                const opps = await ctx.context.opportunities.filter({ 
                    accountId: ctx.context.id 
                });
                for (const opp of opps) {
                    await ctx.context.opportunities.update(opp.id, { 
                        status: 'archived' 
                    });
                }
            `,
        },
    ],
    createdAt: new Date(),
};
```

## Scheduled Triggers

Use cron expressions to schedule automations:

```typescript
// Daily at 8 AM
cronExpression: '0 8 * * *'

// Every hour
cronExpression: '0 * * * *'

// Every 15 minutes
cronExpression: '*/15 * * * *'

// Weekdays at 9 AM
cronExpression: '0 9 * * 1-5'

// First day of month at midnight
cronExpression: '0 0 1 * *'

// Quarterly (Jan, Apr, Jul, Oct 1st at 8 AM)
cronExpression: '0 8 1 1,4,7,10 *'
```

Example:

```typescript
const weeklyBackupRule: AutomationRule = {
    id: 'weekly_backup',
    name: 'Weekly Data Backup',
    status: 'active',
    trigger: {
        type: 'scheduled',
        cronExpression: '0 0 * * 0', // Sunday at midnight
        timezone: 'UTC',
    },
    actions: [
        {
            type: 'http_request',
            url: 'https://api.backup-service.com/trigger',
            method: 'POST',
            headers: {
                'Authorization': 'Bearer {{backup_api_key}}',
            },
            body: {
                type: 'full_backup',
                timestamp: '{{#now}}{{/now}}',
            },
        },
    ],
    createdAt: new Date(),
};
```

## Actions

### Update Field Action

Update field values on a record:

```typescript
{
    type: 'update_field',
    objectName: 'leads',
    recordId: '{{id}}',
    fields: {
        status: 'qualified',
        qualifiedAt: '{{#now}}{{/now}}',
    },
}
```

### Create Record Action

Create a new record:

```typescript
{
    type: 'create_record',
    objectName: 'tasks',
    fields: {
        subject: 'Follow up with {{name}}',
        contactId: '{{id}}',
        priority: 'high',
        dueDate: '{{#addDays}}{{#now}}{{/now}}7{{/addDays}}',
    },
}
```

### Send Email Action

Send email notifications:

```typescript
{
    type: 'send_email',
    to: '{{email}}',
    cc: ['manager@company.com'],
    subject: 'Welcome {{name}}!',
    body: 'Hi {{name}},\n\nWelcome to our platform!',
    isHtml: false,
}
```

### HTTP Request Action

Call external APIs:

```typescript
{
    type: 'http_request',
    url: 'https://api.external-service.com/webhook',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer {{api_token}}',
        'Content-Type': 'application/json',
    },
    body: {
        event: 'lead_created',
        leadId: '{{id}}',
        leadName: '{{name}}',
    },
    timeout: 5000,
}
```

### Execute Script Action

Run custom JavaScript code:

```typescript
{
    type: 'execute_script',
    script: `
        const lead = ctx.context;
        
        // Calculate lead score
        let score = 0;
        if (lead.annualRevenue > 1000000) score += 50;
        if (lead.employeeCount > 100) score += 30;
        if (lead.industry === 'Technology') score += 20;
        
        // Update the lead
        await ctx.context.update(lead.id, { 
            leadScore: score,
            scoredAt: new Date()
        });
        
        ctx.logger.info('Lead scored:', score);
    `,
    language: 'javascript',
    timeout: 10000,
}
```

## Formula Fields

### Calculated Fields

Runtime calculations based on record data:

```typescript
const fullNameFormula: FormulaField = {
    name: 'fullName',
    objectName: 'contacts',
    type: 'calculated',
    config: {
        type: 'calculated',
        expression: '{firstName} + " " + {lastName}',
        returnType: 'string',
    },
    createdAt: new Date(),
};

const ageFormula: FormulaField = {
    name: 'age',
    objectName: 'contacts',
    type: 'calculated',
    config: {
        type: 'calculated',
        expression: 'Math.floor((Date.now() - new Date({birthDate}).getTime()) / (365.25 * 24 * 60 * 60 * 1000))',
        returnType: 'number',
    },
    createdAt: new Date(),
};
```

### Rollup Summary Fields

Aggregate data from related records:

```typescript
// SUM
const totalOpportunityAmount: FormulaField = {
    name: 'totalOpportunityAmount',
    objectName: 'accounts',
    type: 'rollup',
    config: {
        type: 'rollup',
        relatedObject: 'opportunities',
        relationshipField: 'accountId',
        aggregateField: 'amount',
        operation: 'SUM',
    },
    createdAt: new Date(),
};

// COUNT
const numberOfContacts: FormulaField = {
    name: 'numberOfContacts',
    objectName: 'accounts',
    type: 'rollup',
    config: {
        type: 'rollup',
        relatedObject: 'contacts',
        relationshipField: 'accountId',
        aggregateField: 'id',
        operation: 'COUNT',
    },
    createdAt: new Date(),
};

// AVG
const averageDealSize: FormulaField = {
    name: 'averageDealSize',
    objectName: 'users',
    type: 'rollup',
    config: {
        type: 'rollup',
        relatedObject: 'opportunities',
        relationshipField: 'ownerId',
        aggregateField: 'amount',
        operation: 'AVG',
        conditions: [
            {
                field: 'stage',
                operator: 'equals',
                value: 'closed_won',
            },
        ],
    },
    createdAt: new Date(),
};
```

### Auto-Number Fields

Generate sequential numbers:

```typescript
const invoiceNumber: FormulaField = {
    name: 'invoiceNumber',
    objectName: 'invoices',
    type: 'autonumber',
    config: {
        type: 'autonumber',
        prefix: 'INV-',
        startingNumber: 10001,
        digits: 6,
    },
    createdAt: new Date(),
};

// Generates: INV-010001, INV-010002, INV-010003, ...
```

## Condition Operators

- `equals` - Field equals value
- `not_equals` - Field does not equal value
- `greater_than` - Field is greater than value
- `less_than` - Field is less than value
- `contains` - Field contains value (string)
- `starts_with` - Field starts with value (string)
- `ends_with` - Field ends with value (string)
- `changed` - Field value changed (update triggers only)

## Template Interpolation

Use `{{field}}` syntax to reference field values in actions:

```typescript
'Hi {{firstName}} {{lastName}}'          // Access record fields
'Account: {{account.name}}'              // Access related record fields
'Value: ${{amount}}'                     // Embed in strings
recordId: '{{id}}'                       // Use in action parameters
```

## API Reference

### AutomationPlugin

- `registerRule(rule)` - Register an automation rule
- `getRule(id)` - Get an automation rule
- `listRules(filter?)` - List automation rules
- `registerFormula(formula)` - Register a formula field
- `calculateFormula(objectName, fieldName, record)` - Calculate a formula field value
- `getTriggerEngine()` - Get the trigger engine
- `getActionExecutor()` - Get the action executor
- `getFormulaEngine()` - Get the formula engine

## Events

The plugin emits the following events:

- `automation.rule.created` - When a rule is created
- `automation.rule.executed` - When a rule is executed
- `automation.rule.failed` - When a rule execution fails
- `automation.trigger.fired` - When a trigger fires
- `automation.action.executed` - When an action is executed
- `automation.formula.calculated` - When a formula is calculated

## Examples

See the `/examples` directory for complete examples:

- `object-triggers.ts` - Object trigger examples
- `scheduled-triggers.ts` - Scheduled trigger examples
- `formula-fields.ts` - Formula field examples

## Testing

```bash
npm test
```

The plugin includes 94+ comprehensive tests covering:
- Trigger evaluation
- Action execution
- Formula calculations
- Storage operations
- Plugin lifecycle

## Security

- Script execution is disabled by default (set `enableScriptExecution: true` to enable)
- HTTP actions can be disabled with `enableHttp: false`
- Email actions can be disabled with `enableEmail: false`
- Action execution has configurable timeouts
- Template interpolation is sandboxed

## License

AGPL-3.0

## Contributing

Contributions are welcome! Please follow the ObjectOS contribution guidelines.
