/**
 * Flow Converter Tests
 */

import { legacyToFlow, flowToLegacy, validateFlow } from '../src/flow-converter.js';
import type { WorkflowDefinition, Flow } from '../src/types.js';

describe('Flow Converter', () => {
  const sampleLegacyWorkflow: WorkflowDefinition = {
    id: 'wf_001',
    name: 'Order Approval',
    description: 'Order approval workflow',
    type: 'approval',
    version: '1.0.0',
    initialState: 'draft',
    states: {
      draft: {
        name: 'draft',
        initial: true,
        transitions: {
          submit: { target: 'pending_approval', guards: ['canSubmit'] },
        },
      },
      pending_approval: {
        name: 'pending_approval',
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

  describe('legacyToFlow()', () => {
    it('should convert a legacy workflow to Flow format', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);

      expect(flow.name).toBe('Order Approval');
      expect(flow.description).toBe('Order approval workflow');
      expect(flow.version).toBe(1);
    });

    it('should create correct number of nodes', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      expect(flow.nodes).toHaveLength(4); // draft, pending_approval, approved, rejected
    });

    it('should mark start and end nodes correctly', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);

      const startNodes = flow.nodes.filter((n) => n.type === 'start');
      const endNodes = flow.nodes.filter((n) => n.type === 'end');

      expect(startNodes).toHaveLength(1);
      expect(startNodes[0].label).toBe('draft');
      expect(endNodes).toHaveLength(2); // approved, rejected
    });

    it('should create correct number of edges', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      expect(flow.edges).toHaveLength(3); // submit, approve, reject
    });

    it('should include guard conditions on edges', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      const submitEdge = flow.edges.find((e) => e.label === 'submit');
      expect(submitEdge?.condition).toBe('canSubmit');
    });
  });

  describe('flowToLegacy()', () => {
    it('should convert a Flow back to legacy format', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      const legacy = flowToLegacy(flow, { id: 'wf_002', type: 'approval' });

      expect(legacy.name).toBe('Order Approval');
      expect(legacy.type).toBe('approval');
      expect(legacy.id).toBe('wf_002');
    });

    it('should preserve states in round-trip', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      const legacy = flowToLegacy(flow, { id: 'wf_002', type: 'approval' });

      expect(Object.keys(legacy.states)).toHaveLength(4);
      expect(legacy.states['draft']).toBeDefined();
      expect(legacy.states['pending_approval']).toBeDefined();
      expect(legacy.states['approved']).toBeDefined();
      expect(legacy.states['rejected']).toBeDefined();
    });

    it('should preserve initial state', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      const legacy = flowToLegacy(flow, { id: 'wf_002', type: 'approval' });

      expect(legacy.initialState).toBe('draft');
      expect(legacy.states['draft'].initial).toBe(true);
    });

    it('should preserve transitions in round-trip', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      const legacy = flowToLegacy(flow, { id: 'wf_002', type: 'approval' });

      const draftTransitions = legacy.states['draft'].transitions;
      expect(draftTransitions).toBeDefined();
      expect(draftTransitions!['submit']).toBeDefined();
      expect(draftTransitions!['submit'].target).toBe('pending_approval');
    });
  });

  describe('validateFlow()', () => {
    it('should pass for a valid flow', () => {
      const flow = legacyToFlow(sampleLegacyWorkflow);
      const errors = validateFlow(flow);
      expect(errors).toHaveLength(0);
    });

    it('should fail for flow with no name', () => {
      const flow: Flow = {
        name: '',
        label: '',
        type: 'autolaunched',
        version: 1,
        nodes: [],
        edges: [],
      };
      const errors = validateFlow(flow);
      expect(errors).toContain('Flow must have a name');
    });

    it('should fail for flow with no nodes', () => {
      const flow: Flow = {
        name: 'Test',
        label: 'Test',
        type: 'autolaunched',
        version: 1,
        nodes: [],
        edges: [],
      };
      const errors = validateFlow(flow);
      expect(errors).toContain('Flow must have at least one node');
    });

    it('should fail for flow with no start node', () => {
      const flow: Flow = {
        name: 'Test',
        label: 'Test',
        type: 'autolaunched',
        version: 1,
        nodes: [{ id: '1', label: 'end', type: 'end' }],
        edges: [],
      };
      const errors = validateFlow(flow);
      expect(errors).toContain('Flow must have at least one start node');
    });

    it('should fail for flow with no end node', () => {
      const flow: Flow = {
        name: 'Test',
        label: 'Test',
        type: 'autolaunched',
        version: 1,
        nodes: [{ id: '1', label: 'start', type: 'start' }],
        edges: [],
      };
      const errors = validateFlow(flow);
      expect(errors).toContain('Flow must have at least one end node');
    });

    it('should detect invalid edge references', () => {
      const flow: Flow = {
        name: 'Test',
        label: 'Test',
        type: 'autolaunched',
        version: 1,
        nodes: [
          { id: '1', label: 'start', type: 'start' },
          { id: '2', label: 'end', type: 'end' },
        ],
        edges: [{ id: 'e1', source: '1', target: 'nonexistent' }],
      };
      const errors = validateFlow(flow);
      expect(errors.some((e) => e.includes('unknown target node'))).toBe(true);
    });
  });
});
