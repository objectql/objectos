/**
 * Automation System Types
 * 
 * Type definitions aligned with @objectstack/spec/automation specification
 */

// ============================================================================
// Import and Re-export Spec-Compliant Types
// ============================================================================

import type {
  WorkflowRule,
  WorkflowAction,
  TimeTrigger,
} from '@objectstack/spec/automation';

// Re-export spec types as primary types
export type {
  WorkflowRule,
  WorkflowAction,
  TimeTrigger,
};

/**
 * Workflow trigger types from @objectstack/spec
 * Values: 'on_create' | 'on_update' | 'on_create_or_update' | 'on_delete' | 'schedule'
 */
export type SpecWorkflowTriggerType = 
  | 'on_create'
  | 'on_update' 
  | 'on_create_or_update'
  | 'on_delete'
  | 'schedule';

// ============================================================================
// Legacy Compatibility Types (for gradual migration)
// ============================================================================

/**
 * Trigger type enumeration (legacy)
 * @deprecated Use SpecWorkflowTriggerType for spec-compliant types
 */
export type TriggerType = 
  | SpecWorkflowTriggerType
  | 'object.create' 
  | 'object.update' 
  | 'object.delete' 
  | 'scheduled' 
  | 'webhook';

/**
 * Action type enumeration (legacy)
 * @deprecated Extract type from WorkflowAction instead
 */
export type ActionType = WorkflowAction['type'];

/**
 * Formula field type (legacy - keep for formula engine)
 */
export type FormulaType = 
  | 'calculated'       // Runtime calculated
  | 'rollup'           // Rollup summary (SUM, COUNT, etc.)
  | 'autonumber';      // Auto-number field

/**
 * Rollup operation
 */
export type RollupOperation = 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX';

/**
 * Automation rule status
 * @deprecated WorkflowRule in spec uses 'active' boolean instead
 */
export type AutomationRuleStatus = 'active' | 'inactive' | 'error';

// ============================================================================
// Legacy Action Configs (backward compatibility)
// ============================================================================

/**
 * Trigger condition
 */
export interface TriggerCondition {
  /** Field name */
  field: string;
  /** Operator */
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with' | 'changed';
  /** Value to compare */
  value?: any;
}

/**
 * Object trigger configuration (legacy)
 */
export interface ObjectTriggerConfig {
  type: 'object.create' | 'object.update' | 'object.delete';
  objectName: string;
  conditions?: TriggerCondition[];
  fields?: string[];
}

/**
 * Scheduled trigger configuration (legacy)
 */
export interface ScheduledTriggerConfig {
  type: 'scheduled';
  cronExpression: string;
  timezone?: string;
}

/**
 * Webhook trigger configuration (legacy)
 */
export interface WebhookTriggerConfig {
  type: 'webhook';
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authRequired?: boolean;
}

/**
 * Trigger configuration (union type)
 */
export type TriggerConfig = 
  | ObjectTriggerConfig 
  | ScheduledTriggerConfig 
  | WebhookTriggerConfig;

/**
 * Update field action configuration (legacy)
 * @deprecated Use field_update from WorkflowAction in spec
 */
export interface UpdateFieldActionConfig {
  type: 'update_field';
  objectName: string;
  recordId: string;
  fields: Record<string, any>;
}

/**
 * Create record action configuration (legacy)
 */
export interface CreateRecordActionConfig {
  type: 'create_record';
  objectName: string;
  fields: Record<string, any>;
}

/**
 * Send email action configuration (legacy)
 * @deprecated Use email_alert from WorkflowAction in spec
 */
export interface SendEmailActionConfig {
  type: 'send_email';
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * HTTP request action configuration (legacy)
 * @deprecated Use http_call from WorkflowAction in spec
 */
export interface HttpRequestActionConfig {
  type: 'http_request';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

/**
 * Execute script action configuration (legacy)
 * @deprecated Use custom_script from WorkflowAction in spec
 */
export interface ExecuteScriptActionConfig {
  type: 'execute_script';
  script: string;
  language?: 'javascript' | 'typescript';
  timeout?: number;
}

/**
 * Action configuration (union type) - legacy
 */
export type ActionConfig = 
  | UpdateFieldActionConfig 
  | CreateRecordActionConfig 
  | SendEmailActionConfig 
  | HttpRequestActionConfig 
  | ExecuteScriptActionConfig;

// ============================================================================
// Automation Rule (legacy - for backward compatibility)
// ============================================================================

/**
 * Automation rule (legacy format)
 * @deprecated Use WorkflowRule from @objectstack/spec instead
 */
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  status: AutomationRuleStatus;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  priority?: number;
  createdAt: Date;
  updatedAt?: Date;
  lastExecutedAt?: Date;
  executionCount?: number;
  error?: string;
}

// ============================================================================
// Spec-Compliant Automation Rule (new format)
// ============================================================================

/**
 * Spec-compliant automation rule with metadata
 */
export interface SpecAutomationRule extends WorkflowRule {
  /** Unique rule ID */
  id?: string;
  /** Created timestamp */
  createdAt?: Date;
  /** Updated timestamp */
  updatedAt?: Date;
  /** Last executed timestamp */
  lastExecutedAt?: Date;
  /** Execution count */
  executionCount?: number;
  /** Error message if not active */
  error?: string;
}

// ============================================================================
// Execution Context
// ============================================================================

/**
 * Automation execution context
 */
export interface AutomationContext {
  /** Rule being executed (can be legacy or spec format) */
  rule: AutomationRule | SpecAutomationRule;
  /** Trigger data */
  triggerData: any;
  /** Logger */
  logger: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
}

// ============================================================================
// Formula Fields (not part of spec, specific to this implementation)
// ============================================================================

/**
 * Formula field definition
 */
export interface FormulaField {
  name: string;
  objectName: string;
  type: FormulaType;
  config: FormulaConfig;
  createdAt: Date;
}

/**
 * Calculated formula configuration
 */
export interface CalculatedFormulaConfig {
  type: 'calculated';
  expression: string;
  returnType: 'string' | 'number' | 'boolean' | 'date';
}

/**
 * Rollup formula configuration
 */
export interface RollupFormulaConfig {
  type: 'rollup';
  relatedObject: string;
  relationshipField: string;
  aggregateField: string;
  operation: RollupOperation;
  conditions?: TriggerCondition[];
}

/**
 * Auto-number formula configuration
 */
export interface AutoNumberFormulaConfig {
  type: 'autonumber';
  prefix?: string;
  suffix?: string;
  startingNumber?: number;
  digits?: number;
}

/**
 * Formula configuration (union type)
 */
export type FormulaConfig = 
  | CalculatedFormulaConfig 
  | RollupFormulaConfig 
  | AutoNumberFormulaConfig;

// ============================================================================
// Storage Interface
// ============================================================================

/**
 * Automation storage interface
 * Supports both legacy and spec-compliant formats
 */
export interface AutomationStorage {
  /** Save an automation rule */
  saveRule(rule: AutomationRule | SpecAutomationRule): Promise<void>;
  
  /** Get an automation rule */
  getRule(id: string): Promise<(AutomationRule | SpecAutomationRule) | null>;
  
  /** List automation rules */
  listRules(filter?: { 
    status?: AutomationRuleStatus; 
    triggerType?: TriggerType;
    active?: boolean;
    objectName?: string;
  }): Promise<(AutomationRule | SpecAutomationRule)[]>;
  
  /** Update an automation rule */
  updateRule(id: string, updates: Partial<AutomationRule | SpecAutomationRule>): Promise<void>;
  
  /** Delete an automation rule */
  deleteRule(id: string): Promise<void>;
  
  /** Save a formula field */
  saveFormula(formula: FormulaField): Promise<void>;
  
  /** Get a formula field */
  getFormula(objectName: string, fieldName: string): Promise<FormulaField | null>;
  
  /** List formula fields */
  listFormulas(objectName?: string): Promise<FormulaField[]>;
  
  /** Delete a formula field */
  deleteFormula(objectName: string, fieldName: string): Promise<void>;
}

// ============================================================================
// Plugin Configuration
// ============================================================================

/**
 * Automation plugin configuration
 */
export interface AutomationPluginConfig {
  /** Whether automation is enabled */
  enabled?: boolean;
  /** Custom storage implementation */
  storage?: AutomationStorage;
  /** Maximum execution time for actions (milliseconds) */
  maxExecutionTime?: number;
  /** Enable email actions */
  enableEmail?: boolean;
  /** Email configuration */
  emailConfig?: EmailConfig;
  /** Enable HTTP actions */
  enableHttp?: boolean;
  /** Enable script execution */
  enableScriptExecution?: boolean;
}

/**
 * Email configuration
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  username?: string;
  password?: string;
  from: string;
}

/**
 * Automation execution result
 */
export interface AutomationExecutionResult {
  ruleId: string;
  success: boolean;
  executedAt: Date;
  actionsExecuted: number;
  error?: string;
  results?: any[];
}

// ─── Kernel Compliance Types ───────────────────────────────────────────────────

/** Plugin health status */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/** Health check result for a single check */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  latency?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Aggregate health report for a plugin */
export interface PluginHealthReport {
  pluginName: string;
  pluginVersion: string;
  status: HealthStatus;
  uptime: number;
  checks: HealthCheckResult[];
  timestamp: string;
}

/** Plugin capability declaration */
export interface PluginCapabilityManifest {
  services?: string[];
  emits?: string[];
  listens?: string[];
  routes?: string[];
  objects?: string[];
}

/** Plugin security manifest */
export interface PluginSecurityManifest {
  requiredPermissions?: string[];
  handlesSensitiveData?: boolean;
  makesExternalCalls?: boolean;
  allowedDomains?: string[];
  executesUserScripts?: boolean;
  sandboxConfig?: {
    timeout?: number;
    maxMemory?: number;
    allowedModules?: string[];
  };
}

/** Plugin startup result */
export interface PluginStartupResult {
  pluginName: string;
  success: boolean;
  duration: number;
  servicesRegistered: string[];
  warnings?: string[];
  errors?: string[];
}

/** Event bus configuration */
export interface EventBusConfig {
  persistence?: {
    enabled: boolean;
    storage?: 'memory' | 'redis' | 'sqlite';
    maxEvents?: number;
    ttl?: number;
  };
  retry?: {
    enabled: boolean;
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
  };
  deadLetterQueue?: {
    enabled: boolean;
    maxSize?: number;
    storage?: 'memory' | 'redis' | 'sqlite';
  };
  webhooks?: {
    enabled: boolean;
    endpoints?: Array<{
      url: string;
      events: string[];
      secret?: string;
      timeout?: number;
    }>;
  };
}
