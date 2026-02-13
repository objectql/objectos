# Spec-Compliant Workflow Examples

This directory contains workflow examples that follow the [@objectstack/spec](https://github.com/objectstack-ai/spec) Flow schema.

## Examples

### 1. leave-request-flow.yml

Multi-level leave approval with threshold-based auto-approval.

**Features:**

- Decision nodes for conditional routing
- Assignment nodes for approvals
- Auto-approval for short leaves (≤3 days)
- Manager approval for 4-14 days
- Director approval for >14 days
- Variables for input/output

**Use Case:** Employee leave requests with automatic approval for short leaves and escalation for extended leaves.

### 2. order-fulfillment-flow.yml

Complete e-commerce order processing flow.

**Features:**

- HTTP request nodes for payment processing
- Get/Update record nodes for inventory
- Create record for shipment
- Connector actions for customer notifications
- Error handling paths
- Sequential process with branching

**Use Case:** Process online orders from payment to shipping with inventory management and error handling.

### 3. multi-approval-flow.yml

Threshold-based multi-level expense approval.

**Features:**

- Dynamic routing based on amount
- Parallel approval chains
- Manager → Director → Finance escalation
- Assignment nodes with due dates
- Decision nodes for approval/rejection
- Different paths for different amounts

**Use Case:** Expense report approvals with amount-based routing and multi-level sign-off.

## Schema Reference

These examples conform to the Flow schema from @objectstack/spec:

```yaml
name: string # Machine name (lowercase_snake_case)
label: string # Display name
type: enum # autolaunched | record_change | schedule | screen | api
status: enum # draft | active | obsolete | invalid
version: number # Version number
variables: array # Flow variables (inputs/outputs)
nodes: array # Flow steps
edges: array # Connections between nodes
```

## Node Types

All major Flow node types are demonstrated:

| Node Type          | Example                           | Description           |
| ------------------ | --------------------------------- | --------------------- |
| `start`            | All                               | Flow entry point      |
| `end`              | All                               | Flow termination      |
| `decision`         | All                               | Conditional branching |
| `assignment`       | leave-request, multi-approval     | Assign tasks          |
| `create_record`    | order-fulfillment                 | Create records        |
| `update_record`    | order-fulfillment, multi-approval | Update records        |
| `get_record`       | order-fulfillment                 | Query records         |
| `http_request`     | order-fulfillment, multi-approval | External API calls    |
| `connector_action` | order-fulfillment, multi-approval | Connector integration |

## Visual Layout

Nodes include `position` coordinates for visual rendering:

```yaml
nodes:
  - id: start
    type: start
    label: Start
    position:
      x: 100
      y: 100

  - id: approval
    type: assignment
    label: Manager Approval
    position:
      x: 300
      y: 100
```

This enables rendering in visual workflow designers like React Flow or BPMN.js.

## Variables

Flows support input and output variables:

```yaml
variables:
  - name: request_id
    type: text
    isInput: true # Input parameter

  - name: final_status
    type: text
    isOutput: true # Output parameter
```

## Edges (Connections)

Edges define flow between nodes with optional conditions:

```yaml
edges:
  - id: e1
    source: decision_node
    target: approved_node
    condition: 'true'
    label: 'Approved'

  - id: e2
    source: decision_node
    target: rejected_node
    condition: 'false'
    label: 'Rejected'
```

## Usage

Load and execute a Flow:

```typescript
import type { Flow } from '@objectos/workflow';
import { FlowSchema } from '@objectstack/spec/automation';
import yaml from 'js-yaml';
import fs from 'fs';

// Load Flow definition
const content = fs.readFileSync('leave-request-flow.yml', 'utf8');
const flow = yaml.load(content) as Flow;

// Validate against spec schema
const validated = FlowSchema.parse(flow);

// Execute with workflow API
const instance = await workflowAPI.startFlow(validated, {
  request_id: 'REQ-001',
  employee_id: 'EMP-123',
  days_count: 5,
  start_date: '2024-03-01',
  manager_id: 'MGR-456',
});

// Check instance status
console.log(instance.status); // 'running' | 'completed' | 'failed'
```

## Visual Representation

The Flow format is designed for visual workflow designers:

```
[Start] → [Decision] → [Assignment] → [End]
              ↓
          [Rejected] → [End]
```

Each node's position property enables automatic layout in visual editors.

## Comparison with Legacy Format

### Legacy State Machine Format

```yaml
name: leave_request
states:
  draft:
    transitions:
      submit: pending
```

### Spec-Compliant Flow Format

```yaml
name: leave_request_flow
nodes:
  - id: draft
    type: start
  - id: pending
    type: assignment
edges:
  - source: draft
    target: pending
    label: submit
```

The Flow format is more visual and suitable for graphical workflow designers, while the state machine format is more concise for simple workflows.

## Node Configuration

Different node types have specific configuration:

**Assignment Node:**

```yaml
- id: approval
  type: assignment
  config:
    assignee: '{{manager_id}}'
    dueInDays: 3
```

**HTTP Request Node:**

```yaml
- id: payment
  type: http_request
  config:
    url: 'https://api.payment.com/charge'
    method: POST
    body: |
      {
        "amount": {{total_amount}}
      }
```

**Decision Node:**

```yaml
- id: check_amount
  type: decision
  condition: '{{amount}} > 1000'
```

## See Also

- [Flow Schema](https://github.com/objectstack-ai/spec/blob/main/json-schema/automation/Flow.json)
- [FlowNode Schema](https://github.com/objectstack-ai/spec/blob/main/json-schema/automation/FlowNode.json)
- [FlowEdge Schema](https://github.com/objectstack-ai/spec/blob/main/json-schema/automation/FlowEdge.json)
- [Migration Guide](../../../MIGRATION_SPEC.md)
- [Legacy Examples](../) - State machine format examples
