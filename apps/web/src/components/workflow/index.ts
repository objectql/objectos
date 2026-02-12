/**
 * Workflow & Automation component re-exports.
 *
 * Phase 4 workflow UI controls for the Business App Shell.
 * Phase J workflow & automation UI components.
 */

export { WorkflowStatusBadge } from './WorkflowStatusBadge';
export { ApprovalActions } from './ApprovalActions';
export { WorkflowVisualizer } from './WorkflowVisualizer';
export { AutomationRulesBuilder } from './AutomationRulesBuilder';
export { ActivityTimeline } from './ActivityTimeline';

// Phase J — Workflow & Automation UI
export { FlowEditor } from './FlowEditor';
export { ApprovalInbox } from './ApprovalInbox';
export type { ApprovalItem } from './ApprovalInbox';
export { WorkflowInstanceMonitor } from './WorkflowInstanceMonitor';
export type { WorkflowInstance } from './WorkflowInstanceMonitor';
export { TriggerMonitorDashboard } from './TriggerMonitorDashboard';
export type { TriggerExecution } from './TriggerMonitorDashboard';
export { WorkflowTemplates, builtInTemplates } from './WorkflowTemplates';
export type { WorkflowTemplate } from './WorkflowTemplates';
