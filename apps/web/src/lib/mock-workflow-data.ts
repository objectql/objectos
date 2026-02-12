/**
 * Mock workflow, automation, and activity data for development.
 *
 * Re-exports from `__mocks__/mock-workflow-data.ts` so the actual data lives
 * in a tree-shakeable location.
 *
 * @see apps/web/src/providers/dev-data-provider.tsx
 */
export {
  mockWorkflowDefinitions,
  mockWorkflowStatuses,
  mockAutomationRules,
  mockActivities,
  mockChartConfigs,
  getMockWorkflowDefinition,
  getMockWorkflowStatus,
  getMockAutomationRules,
  getMockActivities,
  getMockChartConfigs,
} from './__mocks__/mock-workflow-data';
