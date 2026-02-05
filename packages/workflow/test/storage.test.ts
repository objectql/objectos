/**
 * Storage Tests
 * 
 * Tests for InMemoryWorkflowStorage
 */

import { InMemoryWorkflowStorage } from '../src/storage.js';
import type { WorkflowDefinition, WorkflowInstance, WorkflowTask } from '../src/types.js';

describe('InMemoryWorkflowStorage', () => {
    let storage: InMemoryWorkflowStorage;
    let definition: WorkflowDefinition;

    beforeEach(() => {
        storage = new InMemoryWorkflowStorage();

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
                        submit: { target: 'approved' },
                    },
                },
                approved: {
                    name: 'approved',
                    final: true,
                },
            },
        };
    });

    describe('workflow definitions', () => {
        it('should save and retrieve a workflow definition', async () => {
            await storage.saveDefinition(definition);

            const retrieved = await storage.getDefinition('test-workflow');

            expect(retrieved).toEqual(definition);
        });

        it('should return null for non-existent definition', async () => {
            const retrieved = await storage.getDefinition('non-existent');

            expect(retrieved).toBeNull();
        });

        it('should save multiple versions of a workflow', async () => {
            await storage.saveDefinition(definition);
            
            const v2 = { ...definition, version: '2.0.0' };
            await storage.saveDefinition(v2);

            const v1Retrieved = await storage.getDefinition('test-workflow', '1.0.0');
            const v2Retrieved = await storage.getDefinition('test-workflow', '2.0.0');

            expect(v1Retrieved?.version).toBe('1.0.0');
            expect(v2Retrieved?.version).toBe('2.0.0');
        });

        it('should retrieve latest version when version not specified', async () => {
            await storage.saveDefinition(definition);
            
            const v2 = { ...definition, version: '2.0.0' };
            await storage.saveDefinition(v2);

            const latest = await storage.getDefinition('test-workflow');

            expect(latest?.version).toBe('2.0.0');
        });

        it('should list all workflow definitions', async () => {
            const def1 = { ...definition, id: 'workflow-1' };
            const def2 = { ...definition, id: 'workflow-2' };

            await storage.saveDefinition(def1);
            await storage.saveDefinition(def2);

            const workflows = await storage.listDefinitions();

            expect(workflows).toHaveLength(2);
            expect(workflows.map(w => w.id)).toContain('workflow-1');
            expect(workflows.map(w => w.id)).toContain('workflow-2');
        });

        it('should list only latest versions', async () => {
            await storage.saveDefinition(definition);
            
            const v2 = { ...definition, version: '2.0.0' };
            await storage.saveDefinition(v2);

            const workflows = await storage.listDefinitions();

            expect(workflows).toHaveLength(1);
            expect(workflows[0].version).toBe('2.0.0');
        });
    });

    describe('workflow instances', () => {
        let instance: WorkflowInstance;

        beforeEach(() => {
            instance = {
                id: 'instance-1',
                workflowId: 'test-workflow',
                version: '1.0.0',
                currentState: 'draft',
                status: 'pending',
                data: { foo: 'bar' },
                history: [],
                createdAt: new Date(),
            };
        });

        it('should save and retrieve an instance', async () => {
            await storage.saveInstance(instance);

            const retrieved = await storage.getInstance('instance-1');

            expect(retrieved).toEqual(instance);
        });

        it('should return null for non-existent instance', async () => {
            const retrieved = await storage.getInstance('non-existent');

            expect(retrieved).toBeNull();
        });

        it('should update an instance', async () => {
            await storage.saveInstance(instance);

            await storage.updateInstance('instance-1', {
                status: 'running',
                startedAt: new Date(),
            });

            const updated = await storage.getInstance('instance-1');

            expect(updated?.status).toBe('running');
            expect(updated?.startedAt).toBeInstanceOf(Date);
        });

        it('should throw error when updating non-existent instance', async () => {
            await expect(storage.updateInstance('non-existent', { status: 'running' }))
                .rejects.toThrow('Workflow instance not found: non-existent');
        });

        it('should query instances by workflowId', async () => {
            const instance1 = { ...instance, id: 'inst-1', workflowId: 'wf-1' };
            const instance2 = { ...instance, id: 'inst-2', workflowId: 'wf-2' };

            await storage.saveInstance(instance1);
            await storage.saveInstance(instance2);

            const results = await storage.queryInstances({ workflowId: 'wf-1' });

            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('inst-1');
        });

        it('should query instances by status', async () => {
            const instance1 = { ...instance, id: 'inst-1', status: 'running' as const };
            const instance2 = { ...instance, id: 'inst-2', status: 'completed' as const };

            await storage.saveInstance(instance1);
            await storage.saveInstance(instance2);

            const running = await storage.queryInstances({ status: 'running' });
            const completed = await storage.queryInstances({ status: 'completed' });

            expect(running).toHaveLength(1);
            expect(running[0].id).toBe('inst-1');
            expect(completed).toHaveLength(1);
            expect(completed[0].id).toBe('inst-2');
        });

        it('should query instances by multiple statuses', async () => {
            const instance1 = { ...instance, id: 'inst-1', status: 'running' as const };
            const instance2 = { ...instance, id: 'inst-2', status: 'completed' as const };
            const instance3 = { ...instance, id: 'inst-3', status: 'failed' as const };

            await storage.saveInstance(instance1);
            await storage.saveInstance(instance2);
            await storage.saveInstance(instance3);

            const results = await storage.queryInstances({
                status: ['running', 'completed'],
            });

            expect(results).toHaveLength(2);
            expect(results.map(r => r.id)).toContain('inst-1');
            expect(results.map(r => r.id)).toContain('inst-2');
        });

        it('should query instances by startedBy', async () => {
            const instance1 = { ...instance, id: 'inst-1', startedBy: 'user-1' };
            const instance2 = { ...instance, id: 'inst-2', startedBy: 'user-2' };

            await storage.saveInstance(instance1);
            await storage.saveInstance(instance2);

            const results = await storage.queryInstances({ startedBy: 'user-1' });

            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('inst-1');
        });

        it('should support pagination with limit', async () => {
            await storage.saveInstance({ ...instance, id: 'inst-1' });
            await storage.saveInstance({ ...instance, id: 'inst-2' });
            await storage.saveInstance({ ...instance, id: 'inst-3' });

            const results = await storage.queryInstances({ limit: 2 });

            expect(results).toHaveLength(2);
        });

        it('should support pagination with skip', async () => {
            await storage.saveInstance({ ...instance, id: 'inst-1' });
            await storage.saveInstance({ ...instance, id: 'inst-2' });
            await storage.saveInstance({ ...instance, id: 'inst-3' });

            const results = await storage.queryInstances({ skip: 1, limit: 2 });

            expect(results).toHaveLength(2);
        });

        it('should sort instances by createdAt ascending', async () => {
            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-01-02');
            const date3 = new Date('2024-01-03');

            await storage.saveInstance({ ...instance, id: 'inst-2', createdAt: date2 });
            await storage.saveInstance({ ...instance, id: 'inst-1', createdAt: date1 });
            await storage.saveInstance({ ...instance, id: 'inst-3', createdAt: date3 });

            const results = await storage.queryInstances({
                sortBy: 'createdAt',
                sortOrder: 'asc',
            });

            expect(results.map(r => r.id)).toEqual(['inst-1', 'inst-2', 'inst-3']);
        });

        it('should sort instances by createdAt descending', async () => {
            const date1 = new Date('2024-01-01');
            const date2 = new Date('2024-01-02');
            const date3 = new Date('2024-01-03');

            await storage.saveInstance({ ...instance, id: 'inst-2', createdAt: date2 });
            await storage.saveInstance({ ...instance, id: 'inst-1', createdAt: date1 });
            await storage.saveInstance({ ...instance, id: 'inst-3', createdAt: date3 });

            const results = await storage.queryInstances({
                sortBy: 'createdAt',
                sortOrder: 'desc',
            });

            expect(results.map(r => r.id)).toEqual(['inst-3', 'inst-2', 'inst-1']);
        });
    });

    describe('workflow tasks', () => {
        let task: WorkflowTask;

        beforeEach(() => {
            task = {
                id: 'task-1',
                instanceId: 'instance-1',
                name: 'Approval Task',
                status: 'pending',
                createdAt: new Date(),
            };
        });

        it('should save and retrieve a task', async () => {
            await storage.saveTask(task);

            const retrieved = await storage.getTask('task-1');

            expect(retrieved).toEqual(task);
        });

        it('should return null for non-existent task', async () => {
            const retrieved = await storage.getTask('non-existent');

            expect(retrieved).toBeNull();
        });

        it('should get tasks for an instance', async () => {
            const task1 = { ...task, id: 'task-1', instanceId: 'inst-1' };
            const task2 = { ...task, id: 'task-2', instanceId: 'inst-1' };
            const task3 = { ...task, id: 'task-3', instanceId: 'inst-2' };

            await storage.saveTask(task1);
            await storage.saveTask(task2);
            await storage.saveTask(task3);

            const tasks = await storage.getInstanceTasks('inst-1');

            expect(tasks).toHaveLength(2);
            expect(tasks.map(t => t.id)).toContain('task-1');
            expect(tasks.map(t => t.id)).toContain('task-2');
        });

        it('should update a task', async () => {
            await storage.saveTask(task);

            await storage.updateTask('task-1', {
                status: 'completed',
                completedAt: new Date(),
            });

            const updated = await storage.getTask('task-1');

            expect(updated?.status).toBe('completed');
            expect(updated?.completedAt).toBeInstanceOf(Date);
        });

        it('should throw error when updating non-existent task', async () => {
            await expect(storage.updateTask('non-existent', { status: 'completed' }))
                .rejects.toThrow('Task not found: non-existent');
        });
    });

    describe('clear', () => {
        it('should clear all data', async () => {
            await storage.saveDefinition(definition);
            
            const instance: WorkflowInstance = {
                id: 'inst-1',
                workflowId: 'test-workflow',
                version: '1.0.0',
                currentState: 'draft',
                status: 'pending',
                data: {},
                history: [],
                createdAt: new Date(),
            };
            await storage.saveInstance(instance);

            const task: WorkflowTask = {
                id: 'task-1',
                instanceId: 'inst-1',
                name: 'Task',
                status: 'pending',
                createdAt: new Date(),
            };
            await storage.saveTask(task);

            await storage.clear();

            const retrievedDef = await storage.getDefinition('test-workflow');
            const retrievedInst = await storage.getInstance('inst-1');
            const retrievedTask = await storage.getTask('task-1');

            expect(retrievedDef).toBeNull();
            expect(retrievedInst).toBeNull();
            expect(retrievedTask).toBeNull();
        });
    });
});
