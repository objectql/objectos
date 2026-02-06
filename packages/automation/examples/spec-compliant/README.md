# Spec-Compliant Automation Examples

This directory contains automation rule examples that follow the [@objectstack/spec](https://github.com/objectstack-ai/spec) WorkflowRule schema.

## Examples

### 1. big-deal-notification.yml
Demonstrates immediate and time-based actions for high-value opportunities.

**Features:**
- Field updates (mark_high_priority)
- Email alerts (notify_sales_manager)
- Task creation (create_follow_up_task)
- Time-based triggers (1-day reminder)

**Use Case:** Alert sales team when high-value opportunities are created and schedule follow-up reminders.

### 2. lead-nurture.yml
Complete lead nurturing campaign with auto-assignment.

**Features:**
- Round-robin assignment with LOOKUP function
- Email sequences (welcome, educational, case study)
- Task creation for sales reps
- Push notifications
- Multi-day nurture sequence (Day 2, 5, 7, 14)
- Automatic status updates

**Use Case:** Automatically assign new website leads to sales reps and run a 14-day nurture campaign.

### 3. connector-integration.yml
Integration with external systems using connectors and HTTP.

**Features:**
- Salesforce connector (upsert_account)
- Slack connector (send_message with blocks)
- HTTP call to analytics platform
- Environment variable usage

**Use Case:** Sync account data to Salesforce, notify team in Slack, and track in analytics platform.

### 4. custom-script.yml
Advanced scoring logic using JavaScript.

**Features:**
- Custom JavaScript execution
- Complex scoring algorithm
- Multi-factor calculations (amount, stage, age, velocity)
- Script result usage in subsequent actions

**Use Case:** Calculate opportunity score based on multiple factors and alert VP for high-value deals.

## Schema Reference

These examples conform to the WorkflowRule schema from @objectstack/spec:

```yaml
name: string          # Unique name (lowercase snake_case)
objectName: string    # Target object
triggerType: enum     # on_create | on_update | on_create_or_update | on_delete | schedule
criteria: string      # Formula condition (optional)
actions: array        # Immediate actions
timeTriggers: array   # Time-based actions (optional)
active: boolean       # Whether rule is active
reevaluateOnChange: boolean  # Re-evaluate on field changes
```

## Action Types

All spec-compliant action types are demonstrated:

| Action Type | Example File | Description |
|-------------|--------------|-------------|
| `field_update` | big-deal-notification.yml | Update field values |
| `email_alert` | lead-nurture.yml | Send email notifications |
| `task_creation` | lead-nurture.yml | Create tasks |
| `push_notification` | big-deal-notification.yml | Send push notifications |
| `connector_action` | connector-integration.yml | Call external connectors |
| `http_call` | connector-integration.yml | Make HTTP requests |
| `custom_script` | custom-script.yml | Execute custom code |

## TimeTrigger Usage

Time-based actions support:
- `timeUnit`: minutes, hours, days
- `offsetDirection`: before, after
- `offsetFrom`: trigger_date, date_field

**Example:**
```yaml
timeTriggers:
  - timeLength: 7
    timeUnit: days
    offsetDirection: after
    offsetFrom: trigger_date
    actions:
      - name: reminder
        type: email_alert
        template: reminder_email
        recipients: ["{{owner.email}}"]
```

## Formula Functions

Examples use ObjectQL formula functions:

- `LOOKUP(object, field, value, returnField)` - Lookup values
- `TODAY()` - Current date
- `NOW()` - Current timestamp
- `ISCHANGED(field)` - Detect field changes
- `ENV.VAR_NAME` - Access environment variables

## Usage

Load and register these examples:

```typescript
import { WorkflowRuleSchema } from '@objectstack/spec/automation';
import yaml from 'js-yaml';
import fs from 'fs';

// Load and validate
const content = fs.readFileSync('big-deal-notification.yml', 'utf8');
const rule = yaml.load(content);

// Validate against spec schema
const validated = WorkflowRuleSchema.parse(rule);

// Register with automation engine
await automationAPI.registerRule(validated);
```

## Testing

Test automation rules:

```typescript
import { AutomationEngine } from '@objectos/automation';

const engine = new AutomationEngine();
await engine.loadRule(validated);

// Trigger with test data
await engine.trigger('on_create', {
  objectName: 'opportunity',
  record: {
    _id: 'OPP-001',
    name: 'Big Deal Corp',
    amount: 150000,
    stage: 'new'
  }
});
```

## See Also

- [WorkflowRule Schema](https://github.com/objectstack-ai/spec/blob/main/json-schema/automation/WorkflowRule.json)
- [WorkflowAction Schema](https://github.com/objectstack-ai/spec/blob/main/json-schema/automation/WorkflowAction.json)
- [TimeTrigger Schema](https://github.com/objectstack-ai/spec/blob/main/json-schema/automation/TimeTrigger.json)
- [Migration Guide](../../../MIGRATION_SPEC.md)
