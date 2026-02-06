/**
 * Automation System Types - LEGACY VERSION
 * 
 * This file preserves the original type definitions for backward compatibility.
 * For new code, use the types from ./types.ts which are aligned with @objectstack/spec.
 * 
 * @deprecated This is the legacy types file. Import from ./types.ts instead.
 */

// Import spec-compliant types from @objectstack/spec
import type {
  WorkflowRule,
  WorkflowAction,
  WorkflowTriggerType,
  TimeTrigger,
} from '@objectstack/spec/automation';

// Re-export spec types for convenience
export type {
  WorkflowRule,
  WorkflowAction,
  WorkflowTriggerType,
  TimeTrigger,
};

/**
 * Trigger type enumeration (legacy compatibility)
 * @deprecated Use WorkflowTriggerType from @objectstack/spec instead
 */
export type TriggerType = 
  | 'object.create'    // Object created
  | 'object.update'    // Object updated
  | 'object.delete'    // Object deleted
  | 'scheduled'        // Scheduled (cron)
  | 'webhook';         // Webhook triggered

/**
 * Action type enumeration (legacy compatibility)
 * @deprecated Use WorkflowAction discriminated union from @objectstack/spec instead
 */
export type ActionType = 
  | 'update_field'     // Update a field (now 'field_update' in spec)
  | 'create_record'    // Create a new record
  | 'send_email'       // Send an email (now 'email_alert' in spec)
  | 'http_request'     // Make HTTP request (now 'http_call' in spec)
  | 'execute_script';  // Execute a script (now 'custom_script' in spec)

/**
 * Formula field type
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
 */
export type AutomationRuleStatus = 
  | 'active'           // Rule is active
  | 'inactive'         // Rule is inactive
  | 'error';           // Rule has errors

/**
 * Object trigger configuration
 */
export interface ObjectTriggerConfig {
  /** Trigger type */
  type: 'object.create' | 'object.update' | 'object.delete';
  /** Object name to monitor */
  objectName: string;
  /** Field conditions (for update triggers) */
  conditions?: TriggerCondition[];
  /** Fields to monitor for changes (for update triggers) */
  fields?: string[];
}

/**
 * Scheduled trigger configuration
 */
export interface ScheduledTriggerConfig {
  /** Trigger type */
  type: 'scheduled';
  /** Cron expression */
  cronExpression: string;
  /** Timezone */
  timezone?: string;
}

/**
 * Webhook trigger configuration
 */
export interface WebhookTriggerConfig {
  /** Trigger type */
  type: 'webhook';
  /** Webhook path */
  path: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Authentication required */
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
 * Update field action configuration
 */
export interface UpdateFieldActionConfig {
  /** Action type */
  type: 'update_field';
  /** Object name */
  objectName: string;
  /** Record ID (can be template) */
  recordId: string;
  /** Field updates */
  fields: Record<string, any>;
}

/**
 * Create record action configuration
 */
export interface CreateRecordActionConfig {
  /** Action type */
  type: 'create_record';
  /** Object name */
  objectName: string;
  /** Field values */
  fields: Record<string, any>;
}

/**
 * Send email action configuration
 */
export interface SendEmailActionConfig {
  /** Action type */
  type: 'send_email';
  /** Recipient email(s) */
  to: string | string[];
  /** CC email(s) */
  cc?: string | string[];
  /** BCC email(s) */
  bcc?: string | string[];
  /** Email subject */
  subject: string;
  /** Email body */
  body: string;
  /** Is HTML body */
  isHtml?: boolean;
  /** Attachments */
  attachments?: EmailAttachment[];
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** Filename */
  filename: string;
  /** Content (base64 or buffer) */
  content: string | Buffer;
  /** Content type */
  contentType?: string;
}

/**
 * HTTP request action configuration
 */
export interface HttpRequestActionConfig {
  /** Action type */
  type: 'http_request';
  /** URL */
  url: string;
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Execute script action configuration
 */
export interface ExecuteScriptActionConfig {
  /** Action type */
  type: 'execute_script';
  /** Script code */
  script: string;
  /** Script language */
  language?: 'javascript' | 'typescript';
  /** Script timeout in milliseconds */
  timeout?: number;
}

/**
 * Action configuration (union type)
 */
export type ActionConfig = 
  | UpdateFieldActionConfig 
  | CreateRecordActionConfig 
  | SendEmailActionConfig 
  | HttpRequestActionConfig 
  | ExecuteScriptActionConfig;

/**
 * Automation rule
 */
export interface AutomationRule {
  /** Unique rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description?: string;
  /** Rule status */
  status: AutomationRuleStatus;
  /** Trigger configuration */
  trigger: TriggerConfig;
  /** Actions to execute */
  actions: ActionConfig[];
  /** Rule priority (higher = runs first) */
  priority?: number;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt?: Date;
  /** Last executed timestamp */
  lastExecutedAt?: Date;
  /** Execution count */
  executionCount?: number;
  /** Error message if status is error */
  error?: string;
}

/**
 * Automation execution context
 */
export interface AutomationContext {
  /** Rule being executed */
  rule: AutomationRule;
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

/**
 * Formula field definition
 */
export interface FormulaField {
  /** Field name */
  name: string;
  /** Object name */
  objectName: string;
  /** Formula type */
  type: FormulaType;
  /** Formula configuration */
  config: FormulaConfig;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Calculated formula configuration
 */
export interface CalculatedFormulaConfig {
  /** Formula type */
  type: 'calculated';
  /** Formula expression */
  expression: string;
  /** Return type */
  returnType: 'string' | 'number' | 'boolean' | 'date';
}

/**
 * Rollup formula configuration
 */
export interface RollupFormulaConfig {
  /** Formula type */
  type: 'rollup';
  /** Related object name */
  relatedObject: string;
  /** Relationship field */
  relationshipField: string;
  /** Field to aggregate */
  aggregateField: string;
  /** Rollup operation */
  operation: RollupOperation;
  /** Filter conditions */
  conditions?: TriggerCondition[];
}

/**
 * Auto-number formula configuration
 */
export interface AutoNumberFormulaConfig {
  /** Formula type */
  type: 'autonumber';
  /** Prefix */
  prefix?: string;
  /** Suffix */
  suffix?: string;
  /** Starting number */
  startingNumber?: number;
  /** Number of digits */
  digits?: number;
}

/**
 * Formula configuration (union type)
 */
export type FormulaConfig = 
  | CalculatedFormulaConfig 
  | RollupFormulaConfig 
  | AutoNumberFormulaConfig;

/**
 * Automation storage interface
 */
export interface AutomationStorage {
  /** Save an automation rule */
  saveRule(rule: AutomationRule): Promise<void>;
  
  /** Get an automation rule */
  getRule(id: string): Promise<AutomationRule | null>;
  
  /** List automation rules */
  listRules(filter?: { status?: AutomationRuleStatus; triggerType?: TriggerType }): Promise<AutomationRule[]>;
  
  /** Update an automation rule */
  updateRule(id: string, updates: Partial<AutomationRule>): Promise<void>;
  
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
  /** SMTP host */
  host: string;
  /** SMTP port */
  port: number;
  /** Use secure connection */
  secure?: boolean;
  /** SMTP username */
  username?: string;
  /** SMTP password */
  password?: string;
  /** Default from address */
  from: string;
}

/**
 * Automation execution result
 */
export interface AutomationExecutionResult {
  /** Rule ID */
  ruleId: string;
  /** Execution success */
  success: boolean;
  /** Execution timestamp */
  executedAt: Date;
  /** Actions executed */
  actionsExecuted: number;
  /** Error message if failed */
  error?: string;
  /** Execution results per action */
  results?: any[];
}
