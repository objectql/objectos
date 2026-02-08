import { describe, it, expect } from 'vitest';
import {
  getMockWorkflowDefinition,
  getMockWorkflowStatus,
  getMockAutomationRules,
  getMockActivities,
  getMockChartConfigs,
  mockWorkflowDefinitions,
  mockAutomationRules,
} from '@/lib/mock-workflow-data';

describe('mock-workflow-data', () => {
  describe('getMockWorkflowDefinition', () => {
    it('returns workflow for known object', () => {
      const wf = getMockWorkflowDefinition('leave_request');
      expect(wf).toBeDefined();
      expect(wf!.name).toBe('leave_request_flow');
      expect(wf!.states.length).toBeGreaterThan(0);
      expect(wf!.transitions.length).toBeGreaterThan(0);
    });

    it('returns undefined for unknown object', () => {
      expect(getMockWorkflowDefinition('nonexistent')).toBeUndefined();
    });
  });

  describe('getMockWorkflowStatus', () => {
    it('returns status for known record', () => {
      const status = getMockWorkflowStatus('lr-002');
      expect(status).toBeDefined();
      expect(status!.currentState).toBe('pending');
      expect(status!.canApprove).toBe(true);
    });

    it('returns undefined for unknown record', () => {
      expect(getMockWorkflowStatus('unknown-id')).toBeUndefined();
    });
  });

  describe('getMockAutomationRules', () => {
    it('returns all rules when no filter', () => {
      const rules = getMockAutomationRules();
      expect(rules.length).toBe(mockAutomationRules.length);
    });

    it('filters by object name', () => {
      const rules = getMockAutomationRules('lead');
      expect(rules.length).toBeGreaterThan(0);
      for (const rule of rules) {
        expect(rule.object).toBe('lead');
      }
    });

    it('returns empty array for object with no rules', () => {
      expect(getMockAutomationRules('department')).toEqual([]);
    });
  });

  describe('getMockActivities', () => {
    it('returns activities for known record', () => {
      const activities = getMockActivities('opp-001');
      expect(activities.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown record', () => {
      expect(getMockActivities('unknown-id')).toEqual([]);
    });
  });

  describe('getMockChartConfigs', () => {
    it('returns charts for known app', () => {
      const charts = getMockChartConfigs('crm');
      expect(charts.length).toBeGreaterThan(0);
    });

    it('returns empty array for unknown app', () => {
      expect(getMockChartConfigs('unknown-app')).toEqual([]);
    });
  });

  describe('workflow definitions coverage', () => {
    it('has definitions for multiple objects', () => {
      const names = Object.keys(mockWorkflowDefinitions);
      expect(names.length).toBeGreaterThanOrEqual(3);
    });

    it('each workflow has at least one initial state', () => {
      for (const wf of Object.values(mockWorkflowDefinitions)) {
        const initial = wf.states.filter((s) => s.initial);
        expect(initial.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('each workflow has at least one final state', () => {
      for (const wf of Object.values(mockWorkflowDefinitions)) {
        const final = wf.states.filter((s) => s.final);
        expect(final.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
