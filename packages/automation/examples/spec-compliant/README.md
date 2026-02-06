# Spec-Compliant Automation Examples

This directory contains automation rule examples that follow the [@objectstack/spec](https://github.com/objectstack-ai/spec) WorkflowRule schema.

## Examples

1. **big-deal-notification.yml** - Demonstrates immediate and time-based actions for high-value opportunities
2. Additional examples to be added

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

- `field_update` - Update a field value
- `email_alert` - Send email notification
- `http_call` - Make HTTP request
- `connector_action` - Call a connector (Slack, Salesforce, etc.)
- `task_creation` - Create a task
- `push_notification` - Send push notification
- `custom_script` - Execute JavaScript/TypeScript/Python

## Usage

Load these examples in your ObjectOS application:

```typescript
import { WorkflowRuleSchema } from '@objectstack/spec/automation';
import yaml from 'js-yaml';
import fs from 'fs';

// Load and validate
const content = fs.readFileSync('big-deal-notification.yml', 'utf8');
const rule = yaml.load(content);
const validated = WorkflowRuleSchema.parse(rule);

// Register with automation engine
await automationAPI.registerRule(validated);
```
