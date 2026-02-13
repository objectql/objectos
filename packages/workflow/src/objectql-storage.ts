/**
 * ObjectQL Workflow Storage Implementation
 *
 * Storage adapter that persists workflow data to ObjectOS/ObjectQL database
 */

import type { PluginContext } from '@objectstack/runtime';
import type {
  WorkflowStorage,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowTask,
  WorkflowQueryOptions,
} from './types.js';

export class ObjectQLWorkflowStorage implements WorkflowStorage {
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * Save a workflow definition
   * Currently definitions are file-based, but we may store them in DB later.
   * For now, this is a no-op or we could store in a 'workflow_definition' object.
   */
  async saveDefinition(definition: WorkflowDefinition): Promise<void> {
    // Optional: Implement if we want DB-backed definitions
    // await this.context.broker.call('data.create', { object: 'workflow_definition', doc: definition });
  }

  /**
   * Get a workflow definition
   */
  async getDefinition(id: string, version?: string): Promise<WorkflowDefinition | null> {
    // For now, we rely on file-based loading in the plugin
    return null;
  }

  /**
   * List all workflow definitions
   */
  async listDefinitions(): Promise<WorkflowDefinition[]> {
    return [];
  }

  // --- Instance Persistence ---

  /**
   * Save a new workflow instance
   */
  async saveInstance(instance: WorkflowInstance): Promise<void> {
    await (this.context as any).broker.call('data.create', {
      object: 'workflow_instance',
      doc: this.mapInstanceToDoc(instance),
    });
  }

  /**
   * Get a workflow instance
   */
  async getInstance(id: string): Promise<WorkflowInstance | null> {
    try {
      const result = await (this.context as any).broker.call('data.get', {
        object: 'workflow_instance',
        id: id,
      });
      return result ? this.mapDocToInstance(result) : null;
    } catch (err: any) {
      // If not found, return null
      if (err.message && err.message.includes('not found')) return null;
      throw err;
    }
  }

  /**
   * Update a workflow instance
   */
  async updateInstance(id: string, updates: Partial<WorkflowInstance>): Promise<void> {
    // Map updates to flat fields if necessary
    const docUpdates: any = { ...updates };

    // Handle field renames if any (e.g. camelCase to snake_case if schema required it,
    // but here we align schema keys with TS interface or rely on ObjectQL mapping)
    // Ideally we should use underscore for DB fields, so let's map.

    if (updates.currentState) docUpdates.current_state = updates.currentState;
    if (updates.workflowId) docUpdates.workflow_id = updates.workflowId;
    if (updates.createdAt) docUpdates.created_at = updates.createdAt;
    if (updates.startedAt) docUpdates.started_at = updates.startedAt;
    if (updates.completedAt) docUpdates.completed_at = updates.completedAt;
    if (updates.startedBy) docUpdates.started_by = updates.startedBy;

    delete docUpdates.currentState;
    delete docUpdates.workflowId;
    delete docUpdates.createdAt;
    delete docUpdates.startedAt;
    delete docUpdates.completedAt;
    delete docUpdates.startedBy;

    docUpdates.last_updated = new Date();

    await (this.context as any).broker.call('data.update', {
      object: 'workflow_instance',
      id: id,
      doc: docUpdates,
    });
  }

  /**
   * Query workflow instances
   */
  async queryInstances(options: WorkflowQueryOptions): Promise<WorkflowInstance[]> {
    const query: any = {};

    if (options.workflowId) query.workflow_id = options.workflowId;
    if (options.status) query.status = options.status;
    if (options.startedBy) query.started_by = options.startedBy;

    const results = await (this.context as any).broker.call('data.find', {
      object: 'workflow_instance',
      query: query,
      limit: options.limit || 50,
      skip: options.skip || 0,
      sort: this.mapSort(options),
    });

    return results.map((doc: any) => this.mapDocToInstance(doc));
  }

  async saveTask(task: WorkflowTask): Promise<void> {
    await (this.context as any).broker.call('data.create', {
      object: 'workflow_task',
      record: this.mapTaskToDoc(task),
    });
  }

  async getTask(id: string): Promise<WorkflowTask | null> {
    const result = await (this.context as any).broker.call('data.get', {
      object: 'workflow_task',
      id: id,
    });
    return result ? this.mapDocToTask(result) : null;
  }

  async getInstanceTasks(instanceId: string): Promise<WorkflowTask[]> {
    const results = await (this.context as any).broker.call('data.find', {
      object: 'workflow_task',
      query: {
        instance_id: instanceId,
      },
    });
    return results.map((doc: any) => this.mapDocToTask(doc));
  }

  async updateTask(id: string, updates: Partial<WorkflowTask>): Promise<void> {
    const record: any = {};
    if (updates.status) record.status = updates.status;
    if (updates.completedAt) record.completed_at = updates.completedAt;
    if (updates.data) record.data = updates.data;

    await (this.context as any).broker.call('data.update', {
      object: 'workflow_task',
      id: id,
      record: record,
    });
  }

  private mapTaskToDoc(task: WorkflowTask): any {
    return {
      _id: task.id,
      id: task.id,
      instance_id: task.instanceId,
      name: task.name,
      assigned_to: task.assignedTo,
      status: task.status,
      created_at: task.createdAt,
      completed_at: task.completedAt,
      data: task.data,
    };
  }

  private mapDocToTask(doc: any): WorkflowTask {
    return {
      id: doc.id || doc._id,
      instanceId: doc.instance_id,
      name: doc.name,
      assignedTo: doc.assigned_to,
      status: doc.status,
      createdAt: new Date(doc.created_at),
      completedAt: doc.completed_at ? new Date(doc.completed_at) : undefined,
      data: doc.data || {},
    } as WorkflowTask;
  }

  // --- Helpers ---

  private mapSort(options: WorkflowQueryOptions): string {
    if (!options.sortBy) return '-created_at';
    const field =
      options.sortBy === 'startedAt'
        ? 'started_at'
        : options.sortBy === 'completedAt'
          ? 'completed_at'
          : 'created_at';
    const order = options.sortOrder === 'asc' ? '' : '-';
    return `${order}${field}`;
  }

  private mapInstanceToDoc(instance: WorkflowInstance): any {
    return {
      _id: instance.id, // Use same ID if possible, or ObjectQL assigns one
      id: instance.id,
      workflow_id: instance.workflowId,
      version: instance.version,
      current_state: instance.currentState,
      status: instance.status,
      data: instance.data,
      history: instance.history,
      started_by: instance.startedBy,
      created_at: instance.createdAt,
      started_at: instance.startedAt,
      completed_at: instance.completedAt,
      failed_at: instance.failedAt,
      aborted_at: instance.abortedAt,
    };
  }

  private mapDocToInstance(doc: any): WorkflowInstance {
    return {
      id: doc.id || doc._id,
      workflowId: doc.workflow_id,
      version: doc.version,
      currentState: doc.current_state,
      status: doc.status,
      data: doc.data || {},
      history: doc.history || [],
      createdAt: new Date(doc.created_at),
      startedAt: doc.started_at ? new Date(doc.started_at) : undefined,
      startedBy: doc.started_by,
      completedAt: doc.completed_at ? new Date(doc.completed_at) : undefined,
      failedAt: doc.failed_at ? new Date(doc.failed_at) : undefined,
      abortedAt: doc.aborted_at ? new Date(doc.aborted_at) : undefined,
    } as WorkflowInstance;
  }
}
