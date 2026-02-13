# @objectos/plugin-workflow

Enterprise-Grade Finite State Machine (FSM) Engine - **@objectstack/spec compliant**.

## Overview

Manages complex business processes that require strict state transitions, approval steps, and user intervention. Unlike simple Automation, Workflows have "State" and "Duration", following the **@objectstack/spec** automation protocol.

## Spec Compliance

This package aligns with the automation specification from [@objectstack/spec](https://github.com/objectstack-ai/spec):

- ✅ **Flow**: Visual workflow definition format (spec-compliant)
- ✅ **FlowNode**: Workflow step types (start, end, decision, assignment, loop, actions, etc.)
- ✅ **FlowEdge**: Connections between workflow steps
- ✅ **ApprovalProcess**: Multi-level approval workflow configuration
- ✅ **ApprovalStep**: Individual approval step definition

## Features

- ✅ **BPMN-Lite**: Supports States, Transitions, Guards, and Actions
- ✅ **Approval Processes**: Built-in support for "submit for approval", "approve", "reject"
- ✅ **Visual Definition**: Defined in YAML/JSON, compatible with spec Flow format
- ✅ **History**: Complete audit trail of state changes and approver comments
- ✅ **Timeouts**: "Escalate if stuck in 'Pending' for > 3 days"

## Examples

See [examples/spec-compliant/](./examples/spec-compliant/) for spec-compliant Flow format examples:

- **leave-request-flow.yml** - Multi-level leave approval with auto-approval
- **order-fulfillment-flow.yml** - E-commerce order processing with inventory
- **multi-approval-flow.yml** - Expense approval with threshold-based routing

See [examples/](./examples/) for legacy state machine format examples:

- **approval-workflow.yaml** - Document approval process
- **sequential-workflow.yaml** - Order fulfillment steps
- **conditional-workflow.yaml** - Conditional branching
- **parallel-workflow.yaml** - Parallel execution paths

Both formats are fully supported.

## Usage (YAML - Legacy Format)

```yaml
# This format is still supported for backward compatibility
name: leave_request
initial_state: draft
states:
  draft:
    on:
      submit:
        target: pending_approval
        guard: valid_dates
  pending_approval:
    on:
      approve: approved
      reject: rejected
```

## Usage (Spec-Compliant Flow Format)

```yaml
# Flow format aligned with @objectstack/spec
name: leave_request_flow
label: Leave Request Approval
type: record_change
status: active
variables:
  - name: request_id
    type: text
    isInput: true
  - name: days_count
    type: number
    isInput: true
nodes:
  - id: start_1
    type: start
    label: Start
  - id: decision_1
    type: decision
    label: Check days count
    condition: '{{days_count}} > 5'
  - id: approval_1
    type: approval
    label: Manager Approval
    approver: '{{manager_id}}'
  - id: end_approved
    type: end
    label: Approved
edges:
  - id: edge_1
    source: start_1
    target: decision_1
  - id: edge_2
    source: decision_1
    target: approval_1
    condition: true
  - id: edge_3
    source: approval_1
    target: end_approved
```

## TypeScript Usage

```typescript
import type { Flow, FlowNode, ApprovalProcess } from '@objectos/workflow';

// Spec-compliant Flow definition
const leaveFlow: Flow = {
  name: 'leave_approval',
  label: 'Leave Request Approval',
  type: 'record_change',
  status: 'active',
  variables: [
    { name: 'request_id', type: 'text', isInput: true },
    { name: 'approver', type: 'text', isInput: true },
  ],
  nodes: [
    { id: 'start', type: 'start', label: 'Start' },
    { id: 'approve', type: 'end', label: 'Approved' },
  ],
  edges: [{ id: 'e1', source: 'start', target: 'approve' }],
  version: 1,
};

// Approval process configuration
const approvalProcess: ApprovalProcess = {
  name: 'multi_level_approval',
  steps: [
    {
      step: 1,
      approver: 'manager',
      required: true,
    },
    {
      step: 2,
      approver: 'director',
      required: true,
    },
  ],
  allowParallel: false,
};
```

## Migration from Legacy Format

The package maintains backward compatibility with legacy workflow definitions:

```typescript
// Legacy format (still supported)
const legacyWorkflow: WorkflowDefinition = {
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
          target: 'pending',
          guards: ['valid_dates'],
        },
      },
    },
    pending: {
      name: 'pending',
      transitions: {
        approve: { target: 'approved' },
        reject: { target: 'rejected' },
      },
    },
    approved: {
      name: 'approved',
      final: true,
    },
    rejected: {
      name: 'rejected',
      final: true,
    },
  },
};
```

## Conversion Utilities (Coming Soon)

Utilities to convert between legacy WorkflowDefinition and spec-compliant Flow formats:

```typescript
// Future API
import { convertToFlow, convertFromFlow } from '@objectos/workflow/converters';

const flow = convertToFlow(legacyWorkflow);
const legacy = convertFromFlow(flow);
```

## Development Plan

- [x] **@objectstack/spec Compliance**: Align with Flow specification
- [ ] **Format Converters**: Legacy ↔ Flow conversion utilities
- [ ] **BPMN 2.0 Import**: Support standard BPMN XML import
- [ ] **Parallel Gateways**: Support split/join flows (multiple approvers)
- [ ] **Visual Designer**: Canvas-based workflow editor
- [ ] **Sub-processes**: Call another workflow from within a workflow
- [ ] **SLA Management**: Service Level Agreement tracking on steps

## API Reference

See [type definitions](./src/types.ts) for the complete API including:

- `Flow`: Spec-compliant visual workflow definition
- `FlowNode`: Workflow step types and configuration
- `FlowEdge`: Workflow connections
- `ApprovalProcess`: Multi-level approval configuration
- `WorkflowDefinition`: Legacy state machine format (still supported)
