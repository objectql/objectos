/**
 * Workflow Storage Implementation
 * 
 * In-memory storage for workflow definitions, instances, and tasks
 */

import type {
    WorkflowStorage,
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowTask,
    WorkflowQueryOptions,
    WorkflowStatus,
} from './types';

/**
 * In-memory workflow storage
 */
export class InMemoryWorkflowStorage implements WorkflowStorage {
    private definitions: Map<string, Map<string, WorkflowDefinition>> = new Map();
    private instances: Map<string, WorkflowInstance> = new Map();
    private tasks: Map<string, WorkflowTask> = new Map();

    /**
     * Save a workflow definition
     */
    async saveDefinition(definition: WorkflowDefinition): Promise<void> {
        if (!this.definitions.has(definition.id)) {
            this.definitions.set(definition.id, new Map());
        }
        
        const versions = this.definitions.get(definition.id)!;
        versions.set(definition.version, definition);
    }

    /**
     * Get a workflow definition
     */
    async getDefinition(id: string, version?: string): Promise<WorkflowDefinition | null> {
        const versions = this.definitions.get(id);
        if (!versions) return null;

        if (version) {
            return versions.get(version) || null;
        }

        // Get the latest version
        const allVersions = Array.from(versions.values());
        if (allVersions.length === 0) return null;

        return allVersions[allVersions.length - 1];
    }

    /**
     * List all workflow definitions
     */
    async listDefinitions(): Promise<WorkflowDefinition[]> {
        const result: WorkflowDefinition[] = [];
        
        for (const versions of this.definitions.values()) {
            // Get the latest version of each workflow
            const allVersions = Array.from(versions.values());
            if (allVersions.length > 0) {
                result.push(allVersions[allVersions.length - 1]);
            }
        }

        return result;
    }

    /**
     * Save a workflow instance
     */
    async saveInstance(instance: WorkflowInstance): Promise<void> {
        this.instances.set(instance.id, { ...instance });
    }

    /**
     * Get a workflow instance
     */
    async getInstance(id: string): Promise<WorkflowInstance | null> {
        const instance = this.instances.get(id);
        return instance ? { ...instance } : null;
    }

    /**
     * Update a workflow instance
     */
    async updateInstance(id: string, updates: Partial<WorkflowInstance>): Promise<void> {
        const instance = this.instances.get(id);
        if (!instance) {
            throw new Error(`Workflow instance not found: ${id}`);
        }

        Object.assign(instance, updates);
    }

    /**
     * Query workflow instances
     */
    async queryInstances(options: WorkflowQueryOptions): Promise<WorkflowInstance[]> {
        let results = Array.from(this.instances.values());

        // Filter by workflow ID
        if (options.workflowId) {
            results = results.filter(i => i.workflowId === options.workflowId);
        }

        // Filter by status
        if (options.status) {
            const statuses = Array.isArray(options.status) ? options.status : [options.status];
            results = results.filter(i => statuses.includes(i.status));
        }

        // Filter by started user
        if (options.startedBy) {
            results = results.filter(i => i.startedBy === options.startedBy);
        }

        // Sort
        if (options.sortBy) {
            const sortOrder = options.sortOrder || 'desc';
            results.sort((a, b) => {
                const aVal = a[options.sortBy!];
                const bVal = b[options.sortBy!];
                
                if (!aVal && !bVal) return 0;
                if (!aVal) return sortOrder === 'asc' ? 1 : -1;
                if (!bVal) return sortOrder === 'asc' ? -1 : 1;
                
                const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                return sortOrder === 'asc' ? comparison : -comparison;
            });
        }

        // Pagination
        if (options.skip) {
            results = results.slice(options.skip);
        }
        if (options.limit) {
            results = results.slice(0, options.limit);
        }

        return results.map(i => ({ ...i }));
    }

    /**
     * Save a task
     */
    async saveTask(task: WorkflowTask): Promise<void> {
        this.tasks.set(task.id, { ...task });
    }

    /**
     * Get a task
     */
    async getTask(id: string): Promise<WorkflowTask | null> {
        const task = this.tasks.get(id);
        return task ? { ...task } : null;
    }

    /**
     * Get tasks for an instance
     */
    async getInstanceTasks(instanceId: string): Promise<WorkflowTask[]> {
        return Array.from(this.tasks.values())
            .filter(t => t.instanceId === instanceId)
            .map(t => ({ ...t }));
    }

    /**
     * Update a task
     */
    async updateTask(id: string, updates: Partial<WorkflowTask>): Promise<void> {
        const task = this.tasks.get(id);
        if (!task) {
            throw new Error(`Task not found: ${id}`);
        }

        Object.assign(task, updates);
    }

    /**
     * Clear all data (for testing)
     */
    async clear(): Promise<void> {
        this.definitions.clear();
        this.instances.clear();
        this.tasks.clear();
    }
}
