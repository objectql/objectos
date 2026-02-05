/**
 * Workflow API
 * 
 * High-level API for workflow management
 */

import type {
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowTask,
    WorkflowStorage,
    WorkflowQueryOptions,
} from './types.js';
import { WorkflowEngine } from './engine.js';
import { ApprovalService } from './approval.js';

/**
 * Workflow API class
 */
export class WorkflowAPI {
    private engine: WorkflowEngine;
    private storage: WorkflowStorage;
    private approvalService: ApprovalService;

    constructor(storage: WorkflowStorage, engine?: WorkflowEngine) {
        this.storage = storage;
        this.engine = engine || new WorkflowEngine();
        this.approvalService = new ApprovalService(storage);
    }

    /**
     * Register a workflow definition
     */
    async registerWorkflow(definition: WorkflowDefinition): Promise<void> {
        await this.storage.saveDefinition(definition);
    }

    /**
     * Get a workflow definition
     */
    async getWorkflow(id: string, version?: string): Promise<WorkflowDefinition | null> {
        return this.storage.getDefinition(id, version);
    }

    /**
     * List all workflow definitions
     */
    async listWorkflows(): Promise<WorkflowDefinition[]> {
        return this.storage.listDefinitions();
    }

    /**
     * Start a new workflow instance
     */
    async startWorkflow(
        workflowId: string,
        data: Record<string, any> = {},
        startedBy?: string,
        version?: string
    ): Promise<WorkflowInstance> {
        const definition = await this.storage.getDefinition(workflowId, version);
        if (!definition) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }

        let instance = this.engine.createInstance(definition, data, startedBy);
        await this.storage.saveInstance(instance);

        instance = await this.engine.startInstance(instance, definition);
        await this.storage.updateInstance(instance.id, instance);

        return instance;
    }

    /**
     * Get workflow instance status
     */
    async getWorkflowStatus(instanceId: string): Promise<WorkflowInstance | null> {
        return this.storage.getInstance(instanceId);
    }

    /**
     * Execute a transition
     */
    async executeTransition(
        instanceId: string,
        transitionName: string,
        triggeredBy?: string,
        data?: Record<string, any>
    ): Promise<WorkflowInstance> {
        const instance = await this.storage.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Workflow instance not found: ${instanceId}`);
        }

        const definition = await this.storage.getDefinition(instance.workflowId, instance.version);
        if (!definition) {
            throw new Error(
                `Workflow definition not found: ${instance.workflowId} v${instance.version}`
            );
        }

        const updatedInstance = await this.engine.executeTransition(
            instance,
            definition,
            transitionName,
            triggeredBy,
            data
        );

        await this.storage.updateInstance(instanceId, updatedInstance);

        return updatedInstance;
    }

    /**
     * Abort a workflow instance
     */
    async abortWorkflow(instanceId: string, abortedBy?: string): Promise<WorkflowInstance> {
        const instance = await this.storage.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Workflow instance not found: ${instanceId}`);
        }

        const definition = await this.storage.getDefinition(instance.workflowId, instance.version);
        if (!definition) {
            throw new Error(
                `Workflow definition not found: ${instance.workflowId} v${instance.version}`
            );
        }

        const updatedInstance = await this.engine.abortInstance(instance, definition, abortedBy);
        await this.storage.updateInstance(instanceId, updatedInstance);

        return updatedInstance;
    }

    /**
     * Query workflow instances
     */
    async queryWorkflows(options: WorkflowQueryOptions): Promise<WorkflowInstance[]> {
        return this.storage.queryInstances(options);
    }

    /**
     * Get available transitions for an instance
     */
    async getAvailableTransitions(instanceId: string): Promise<string[]> {
        const instance = await this.storage.getInstance(instanceId);
        if (!instance) {
            throw new Error(`Workflow instance not found: ${instanceId}`);
        }

        const definition = await this.storage.getDefinition(instance.workflowId, instance.version);
        if (!definition) {
            throw new Error(
                `Workflow definition not found: ${instance.workflowId} v${instance.version}`
            );
        }

        return this.engine.getAvailableTransitions(instance, definition);
    }

    /**
     * Check if a transition can be executed
     */
    async canExecuteTransition(instanceId: string, transitionName: string): Promise<boolean> {
        const instance = await this.storage.getInstance(instanceId);
        if (!instance) {
            return false;
        }

        const definition = await this.storage.getDefinition(instance.workflowId, instance.version);
        if (!definition) {
            return false;
        }

        return this.engine.canExecuteTransition(instance, definition, transitionName);
    }

    /**
     * Create a task
     */
    async createTask(task: Omit<WorkflowTask, 'id' | 'createdAt'>): Promise<WorkflowTask> {
        const newTask: WorkflowTask = {
            ...task,
            id: this.generateTaskId(),
            createdAt: new Date(),
        };

        await this.storage.saveTask(newTask);
        return newTask;
    }

    /**
     * Get a task
     */
    async getTask(taskId: string): Promise<WorkflowTask | null> {
        return this.storage.getTask(taskId);
    }

    /**
     * Get tasks for a workflow instance
     */
    async getInstanceTasks(instanceId: string): Promise<WorkflowTask[]> {
        return this.storage.getInstanceTasks(instanceId);
    }

    /**
     * Complete a task
     */
    async completeTask(
        taskId: string,
        result?: Record<string, any>
    ): Promise<WorkflowTask> {
        const task = await this.storage.getTask(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        if (task.status !== 'pending') {
            throw new Error(`Cannot complete task in status: ${task.status}`);
        }

        await this.storage.updateTask(taskId, {
            status: 'completed',
            completedAt: new Date(),
            result,
        });

        const updatedTask = await this.storage.getTask(taskId);
        return updatedTask!;
    }

    /**
     * Reject a task
     */
    async rejectTask(taskId: string, result?: Record<string, any>): Promise<WorkflowTask> {
        const task = await this.storage.getTask(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        if (task.status !== 'pending') {
            throw new Error(`Cannot reject task in status: ${task.status}`);
        }

        await this.storage.updateTask(taskId, {
            status: 'rejected',
            completedAt: new Date(),
            result,
        });

        const updatedTask = await this.storage.getTask(taskId);
        return updatedTask!;
    }

    /**
     * Delegate a task to another user
     */
    async delegateTask(
        taskId: string,
        delegateTo: string,
        delegatedBy: string,
        reason?: string
    ): Promise<WorkflowTask> {
        return this.approvalService.delegateTask({
            taskId,
            delegateTo,
            delegatedBy,
            reason,
        });
    }

    /**
     * Escalate a task to a higher authority
     */
    async escalateTask(
        taskId: string,
        escalateTo: string,
        reason?: string,
        escalatedBy?: string
    ): Promise<WorkflowTask> {
        return this.approvalService.escalateTask({
            taskId,
            escalateTo,
            reason,
            escalatedBy,
        });
    }

    /**
     * Get the workflow engine (for registering guards/actions)
     */
    getEngine(): WorkflowEngine {
        return this.engine;
    }

    /**
     * Generate a unique task ID
     */
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
}
