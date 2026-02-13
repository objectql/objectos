/**
 * @objectos/plugin-workflow
 *
 * Workflow and state machine plugin for ObjectOS
 */

// Main plugin
export { WorkflowPlugin, getWorkflowAPI } from './plugin.js';

// Core classes
export { WorkflowEngine } from './engine.js';
export { WorkflowAPI } from './api.js';
export { InMemoryWorkflowStorage } from './storage.js';

// Approval and notifications
export { ApprovalService } from './approval.js';
export {
  NotificationService,
  EmailNotificationHandler,
  SlackNotificationHandler,
  WebhookNotificationHandler,
} from './notifications.js';

// Parser
export { parseWorkflowYAML, validateWorkflowDefinition } from './parser.js';

// Flow conversion utilities
export { legacyToFlow, flowToLegacy, validateFlow } from './flow-converter.js';

// Flow execution engine
export { FlowEngine } from './flow-engine.js';
export type {
  FlowNodeHandler,
  FlowNodeResult,
  FlowExecutionContext,
  FlowExecutionResult,
} from './flow-engine.js';

// Types
export type {
  WorkflowStatus,
  WorkflowType,
  TransitionGuard,
  TransitionAction,
  StateConfig,
  TransitionConfig,
  WorkflowDefinition,
  SpecWorkflowDefinition,
  WorkflowInstance,
  StateHistoryEntry,
  WorkflowContext,
  SpecWorkflowContext,
  WorkflowTask,
  WorkflowQueryOptions,
  WorkflowStorage,
  SpecWorkflowStorage,
  WorkflowPluginConfig,
  YAMLWorkflowDefinition,
  YAMLStateConfig,
  YAMLTransitionConfig,
  NotificationChannel,
  NotificationConfig,
  NotificationHandler,
  ApprovalChain,
  ApprovalLevel,
  DelegationRequest,
  EscalationRequest,
} from './types.js';

// Re-export spec types from types.ts
export type { Flow, FlowNode, FlowEdge, ApprovalProcess, ApprovalStep } from './types.js';
