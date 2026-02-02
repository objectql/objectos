/**
 * API Tests
 * 
 * Tests for WorkflowAPI - high-level API operations
 */

import { WorkflowAPI } from '../src/api';
import { WorkflowEngine } from '../src/engine';
import { InMemoryWorkflowStorage } from '../src/storage';
import type { WorkflowDefinition, WorkflowTask } from '../src/types';

describe('WorkflowAPI', () => {
    let api: WorkflowAPI;
    let storage: InMemoryWorkflowStorage;
    let engine: WorkflowEngine;
    let definition: WorkflowDefinition;

    beforeEach(() => {
        storage = new InMemoryWorkflowStorage();
        engine = new WorkflowEngine();
        api = new WorkflowAPI(storage, engine);

        definition = {
            id: 'test-workflow',
            name: 'Test Workflow',
            type: 'sequential',
            version: '1.0.0',
            initialState: 'draft',
            states: {
                draft: {
                    name: 'draft',
                    initial: true,
                    transitions: {
                        submit: { target: 'review' },
                    },
                },
                review: {
                    name: 'review',
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
    });

    describe('registerWorkflow', () => {
        it('should register a workflow definition', async () => {
            await api.registerWorkflow(definition);

            const retrieved = await api.getWorkflow('test-workflow');
            expect(retrieved).toEqual(definition);
        });
    });

    describe('getWorkflow', () => {
        it('should retrieve a workflow by ID', async () => {
            await api.registerWorkflow(definition);

            const retrieved = await api.getWorkflow('test-workflow');

            expect(retrieved?.id).toBe('test-workflow');
            expect(retrieved?.name).toBe('Test Workflow');
        });

        it('should retrieve a specific version', async () => {
            await api.registerWorkflow(definition);
            
            const v2 = { ...definition, version: '2.0.0' };
            await api.registerWorkflow(v2);

            const retrieved = await api.getWorkflow('test-workflow', '1.0.0');

            expect(retrieved?.version).toBe('1.0.0');
        });

        it('should return null for non-existent workflow', async () => {
            const retrieved = await api.getWorkflow('non-existent');

            expect(retrieved).toBeNull();
        });
    });

    describe('listWorkflows', () => {
        it('should list all workflow definitions', async () => {
            const def1 = { ...definition, id: 'workflow-1' };
            const def2 = { ...definition, id: 'workflow-2' };

            await api.registerWorkflow(def1);
            await api.registerWorkflow(def2);

            const workflows = await api.listWorkflows();

            expect(workflows).toHaveLength(2);
            expect(workflows.map(w => w.id)).toContain('workflow-1');
            expect(workflows.map(w => w.id)).toContain('workflow-2');
        });
    });

    describe('startWorkflow', () => {
        beforeEach(async () => {
            await api.registerWorkflow(definition);
        });

        it('should start a new workflow instance', async () => {
            const instance = await api.startWorkflow(
                'test-workflow',
                { foo: 'bar' },
                'user-1'
            );

            expect(instance.id).toBeDefined();
            expect(instance.workflowId).toBe('test-workflow');
            expect(instance.status).toBe('running');
            expect(instance.currentState).toBe('draft');
            expect(instance.data).toEqual({ foo: 'bar' });
            expect(instance.startedBy).toBe('user-1');
        });

        it('should throw error for non-existent workflow', async () => {
            await expect(api.startWorkflow('non-existent'))
                .rejects.toThrow('Workflow not found: non-existent');
        });
    });

    describe('getWorkflowStatus', () => {
        it('should retrieve workflow instance status', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const status = await api.getWorkflowStatus(instance.id);

            expect(status).toMatchObject({
                id: instance.id,
                workflowId: 'test-workflow',
                status: 'running',
                currentState: 'draft',
            });
        });

        it('should return null for non-existent instance', async () => {
            const status = await api.getWorkflowStatus('non-existent');

            expect(status).toBeNull();
        });
    });

    describe('executeTransition', () => {
        it('should execute a transition successfully', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const updated = await api.executeTransition(
                instance.id,
                'submit',
                'user-1',
                { comment: 'Ready for review' }
            );

            expect(updated.currentState).toBe('review');
            expect(updated.history).toHaveLength(1);
            expect(updated.history[0].data).toEqual({ comment: 'Ready for review' });
        });

        it('should throw error for non-existent instance', async () => {
            await expect(api.executeTransition('non-existent', 'submit'))
                .rejects.toThrow('Workflow instance not found: non-existent');
        });

        it('should persist transition changes', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            await api.executeTransition(instance.id, 'submit');

            const status = await api.getWorkflowStatus(instance.id);
            expect(status?.currentState).toBe('review');
        });
    });

    describe('abortWorkflow', () => {
        it('should abort a running workflow', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const aborted = await api.abortWorkflow(instance.id, 'user-1');

            expect(aborted.status).toBe('aborted');
            expect(aborted.abortedAt).toBeInstanceOf(Date);
            expect(aborted.completedBy).toBe('user-1');
        });

        it('should throw error for non-existent instance', async () => {
            await expect(api.abortWorkflow('non-existent'))
                .rejects.toThrow('Workflow instance not found: non-existent');
        });

        it('should persist abort status', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            await api.abortWorkflow(instance.id);

            const status = await api.getWorkflowStatus(instance.id);
            expect(status?.status).toBe('aborted');
        });
    });

    describe('queryWorkflows', () => {
        beforeEach(async () => {
            await api.registerWorkflow(definition);
        });

        it('should query workflows by status', async () => {
            const instance1 = await api.startWorkflow('test-workflow');
            const instance2 = await api.startWorkflow('test-workflow');
            await api.abortWorkflow(instance2.id);

            const running = await api.queryWorkflows({ status: 'running' });
            const aborted = await api.queryWorkflows({ status: 'aborted' });

            expect(running).toHaveLength(1);
            expect(running[0].id).toBe(instance1.id);
            expect(aborted).toHaveLength(1);
            expect(aborted[0].id).toBe(instance2.id);
        });

        it('should query workflows by workflowId', async () => {
            const def2 = { ...definition, id: 'another-workflow' };
            await api.registerWorkflow(def2);

            await api.startWorkflow('test-workflow');
            await api.startWorkflow('another-workflow');

            const results = await api.queryWorkflows({ workflowId: 'test-workflow' });

            expect(results).toHaveLength(1);
            expect(results[0].workflowId).toBe('test-workflow');
        });

        it('should query workflows by startedBy', async () => {
            await api.startWorkflow('test-workflow', {}, 'user-1');
            await api.startWorkflow('test-workflow', {}, 'user-2');

            const results = await api.queryWorkflows({ startedBy: 'user-1' });

            expect(results).toHaveLength(1);
            expect(results[0].startedBy).toBe('user-1');
        });

        it('should support pagination', async () => {
            await api.startWorkflow('test-workflow');
            await api.startWorkflow('test-workflow');
            await api.startWorkflow('test-workflow');

            const page1 = await api.queryWorkflows({ limit: 2 });
            const page2 = await api.queryWorkflows({ skip: 2, limit: 2 });

            expect(page1).toHaveLength(2);
            expect(page2).toHaveLength(1);
        });
    });

    describe('getAvailableTransitions', () => {
        it('should return available transitions for current state', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const transitions = await api.getAvailableTransitions(instance.id);

            expect(transitions).toEqual(['submit']);
        });

        it('should throw error for non-existent instance', async () => {
            await expect(api.getAvailableTransitions('non-existent'))
                .rejects.toThrow('Workflow instance not found: non-existent');
        });
    });

    describe('canExecuteTransition', () => {
        it('should return true for valid transition', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const canExecute = await api.canExecuteTransition(instance.id, 'submit');

            expect(canExecute).toBe(true);
        });

        it('should return false for invalid transition', async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const canExecute = await api.canExecuteTransition(instance.id, 'approve');

            expect(canExecute).toBe(false);
        });

        it('should return false for non-existent instance', async () => {
            const canExecute = await api.canExecuteTransition('non-existent', 'submit');

            expect(canExecute).toBe(false);
        });
    });

    describe('task management', () => {
        let instanceId: string;

        beforeEach(async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');
            instanceId = instance.id;
        });

        it('should create a task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                description: 'Please review and approve',
                assignedTo: 'user-1',
                status: 'pending',
            });

            expect(task.id).toBeDefined();
            expect(task.name).toBe('Approval Task');
            expect(task.assignedTo).toBe('user-1');
            expect(task.status).toBe('pending');
            expect(task.createdAt).toBeInstanceOf(Date);
        });

        it('should get a task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Test Task',
                status: 'pending',
            });

            const retrieved = await api.getTask(task.id);

            expect(retrieved).toMatchObject({
                id: task.id,
                name: 'Test Task',
            });
        });

        it('should get tasks for an instance', async () => {
            await api.createTask({ instanceId, name: 'Task 1', status: 'pending' });
            await api.createTask({ instanceId, name: 'Task 2', status: 'pending' });

            const tasks = await api.getInstanceTasks(instanceId);

            expect(tasks).toHaveLength(2);
            expect(tasks.map(t => t.name)).toContain('Task 1');
            expect(tasks.map(t => t.name)).toContain('Task 2');
        });

        it('should complete a task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval',
                status: 'pending',
            });

            const completed = await api.completeTask(task.id, { approved: true });

            expect(completed.status).toBe('completed');
            expect(completed.completedAt).toBeInstanceOf(Date);
            expect(completed.result).toEqual({ approved: true });
        });

        it('should reject a task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval',
                status: 'pending',
            });

            const rejected = await api.rejectTask(task.id, { reason: 'Invalid' });

            expect(rejected.status).toBe('rejected');
            expect(rejected.completedAt).toBeInstanceOf(Date);
            expect(rejected.result).toEqual({ reason: 'Invalid' });
        });

        it('should throw error when completing non-pending task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Task',
                status: 'pending',
            });

            await api.completeTask(task.id);

            await expect(api.completeTask(task.id))
                .rejects.toThrow('Cannot complete task in status: completed');
        });

        it('should throw error when rejecting non-pending task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Task',
                status: 'pending',
            });

            await api.rejectTask(task.id);

            await expect(api.rejectTask(task.id))
                .rejects.toThrow('Cannot reject task in status: rejected');
        });
    });

    describe('delegateTask', () => {
        let instanceId: string;

        beforeEach(async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow', {});
            instanceId = instance.id;
        });

        it('should delegate a pending task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                assignedTo: 'manager@example.com',
                status: 'pending',
            });

            const delegated = await api.delegateTask(
                task.id,
                'assistant@example.com',
                'manager@example.com',
                'Out of office this week'
            );

            expect(delegated.status).toBe('delegated');
            expect(delegated.assignedTo).toBe('assistant@example.com');
            expect(delegated.delegatedTo).toBe('assistant@example.com');
            expect(delegated.originalAssignee).toBe('manager@example.com');
            expect(delegated.delegationReason).toBe('Out of office this week');
            expect(delegated.delegatedAt).toBeInstanceOf(Date);
        });

        it('should preserve original assignee on re-delegation', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                assignedTo: 'manager@example.com',
                status: 'pending',
            });

            // First delegation
            await api.delegateTask(
                task.id,
                'assistant1@example.com',
                'manager@example.com',
                'First delegation'
            );

            // Second delegation (should work on delegated task)
            const delegated = await api.delegateTask(
                task.id,
                'assistant2@example.com',
                'assistant1@example.com',
                'Second delegation'
            );

            expect(delegated.originalAssignee).toBe('manager@example.com');
            expect(delegated.assignedTo).toBe('assistant2@example.com');
        });

        it('should throw error for non-existent task', async () => {
            await expect(
                api.delegateTask('non-existent', 'user@example.com', 'delegator@example.com')
            ).rejects.toThrow('Task not found');
        });

        it('should throw error when delegating completed task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                status: 'pending',
            });

            await api.completeTask(task.id);

            await expect(
                api.delegateTask(task.id, 'user@example.com', 'delegator@example.com')
            ).rejects.toThrow('Cannot delegate task in status: completed');
        });
    });

    describe('escalateTask', () => {
        let instanceId: string;

        beforeEach(async () => {
            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow', {});
            instanceId = instance.id;
        });

        it('should escalate a pending task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                assignedTo: 'manager@example.com',
                status: 'pending',
            });

            const escalated = await api.escalateTask(
                task.id,
                'director@example.com',
                'Requires higher-level approval',
                'system'
            );

            expect(escalated.status).toBe('escalated');
            expect(escalated.assignedTo).toBe('director@example.com');
            expect(escalated.escalatedTo).toBe('director@example.com');
            expect(escalated.escalationReason).toBe('Requires higher-level approval');
            expect(escalated.escalatedAt).toBeInstanceOf(Date);
        });

        it('should escalate a delegated task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                assignedTo: 'manager@example.com',
                status: 'delegated',
            });

            const escalated = await api.escalateTask(
                task.id,
                'director@example.com',
                'Escalation needed'
            );

            expect(escalated.status).toBe('escalated');
            expect(escalated.assignedTo).toBe('director@example.com');
        });

        it('should throw error for non-existent task', async () => {
            await expect(
                api.escalateTask('non-existent', 'director@example.com')
            ).rejects.toThrow('Task not found');
        });

        it('should throw error when escalating completed task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                status: 'pending',
            });

            await api.completeTask(task.id);

            await expect(
                api.escalateTask(task.id, 'director@example.com')
            ).rejects.toThrow('Cannot escalate task in status: completed');
        });

        it('should throw error when escalating rejected task', async () => {
            const task = await api.createTask({
                instanceId,
                name: 'Approval Task',
                status: 'pending',
            });

            await api.rejectTask(task.id);

            await expect(
                api.escalateTask(task.id, 'director@example.com')
            ).rejects.toThrow('Cannot escalate task in status: rejected');
        });
    });

    describe('getEngine', () => {
        it('should return the workflow engine', () => {
            const engine = api.getEngine();

            expect(engine).toBeInstanceOf(WorkflowEngine);
        });
    });
});
