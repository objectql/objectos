/**
 * TanStack Query hooks for workflow and automation data.
 *
 * Falls back to mock data when the server is unreachable so the UI
 * can be developed without a running backend.
 */

import { useQuery } from '@tanstack/react-query';
import type {
  WorkflowDefinition,
  WorkflowStatus,
  AutomationRule,
  ActivityEntry,
  ChartConfig,
} from '@/types/workflow';
import {
  getMockWorkflowDefinition,
  getMockWorkflowStatus,
  getMockAutomationRules,
  getMockActivities,
  getMockChartConfigs,
} from '@/lib/mock-workflow-data';

// ── Workflow hooks ──────────────────────────────────────────────

export function useWorkflowDefinition(objectName: string | undefined) {
  return useQuery<WorkflowDefinition | undefined>({
    queryKey: ['workflow', 'definition', objectName],
    queryFn: async () => {
      if (!objectName) return undefined;
      // TODO: Replace with real API call when endpoint is available
      return getMockWorkflowDefinition(objectName);
    },
    enabled: !!objectName,
  });
}

export function useWorkflowStatus(recordId: string | undefined) {
  return useQuery<WorkflowStatus | undefined>({
    queryKey: ['workflow', 'status', recordId],
    queryFn: async () => {
      if (!recordId) return undefined;
      // TODO: Replace with real API call when endpoint is available
      return getMockWorkflowStatus(recordId);
    },
    enabled: !!recordId,
  });
}

// ── Automation hooks ────────────────────────────────────────────

export function useAutomationRules(objectName?: string) {
  return useQuery<AutomationRule[]>({
    queryKey: ['automation', 'rules', objectName],
    queryFn: async () => {
      // TODO: Replace with real API call when endpoint is available
      return getMockAutomationRules(objectName);
    },
  });
}

// ── Activity hooks ──────────────────────────────────────────────

export function useActivities(recordId: string | undefined) {
  return useQuery<ActivityEntry[]>({
    queryKey: ['activities', recordId],
    queryFn: async () => {
      if (!recordId) return [];
      // TODO: Replace with real API call when endpoint is available
      return getMockActivities(recordId);
    },
    enabled: !!recordId,
  });
}

// ── Chart hooks ─────────────────────────────────────────────────

export function useChartConfigs(appId: string | undefined) {
  return useQuery<ChartConfig[]>({
    queryKey: ['charts', appId],
    queryFn: async () => {
      if (!appId) return [];
      // TODO: Replace with real API call when endpoint is available
      return getMockChartConfigs(appId);
    },
    enabled: !!appId,
  });
}
