/**
 * Workflow Plugin Usage Examples
 *
 * This file demonstrates how to use the Workflow Plugin
 */

import {
  WorkflowPlugin,
  parseWorkflowYAML,
  WorkflowEngine,
  type WorkflowContext,
} from '@objectos/plugin-workflow';
import * as fs from 'fs';
import * as path from 'path';

// Example 1: Create and configure the plugin
async function example1_setupPlugin() {
  const plugin = new WorkflowPlugin({
    enabled: true,
    defaultTimeout: 3600000, // 1 hour
    maxTransitions: 1000,
  });

  // Mock context for demonstration
  const mockContext = {
    logger: console,
    registerService: (name: string, service: any) => {
      console.log(`Registered service: ${name}`);
    },
    hook: (event: string, handler: Function) => {
      console.log(`Registered hook: ${event}`);
    },
    trigger: async (event: string, data: any) => {
      console.log(`Triggered event: ${event}`, data);
    },
  };

  // Initialize and start the plugin
  await plugin.init(mockContext as any);
  await plugin.start(mockContext as any);

  console.log('✓ Workflow plugin initialized and started');
}

// Example 2: Load and register a workflow from YAML
async function example2_loadWorkflowFromYAML() {
  // Read the approval workflow YAML
  const yamlPath = path.join(__dirname, 'approval-workflow.yaml');
  const yamlContent = fs.readFileSync(yamlPath, 'utf-8');

  // Parse the YAML into a workflow definition
  const workflowDef = parseWorkflowYAML(yamlContent, 'document_approval');

  console.log('✓ Loaded workflow:', workflowDef.name);
  console.log('  Type:', workflowDef.type);
  console.log('  States:', Object.keys(workflowDef.states).join(', '));

  return workflowDef;
}

// Example 3: Register custom guards and actions
async function example3_registerGuardsAndActions() {
  const engine = new WorkflowEngine();

  // Register a guard: Check if document has required fields
  engine.registerGuard('has_required_fields', async (ctx: WorkflowContext) => {
    const data = ctx.getData();
    return !!(data.title && data.content && data.author);
  });

  // Register an action: Notify manager
  engine.registerAction('notify_manager', async (ctx: WorkflowContext) => {
    const data = ctx.getData();
    ctx.logger.info(`Notifying manager about document: ${data.title}`);
    // In real implementation, send email or notification
    ctx.setData('managerNotified', true);
  });

  // Register an action: Set pending date
  engine.registerAction('set_pending_date', async (ctx: WorkflowContext) => {
    ctx.setData('pendingDate', new Date().toISOString());
  });

  console.log('✓ Registered guards and actions');

  return engine;
}

// Example 4: Start a workflow instance
async function example4_startWorkflow() {
  const { WorkflowAPI } = await import('@objectos/plugin-workflow');
  const { InMemoryWorkflowStorage } = await import('@objectos/plugin-workflow');

  const storage = new InMemoryWorkflowStorage();
  const engine = await example3_registerGuardsAndActions();
  const api = new WorkflowAPI(storage, engine);

  // Load and register the workflow definition
  const workflowDef = await example2_loadWorkflowFromYAML();
  await api.registerWorkflow(workflowDef);

  // Start a new workflow instance
  const instance = await api.startWorkflow(
    'document_approval',
    {
      title: 'Q4 Budget Report',
      content: 'Annual budget analysis...',
      author: 'John Doe',
    },
    'user_123', // Started by user
  );

  console.log('✓ Started workflow instance:', instance.id);
  console.log('  Current state:', instance.currentState);
  console.log('  Status:', instance.status);

  return { api, instance };
}

// Example 5: Execute transitions
async function example5_executeTransitions() {
  const { api, instance } = await example4_startWorkflow();

  // Get available transitions
  const transitions = await api.getAvailableTransitions(instance.id);
  console.log('✓ Available transitions:', transitions);

  // Execute the 'submit' transition
  const updated = await api.executeTransition(
    instance.id,
    'submit',
    'user_123', // Triggered by user
    { comment: 'Ready for review' },
  );

  console.log('✓ Executed transition: submit');
  console.log('  New state:', updated.currentState);
  console.log('  History entries:', updated.history.length);

  // View state history
  updated.history.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.fromState} -> ${entry.toState} (${entry.transition})`);
  });

  return { api, instance: updated };
}

// Example 6: Query workflow instances
async function example6_queryWorkflows() {
  const { WorkflowAPI } = await import('@objectos/plugin-workflow');
  const { InMemoryWorkflowStorage } = await import('@objectos/plugin-workflow');

  const storage = new InMemoryWorkflowStorage();
  const api = new WorkflowAPI(storage);

  // Create some test instances
  const workflowDef = await example2_loadWorkflowFromYAML();
  await api.registerWorkflow(workflowDef);

  // Start multiple instances
  for (let i = 0; i < 5; i++) {
    await api.startWorkflow('document_approval', {
      title: `Document ${i + 1}`,
      author: i % 2 === 0 ? 'Alice' : 'Bob',
    });
  }

  // Query running workflows
  const running = await api.queryWorkflows({
    status: 'running',
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  console.log('✓ Found running workflows:', running.length);

  // Query by user
  const aliceWorkflows = await api.queryWorkflows({
    startedBy: 'Alice',
  });

  console.log("✓ Alice's workflows:", aliceWorkflows.length);

  return api;
}

// Example 7: Work with tasks
async function example7_workWithTasks() {
  const { api, instance } = await example4_startWorkflow();

  // Create a task for approval
  const task = await api.createTask({
    instanceId: instance.id,
    name: 'manager_approval',
    description: 'Review and approve the document',
    assignedTo: 'manager_456',
    status: 'pending',
    data: {
      documentId: instance.data.id,
    },
  });

  console.log('✓ Created task:', task.id);
  console.log('  Assigned to:', task.assignedTo);

  // Complete the task
  const completed = await api.completeTask(task.id, {
    approved: true,
    comment: 'Looks good!',
  });

  console.log('✓ Completed task:', completed.id);
  console.log('  Status:', completed.status);

  // Get all tasks for the workflow instance
  const tasks = await api.getInstanceTasks(instance.id);
  console.log('✓ Total tasks for instance:', tasks.length);

  return api;
}

// Example 8: Abort a workflow
async function example8_abortWorkflow() {
  const { api, instance } = await example4_startWorkflow();

  // Abort the workflow
  const aborted = await api.abortWorkflow(instance.id, 'admin_789');

  console.log('✓ Aborted workflow:', aborted.id);
  console.log('  Status:', aborted.status);
  console.log('  Aborted by:', aborted.completedBy);
  console.log('  Aborted at:', aborted.abortedAt);

  return api;
}

// Run all examples
async function runAllExamples() {
  console.log('\n=== Workflow Plugin Examples ===\n');

  try {
    console.log('Example 1: Setup Plugin');
    await example1_setupPlugin();
    console.log('');

    console.log('Example 2: Load Workflow from YAML');
    await example2_loadWorkflowFromYAML();
    console.log('');

    console.log('Example 3: Register Guards and Actions');
    await example3_registerGuardsAndActions();
    console.log('');

    console.log('Example 4: Start Workflow');
    await example4_startWorkflow();
    console.log('');

    console.log('Example 5: Execute Transitions');
    await example5_executeTransitions();
    console.log('');

    console.log('Example 6: Query Workflows');
    await example6_queryWorkflows();
    console.log('');

    console.log('Example 7: Work with Tasks');
    await example7_workWithTasks();
    console.log('');

    console.log('Example 8: Abort Workflow');
    await example8_abortWorkflow();
    console.log('');

    console.log('=== All Examples Completed ===\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples
export {
  example1_setupPlugin,
  example2_loadWorkflowFromYAML,
  example3_registerGuardsAndActions,
  example4_startWorkflow,
  example5_executeTransitions,
  example6_queryWorkflows,
  example7_workWithTasks,
  example8_abortWorkflow,
  runAllExamples,
};

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
