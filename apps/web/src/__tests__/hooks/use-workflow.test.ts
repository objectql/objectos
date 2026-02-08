import { describe, it, expect } from 'vitest';
import {
  useWorkflowDefinition,
  useWorkflowStatus,
  useAutomationRules,
  useActivities,
  useChartConfigs,
} from '@/hooks/use-workflow';

describe('use-workflow exports', () => {
  it('exports useWorkflowDefinition hook', () => {
    expect(useWorkflowDefinition).toBeTypeOf('function');
  });

  it('exports useWorkflowStatus hook', () => {
    expect(useWorkflowStatus).toBeTypeOf('function');
  });

  it('exports useAutomationRules hook', () => {
    expect(useAutomationRules).toBeTypeOf('function');
  });

  it('exports useActivities hook', () => {
    expect(useActivities).toBeTypeOf('function');
  });

  it('exports useChartConfigs hook', () => {
    expect(useChartConfigs).toBeTypeOf('function');
  });
});
