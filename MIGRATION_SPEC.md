# Migration Guide: @objectstack/spec Compliance

This guide helps you migrate existing automation rules and workflows to the @objectstack/spec compliant format.

## Overview

Both `@objectos/automation` and `@objectos/workflow` packages have been refactored to align with the [@objectstack/spec](https://github.com/objectstack-ai/spec) automation specification while maintaining backward compatibility.

## Automation Package (@objectos/automation)

### Key Changes

1. **Primary Types**: Now imported from `@objectstack/spec/automation`
   - `WorkflowRule` - Spec-compliant automation rule
   - `WorkflowAction` - Discriminated union of action types
   - `TimeTrigger` - Time-based trigger configuration

2. **Action Type Names**: Updated to match spec
   - `update_field` → `field_update`
   - `send_email` → `email_alert`
   - `http_request` → `http_call`
   - `execute_script` → `custom_script`

3. **Trigger Type Names**: Standardized
   - `object.create` → `on_create`
   - `object.update` → `on_update`
   - `object.delete` → `on_delete`
   - `scheduled` → `schedule`

### Migration Example

#### Before (Legacy Format)

```typescript
import { AutomationRule } from '@objectos/automation';

const rule: AutomationRule = {
  id: 'rule-123',
  name: 'Big Deal Alert',
  status: 'active',
  trigger: {
    type: 'object.create',
    objectName: 'opportunity'
  },
  actions: [
    {
      type: 'send_email',
      to: 'manager@company.com',
      subject: 'New Big Deal',
      body: 'A new opportunity was created'
    },
    {
      type: 'update_field',
      objectName: 'opportunity',
      recordId: '{{id}}',
      fields: {
        status: 'pending_review'
      }
    }
  ],
  createdAt: new Date(),
  priority: 10
};
```

#### After (Spec-Compliant Format)

```typescript
import type { WorkflowRule } from '@objectos/automation';

const rule: WorkflowRule = {
  name: 'big_deal_alert',
  objectName: 'opportunity',
  triggerType: 'on_create',
  criteria: 'amount > 100000',
  actions: [
    {
      name: 'notify_manager',
      type: 'email_alert',
      template: 'big_deal_template',
      recipients: ['manager@company.com']
    },
    {
      name: 'update_status',
      type: 'field_update',
      field: 'status',
      value: 'pending_review'
    }
  ],
  active: true,
  reevaluateOnChange: false
};
```

### YAML Format

#### Before
```yaml
automations:
  - name: "Big Deal Alert"
    object: "opportunity"
    trigger: "on_create"
    condition: "amount > 100000"
    actions:
      - type: "notification"
        params:
          to: "manager"
```

#### After (Spec-Compliant)
```yaml
name: big_deal_alert
objectName: opportunity
triggerType: on_create
criteria: "amount > 100000"
actions:
  - name: notify_manager
    type: email_alert
    template: big_deal_template
    recipients:
      - manager@company.com
active: true
```

## Workflow Package (@objectos/workflow)

### Key Changes

1. **Primary Types**: Now include spec-compliant Flow types
   - `Flow` - Visual workflow definition (from spec)
   - `FlowNode` - Workflow step types
   - `FlowEdge` - Workflow connections
   - `ApprovalProcess` - Multi-level approval configuration

2. **Dual Format Support**:
   - Legacy: `WorkflowDefinition` (state machine format)
   - Spec: `Flow` (visual flow format)

### Migration Example

#### Legacy State Machine Format (Still Supported)

```typescript
import { WorkflowDefinition } from '@objectos/workflow';

const workflow: WorkflowDefinition = {
  id: 'leave_request',
  name: 'Leave Request',
  type: 'approval',
  version: '1.0.0',
  initialState: 'draft',
  states: {
    draft: {
      name: 'draft',
      initial: true,
      transitions: {
        submit: {
          target: 'pending_approval',
          guards: ['valid_dates']
        }
      }
    },
    pending_approval: {
      name: 'pending_approval',
      transitions: {
        approve: { target: 'approved' },
        reject: { target: 'rejected' }
      }
    },
    approved: {
      name: 'approved',
      final: true
    },
    rejected: {
      name: 'rejected',
      final: true
    }
  }
};
```

#### Spec-Compliant Flow Format (Recommended)

```typescript
import type { Flow } from '@objectos/workflow';

const workflow: Flow = {
  name: 'leave_request_flow',
  label: 'Leave Request Approval',
  type: 'record_change',
  status: 'active',
  variables: [
    {
      name: 'request_id',
      type: 'text',
      isInput: true
    },
    {
      name: 'days',
      type: 'number',
      isInput: true
    }
  ],
  nodes: [
    {
      id: 'start',
      type: 'start',
      label: 'Start',
      position: { x: 0, y: 0 }
    },
    {
      id: 'check_days',
      type: 'decision',
      label: 'Check Days',
      condition: '{{days}} > 5',
      position: { x: 100, y: 0 }
    },
    {
      id: 'manager_approval',
      type: 'assignment',
      label: 'Manager Approval',
      config: {
        assignee: '{{manager_id}}'
      },
      position: { x: 200, y: 0 }
    },
    {
      id: 'approved',
      type: 'end',
      label: 'Approved',
      position: { x: 300, y: 0 }
    },
    {
      id: 'rejected',
      type: 'end',
      label: 'Rejected',
      position: { x: 300, y: 100 }
    }
  ],
  edges: [
    {
      id: 'e1',
      source: 'start',
      target: 'check_days',
      label: 'Submit'
    },
    {
      id: 'e2',
      source: 'check_days',
      target: 'manager_approval',
      condition: 'true',
      label: 'Needs Approval'
    },
    {
      id: 'e3',
      source: 'check_days',
      target: 'approved',
      condition: 'false',
      label: 'Auto-Approve'
    },
    {
      id: 'e4',
      source: 'manager_approval',
      target: 'approved',
      label: 'Approve'
    },
    {
      id: 'e5',
      source: 'manager_approval',
      target: 'rejected',
      label: 'Reject'
    }
  ],
  version: 1
};
```

### YAML Format

#### Legacy Format (Still Supported)
```yaml
name: leave_request
type: approval
version: "1.0.0"
states:
  draft:
    initial: true
    transitions:
      submit:
        target: pending_approval
  pending_approval:
    transitions:
      approve:
        target: approved
      reject:
        target: rejected
  approved:
    final: true
  rejected:
    final: true
```

#### Spec-Compliant Flow Format
```yaml
name: leave_request_flow
label: Leave Request Approval
type: record_change
status: active
version: 1
variables:
  - name: request_id
    type: text
    isInput: true
nodes:
  - id: start
    type: start
    label: Start
  - id: approval
    type: assignment
    label: Manager Approval
  - id: end_approved
    type: end
    label: Approved
edges:
  - id: e1
    source: start
    target: approval
  - id: e2
    source: approval
    target: end_approved
```

## Backward Compatibility

### Automation Package

All legacy types are still supported:
- `AutomationRule` (with `id`, `status`, etc.)
- `TriggerConfig` union types
- Legacy action configurations

The package will continue to accept both formats during the transition period.

### Workflow Package

Both formats are supported:
- `WorkflowDefinition` (state machine format)
- `Flow` (spec-compliant visual format)

The workflow engine currently uses the legacy format internally. A future update will add:
- Conversion utilities (`convertToFlow`, `convertFromFlow`)
- Native Flow format execution
- Storage adapters for both formats

## Recommended Migration Path

1. **Phase 1**: Update imports to use new type names
   ```typescript
   // Before
   import { AutomationRule } from '@objectos/automation';
   
   // After
   import type { WorkflowRule } from '@objectos/automation';
   ```

2. **Phase 2**: Update your data format gradually
   - Start with new automations/workflows using spec format
   - Keep existing ones in legacy format
   - Both formats work side-by-side

3. **Phase 3**: Use conversion utilities (when available)
   ```typescript
   import { migrateToSpec } from '@objectos/automation/migrate';
   
   const specRule = migrateToSpec(legacyRule);
   ```

## Benefits of Migration

1. **Interoperability**: Works with all @objectstack ecosystem tools
2. **Validation**: Leverage JSON Schema validation from @objectstack/spec
3. **Future-Proof**: Aligned with the protocol specification
4. **Better Tooling**: Enhanced IDE support and documentation
5. **Ecosystem Integration**: Compatible with @objectstack/cli and other tools

## Need Help?

- Check the [spec documentation](https://github.com/objectstack-ai/spec)
- See example workflows in `packages/workflow/examples/`
- See example automations in `packages/automation/examples/`
- Open an issue on GitHub for migration questions
