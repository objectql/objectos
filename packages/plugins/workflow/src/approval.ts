/**
 * Approval Service
 * 
 * Handles approval workflows with delegation and escalation
 */

import type {
    WorkflowTask,
    WorkflowStorage,
    DelegationRequest,
    EscalationRequest,
    ApprovalChain,
} from './types';

/**
 * Approval service for managing approval workflows
 */
export class ApprovalService {
    constructor(private storage: WorkflowStorage) {}

    /**
     * Delegate a task to another user
     */
    async delegateTask(request: DelegationRequest): Promise<WorkflowTask> {
        const { taskId, delegateTo, reason, delegatedBy } = request;

        const task = await this.storage.getTask(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        // Allow delegation of pending or already delegated tasks (for re-delegation)
        if (task.status !== 'pending' && task.status !== 'delegated') {
            throw new Error(`Cannot delegate task in status: ${task.status}`);
        }

        // Store original assignee if not already delegated
        const originalAssignee = task.originalAssignee || task.assignedTo;

        await this.storage.updateTask(taskId, {
            status: 'delegated',
            originalAssignee,
            delegatedTo: delegateTo,
            delegatedAt: new Date(),
            delegationReason: reason,
            // Update assignedTo to the delegatee
            assignedTo: delegateTo,
        });

        const updatedTask = await this.storage.getTask(taskId);
        return updatedTask!;
    }

    /**
     * Escalate a task to a higher authority
     */
    async escalateTask(request: EscalationRequest): Promise<WorkflowTask> {
        const { taskId, escalateTo, reason, escalatedBy, automatic = false } = request;

        const task = await this.storage.getTask(taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }

        if (task.status === 'completed' || task.status === 'rejected') {
            throw new Error(`Cannot escalate task in status: ${task.status}`);
        }

        await this.storage.updateTask(taskId, {
            status: 'escalated',
            escalatedTo: escalateTo,
            escalatedAt: new Date(),
            escalationReason: reason || (automatic ? 'Automatic escalation due to timeout' : undefined),
            // Update assignedTo to the escalation target
            assignedTo: escalateTo,
        });

        const updatedTask = await this.storage.getTask(taskId);
        return updatedTask!;
    }

    /**
     * Check for tasks that need auto-escalation
     */
    async checkAutoEscalation(): Promise<WorkflowTask[]> {
        // This would typically be called by a scheduled job
        const allTasks = await this.getAllPendingTasks();
        const escalatedTasks: WorkflowTask[] = [];
        const now = new Date();

        for (const task of allTasks) {
            if (!task.autoEscalate || !task.dueDate || !task.escalationTarget) {
                continue;
            }

            // Check if task is overdue
            if (now > task.dueDate && task.status === 'pending') {
                const escalated = await this.escalateTask({
                    taskId: task.id,
                    escalateTo: task.escalationTarget,
                    reason: `Automatic escalation - task overdue since ${task.dueDate.toISOString()}`,
                    automatic: true,
                });
                escalatedTasks.push(escalated);
            }
        }

        return escalatedTasks;
    }

    /**
     * Get all pending tasks (helper method)
     */
    private async getAllPendingTasks(): Promise<WorkflowTask[]> {
        // In a real implementation, this would query the storage
        // For now, we'll return an empty array since the interface doesn't support this query
        return [];
    }

    /**
     * Create approval chain tasks
     */
    async createApprovalChain(
        instanceId: string,
        chain: ApprovalChain,
        workflowName: string
    ): Promise<WorkflowTask[]> {
        const tasks: WorkflowTask[] = [];

        for (const level of chain.levels) {
            const task: WorkflowTask = {
                id: this.generateTaskId(),
                instanceId,
                name: `${workflowName}_approval_level_${level.level}`,
                description: level.description || `Approval required at level ${level.level}`,
                assignedTo: level.approver,
                status: 'pending',
                createdAt: new Date(),
                data: {
                    approvalLevel: level.level,
                    required: level.required !== false,
                },
                autoEscalate: !!level.escalationTarget,
                escalationTarget: level.escalationTarget,
                dueDate: level.escalationTimeout 
                    ? new Date(Date.now() + level.escalationTimeout)
                    : undefined,
            };

            await this.storage.saveTask(task);
            tasks.push(task);
        }

        return tasks;
    }

    /**
     * Check if approval chain is complete
     */
    async isApprovalChainComplete(instanceId: string): Promise<boolean> {
        const tasks = await this.storage.getInstanceTasks(instanceId);
        
        // Check if all required tasks are completed
        const requiredTasks = tasks.filter(t => t.data?.required !== false);
        
        return requiredTasks.every(t => t.status === 'completed');
    }

    /**
     * Check if any approval was rejected
     */
    async hasRejectedApproval(instanceId: string): Promise<boolean> {
        const tasks = await this.storage.getInstanceTasks(instanceId);
        return tasks.some(t => t.status === 'rejected');
    }

    /**
     * Get approval history for an instance
     */
    async getApprovalHistory(instanceId: string): Promise<WorkflowTask[]> {
        const tasks = await this.storage.getInstanceTasks(instanceId);
        
        // Sort by completion date
        return tasks.sort((a, b) => {
            if (!a.completedAt) return 1;
            if (!b.completedAt) return -1;
            return a.completedAt.getTime() - b.completedAt.getTime();
        });
    }

    /**
     * Generate a unique task ID
     */
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
}
