import { describe, it, expect } from 'vitest';
import type {
  WorkflowDefinition,
  WorkflowStatus,
  AutomationRule,
  ActivityEntry,
  ChartConfig,
  PageLayout,
} from '@/types/workflow';

describe('workflow types', () => {
  it('WorkflowDefinition has required shape', () => {
    const def: WorkflowDefinition = {
      name: 'test_flow',
      label: 'Test Flow',
      object: 'test',
      states: [
        { name: 'draft', label: 'Draft', initial: true, color: 'default' },
        { name: 'done', label: 'Done', final: true, color: 'green' },
      ],
      transitions: [
        { name: 'complete', label: 'Complete', from: 'draft', to: 'done' },
      ],
    };
    expect(def.states).toHaveLength(2);
    expect(def.transitions).toHaveLength(1);
    expect(def.states[0].initial).toBe(true);
    expect(def.states[1].final).toBe(true);
  });

  it('WorkflowStatus tracks current state and available transitions', () => {
    const status: WorkflowStatus = {
      workflowName: 'test_flow',
      currentState: 'draft',
      currentStateLabel: 'Draft',
      color: 'default',
      availableTransitions: [
        { name: 'complete', label: 'Complete', from: 'draft', to: 'done' },
      ],
      canApprove: true,
    };
    expect(status.currentState).toBe('draft');
    expect(status.availableTransitions).toHaveLength(1);
    expect(status.canApprove).toBe(true);
  });

  it('AutomationRule has trigger, conditions, and actions', () => {
    const rule: AutomationRule = {
      id: 'rule-1',
      name: 'Test Rule',
      object: 'test',
      active: true,
      trigger: { type: 'record_created', object: 'test' },
      conditions: [{ field: 'status', operator: 'equals', value: 'new' }],
      actions: [{ type: 'send_email', label: 'Send', config: {} }],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(rule.trigger.type).toBe('record_created');
    expect(rule.conditions).toHaveLength(1);
    expect(rule.actions).toHaveLength(1);
  });

  it('ActivityEntry captures different event types', () => {
    const entry: ActivityEntry = {
      id: 'act-1',
      type: 'field_changed',
      timestamp: '2025-01-01T10:00:00Z',
      user: 'John',
      summary: 'Updated status',
      changes: [{ field: 'status', fieldLabel: 'Status', oldValue: 'draft', newValue: 'sent' }],
    };
    expect(entry.type).toBe('field_changed');
    expect(entry.changes).toHaveLength(1);
    expect(entry.changes![0].oldValue).toBe('draft');
  });

  it('ChartConfig supports multiple chart types', () => {
    const chart: ChartConfig = {
      type: 'bar',
      title: 'Test Chart',
      data: [
        { label: 'A', value: 10 },
        { label: 'B', value: 20, color: '#ff0000' },
      ],
    };
    expect(chart.type).toBe('bar');
    expect(chart.data).toHaveLength(2);
  });

  it('PageLayout defines sections with field selections', () => {
    const layout: PageLayout = {
      name: 'default',
      object: 'test',
      sections: [
        { id: 's1', type: 'fields', title: 'Details', columns: 2, fields: ['name', 'email'] },
        { id: 's2', type: 'activity', title: 'Activity' },
      ],
    };
    expect(layout.sections).toHaveLength(2);
    expect(layout.sections[0].fields).toEqual(['name', 'email']);
  });
});
