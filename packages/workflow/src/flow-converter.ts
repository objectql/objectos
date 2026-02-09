/**
 * Flow Conversion Utilities
 * 
 * Provides conversion between legacy WorkflowDefinition (FSM) format
 * and the spec-compliant Flow format from @objectstack/spec.
 * 
 * This enables gradual migration from the legacy state machine format
 * to the visual flow format defined in the spec.
 */

import type {
    Flow,
    FlowNode,
    FlowEdge,
    WorkflowDefinition,
    StateConfig,
    TransitionConfig,
} from './types.js';

/**
 * Convert a legacy WorkflowDefinition (FSM) to a spec Flow
 */
export function legacyToFlow(definition: WorkflowDefinition): Flow {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];
    let nodeIndex = 0;

    // Create nodes from states
    const stateNodeMap = new Map<string, string>();

    for (const [stateName, stateConfig] of Object.entries(definition.states)) {
        const nodeId = `node_${nodeIndex++}`;
        stateNodeMap.set(stateName, nodeId);

        // Determine node type
        let nodeType: FlowNode['type'] = 'assignment';
        if (stateConfig.initial) {
            nodeType = 'start';
        } else if (stateConfig.final) {
            nodeType = 'end';
        }

        const node: FlowNode = {
            id: nodeId,
            label: stateName,
            type: nodeType,
            config: {
                metadata: stateConfig.metadata,
                onEnter: stateConfig.onEnter?.map(a => typeof a === 'string' ? a : (a as any).type),
                onExit: stateConfig.onExit?.map(a => typeof a === 'string' ? a : (a as any).type),
            },
        };

        nodes.push(node);
    }

    // Create edges from transitions
    let edgeIndex = 0;
    for (const [stateName, stateConfig] of Object.entries(definition.states)) {
        if (!stateConfig.transitions) continue;

        const sourceNodeId = stateNodeMap.get(stateName);
        if (!sourceNodeId) continue;

        for (const [transitionName, transitionConfig] of Object.entries(stateConfig.transitions)) {
            const targetStateName = typeof transitionConfig === 'string'
                ? transitionConfig
                : (transitionConfig as TransitionConfig).target;

            const targetNodeId = stateNodeMap.get(targetStateName);
            if (!targetNodeId) continue;

            const edge: FlowEdge = {
                id: `edge_${edgeIndex++}`,
                source: sourceNodeId,
                target: targetNodeId,
                label: transitionName,
                condition: undefined,
            };

            // Add guard conditions as edge conditions
            if (typeof transitionConfig !== 'string' && (transitionConfig as TransitionConfig).guards) {
                const guards = (transitionConfig as TransitionConfig).guards;
                if (guards && guards.length > 0) {
                    edge.condition = guards.map(g =>
                        typeof g === 'string' ? g : (g as any).type
                    ).join(' && ');
                }
            }

            edges.push(edge);
        }
    }

    return {
        name: definition.name,
        label: definition.name,
        description: definition.description,
        type: 'autolaunched',
        version: typeof definition.version === 'string' ? parseInt(definition.version, 10) || 1 : (definition.version ?? 1),
        nodes,
        edges,
    };
}

/**
 * Convert a spec Flow back to a legacy WorkflowDefinition (FSM)
 */
export function flowToLegacy(
    flow: Flow,
    options?: { id?: string; object?: string; type?: 'approval' | 'sequential' | 'parallel' | 'conditional' }
): WorkflowDefinition {
    const states: Record<string, StateConfig> = {};
    let initialState = '';

    // Map nodes to states
    const nodeIdToName = new Map<string, string>();
    for (const node of flow.nodes) {
        nodeIdToName.set(node.id, node.label);
    }

    for (const node of flow.nodes) {
        const stateConfig: StateConfig = {
            name: node.label,
            initial: node.type === 'start',
            final: node.type === 'end',
            metadata: node.config,
            transitions: {},
        };

        if (node.type === 'start') {
            initialState = node.label;
        }

        states[node.label] = stateConfig;
    }

    // Map edges to transitions
    for (const edge of flow.edges) {
        const sourceName = nodeIdToName.get(edge.source);
        const targetName = nodeIdToName.get(edge.target);
        if (!sourceName || !targetName) continue;

        const state = states[sourceName];
        if (!state || !state.transitions) continue;

        const transitionName = edge.label || `to_${targetName}`;
        state.transitions[transitionName] = {
            target: targetName,
            guards: edge.condition ? [edge.condition] : undefined,
        };
    }

    return {
        id: options?.id || `flow_${Date.now()}`,
        name: flow.name,
        description: flow.description,
        type: options?.type || 'sequential',
        version: String(flow.version || '1.0.0'),
        states,
        initialState: initialState || Object.keys(states)[0] || '',
    };
}

/**
 * Validate a Flow definition for structural correctness
 */
export function validateFlow(flow: Flow): string[] {
    const errors: string[] = [];

    if (!flow.name) errors.push('Flow must have a name');
    if (!flow.nodes || flow.nodes.length === 0) errors.push('Flow must have at least one node');
    if (!flow.edges) errors.push('Flow must have an edges array');

    // Check for start and end nodes
    const startNodes = flow.nodes.filter(n => n.type === 'start');
    const endNodes = flow.nodes.filter(n => n.type === 'end');

    if (startNodes.length === 0) errors.push('Flow must have at least one start node');
    if (startNodes.length > 1) errors.push('Flow should have exactly one start node');
    if (endNodes.length === 0) errors.push('Flow must have at least one end node');

    // Check edge references
    const nodeIds = new Set(flow.nodes.map(n => n.id));
    for (const edge of flow.edges) {
        if (!nodeIds.has(edge.source)) errors.push(`Edge ${edge.id} references unknown source node: ${edge.source}`);
        if (!nodeIds.has(edge.target)) errors.push(`Edge ${edge.id} references unknown target node: ${edge.target}`);
    }

    // Check for orphan nodes (no incoming or outgoing edges, except start/end)
    for (const node of flow.nodes) {
        if (node.type === 'start') continue;
        const hasIncoming = flow.edges.some(e => e.target === node.id);
        if (!hasIncoming) errors.push(`Node ${node.label} (${node.id}) has no incoming edges`);
    }

    for (const node of flow.nodes) {
        if (node.type === 'end') continue;
        const hasOutgoing = flow.edges.some(e => e.source === node.id);
        if (!hasOutgoing) errors.push(`Node ${node.label} (${node.id}) has no outgoing edges`);
    }

    return errors;
}
