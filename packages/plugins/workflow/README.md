# @objectos/plugin-workflow

A comprehensive workflow and state machine plugin for ObjectOS, providing finite state machine (FSM) execution, YAML-based workflow definitions, and workflow management.

## Features

- ✅ **Finite State Machine (FSM) Engine** - Execute workflows as state machines with well-defined states and transitions
- ✅ **YAML Workflow Definitions** - Define workflows in declarative YAML format
- ✅ **State Transitions with Guards** - Control transitions with guard conditions (sync/async)
- ✅ **Transition Actions** - Execute actions during state transitions
- ✅ **Workflow Versioning** - Support for multiple versions of workflows
- ✅ **Multiple Workflow Types**:
  - **Approval Workflows** - Multi-level approval processes with delegation and escalation 🆕
  - **Sequential Workflows** - Step-by-step linear processes
  - **Parallel Workflows** - Concurrent execution paths
  - **Conditional Workflows** - Dynamic branching based on conditions
- ✅ **Task Management** - Create, complete, reject, delegate, and escalate workflow tasks 🆕
- ✅ **State History** - Track all state transitions with full audit trail
- ✅ **Event Integration** - Emit events for workflow lifecycle
- ✅ **Multi-Channel Notifications** - Email, Slack, and Webhook notifications 🆕
- ✅ **Delegation Support** - Delegate tasks with reason tracking and original assignee preservation 🆕
- ✅ **Escalation Support** - Manual and automatic time-based escalation 🆕
- ✅ **Approval Chains** - Multi-level approval workflows with configurable requirements 🆕

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

## Advanced Approval Features 🆕

The workflow plugin now includes powerful approval workflow capabilities with delegation, escalation, and multi-channel notifications.

### Delegation

Delegate tasks to other users when you're unavailable:

```typescript
// Delegate a task to another user
const delegated = await api.delegateTask(
    taskId,
    'assistant@example.com',      // Delegate to
    'manager@example.com',         // Delegated by
    'Out of office this week'      // Reason
);

console.log(delegated.originalAssignee);  // manager@example.com
console.log(delegated.assignedTo);        // assistant@example.com
console.log(delegated.delegationReason);  // Out of office this week
```

### Escalation

Escalate tasks to higher authorities:

```typescript
// Escalate a task manually
const escalated = await api.escalateTask(
    taskId,
    'director@example.com',        // Escalate to
    'Requires executive approval', // Reason
    'manager@example.com'          // Escalated by
);

// Auto-escalation based on due date
const task = await api.createTask({
    instanceId: workflowId,
    name: 'manager_approval',
    assignedTo: 'manager@example.com',
    status: 'pending',
    autoEscalate: true,
    escalationTarget: 'director@example.com',
    dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
});
```

### Multi-Channel Notifications

Send notifications via Email, Slack, or Webhooks:

```typescript
import {
    NotificationService,
    EmailNotificationHandler,
    SlackNotificationHandler,
} from '@objectos/plugin-workflow';

// Setup notification service
const notificationService = new NotificationService();

// Register handlers
const emailHandler = new EmailNotificationHandler('noreply@company.com');
const slackHandler = new SlackNotificationHandler({ 
    webhookUrl: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL' 
});

notificationService.registerHandler('email', emailHandler);
notificationService.registerHandler('slack', slackHandler);

// Register notification actions
const engine = api.getEngine();

engine.registerAction('notify_manager', async (ctx) => {
    await notificationService.send({
        channel: 'email',
        recipients: ['manager@company.com'],
        subject: 'Approval Required',
        message: `Please review: ${ctx.getData('title')}`,
        data: ctx.getData(),
    }, ctx);
});

engine.registerAction('notify_slack', async (ctx) => {
    await notificationService.send({
        channel: 'slack',
        recipients: ['#approvals'],
        message: `✅ Approved: ${ctx.getData('title')}`,
    }, ctx);
});
```

### Multi-Level Approval Chains

Create complex approval workflows with multiple levels:

```typescript
import { ApprovalService } from '@objectos/plugin-workflow';

const approvalService = new ApprovalService(storage);

// Define approval chain
const approvalChain = {
    levels: [
        {
            level: 1,
            approver: 'manager@company.com',
            description: 'Manager approval',
            required: true,
            escalationTarget: 'senior_manager@company.com',
            escalationTimeout: 48 * 60 * 60 * 1000, // 48 hours
        },
        {
            level: 2,
            approver: 'director@company.com',
            description: 'Director approval',
            required: true,
            escalationTarget: 'vp@company.com',
            escalationTimeout: 72 * 60 * 60 * 1000, // 72 hours
        },
        {
            level: 3,
            approver: 'cfo@company.com',
            description: 'CFO final approval',
            required: true,
        },
    ],
};

// Create approval tasks for workflow
const tasks = await approvalService.createApprovalChain(
    instanceId,
    approvalChain,
    'purchase_order'
);

// Check if approval chain is complete
const isComplete = await approvalService.isApprovalChainComplete(instanceId);

// Check if any approval was rejected
const hasRejection = await approvalService.hasRejectedApproval(instanceId);

// Get approval history
const history = await approvalService.getApprovalHistory(instanceId);
```

### Complete Example

See `examples/advanced-approval-example.ts` for a comprehensive example demonstrating:
- Multi-level approval workflow (Manager → Director → CFO)
- Task delegation with reason tracking
- Task escalation (manual and automatic)
- Email and Slack notifications
- Complete approval history tracking

```bash
# Run the example
ts-node examples/advanced-approval-example.ts
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

**Workflow Management:**
- `registerWorkflow(definition)` - Register a workflow definition
- `startWorkflow(workflowId, data, startedBy?)` - Start a new workflow instance
- `getWorkflowStatus(instanceId)` - Get workflow instance status
- `executeTransition(instanceId, transition, triggeredBy?, data?)` - Execute a transition
- `abortWorkflow(instanceId, abortedBy?)` - Abort a workflow
- `queryWorkflows(options)` - Query workflow instances
- `getAvailableTransitions(instanceId)` - Get available transitions
- `canExecuteTransition(instanceId, transition)` - Check if transition can be executed

**Task Management:**
- `createTask(task)` - Create a workflow task
- `getTask(taskId)` - Get a task
- `getInstanceTasks(instanceId)` - Get all tasks for a workflow instance
- `completeTask(taskId, result?)` - Complete a task
- `rejectTask(taskId, result?)` - Reject a task

**Advanced Approval Features:** 🆕
- `delegateTask(taskId, delegateTo, delegatedBy, reason?)` - Delegate a task to another user
- `escalateTask(taskId, escalateTo, reason?, escalatedBy?)` - Escalate a task to higher authority

**Utility:**
- `getEngine()` - Get the workflow engine for registering guards/actions

### ApprovalService 🆕

- `delegateTask(request)` - Delegate a task with full tracking
- `escalateTask(request)` - Escalate a task with reason
- `checkAutoEscalation()` - Check and process overdue tasks for auto-escalation
- `createApprovalChain(instanceId, chain, workflowName)` - Create multi-level approval tasks
- `isApprovalChainComplete(instanceId)` - Check if all required approvals are complete
- `hasRejectedApproval(instanceId)` - Check if any approval was rejected
- `getApprovalHistory(instanceId)` - Get chronological approval history

### NotificationService 🆕

- `registerHandler(channel, handler)` - Register a notification handler
- `send(config, context)` - Send a notification through registered handler
- `isSupported(channel)` - Check if a notification channel is supported

### NotificationHandlers 🆕

**EmailNotificationHandler:**
- Sends email notifications
- Supports template rendering with variable substitution
- Constructor: `new EmailNotificationHandler(fromAddress, smtpConfig?)`

**SlackNotificationHandler:**
- Sends Slack notifications
- Supports webhook URL and bot token authentication
- Constructor: `new SlackNotificationHandler(config?)`

**WebhookNotificationHandler:**
- Sends HTTP webhook notifications
- Supports custom payload data
- Constructor: `new WebhookNotificationHandler()`

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

- `approval-workflow.yaml` - Basic multi-level approval workflow
- `multi-level-approval-workflow.yaml` - Advanced approval with delegation and escalation 🆕
- `advanced-approval-example.ts` - Complete demonstration of approval features 🆕
- `sequential-workflow.yaml` - Order fulfillment workflow
- `parallel-workflow.yaml` - Employee onboarding workflow
- `conditional-workflow.yaml` - Support ticket routing workflow
- `usage.ts` - Comprehensive usage examples

## Testing

```bash
npm test
```

The plugin includes 170+ comprehensive tests covering:
- FSM engine functionality
- YAML parsing and validation
- API operations
- Storage operations
- Plugin lifecycle
- Approval service (delegation, escalation, approval chains) 🆕
- Notification service (email, Slack, webhooks) 🆕

## License

AGPL-3.0

## Contributing

Contributions are welcome! Please follow the ObjectOS contribution guidelines.
