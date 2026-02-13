import { WorkflowEngine } from '../src/engine.js';
import { StandardActions, StandardGuards } from '../src/stdlib.js';
import { WorkflowDefinition } from '../src/types.js';

describe('Workflow Parameterized Actions & Guards', () => {
  let engine: WorkflowEngine;
  let loggerMock: any;

  beforeEach(() => {
    loggerMock = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    engine = new WorkflowEngine(loggerMock);

    // Register standard library
    engine.registerAction('log', StandardActions.log);
    engine.registerGuard('greater_than', StandardGuards.greaterThan);
  });

  test('should execute action with Object configuration', async () => {
    const definition: WorkflowDefinition = {
      id: 'test-wf',
      name: 'Test Workflow',
      version: '1.0.0',
      type: 'sequential',
      initialState: 'start',
      states: {
        start: {
          name: 'start',
          onEnter: [{ type: 'log', params: { message: 'Hello {{ name }}' } }],
        },
      },
    };

    const instance = engine.createInstance(definition, { name: 'World' });
    await engine.startInstance(instance, definition);

    expect(loggerMock.info).toHaveBeenCalledWith(expect.stringContaining('Hello World'));
  });

  test('should validate transitions with Object guards', async () => {
    const definition: WorkflowDefinition = {
      id: 'test-wf-guard',
      name: 'Test Guard Workflow',
      version: '1.0.0',
      type: 'sequential',
      initialState: 'draft',
      states: {
        draft: {
          name: 'draft',
          transitions: {
            submit: {
              target: 'approved',
              guards: [{ type: 'greater_than', params: { field: 'amount', value: 100 } }],
            },
          },
        },
        approved: {
          name: 'approved',
          final: true,
        },
      },
    };

    // Case 1: Amount too low
    const instance1 = engine.createInstance(definition, { amount: 50 });
    instance1.status = 'running'; // Mock running state

    const canTransition1 = await engine.canExecuteTransition(instance1, definition, 'submit');
    expect(canTransition1).toBe(false);

    // Case 2: Amount enough
    const instance2 = engine.createInstance(definition, { amount: 150 });
    instance2.status = 'running';

    const canTransition2 = await engine.canExecuteTransition(instance2, definition, 'submit');
    expect(canTransition2).toBe(true);
  });
});
