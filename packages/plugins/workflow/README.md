# @objectos/plugin-workflow

A comprehensive workflow and state machine plugin for ObjectOS, providing finite state machine (FSM) execution, YAML-based workflow definitions, and workflow management.

## Features

- ✅ **Finite State Machine (FSM) Engine** - Execute workflows as state machines with well-defined states and transitions
- ✅ **YAML Workflow Definitions** - Define workflows in declarative YAML format
- ✅ **State Transitions with Guards** - Control transitions with guard conditions (sync/async)
- ✅ **Transition Actions** - Execute actions during state transitions
- ✅ **Workflow Versioning** - Support for multiple versions of workflows
- ✅ **Multiple Workflow Types**:
  - **Approval Workflows** - Multi-level approval processes
  - **Sequential Workflows** - Step-by-step linear processes
  - **Parallel Workflows** - Concurrent execution paths
  - **Conditional Workflows** - Dynamic branching based on conditions
- ✅ **Task Management** - Create, complete, and track workflow tasks
- ✅ **State History** - Track all state transitions with full audit trail
- ✅ **Event Integration** - Emit events for workflow lifecycle

## Installation

```bash
npm install @objectos/plugin-workflow
```

## Quick Start

### 1. Install and Enable the Plugin

```typescript
import { WorkflowPlugin } from '@objectos/plugin-workflow';

const workflowPlugin = new WorkflowPlugin({
    enabled: true,
    defaultTimeout: 3600000, // 1 hour
    maxTransitions: 1000,
});

// Initialize and start
await workflowPlugin.init(context);
await workflowPlugin.start(context);
```

### 2. Define a Workflow in YAML

Create a file `approval-workflow.yaml`:

```yaml
name: "Document Approval"
description: "Multi-level approval workflow"
type: approval
version: "1.0.0"

states:
  draft:
    initial: true
    transitions:
      submit: pending_approval
    on_enter:
      - log_created
  
  pending_approval:
    transitions:
      approve: approved
      reject: rejected
    on_enter:
      - notify_approver
  
  approved:
    final: true
    on_enter:
      - send_approval_notification
  
  rejected:
    final: true
    on_enter:
      - send_rejection_notification
```

### 3. Load and Use the Workflow

```typescript
import { parseWorkflowYAML, WorkflowAPI, InMemoryWorkflowStorage } from '@objectos/plugin-workflow';
import * as fs from 'fs';

// Parse YAML workflow
const yamlContent = fs.readFileSync('approval-workflow.yaml', 'utf-8');
const workflowDef = parseWorkflowYAML(yamlContent, 'document_approval');

// Create API and storage
const storage = new InMemoryWorkflowStorage();
const api = new WorkflowAPI(storage);

// Register the workflow
await api.registerWorkflow(workflowDef);

// Start a workflow instance
const instance = await api.startWorkflow(
    'document_approval',
    { title: 'Q4 Budget', author: 'John Doe' },
    'user_123'
);

console.log('Started workflow:', instance.id);
console.log('Current state:', instance.currentState);

// Execute a transition
const updated = await api.executeTransition(
    instance.id,
    'submit',
    'user_123'
);

console.log('New state:', updated.currentState);
```

## Workflow Types

### Approval Workflow

Multi-level approval processes with sequential approvers.

```yaml
name: "Purchase Order Approval"
type: approval
states:
  draft:
    initial: true
    transitions:
      submit: pending_manager
  pending_manager:
    transitions:
      approve: pending_finance
      reject: rejected
  pending_finance:
    transitions:
      approve: approved
      reject: rejected
  approved:
    final: true
  rejected:
    final: true
```

### Sequential Workflow

Linear step-by-step processes.

```yaml
name: "Order Fulfillment"
type: sequential
states:
  received:
    initial: true
    transitions:
      process: payment_processing
  payment_processing:
    transitions:
      complete: packaging
  packaging:
    transitions:
      complete: shipping
  shipping:
    transitions:
      complete: delivered
  delivered:
    final: true
```

### Parallel Workflow

Concurrent execution of multiple tasks.

```yaml
name: "Employee Onboarding"
type: parallel
states:
  started:
    initial: true
    transitions:
      begin: parallel_tasks
  parallel_tasks:
    transitions:
      it_complete: check_complete
      hr_complete: check_complete
      facilities_complete: check_complete
  check_complete:
    transitions:
      all_done: completed
  completed:
    final: true
```

### Conditional Workflow

Dynamic branching based on conditions.

```yaml
name: "Support Ticket Routing"
type: conditional
states:
  created:
    initial: true
    transitions:
      triage: triaging
  triaging:
    transitions:
      route_critical: critical_path
      route_high: high_priority_path
      route_normal: normal_path
  critical_path:
    transitions:
      escalate: escalated
  high_priority_path:
    transitions:
      assign: assigned
  normal_path:
    transitions:
      assign: assigned
  assigned:
    transitions:
      resolve: resolved
  escalated:
    transitions:
      resolve: resolved
  resolved:
    final: true
```

## Guards and Actions

### Registering Guards

Guards control whether a transition can be executed:

```typescript
const engine = api.getEngine();

// Synchronous guard
engine.registerGuard('has_required_fields', (ctx) => {
    const data = ctx.getData();
    return !!(data.title && data.content);
});

// Asynchronous guard
engine.registerGuard('user_has_permission', async (ctx) => {
    const userId = ctx.getData('userId');
    const permission = await checkPermission(userId, 'approve');
    return permission;
});
```

### Registering Actions

Actions are executed during transitions:

```typescript
// Synchronous action
engine.registerAction('log_created', (ctx) => {
    ctx.logger.info('Workflow created:', ctx.instance.id);
});

// Asynchronous action
engine.registerAction('notify_approver', async (ctx) => {
    const approver = ctx.getData('approver');
    await sendEmail(approver, 'Approval Required');
    ctx.setData('notificationSent', true);
});

// Action with data modification
engine.registerAction('set_timestamp', (ctx) => {
    ctx.setData('processedAt', new Date().toISOString());
});
```

## Task Management

```typescript
// Create a task
const task = await api.createTask({
    instanceId: instance.id,
    name: 'manager_approval',
    description: 'Review and approve the document',
    assignedTo: 'manager_456',
    status: 'pending',
    data: { documentId: instance.data.id },
});

// Complete a task
await api.completeTask(task.id, {
    approved: true,
    comment: 'Looks good!',
});

// Get tasks for an instance
const tasks = await api.getInstanceTasks(instance.id);
```

## Querying Workflows

```typescript
// Query by status
const runningWorkflows = await api.queryWorkflows({
    status: 'running',
    limit: 10,
});

// Query by user
const userWorkflows = await api.queryWorkflows({
    startedBy: 'user_123',
    sortBy: 'createdAt',
    sortOrder: 'desc',
});

// Query with pagination
const page1 = await api.queryWorkflows({
    limit: 10,
    skip: 0,
});

const page2 = await api.queryWorkflows({
    limit: 10,
    skip: 10,
});
```

## API Reference

### WorkflowAPI

- `registerWorkflow(definition)` - Register a workflow definition
- `startWorkflow(workflowId, data, startedBy?)` - Start a new workflow instance
- `getWorkflowStatus(instanceId)` - Get workflow instance status
- `executeTransition(instanceId, transition, triggeredBy?, data?)` - Execute a transition
- `abortWorkflow(instanceId, abortedBy?)` - Abort a workflow
- `queryWorkflows(options)` - Query workflow instances
- `getAvailableTransitions(instanceId)` - Get available transitions
- `canExecuteTransition(instanceId, transition)` - Check if transition can be executed
- `createTask(task)` - Create a workflow task
- `getTask(taskId)` - Get a task
- `completeTask(taskId, result?)` - Complete a task
- `rejectTask(taskId, result?)` - Reject a task

### WorkflowEngine

- `registerGuard(name, guard)` - Register a guard function
- `registerAction(name, action)` - Register an action function
- `createInstance(definition, data, startedBy?)` - Create a workflow instance
- `startInstance(instance, definition)` - Start a workflow instance
- `executeTransition(instance, definition, transition, triggeredBy?, data?)` - Execute a transition
- `abortInstance(instance, definition, abortedBy?)` - Abort a workflow instance

## Events

The plugin emits the following events:

- `workflow.started` - When a workflow is started
- `workflow.completed` - When a workflow completes
- `workflow.failed` - When a workflow fails
- `workflow.aborted` - When a workflow is aborted
- `workflow.transition` - When a transition is executed
- `workflow.task.created` - When a task is created
- `workflow.task.completed` - When a task is completed

## Examples

See the `/examples` directory for complete examples:

- `approval-workflow.yaml` - Multi-level approval workflow
- `sequential-workflow.yaml` - Order fulfillment workflow
- `parallel-workflow.yaml` - Employee onboarding workflow
- `conditional-workflow.yaml` - Support ticket routing workflow
- `usage.ts` - Comprehensive usage examples

## Testing

```bash
npm test
```

The plugin includes 130+ comprehensive tests covering:
- FSM engine functionality
- YAML parsing and validation
- API operations
- Storage operations
- Plugin lifecycle

## License

AGPL-3.0

## Contributing

Contributions are welcome! Please follow the ObjectOS contribution guidelines.
