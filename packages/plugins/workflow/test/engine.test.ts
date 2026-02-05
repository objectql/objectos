/**
 * Engine Tests
 * 
 * Tests for WorkflowEngine - FSM execution
 */

import { WorkflowEngine } from '../src/engine';
import type {
    WorkflowDefinition,
    WorkflowInstance,
    StateConfig,
    TransitionConfig,
    WorkflowContext,
} from '../src/types';

describe('WorkflowEngine', () => {
    let engine: WorkflowEngine;
    let mockLogger: any;
    let definition: WorkflowDefinition;

    beforeEach(() => {
        mockLogger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
        };

        engine = new WorkflowEngine(mockLogger);

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
                        submit: {
                            target: 'review',
                        },
                    },
                },
                review: {
                    name: 'review',
                    transitions: {
                        approve: {
                            target: 'approved',
                        },
                        reject: {
                            target: 'rejected',
                        },
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

    describe('createInstance', () => {
        it('should create a workflow instance with correct initial state', () => {
            const instance = engine.createInstance(definition, { foo: 'bar' }, 'user-1');

            expect(instance.id).toBeDefined();
            expect(instance.workflowId).toBe('test-workflow');
            expect(instance.version).toBe('1.0.0');
            expect(instance.currentState).toBe('draft');
            expect(instance.status).toBe('pending');
            expect(instance.data).toEqual({ foo: 'bar' });
            expect(instance.history).toEqual([]);
            expect(instance.createdAt).toBeInstanceOf(Date);
            expect(instance.startedBy).toBe('user-1');
        });

        it('should create instance with empty data if not provided', () => {
            const instance = engine.createInstance(definition);

            expect(instance.data).toEqual({});
        });
    });

    describe('startInstance', () => {
        it('should start a workflow instance successfully', async () => {
            const instance = engine.createInstance(definition);

            const started = await engine.startInstance(instance, definition);

            expect(started.status).toBe('running');
            expect(started.startedAt).toBeInstanceOf(Date);
        });

        it('should execute initial state onEnter actions', async () => {
            const onEnterAction = vi.fn();
            engine.registerAction('logEntry', onEnterAction);
            
            definition.states.draft.onEnter = [onEnterAction];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            expect(onEnterAction).toHaveBeenCalledTimes(1);
        });

        it('should mark as completed if initial state is final', async () => {
            definition.initialState = 'approved';
            definition.states.approved.initial = true;

            const instance = engine.createInstance(definition);
            const started = await engine.startInstance(instance, definition);

            expect(started.status).toBe('completed');
            expect(started.completedAt).toBeInstanceOf(Date);
        });

        it('should throw error if trying to start non-pending workflow', async () => {
            const instance = engine.createInstance(definition);
            instance.status = 'running';

            await expect(engine.startInstance(instance, definition))
                .rejects.toThrow('Cannot start workflow in status: running');
        });
    });

    describe('executeTransition', () => {
        it('should execute a valid transition', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            const updated = await engine.executeTransition(
                instance,
                definition,
                'submit',
                'user-1'
            );

            expect(updated.currentState).toBe('review');
            expect(updated.history).toHaveLength(1);
            expect(updated.history[0]).toMatchObject({
                fromState: 'draft',
                toState: 'review',
                transition: 'submit',
                triggeredBy: 'user-1',
            });
        });

        it('should execute transition with data', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            const updated = await engine.executeTransition(
                instance,
                definition,
                'submit',
                'user-1',
                { comment: 'Looks good' }
            );

            expect(updated.history[0].data).toEqual({ comment: 'Looks good' });
        });

        it('should throw error for invalid transition', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await expect(
                engine.executeTransition(instance, definition, 'approve')
            ).rejects.toThrow('Transition "approve" not available in state "draft"');
        });

        it('should throw error when executing transition on non-running workflow', async () => {
            const instance = engine.createInstance(definition);

            await expect(
                engine.executeTransition(instance, definition, 'submit')
            ).rejects.toThrow('Cannot execute transition on workflow in status: pending');
        });

        it('should mark workflow as completed when reaching final state', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.executeTransition(instance, definition, 'submit', 'user-1');
            const completed = await engine.executeTransition(
                instance,
                definition,
                'approve',
                'user-1'
            );

            expect(completed.status).toBe('completed');
            expect(completed.completedAt).toBeInstanceOf(Date);
            expect(completed.completedBy).toBe('user-1');
        });
    });

    describe('abortInstance', () => {
        it('should abort a running workflow', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            const aborted = await engine.abortInstance(instance, definition, 'user-1');

            expect(aborted.status).toBe('aborted');
            expect(aborted.abortedAt).toBeInstanceOf(Date);
            expect(aborted.completedBy).toBe('user-1');
        });

        it('should execute onExit actions when aborting', async () => {
            const onExitAction = vi.fn();
            engine.registerAction('cleanup', onExitAction);
            definition.states.draft.onExit = [onExitAction];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.abortInstance(instance, definition);

            expect(onExitAction).toHaveBeenCalledTimes(1);
        });

        it('should throw error when aborting non-running workflow', async () => {
            const instance = engine.createInstance(definition);

            await expect(
                engine.abortInstance(instance, definition)
            ).rejects.toThrow('Cannot abort workflow in status: pending');
        });
    });

    describe('guard conditions', () => {
        it('should block transition when guard returns false', async () => {
            const guardFn = vi.fn().mockReturnValue(false);
            engine.registerGuard('checkPermission', guardFn);

            definition.states.draft.transitions!.submit.guards = [guardFn];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await expect(
                engine.executeTransition(instance, definition, 'submit')
            ).rejects.toThrow('Transition "submit" blocked by guard conditions');

            expect(guardFn).toHaveBeenCalledTimes(1);
        });

        it('should allow transition when guard returns true', async () => {
            const guardFn = vi.fn().mockReturnValue(true);
            engine.registerGuard('checkPermission', guardFn);

            definition.states.draft.transitions!.submit.guards = [guardFn];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            const updated = await engine.executeTransition(instance, definition, 'submit');

            expect(updated.currentState).toBe('review');
            expect(guardFn).toHaveBeenCalledTimes(1);
        });

        it('should pass context to guard functions', async () => {
            let receivedContext: WorkflowContext | undefined;
            const guardFn = vi.fn((ctx: WorkflowContext) => {
                receivedContext = ctx;
                return true;
            });

            definition.states.draft.transitions!.submit.guards = [guardFn];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.executeTransition(instance, definition, 'submit');

            expect(receivedContext).toBeDefined();
            expect(receivedContext!.instance).toBeDefined();
            expect(receivedContext!.definition).toBe(definition);
            expect(receivedContext!.currentState.name).toBe('draft');
        });
    });

    describe('transition actions', () => {
        it('should execute transition actions', async () => {
            const actionFn = vi.fn();
            engine.registerAction('sendNotification', actionFn);

            definition.states.draft.transitions!.submit.actions = [actionFn];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.executeTransition(instance, definition, 'submit');

            expect(actionFn).toHaveBeenCalledTimes(1);
        });

        it('should execute onExit and onEnter actions in correct order', async () => {
            const callOrder: string[] = [];

            const onExitAction = vi.fn(() => { callOrder.push('exit'); });
            const transitionAction = vi.fn(() => { callOrder.push('transition'); });
            const onEnterAction = vi.fn(() => { callOrder.push('enter'); });

            definition.states.draft.onExit = [onExitAction as any];
            definition.states.draft.transitions!.submit.actions = [transitionAction as any];
            definition.states.review.onEnter = [onEnterAction as any];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.executeTransition(instance, definition, 'submit');

            expect(callOrder).toEqual(['exit', 'transition', 'enter']);
        });

        it('should allow actions to modify workflow data', async () => {
            const actionFn = vi.fn((ctx: WorkflowContext) => {
                ctx.setData('processedBy', 'action-fn');
                ctx.setData('timestamp', Date.now());
            });

            definition.states.draft.transitions!.submit.actions = [actionFn];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.executeTransition(instance, definition, 'submit');

            expect(instance.data.processedBy).toBe('action-fn');
            expect(instance.data.timestamp).toBeDefined();
        });
    });

    describe('state history', () => {
        it('should track state history correctly', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            expect(instance.history).toHaveLength(0);

            await engine.executeTransition(instance, definition, 'submit', 'user-1');
            expect(instance.history).toHaveLength(1);

            await engine.executeTransition(instance, definition, 'approve', 'user-2');
            expect(instance.history).toHaveLength(2);

            expect(instance.history[0]).toMatchObject({
                fromState: 'draft',
                toState: 'review',
                transition: 'submit',
                triggeredBy: 'user-1',
            });

            expect(instance.history[1]).toMatchObject({
                fromState: 'review',
                toState: 'approved',
                transition: 'approve',
                triggeredBy: 'user-2',
            });
        });

        it('should include timestamps in history entries', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.executeTransition(instance, definition, 'submit');

            expect(instance.history[0].timestamp).toBeInstanceOf(Date);
        });
    });

    describe('getAvailableTransitions', () => {
        it('should return available transitions for current state', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            const transitions = engine.getAvailableTransitions(instance, definition);

            expect(transitions).toEqual(['submit']);
        });

        it('should return empty array for final state', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            await engine.executeTransition(instance, definition, 'submit');
            await engine.executeTransition(instance, definition, 'approve');

            const transitions = engine.getAvailableTransitions(instance, definition);

            expect(transitions).toEqual([]);
        });
    });

    describe('canExecuteTransition', () => {
        it('should return true for valid transition', async () => {
            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            const canExecute = await engine.canExecuteTransition(
                instance,
                definition,
                'submit'
            );

            expect(canExecute).toBe(true);
        });

        it('should return false for non-running workflow', async () => {
            const instance = engine.createInstance(definition);

            const canExecute = await engine.canExecuteTransition(
                instance,
                definition,
                'submit'
            );

            expect(canExecute).toBe(false);
        });

        it('should return false when guard blocks transition', async () => {
            const guardFn = vi.fn().mockResolvedValue(false);
            definition.states.draft.transitions!.submit.guards = [guardFn];

            const instance = engine.createInstance(definition);
            await engine.startInstance(instance, definition);

            const canExecute = await engine.canExecuteTransition(
                instance,
                definition,
                'submit'
            );

            expect(canExecute).toBe(false);
        });
    });
});
