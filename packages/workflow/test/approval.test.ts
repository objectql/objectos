/**
 * Approval Service Tests
 */

import { ApprovalService } from '../src/approval';
import { InMemoryWorkflowStorage } from '../src/storage';
import type { WorkflowTask, ApprovalChain } from '../src/types';

describe('ApprovalService', () => {
    let storage: InMemoryWorkflowStorage;
    let approvalService: ApprovalService;

    beforeEach(async () => {
        storage = new InMemoryWorkflowStorage();
        approvalService = new ApprovalService(storage);
    });

    describe('delegateTask', () => {
        it('should delegate a pending task to another user', async () => {
            // Create a task
            const task: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_task',
                description: 'Approve document',
                assignedTo: 'user1@example.com',
                status: 'pending',
                createdAt: new Date(),
            };
            await storage.saveTask(task);

            // Delegate the task
            const delegated = await approvalService.delegateTask({
                taskId: 'task_1',
                delegateTo: 'user2@example.com',
                delegatedBy: 'user1@example.com',
                reason: 'Out of office',
            });

            expect(delegated.status).toBe('delegated');
            expect(delegated.assignedTo).toBe('user2@example.com');
            expect(delegated.delegatedTo).toBe('user2@example.com');
            expect(delegated.originalAssignee).toBe('user1@example.com');
            expect(delegated.delegationReason).toBe('Out of office');
            expect(delegated.delegatedAt).toBeInstanceOf(Date);
        });

        it('should preserve original assignee on second delegation', async () => {
            // Create a task
            const task: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_task',
                assignedTo: 'user1@example.com',
                status: 'pending',
                createdAt: new Date(),
            };
            await storage.saveTask(task);

            // First delegation
            await approvalService.delegateTask({
                taskId: 'task_1',
                delegateTo: 'user2@example.com',
                delegatedBy: 'user1@example.com',
                reason: 'First delegation',
            });

            // Second delegation (should work on delegated task)
            const delegated = await approvalService.delegateTask({
                taskId: 'task_1',
                delegateTo: 'user3@example.com',
                delegatedBy: 'user2@example.com',
                reason: 'Second delegation',
            });

            // Original assignee should still be user1
            expect(delegated.originalAssignee).toBe('user1@example.com');
            expect(delegated.assignedTo).toBe('user3@example.com');
        });

        it('should throw error for non-existent task', async () => {
            await expect(
                approvalService.delegateTask({
                    taskId: 'non_existent',
                    delegateTo: 'user2@example.com',
                    delegatedBy: 'user1@example.com',
                })
            ).rejects.toThrow('Task not found');
        });

        it('should throw error when delegating completed task', async () => {
            const task: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_task',
                assignedTo: 'user1@example.com',
                status: 'completed',
                createdAt: new Date(),
            };
            await storage.saveTask(task);

            await expect(
                approvalService.delegateTask({
                    taskId: 'task_1',
                    delegateTo: 'user2@example.com',
                    delegatedBy: 'user1@example.com',
                })
            ).rejects.toThrow('Cannot delegate task in status: completed');
        });
    });

    describe('escalateTask', () => {
        it('should escalate a pending task to higher authority', async () => {
            const task: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_task',
                assignedTo: 'manager@example.com',
                status: 'pending',
                createdAt: new Date(),
            };
            await storage.saveTask(task);

            const escalated = await approvalService.escalateTask({
                taskId: 'task_1',
                escalateTo: 'director@example.com',
                reason: 'Requires higher approval',
                escalatedBy: 'system',
            });

            expect(escalated.status).toBe('escalated');
            expect(escalated.assignedTo).toBe('director@example.com');
            expect(escalated.escalatedTo).toBe('director@example.com');
            expect(escalated.escalationReason).toBe('Requires higher approval');
            expect(escalated.escalatedAt).toBeInstanceOf(Date);
        });

        it('should handle automatic escalation', async () => {
            const task: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_task',
                assignedTo: 'manager@example.com',
                status: 'pending',
                createdAt: new Date(),
            };
            await storage.saveTask(task);

            const escalated = await approvalService.escalateTask({
                taskId: 'task_1',
                escalateTo: 'director@example.com',
                automatic: true,
            });

            expect(escalated.status).toBe('escalated');
            expect(escalated.escalationReason).toBe('Automatic escalation due to timeout');
        });

        it('should throw error for non-existent task', async () => {
            await expect(
                approvalService.escalateTask({
                    taskId: 'non_existent',
                    escalateTo: 'director@example.com',
                })
            ).rejects.toThrow('Task not found');
        });

        it('should throw error when escalating completed task', async () => {
            const task: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_task',
                assignedTo: 'manager@example.com',
                status: 'completed',
                createdAt: new Date(),
            };
            await storage.saveTask(task);

            await expect(
                approvalService.escalateTask({
                    taskId: 'task_1',
                    escalateTo: 'director@example.com',
                })
            ).rejects.toThrow('Cannot escalate task in status: completed');
        });
    });

    describe('createApprovalChain', () => {
        it('should create multi-level approval tasks', async () => {
            const chain: ApprovalChain = {
                levels: [
                    {
                        level: 1,
                        approver: 'manager@example.com',
                        description: 'Manager approval',
                        required: true,
                        escalationTarget: 'senior_manager@example.com',
                        escalationTimeout: 48 * 60 * 60 * 1000, // 48 hours
                    },
                    {
                        level: 2,
                        approver: 'director@example.com',
                        description: 'Director approval',
                        required: true,
                        escalationTarget: 'vp@example.com',
                        escalationTimeout: 72 * 60 * 60 * 1000, // 72 hours
                    },
                    {
                        level: 3,
                        approver: 'cfo@example.com',
                        description: 'CFO final approval',
                        required: true,
                    },
                ],
            };

            const tasks = await approvalService.createApprovalChain(
                'wf_1',
                chain,
                'purchase_order'
            );

            expect(tasks).toHaveLength(3);
            
            // Check first level
            expect(tasks[0].assignedTo).toBe('manager@example.com');
            expect(tasks[0].data?.approvalLevel).toBe(1);
            expect(tasks[0].autoEscalate).toBe(true);
            expect(tasks[0].escalationTarget).toBe('senior_manager@example.com');
            expect(tasks[0].dueDate).toBeInstanceOf(Date);

            // Check second level
            expect(tasks[1].assignedTo).toBe('director@example.com');
            expect(tasks[1].data?.approvalLevel).toBe(2);

            // Check third level
            expect(tasks[2].assignedTo).toBe('cfo@example.com');
            expect(tasks[2].data?.approvalLevel).toBe(3);
            expect(tasks[2].autoEscalate).toBe(false);
        });

        it('should support optional approval levels', async () => {
            const chain: ApprovalChain = {
                levels: [
                    {
                        level: 1,
                        approver: 'manager@example.com',
                        required: true,
                    },
                    {
                        level: 2,
                        approver: 'director@example.com',
                        required: false, // Optional approval
                    },
                ],
            };

            const tasks = await approvalService.createApprovalChain(
                'wf_1',
                chain,
                'expense'
            );

            expect(tasks).toHaveLength(2);
            expect(tasks[0].data?.required).toBe(true);
            expect(tasks[1].data?.required).toBe(false);
        });
    });

    describe('isApprovalChainComplete', () => {
        it('should return true when all required tasks are completed', async () => {
            const task1: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_1',
                assignedTo: 'user1@example.com',
                status: 'completed',
                createdAt: new Date(),
                data: { required: true },
            };
            const task2: WorkflowTask = {
                id: 'task_2',
                instanceId: 'wf_1',
                name: 'approval_2',
                assignedTo: 'user2@example.com',
                status: 'completed',
                createdAt: new Date(),
                data: { required: true },
            };
            
            await storage.saveTask(task1);
            await storage.saveTask(task2);

            const isComplete = await approvalService.isApprovalChainComplete('wf_1');
            expect(isComplete).toBe(true);
        });

        it('should return false when required tasks are pending', async () => {
            const task1: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_1',
                assignedTo: 'user1@example.com',
                status: 'completed',
                createdAt: new Date(),
                data: { required: true },
            };
            const task2: WorkflowTask = {
                id: 'task_2',
                instanceId: 'wf_1',
                name: 'approval_2',
                assignedTo: 'user2@example.com',
                status: 'pending',
                createdAt: new Date(),
                data: { required: true },
            };
            
            await storage.saveTask(task1);
            await storage.saveTask(task2);

            const isComplete = await approvalService.isApprovalChainComplete('wf_1');
            expect(isComplete).toBe(false);
        });

        it('should ignore optional tasks when checking completion', async () => {
            const task1: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_1',
                assignedTo: 'user1@example.com',
                status: 'completed',
                createdAt: new Date(),
                data: { required: true },
            };
            const task2: WorkflowTask = {
                id: 'task_2',
                instanceId: 'wf_1',
                name: 'approval_2',
                assignedTo: 'user2@example.com',
                status: 'pending',
                createdAt: new Date(),
                data: { required: false },
            };
            
            await storage.saveTask(task1);
            await storage.saveTask(task2);

            const isComplete = await approvalService.isApprovalChainComplete('wf_1');
            expect(isComplete).toBe(true);
        });
    });

    describe('hasRejectedApproval', () => {
        it('should return true when any task is rejected', async () => {
            const task1: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_1',
                assignedTo: 'user1@example.com',
                status: 'completed',
                createdAt: new Date(),
            };
            const task2: WorkflowTask = {
                id: 'task_2',
                instanceId: 'wf_1',
                name: 'approval_2',
                assignedTo: 'user2@example.com',
                status: 'rejected',
                createdAt: new Date(),
            };
            
            await storage.saveTask(task1);
            await storage.saveTask(task2);

            const hasRejected = await approvalService.hasRejectedApproval('wf_1');
            expect(hasRejected).toBe(true);
        });

        it('should return false when no tasks are rejected', async () => {
            const task1: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_1',
                assignedTo: 'user1@example.com',
                status: 'completed',
                createdAt: new Date(),
            };
            const task2: WorkflowTask = {
                id: 'task_2',
                instanceId: 'wf_1',
                name: 'approval_2',
                assignedTo: 'user2@example.com',
                status: 'pending',
                createdAt: new Date(),
            };
            
            await storage.saveTask(task1);
            await storage.saveTask(task2);

            const hasRejected = await approvalService.hasRejectedApproval('wf_1');
            expect(hasRejected).toBe(false);
        });
    });

    describe('getApprovalHistory', () => {
        it('should return tasks sorted by completion date', async () => {
            const now = new Date();
            const task1: WorkflowTask = {
                id: 'task_1',
                instanceId: 'wf_1',
                name: 'approval_1',
                assignedTo: 'user1@example.com',
                status: 'completed',
                createdAt: new Date(now.getTime() - 3000),
                completedAt: new Date(now.getTime() - 1000),
            };
            const task2: WorkflowTask = {
                id: 'task_2',
                instanceId: 'wf_1',
                name: 'approval_2',
                assignedTo: 'user2@example.com',
                status: 'completed',
                createdAt: new Date(now.getTime() - 2000),
                completedAt: new Date(now.getTime() - 500),
            };
            const task3: WorkflowTask = {
                id: 'task_3',
                instanceId: 'wf_1',
                name: 'approval_3',
                assignedTo: 'user3@example.com',
                status: 'pending',
                createdAt: now,
            };
            
            await storage.saveTask(task1);
            await storage.saveTask(task2);
            await storage.saveTask(task3);

            const history = await approvalService.getApprovalHistory('wf_1');
            
            expect(history).toHaveLength(3);
            expect(history[0].id).toBe('task_1'); // Completed first
            expect(history[1].id).toBe('task_2'); // Completed second
            expect(history[2].id).toBe('task_3'); // Still pending (sorted last)
        });
    });
});
