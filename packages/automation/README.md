# @objectos/plugin-automation

No-Code Automation Engine for ObjectOS - **@objectstack/spec compliant**.

## Overview

The "IF This THEN That" engine for business objects. It allows administrators to define logic without writing code, following the **@objectstack/spec** automation protocol.

## Spec Compliance

This package implements the automation specification from [@objectstack/spec](https://github.com/objectstack-ai/spec):

- ✅ **WorkflowRule**: Spec-compliant automation rule format
- ✅ **WorkflowAction**: All action types (field_update, email_alert, http_call, connector_action, task_creation, push_notification, custom_script)
- ✅ **TimeTrigger**: Time-based triggers with offset calculations
- ✅ **WorkflowTriggerType**: Standard trigger types (on_create, on_update, on_create_or_update, on_delete, schedule)

## Features

- ✅ **Triggers** (spec-compliant):
  - `on_create`, `on_update`, `on_create_or_update`, `on_delete`
  - `schedule` (Time-based with cron)
  - Time triggers (before/after date fields)
- ✅ **Conditions**: Filter logic with formula criteria
- ✅ **Actions** (spec-compliant):
  - `field_update`: Modify record fields
  - `email_alert`: Send email notifications
  - `http_call`: Call external APIs
  - `connector_action`: Integrate with connectors (Slack, Twilio, etc.)
  - `task_creation`: Create tasks
  - `push_notification`: Send push notifications
  - `custom_script`: Execute JavaScript/TypeScript/Python scripts
- ✅ **Formulas**: Spreadsheet-like formula engine for calculated fields

## Examples

See [examples/spec-compliant/](./examples/spec-compliant/) for complete working examples:

- **big-deal-notification.yml** - High-value opportunity alerts with time-based follow-ups
- **lead-nurture.yml** - 14-day automated lead nurture campaign
- **connector-integration.yml** - Salesforce and Slack integration
- **custom-script.yml** - Advanced opportunity scoring with JavaScript

Each example demonstrates different aspects of the spec-compliant WorkflowRule format.

## Usage (Spec-Compliant Format)

```yaml
# Example: Big deal alert automation
name: big_deal_alert
objectName: c_opportunity
triggerType: on_create
criteria: 'amount > 100000'
actions:
  - name: notify_manager
    type: email_alert
    template: big_deal_template
    recipients:
      - manager@company.com
  - name: create_task
    type: task_creation
    taskObject: task
    subject: 'Review big deal'
    assignedTo: 'manager_id'
active: true
```

## TypeScript Usage

```typescript
import type { WorkflowRule, WorkflowAction } from '@objectos/automation';

// Spec-compliant automation rule
const rule: WorkflowRule = {
  name: 'lead_follow_up',
  objectName: 'lead',
  triggerType: 'on_create',
  criteria: 'status == "new"',
  actions: [
    {
      name: 'send_welcome',
      type: 'email_alert',
      template: 'welcome_email',
      recipients: ['{{email}}'],
    },
    {
      name: 'create_task',
      type: 'task_creation',
      taskObject: 'task',
      subject: 'Follow up with {{name}}',
      assignedTo: '{{owner_id}}',
    },
  ],
  timeTriggers: [
    {
      timeLength: 1,
      timeUnit: 'days',
      offsetDirection: 'after',
      offsetFrom: 'trigger_date',
      actions: [
        {
          name: 'reminder',
          type: 'push_notification',
          title: 'Follow-up reminder',
          body: 'Remember to follow up with {{name}}',
          recipients: ['{{owner_id}}'],
        },
      ],
    },
  ],
  active: true,
};
```

## Migration from Legacy Format

The package maintains backward compatibility with legacy automation formats:

```typescript
// Legacy format (still supported)
const legacyRule: AutomationRule = {
  id: 'rule-123',
  name: 'My Rule',
  status: 'active',
  trigger: {
    type: 'object.create',
    objectName: 'lead',
  },
  actions: [
    {
      type: 'send_email', // Legacy: now 'email_alert'
      to: 'user@example.com',
      subject: 'New Lead',
      body: 'A new lead was created',
    },
  ],
  createdAt: new Date(),
};
```

## Development Plan

- [x] **@objectstack/spec Compliance**: Align with automation specification
- [ ] **Graphical Editor**: Drag-and-drop flow builder
- [ ] **Formula Engine Upgrade**: Support cross-object formulas (`account.owner.name`)
- [ ] **Debug Mode**: Trace execution of automation rules for troubleshooting
- [ ] **Loop Actions**: Iterate over child records (e.g., "Update all Order Items")

## API Reference

See [type definitions](./src/types.ts) for the complete API including:

- `WorkflowRule`: Spec-compliant automation rule
- `WorkflowAction`: Discriminated union of all action types
- `TimeTrigger`: Scheduled action configuration
- `AutomationStorage`: Storage interface for rules and formulas
