/**
 * Parser Tests
 * 
 * Tests for YAML workflow parser
 */

import { parseWorkflowYAML, validateWorkflowDefinition } from '../src/parser';
import type { WorkflowDefinition } from '../src/types';

describe('parseWorkflowYAML', () => {
    describe('basic parsing', () => {
        it('should parse a simple workflow definition', () => {
            const yaml = `
name: Simple Workflow
type: sequential
version: 1.0.0
states:
  draft:
    initial: true
    transitions:
      submit: review
  review:
    transitions:
      approve: approved
  approved:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.name).toBe('Simple Workflow');
            expect(definition.type).toBe('sequential');
            expect(definition.version).toBe('1.0.0');
            expect(definition.initialState).toBe('draft');
            expect(definition.states.draft.initial).toBe(true);
            expect(definition.states.approved.final).toBe(true);
        });

        it('should parse workflow with description', () => {
            const yaml = `
name: Test Workflow
description: This is a test workflow
type: approval
states:
  pending:
    initial: true
  done:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.description).toBe('This is a test workflow');
        });

        it('should generate workflow ID from name if not provided', () => {
            const yaml = `
name: My Test Workflow
type: sequential
states:
  start:
    initial: true
  end:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.id).toBe('my_test_workflow');
        });

        it('should use provided ID', () => {
            const yaml = `
name: Test Workflow
type: sequential
states:
  start:
    initial: true
  end:
    final: true
`;

            const definition = parseWorkflowYAML(yaml, 'custom-workflow-id');

            expect(definition.id).toBe('custom-workflow-id');
        });

        it('should default version to 1.0.0 if not provided', () => {
            const yaml = `
name: Test Workflow
type: sequential
states:
  start:
    initial: true
  end:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.version).toBe('1.0.0');
        });
    });

    describe('transition parsing', () => {
        it('should parse shorthand transition syntax', () => {
            const yaml = `
name: Test
type: sequential
states:
  a:
    initial: true
    transitions:
      next: b
  b:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.states.a.transitions?.next.target).toBe('b');
        });

        it('should parse full transition configuration', () => {
            const yaml = `
name: Test
type: approval
states:
  draft:
    initial: true
    transitions:
      submit:
        target: review
        guards:
          - checkPermission
        actions:
          - sendNotification
        metadata:
          requiresApproval: true
  review:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            const transition = definition.states.draft.transitions?.submit;
            expect(transition?.target).toBe('review');
            expect(transition?.metadata?.requiresApproval).toBe(true);
        });

        it('should parse state with multiple transitions', () => {
            const yaml = `
name: Test
type: conditional
states:
  review:
    initial: true
    transitions:
      approve: approved
      reject: rejected
  approved:
    final: true
  rejected:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            const transitions = definition.states.review.transitions!;
            expect(Object.keys(transitions)).toEqual(['approve', 'reject']);
            expect(transitions.approve.target).toBe('approved');
            expect(transitions.reject.target).toBe('rejected');
        });
    });

    describe('state configuration parsing', () => {
        it('should parse state with onEnter and onExit actions', () => {
            const yaml = `
name: Test
type: sequential
states:
  processing:
    initial: true
    on_enter:
      - startTimer
      - logEntry
    on_exit:
      - stopTimer
      - logExit
  done:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.states.processing.onEnter).toBeDefined();
            expect(definition.states.processing.onExit).toBeDefined();
        });

        it('should parse state metadata', () => {
            const yaml = `
name: Test
type: sequential
states:
  draft:
    initial: true
    metadata:
      color: blue
      icon: draft
  published:
    final: true
    metadata:
      color: green
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.states.draft.metadata?.color).toBe('blue');
            expect(definition.states.draft.metadata?.icon).toBe('draft');
            expect(definition.states.published.metadata?.color).toBe('green');
        });
    });

    describe('validation errors', () => {
        it('should throw error for invalid YAML', () => {
            const yaml = 'invalid: yaml: content:';

            expect(() => parseWorkflowYAML(yaml)).toThrow();
        });

        it('should throw error for missing name', () => {
            const yaml = `
type: sequential
states:
  start:
    initial: true
`;

            expect(() => parseWorkflowYAML(yaml)).toThrow('Workflow definition must have a name');
        });

        it('should throw error for missing states', () => {
            const yaml = `
name: Test
type: sequential
`;

            expect(() => parseWorkflowYAML(yaml))
                .toThrow('Workflow definition must have at least one state');
        });

        it('should throw error for missing initial state', () => {
            const yaml = `
name: Test
type: sequential
states:
  draft:
    transitions:
      next: done
  done:
    final: true
`;

            expect(() => parseWorkflowYAML(yaml))
                .toThrow('Workflow definition must have an initial state');
        });

        it('should throw error for invalid transition target', () => {
            const yaml = `
name: Test
type: sequential
states:
  draft:
    initial: true
    transitions:
      next: nonexistent
  done:
    final: true
`;

            expect(() => parseWorkflowYAML(yaml))
                .toThrow('target state "nonexistent" does not exist');
        });

        it('should throw error for transition without target', () => {
            const yaml = `
name: Test
type: sequential
states:
  draft:
    initial: true
    transitions:
      next:
        guards:
          - checkSomething
  done:
    final: true
`;

            expect(() => parseWorkflowYAML(yaml))
                .toThrow('Transition "next" must have a target state');
        });
    });

    describe('workflow metadata', () => {
        it('should parse workflow metadata', () => {
            const yaml = `
name: Test
type: sequential
metadata:
  category: business
  department: sales
  priority: high
states:
  start:
    initial: true
  end:
    final: true
`;

            const definition = parseWorkflowYAML(yaml);

            expect(definition.metadata?.category).toBe('business');
            expect(definition.metadata?.department).toBe('sales');
            expect(definition.metadata?.priority).toBe('high');
        });
    });
});

describe('validateWorkflowDefinition', () => {
    let validDefinition: WorkflowDefinition;

    beforeEach(() => {
        validDefinition = {
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

    it('should return empty array for valid definition', () => {
        const errors = validateWorkflowDefinition(validDefinition);

        expect(errors).toEqual([]);
    });

    it('should detect missing ID', () => {
        const invalid = { ...validDefinition, id: '' };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors).toContain('Workflow must have an ID');
    });

    it('should detect missing name', () => {
        const invalid = { ...validDefinition, name: '' };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors).toContain('Workflow must have a name');
    });

    it('should detect missing version', () => {
        const invalid = { ...validDefinition, version: '' };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors).toContain('Workflow must have a version');
    });

    it('should detect missing states', () => {
        const invalid = { ...validDefinition, states: {} };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors).toContain('Workflow must have at least one state');
    });

    it('should detect missing initial state', () => {
        const invalid = { ...validDefinition, initialState: '' };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors).toContain('Workflow must have an initial state');
    });

    it('should detect non-existent initial state', () => {
        const invalid = { ...validDefinition, initialState: 'nonexistent' };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors).toContain('Initial state "nonexistent" does not exist');
    });

    it('should detect missing final state', () => {
        const invalid = {
            ...validDefinition,
            states: {
                draft: {
                    name: 'draft',
                    initial: true,
                },
            },
        };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors).toContain('Workflow must have at least one final state');
    });

    it('should detect invalid transition target', () => {
        const invalid = {
            ...validDefinition,
            states: {
                ...validDefinition.states,
                draft: {
                    name: 'draft',
                    initial: true,
                    transitions: {
                        submit: { target: 'nonexistent' },
                    },
                },
            },
        };

        const errors = validateWorkflowDefinition(invalid);

        expect(errors.some(e => e.includes('target state "nonexistent" does not exist')))
            .toBe(true);
    });
});
