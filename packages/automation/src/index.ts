/**
 * @objectos/plugin-automation
 * 
 * Automation plugin for ObjectOS
 */

// Main plugin
export {
    AutomationPlugin,
    getAutomationAPI,
} from './plugin.js';

// Core classes
export { TriggerEngine } from './triggers.js';
export { ActionExecutor } from './actions.js';
export { FormulaEngine } from './formulas.js';
export { InMemoryAutomationStorage } from './storage.js';

// Sandbox
export { executeSandboxed, validateScript, executeSandboxedWithPolicy, DEFAULT_SANDBOX_POLICY } from './sandbox.js';
export type { SandboxConfig, SandboxResult, SandboxPolicy } from './sandbox.js';

// Spec validation
export { validateWorkflowRule, validateWorkflowAction } from './validation.js';
export type { ValidationResult } from './validation.js';

// Types
export type {
    TriggerType,
    ActionType,
    FormulaType,
    RollupOperation,
    AutomationRuleStatus,
    ObjectTriggerConfig,
    ScheduledTriggerConfig,
    WebhookTriggerConfig,
    TriggerConfig,
    TriggerCondition,
    UpdateFieldActionConfig,
    CreateRecordActionConfig,
    SendEmailActionConfig,
    HttpRequestActionConfig,
    ExecuteScriptActionConfig,
    ActionConfig,
    AutomationRule,
    AutomationContext,
    FormulaField,
    CalculatedFormulaConfig,
    RollupFormulaConfig,
    AutoNumberFormulaConfig,
    FormulaConfig,
    AutomationStorage,
    AutomationPluginConfig,
    EmailConfig,
    AutomationExecutionResult,
    EmailAttachment,
} from './types.js';
