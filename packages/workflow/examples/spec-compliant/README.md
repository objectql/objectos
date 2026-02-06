# Spec-Compliant Workflow Examples

This directory contains workflow examples that follow the [@objectstack/spec](https://github.com/objectstack-ai/spec) Flow schema.

## Examples

1. **leave-request-flow.yml** - Multi-level approval workflow using visual Flow format

## Schema Reference

These examples conform to the Flow schema from @objectstack/spec:

```yaml
name: string         # Machine name (lowercase_snake_case)
label: string        # Display name
type: enum           # autolaunched | record_change | schedule | screen | api
status: enum         # draft | active | obsolete | invalid
version: number      # Version number
variables: array     # Flow variables (inputs/outputs)
nodes: array         # Flow steps
edges: array         # Connections between nodes
```

## Node Types

- `start` - Flow entry point
- `end` - Flow termination point
- `decision` - Conditional branching
- `assignment` - Assign task to user
- `loop` - Iterate over collection
- `create_record` - Create a record
- `update_record` - Update a record
- `delete_record` - Delete a record
- `get_record` - Query records
- `http_request` - Make HTTP call
- `script` - Execute custom code
- `wait` - Pause execution
- `subflow` - Call another flow
- `connector_action` - Call connector

## Usage

Load and execute a Flow:

```typescript
import type { Flow } from '@objectos/workflow';
import yaml from 'js-yaml';
import fs from 'fs';

// Load Flow definition
const content = fs.readFileSync('leave-request-flow.yml', 'utf8');
const flow: Flow = yaml.load(content);

// Execute with workflow API
const instance = await workflowAPI.startFlow(flow, {
  request_id: 'REQ-001',
  employee_id: 'EMP-123',
  days_count: 5,
  start_date: '2024-03-01',
  manager_id: 'MGR-456'
});
```

## Visual Representation

The Flow format is designed to be rendered visually. Each node has a `position` property for layout, and edges define connections. This makes it compatible with visual workflow designers like:

- React Flow
- BPMN.js
- Workflow visualization tools

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
