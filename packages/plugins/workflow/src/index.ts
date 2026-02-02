/**
 * @objectos/plugin-workflow
 * 
 * Workflow and state machine plugin for ObjectOS
 */

// Main plugin
export {
    WorkflowPlugin,
    WorkflowManifest,
    createWorkflowPlugin,
    getWorkflowAPI,
} from './plugin';

// Core classes
export { WorkflowEngine } from './engine';
export { WorkflowAPI } from './api';
export { InMemoryWorkflowStorage } from './storage';

// Parser
export { parseWorkflowYAML, validateWorkflowDefinition } from './parser';

// Types
export type {
    WorkflowStatus,
    WorkflowType,
    TransitionGuard,
    TransitionAction,
    StateConfig,
    TransitionConfig,
    WorkflowDefinition,
    WorkflowInstance,
    StateHistoryEntry,
    WorkflowContext,
    WorkflowTask,
    WorkflowQueryOptions,
    WorkflowStorage,
    WorkflowPluginConfig,
    YAMLWorkflowDefinition,
    YAMLStateConfig,
    YAMLTransitionConfig,
} from './types';
