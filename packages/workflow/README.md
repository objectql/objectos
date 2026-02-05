# @objectos/plugin-workflow

Enterprise-Grade Finite State Machine (FSM) Engine.

## Overview

Manages complex business processes that require strict state transitions, approval steps, and user intervention. Unlike simple Automation, Workflows have "State" and "Duration".

## Features

- ✅ **BPMN-Lite**: Supports States, Transitions, Guards, and Actions.
- ✅ **Approval Processes**: Built-in support for "submit for approval", "approve", "reject".
- ✅ **Visual Definition**: Defined in YAML/JSON, renderable as diagrams.
- ✅ **History**: Complete audit trail of state changes and approver comments.
- ✅ **Timeouts**: "Escalate if stuck in 'Pending' for > 3 days".

## Usage (YAML)

```yaml
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

## Development Plan

- [ ] **BPMN 2.0 Import**: Support standard BPMN XML import.
- [ ] **Parallel Gateways**: Support split/join flows (multiple approvers).
- [ ] **Visual Designer**: Canvas-based workflow editor.
- [ ] **Sub-processes**: Call another workflow from within a workflow.
- [ ] **SLA Management**: Service Level Agreement tracking on steps.
