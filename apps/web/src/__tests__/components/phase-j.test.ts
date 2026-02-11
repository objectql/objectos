/**
 * Tests for Phase J components — Workflow & Automation UI.
 *
 * Validates exports of all Phase J workflow/automation components.
 */
import { describe, it, expect } from 'vitest';
import { FlowEditor } from '@/components/workflow/FlowEditor';
import { ApprovalInbox } from '@/components/workflow/ApprovalInbox';
import { WorkflowInstanceMonitor } from '@/components/workflow/WorkflowInstanceMonitor';
import { TriggerMonitorDashboard } from '@/components/workflow/TriggerMonitorDashboard';
import { WorkflowTemplates, builtInTemplates } from '@/components/workflow/WorkflowTemplates';

describe('Phase J component exports', () => {
  it('exports FlowEditor (J.1)', () => {
    expect(FlowEditor).toBeTypeOf('function');
  });

  it('exports ApprovalInbox (J.2)', () => {
    expect(ApprovalInbox).toBeTypeOf('function');
  });

  it('exports WorkflowInstanceMonitor (J.4)', () => {
    expect(WorkflowInstanceMonitor).toBeTypeOf('function');
  });

  it('exports TriggerMonitorDashboard (J.5)', () => {
    expect(TriggerMonitorDashboard).toBeTypeOf('function');
  });

  it('exports WorkflowTemplates (J.6)', () => {
    expect(WorkflowTemplates).toBeTypeOf('function');
  });

  it('exports builtInTemplates with at least 3 templates', () => {
    expect(Array.isArray(builtInTemplates)).toBe(true);
    expect(builtInTemplates.length).toBeGreaterThanOrEqual(3);
  });

  it('builtInTemplates have required properties', () => {
    for (const template of builtInTemplates) {
      expect(template.id).toBeTypeOf('string');
      expect(template.name).toBeTypeOf('string');
      expect(template.description).toBeTypeOf('string');
      expect(template.category).toBeTypeOf('string');
      expect(template.workflow).toBeDefined();
      expect(template.workflow.states.length).toBeGreaterThan(0);
      expect(template.workflow.transitions.length).toBeGreaterThan(0);
    }
  });
});
