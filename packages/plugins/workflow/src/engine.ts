/**
 * Workflow Engine
 * 
 * Finite State Machine (FSM) execution engine
 */

import type {
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowContext,
    StateConfig,
    TransitionConfig,
    StateHistoryEntry,
    TransitionGuard,
    TransitionAction,
} from './types';

/**
 * Workflow engine for executing state machines
 */
export class WorkflowEngine {
    private guards: Map<string, TransitionGuard> = new Map();
    private actions: Map<string, TransitionAction> = new Map();
    private logger: any;

    constructor(logger?: any) {
        this.logger = logger || console;
    }

    /**
     * Register a guard function
     */
    registerGuard(name: string, guard: TransitionGuard): void {
        this.guards.set(name, guard);
    }

    /**
     * Register an action function
     */
    registerAction(name: string, action: TransitionAction): void {
        this.actions.set(name, action);
    }

    /**
     * Create a new workflow instance
     */
    createInstance(
        definition: WorkflowDefinition,
        data: Record<string, any> = {},
        startedBy?: string
    ): WorkflowInstance {
        const instance: WorkflowInstance = {
            id: this.generateInstanceId(),
            workflowId: definition.id,
            version: definition.version,
            currentState: definition.initialState,
            status: 'pending',
            data,
            history: [],
            createdAt: new Date(),
            startedBy,
        };

        return instance;
    }

    /**
     * Start a workflow instance
     */
    async startInstance(
        instance: WorkflowInstance,
        definition: WorkflowDefinition
    ): Promise<WorkflowInstance> {
        if (instance.status !== 'pending') {
            throw new Error(`Cannot start workflow in status: ${instance.status}`);
        }

        instance.status = 'running';
        instance.startedAt = new Date();

        // Execute initial state's onEnter actions
        const initialState = definition.states[instance.currentState];
        const context = this.createContext(instance, definition, initialState);
        
        if (initialState.onEnter) {
            await this.executeActions(initialState.onEnter, context);
        }

        // Check if initial state is final
        if (initialState.final) {
            instance.status = 'completed';
            instance.completedAt = new Date();
        }

        return instance;
    }

    /**
     * Execute a transition
     */
    async executeTransition(
        instance: WorkflowInstance,
        definition: WorkflowDefinition,
        transitionName: string,
        triggeredBy?: string,
        transitionData?: Record<string, any>
    ): Promise<WorkflowInstance> {
        if (instance.status !== 'running') {
            throw new Error(`Cannot execute transition on workflow in status: ${instance.status}`);
        }

        const currentState = definition.states[instance.currentState];
        if (!currentState.transitions || !currentState.transitions[transitionName]) {
            throw new Error(
                `Transition "${transitionName}" not available in state "${instance.currentState}"`
            );
        }

        const transition = currentState.transitions[transitionName];
        const context = this.createContext(instance, definition, currentState, {
            name: transitionName,
            config: transition,
        });

        // Check guards
        if (transition.guards) {
            const guardsPass = await this.checkGuards(transition.guards, context);
            if (!guardsPass) {
                throw new Error(`Transition "${transitionName}" blocked by guard conditions`);
            }
        }

        const fromState = instance.currentState;
        const toState = transition.target;

        // Execute current state's onExit actions
        if (currentState.onExit) {
            await this.executeActions(currentState.onExit, context);
        }

        // Execute transition actions
        if (transition.actions) {
            await this.executeActions(transition.actions, context);
        }

        // Update instance state
        instance.currentState = toState;

        // Add to history
        const historyEntry: StateHistoryEntry = {
            fromState,
            toState,
            transition: transitionName,
            timestamp: new Date(),
            triggeredBy,
            data: transitionData,
        };
        instance.history.push(historyEntry);

        // Execute new state's onEnter actions
        const newState = definition.states[toState];
        const newContext = this.createContext(instance, definition, newState);
        
        if (newState.onEnter) {
            await this.executeActions(newState.onEnter, newContext);
        }

        // Check if new state is final
        if (newState.final) {
            instance.status = 'completed';
            instance.completedAt = new Date();
            instance.completedBy = triggeredBy;
        }

        return instance;
    }

    /**
     * Abort a workflow instance
     */
    async abortInstance(
        instance: WorkflowInstance,
        definition: WorkflowDefinition,
        abortedBy?: string
    ): Promise<WorkflowInstance> {
        if (instance.status !== 'running') {
            throw new Error(`Cannot abort workflow in status: ${instance.status}`);
        }

        instance.status = 'aborted';
        instance.abortedAt = new Date();
        instance.completedBy = abortedBy;

        // Execute current state's onExit actions
        const currentState = definition.states[instance.currentState];
        if (currentState.onExit) {
            const context = this.createContext(instance, definition, currentState);
            await this.executeActions(currentState.onExit, context);
        }

        return instance;
    }

    /**
     * Get available transitions for current state
     */
    getAvailableTransitions(
        instance: WorkflowInstance,
        definition: WorkflowDefinition
    ): string[] {
        const currentState = definition.states[instance.currentState];
        if (!currentState.transitions) {
            return [];
        }

        return Object.keys(currentState.transitions);
    }

    /**
     * Check if a transition is available
     */
    async canExecuteTransition(
        instance: WorkflowInstance,
        definition: WorkflowDefinition,
        transitionName: string
    ): Promise<boolean> {
        if (instance.status !== 'running') {
            return false;
        }

        const currentState = definition.states[instance.currentState];
        if (!currentState.transitions || !currentState.transitions[transitionName]) {
            return false;
        }

        const transition = currentState.transitions[transitionName];
        if (!transition.guards || transition.guards.length === 0) {
            return true;
        }

        const context = this.createContext(instance, definition, currentState, {
            name: transitionName,
            config: transition,
        });

        return this.checkGuards(transition.guards, context);
    }

    /**
     * Create a workflow context
     */
    private createContext(
        instance: WorkflowInstance,
        definition: WorkflowDefinition,
        currentState: StateConfig,
        transition?: { name: string; config: TransitionConfig }
    ): WorkflowContext {
        return {
            instance,
            definition,
            currentState,
            transition,
            logger: this.logger,
            getData: <T = any>(key?: string): T => {
                if (key === undefined) {
                    return instance.data as T;
                }
                return instance.data[key] as T;
            },
            setData: (key: string, value: any) => {
                instance.data[key] = value;
            },
        };
    }

    /**
     * Check guard conditions
     */
    private async checkGuards(
        guards: TransitionGuard[],
        context: WorkflowContext
    ): Promise<boolean> {
        for (const guard of guards) {
            const result = await guard(context);
            if (!result) {
                return false;
            }
        }
        return true;
    }

    /**
     * Execute actions
     */
    private async executeActions(
        actions: TransitionAction[],
        context: WorkflowContext
    ): Promise<void> {
        for (const action of actions) {
            try {
                await action(context);
            } catch (error) {
                this.logger.error('Error executing action:', error);
                throw error;
            }
        }
    }

    /**
     * Generate a unique instance ID
     */
    private generateInstanceId(): string {
        return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }
}
