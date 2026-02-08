/**
 * Flow Engine Tests
 * 
 * Tests for native Flow execution without legacy FSM conversion.
 */

import { FlowEngine } from '../src/flow-engine.js';
import type { Flow } from '../src/types.js';

const silentLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
};

/**
 * Helper: create a simple linear flow: start → assignment → end
 */
function createSimpleFlow(): Flow {
    return {
        name: 'simple_flow',
        label: 'Simple Flow',
        type: 'autolaunched',
        nodes: [
            { id: 'n1', type: 'start', label: 'Start' },
            { id: 'n2', type: 'assignment', label: 'Set Status', config: { status: 'active' } },
            { id: 'n3', type: 'end', label: 'End' },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3' },
        ],
    } as Flow;
}

/**
 * Helper: create a decision flow: start → decision → (yes: end_a) | (no: end_b)
 */
function createDecisionFlow(): Flow {
    return {
        name: 'decision_flow',
        label: 'Decision Flow',
        type: 'autolaunched',
        nodes: [
            { id: 'n1', type: 'start', label: 'Start' },
            { id: 'n2', type: 'decision', label: 'Check Amount' },
            { id: 'n3', type: 'end', label: 'Approved' },
            { id: 'n4', type: 'end', label: 'Rejected' },
        ],
        edges: [
            { id: 'e1', source: 'n1', target: 'n2' },
            { id: 'e2', source: 'n2', target: 'n3', condition: 'approved == true', label: 'yes' },
            { id: 'e3', source: 'n2', target: 'n4', label: 'no' },
        ],
    } as Flow;
}

describe('FlowEngine', () => {
    let engine: FlowEngine;

    beforeEach(() => {
        engine = new FlowEngine({ logger: silentLogger });
    });

    describe('createInstance()', () => {
        it('should create an instance starting at the start node', () => {
            const flow = createSimpleFlow();
            const instance = engine.createInstance(flow, { key: 'value' }, 'user1');
            expect(instance.workflowId).toBe('simple_flow');
            expect(instance.currentState).toBe('n1');
            expect(instance.status).toBe('pending');
            expect(instance.data.key).toBe('value');
            expect(instance.startedBy).toBe('user1');
        });
    });

    describe('execute()', () => {
        it('should execute a simple linear flow to completion', async () => {
            const flow = createSimpleFlow();
            const instance = engine.createInstance(flow);
            const result = await engine.execute(flow, instance);

            expect(result.success).toBe(true);
            expect(result.instance.status).toBe('completed');
            expect(result.variables.status).toBe('active');
            expect(result.nodesVisited).toBe(3); // start, assignment, end
        });

        it('should follow the true branch in a decision flow', async () => {
            const flow = createDecisionFlow();
            const instance = engine.createInstance(flow);
            const result = await engine.execute(flow, instance, { approved: true });

            expect(result.success).toBe(true);
            expect(result.instance.status).toBe('completed');
            expect(result.instance.currentState).toBe('n3'); // Approved end node
        });

        it('should follow the false/default branch in a decision flow', async () => {
            const flow = createDecisionFlow();
            const instance = engine.createInstance(flow);
            const result = await engine.execute(flow, instance, { approved: false });

            expect(result.success).toBe(true);
            expect(result.instance.status).toBe('completed');
            expect(result.instance.currentState).toBe('n4'); // Rejected end node
        });

        it('should record state history entries', async () => {
            const flow = createSimpleFlow();
            const instance = engine.createInstance(flow);
            await engine.execute(flow, instance);

            expect(instance.history.length).toBe(2); // start→assignment, assignment→end
            expect(instance.history[0].fromState).toBe('n1');
            expect(instance.history[0].toState).toBe('n2');
        });

        it('should fail if a node handler fails', async () => {
            const flow = createSimpleFlow();
            engine.registerHandler('assignment', async () => ({
                success: false,
                error: 'Assignment failed',
            }));

            const instance = engine.createInstance(flow);
            const result = await engine.execute(flow, instance);

            expect(result.success).toBe(false);
            expect(result.instance.status).toBe('failed');
            expect(result.error).toBe('Assignment failed');
        });

        it('should enforce max node limit', async () => {
            const loopEngine = new FlowEngine({ logger: silentLogger, maxNodes: 5 });
            // Create a cycle: start → a → b → a (infinite loop)
            const flow: Flow = {
                name: 'loop_flow',
                label: 'Loop',
                type: 'autolaunched',
                nodes: [
                    { id: 'n1', type: 'start', label: 'Start' },
                    { id: 'n2', type: 'assignment', label: 'A' },
                    { id: 'n3', type: 'assignment', label: 'B' },
                ],
                edges: [
                    { id: 'e1', source: 'n1', target: 'n2' },
                    { id: 'e2', source: 'n2', target: 'n3' },
                    { id: 'e3', source: 'n3', target: 'n2' }, // cycle back
                ],
            } as Flow;

            const instance = loopEngine.createInstance(flow);
            const result = await loopEngine.execute(flow, instance);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Max node limit');
        });

        it('should support custom node handlers', async () => {
            const flow: Flow = {
                name: 'custom_handler_flow',
                label: 'Custom',
                type: 'autolaunched',
                nodes: [
                    { id: 'n1', type: 'start', label: 'Start' },
                    { id: 'n2', type: 'http_request', label: 'Call API', config: { url: 'https://example.com' } },
                    { id: 'n3', type: 'end', label: 'End' },
                ],
                edges: [
                    { id: 'e1', source: 'n1', target: 'n2' },
                    { id: 'e2', source: 'n2', target: 'n3' },
                ],
            } as Flow;

            engine.registerHandler('http_request', async (node) => ({
                success: true,
                output: { apiResponse: 'ok', url: node.config?.url },
            }));

            const instance = engine.createInstance(flow);
            const result = await engine.execute(flow, instance);

            expect(result.success).toBe(true);
            expect(result.variables.apiResponse).toBe('ok');
        });

        it('should handle node handler that returns nextEdge', async () => {
            const flow: Flow = {
                name: 'edge_select_flow',
                label: 'Edge Select',
                type: 'autolaunched',
                nodes: [
                    { id: 'n1', type: 'start', label: 'Start' },
                    { id: 'n2', type: 'screen', label: 'User Choice' },
                    { id: 'n3', type: 'end', label: 'Path A End' },
                    { id: 'n4', type: 'end', label: 'Path B End' },
                ],
                edges: [
                    { id: 'e1', source: 'n1', target: 'n2' },
                    { id: 'e2', source: 'n2', target: 'n3', label: 'path_a' },
                    { id: 'e3', source: 'n2', target: 'n4', label: 'path_b' },
                ],
            } as Flow;

            engine.registerHandler('screen', async () => ({
                success: true,
                nextEdge: 'path_b',
            }));

            const instance = engine.createInstance(flow);
            const result = await engine.execute(flow, instance);

            expect(result.success).toBe(true);
            expect(result.instance.currentState).toBe('n4'); // Path B
        });
    });
});
