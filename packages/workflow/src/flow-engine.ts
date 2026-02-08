/**
 * Flow Execution Engine
 * 
 * Executes Flow definitions natively using the spec-compliant
 * Flow/FlowNode/FlowEdge format — without converting to legacy FSM.
 * 
 * Traverses the graph from the start node, following edges based on
 * conditions, and executing node-specific logic at each step.
 */

import type {
    Flow,
    FlowNode,
    FlowEdge,
    WorkflowInstance,
    StateHistoryEntry,
    WorkflowStatus,
} from './types.js';

/**
 * Node handler function — executed when a node is visited
 */
export type FlowNodeHandler = (
    node: FlowNode,
    context: FlowExecutionContext,
) => Promise<FlowNodeResult>;

/**
 * Result returned by a node handler
 */
export interface FlowNodeResult {
    /** Whether the node executed successfully */
    success: boolean;
    /** Output data from the node */
    output?: Record<string, unknown>;
    /** Error message if failed */
    error?: string;
    /** Explicit next edge label to follow (for decision nodes) */
    nextEdge?: string;
}

/**
 * Flow execution context — available to node handlers
 */
export interface FlowExecutionContext {
    /** The flow definition being executed */
    flow: Flow;
    /** The workflow instance */
    instance: WorkflowInstance;
    /** Flow variables (accumulated during execution) */
    variables: Record<string, unknown>;
    /** Logger */
    logger: {
        info: (msg: string, ...args: unknown[]) => void;
        warn: (msg: string, ...args: unknown[]) => void;
        error: (msg: string, ...args: unknown[]) => void;
        debug: (msg: string, ...args: unknown[]) => void;
    };
}

/**
 * Flow execution result
 */
export interface FlowExecutionResult {
    /** Whether the flow completed successfully */
    success: boolean;
    /** Final instance state */
    instance: WorkflowInstance;
    /** Accumulated variables */
    variables: Record<string, unknown>;
    /** Error message if failed */
    error?: string;
    /** Number of nodes visited */
    nodesVisited: number;
}

/**
 * Logger interface for FlowEngine
 */
interface FlowLogger {
    info: (msg: string, ...args: unknown[]) => void;
    warn: (msg: string, ...args: unknown[]) => void;
    error: (msg: string, ...args: unknown[]) => void;
    debug: (msg: string, ...args: unknown[]) => void;
}

/**
 * Flow Engine — executes spec-compliant Flow graphs natively
 */
export class FlowEngine {
    private handlers: Map<string, FlowNodeHandler> = new Map();
    private logger: FlowLogger;
    private maxNodes: number;

    constructor(options?: { logger?: FlowLogger; maxNodes?: number }) {
        this.logger = options?.logger || console;
        this.maxNodes = options?.maxNodes || 500;

        // Register default handlers
        this.registerDefaultHandlers();
    }

    /**
     * Register a handler for a node type
     */
    registerHandler(nodeType: string, handler: FlowNodeHandler): void {
        this.handlers.set(nodeType, handler);
    }

    /**
     * Create a new workflow instance from a Flow definition
     */
    createInstance(
        flow: Flow,
        data: Record<string, unknown> = {},
        startedBy?: string,
    ): WorkflowInstance {
        const startNode = flow.nodes.find(n => n.type === 'start');
        return {
            id: `flow_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            workflowId: flow.name,
            version: String(flow.version ?? '1'),
            currentState: startNode?.id || flow.nodes[0]?.id || '',
            status: 'pending',
            data,
            history: [],
            createdAt: new Date(),
            startedBy,
        };
    }

    /**
     * Execute a Flow from start to completion
     * 
     * Walks the graph from the start node, executing handlers at each node,
     * and following edges until an end node is reached or an error occurs.
     */
    async execute(
        flow: Flow,
        instance: WorkflowInstance,
        initialVariables: Record<string, unknown> = {},
    ): Promise<FlowExecutionResult> {
        instance.status = 'running';
        instance.startedAt = new Date();

        const context: FlowExecutionContext = {
            flow,
            instance,
            variables: { ...initialVariables },
            logger: this.logger,
        };

        const nodeMap = new Map<string, FlowNode>();
        for (const node of flow.nodes) {
            nodeMap.set(node.id, node);
        }

        let currentNodeId = instance.currentState;
        let nodesVisited = 0;

        try {
            while (currentNodeId && nodesVisited < this.maxNodes) {
                const node = nodeMap.get(currentNodeId);
                if (!node) {
                    throw new Error(`Node not found: ${currentNodeId}`);
                }

                nodesVisited++;

                // Execute the node handler
                const handler = this.handlers.get(node.type);
                const result = handler
                    ? await handler(node, context)
                    : { success: true };

                if (!result.success) {
                    instance.status = 'failed';
                    instance.failedAt = new Date();
                    instance.error = result.error || `Node ${node.id} failed`;
                    return {
                        success: false,
                        instance,
                        variables: context.variables,
                        error: instance.error,
                        nodesVisited,
                    };
                }

                // Merge output into variables
                if (result.output) {
                    Object.assign(context.variables, result.output);
                }

                // If this is an end node, we're done
                if (node.type === 'end') {
                    instance.currentState = node.id;
                    instance.status = 'completed';
                    instance.completedAt = new Date();
                    return {
                        success: true,
                        instance,
                        variables: context.variables,
                        nodesVisited,
                    };
                }

                // Find next node via edges
                const nextNodeId = this.resolveNextNode(flow, node, context, result.nextEdge);
                if (!nextNodeId) {
                    // Dead end — no outgoing edges
                    instance.status = 'completed';
                    instance.completedAt = new Date();
                    return {
                        success: true,
                        instance,
                        variables: context.variables,
                        nodesVisited,
                    };
                }

                // Record transition
                const entry: StateHistoryEntry = {
                    fromState: currentNodeId,
                    toState: nextNodeId,
                    transition: `${node.type}→`,
                    timestamp: new Date(),
                    triggeredBy: instance.startedBy,
                };
                instance.history.push(entry);

                instance.currentState = nextNodeId;
                currentNodeId = nextNodeId;
            }

            if (nodesVisited >= this.maxNodes) {
                instance.status = 'failed';
                instance.error = `Max node limit (${this.maxNodes}) exceeded — possible infinite loop`;
                return {
                    success: false,
                    instance,
                    variables: context.variables,
                    error: instance.error,
                    nodesVisited,
                };
            }

            return {
                success: true,
                instance,
                variables: context.variables,
                nodesVisited,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            instance.status = 'failed';
            instance.failedAt = new Date();
            instance.error = errorMessage;
            return {
                success: false,
                instance,
                variables: context.variables,
                error: errorMessage,
                nodesVisited,
            };
        }
    }

    /**
     * Resolve the next node from outgoing edges
     */
    private resolveNextNode(
        flow: Flow,
        currentNode: FlowNode,
        context: FlowExecutionContext,
        preferredEdge?: string,
    ): string | null {
        const outgoing = flow.edges.filter(e => e.source === currentNode.id);
        if (outgoing.length === 0) return null;

        // If caller specified a preferred edge label, try to follow it
        if (preferredEdge) {
            const preferred = outgoing.find(e => e.label === preferredEdge);
            if (preferred) return preferred.target;
        }

        // For decision nodes, evaluate conditions
        if (currentNode.type === 'decision') {
            for (const edge of outgoing) {
                if (edge.condition) {
                    if (this.evaluateCondition(edge.condition, context.variables)) {
                        return edge.target;
                    }
                }
            }
            // Fall through to default edge (no condition)
            const defaultEdge = outgoing.find(e => !e.condition);
            return defaultEdge?.target || outgoing[0]?.target || null;
        }

        // For non-decision nodes, take the first (or default) edge
        const defaultEdge = outgoing.find(e => !e.condition) || outgoing[0];
        return defaultEdge?.target || null;
    }

    /**
     * Evaluate a simple condition expression against variables
     */
    private evaluateCondition(
        condition: string,
        variables: Record<string, unknown>,
    ): boolean {
        try {
            // Simple expression evaluator: supports "field == value", "field != value"
            const eqMatch = condition.match(/^(\w+)\s*==\s*"?([^"]*)"?$/);
            if (eqMatch) {
                const actual = variables[eqMatch[1]];
                const expected = eqMatch[2];
                // Handle boolean/number comparison
                if (expected === 'true') return actual === true || actual === 'true';
                if (expected === 'false') return actual === false || actual === 'false';
                const num = Number(expected);
                if (!isNaN(num) && expected !== '') return actual === num;
                return String(actual) === expected;
            }
            const neqMatch = condition.match(/^(\w+)\s*!=\s*"?([^"]*)"?$/);
            if (neqMatch) {
                const actual = variables[neqMatch[1]];
                const expected = neqMatch[2];
                if (expected === 'true') return actual !== true && actual !== 'true';
                if (expected === 'false') return actual !== false && actual !== 'false';
                const num = Number(expected);
                if (!isNaN(num) && expected !== '') return actual !== num;
                return String(actual) !== expected;
            }
            // Boolean check: "field"
            return !!variables[condition];
        } catch {
            return false;
        }
    }

    /**
     * Register default node handlers for common types
     */
    private registerDefaultHandlers(): void {
        // Start node — no-op, just pass through
        this.handlers.set('start', async () => ({ success: true }));

        // End node — no-op, execution stops
        this.handlers.set('end', async () => ({ success: true }));

        // Assignment node — set variables from config
        this.handlers.set('assignment', async (node, ctx) => {
            if (node.config) {
                for (const [key, value] of Object.entries(node.config)) {
                    ctx.variables[key] = value;
                }
            }
            return { success: true };
        });

        // Decision node — handler just passes; routing happens in resolveNextNode
        this.handlers.set('decision', async () => ({ success: true }));

        // Wait node — no-op in synchronous execution
        this.handlers.set('wait', async () => ({ success: true }));

        // Script node — basic handler (production deployments should register
        // a custom handler that delegates to @objectos/automation executeSandboxedWithPolicy)
        this.handlers.set('script', async (node, ctx) => {
            const script = node.config?.script as string | undefined;
            if (!script) return { success: true };
            ctx.logger.warn('Default script handler used — register a sandboxed handler for production');
            return { success: true };
        });
    }
}
