/**
 * @objectos/plugin-automation
 * 
 * Automation plugin for ObjectOS
 */

// Main plugin
export {
    AutomationPlugin,
    getAutomationAPI,
} from './plugin';

// Core classes
export { TriggerEngine } from './triggers';
export { ActionExecutor } from './actions';
export { FormulaEngine } from './formulas';
export { InMemoryAutomationStorage } from './storage';

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
} from './types';
