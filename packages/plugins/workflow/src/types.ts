/**
 * Workflow System Types
 * 
 * Type definitions for the workflow and state machine system
 */

/**
 * Workflow status
 */
export type WorkflowStatus = 
  | 'pending'     // Workflow is created but not started
  | 'running'     // Workflow is currently executing
  | 'completed'   // Workflow completed successfully
  | 'failed'      // Workflow failed
  | 'aborted';    // Workflow was aborted

/**
 * Workflow type
 */
export type WorkflowType = 
  | 'approval'      // Approval workflow
  | 'sequential'    // Sequential workflow
  | 'parallel'      // Parallel workflow
  | 'conditional';  // Conditional branching workflow

/**
 * Transition guard function
 * Returns true if transition is allowed, false otherwise
 */
export type TransitionGuard = (context: WorkflowContext, params?: any) => boolean | Promise<boolean>;

/**
 * Transition action function
 * Executed when a transition occurs
 */
export type TransitionAction = (context: WorkflowContext, params?: any) => void | Promise<void>;

/**
 * Parameterized Action Configuration
 */
export interface ActionConfig {
    type: string;
    params?: any;
}

/**
 * Parameterized Guard Configuration
 */
export interface GuardConfig {
    type: string;
    params?: any;
}

/**
 * Transition guard reference (name, config object, or function)
 */
export type GuardReference = string | GuardConfig | TransitionGuard;

/**
 * Transition action reference (name, config object, or function)
 */
export type ActionReference = string | ActionConfig | TransitionAction;

/**
 * State configuration
 */
export interface StateConfig {
  /** State name */
  name: string;
  /** Is this the initial state? */
  initial?: boolean;
  /** Is this a final state? */
  final?: boolean;
  /** Actions to run when entering this state */
  onEnter?: ActionReference[];
  /** Actions to run when exiting this state */
  onExit?: ActionReference[];
  /** Available transitions from this state */
  transitions?: Record<string, TransitionConfig>;
  /** Metadata for the state */
  metadata?: Record<string, any>;
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  /** Target state name */
  target: string;
  /** Guard conditions for this transition */
  guards?: GuardReference[];
  /** Actions to execute during transition */
  actions?: ActionReference[];
  /** Metadata for the transition */
  metadata?: Record<string, any>;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  /** Unique workflow ID */
  id: string;
  /** Workflow name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Workflow type */
  type: WorkflowType;
  /** Workflow version */
  version: string;
  /** State configurations */
  states: Record<string, StateConfig>;
  /** Initial state name */
  initialState: string;
  /** Workflow metadata */
  metadata?: Record<string, any>;
}

/**
 * Workflow instance
 */
export interface WorkflowInstance {
  /** Unique instance ID */
  id: string;
  /** Workflow definition ID */
  workflowId: string;
  /** Workflow version */
  version: string;
  /** Current state */
  currentState: string;
  /** Instance status */
  status: WorkflowStatus;
  /** Instance data/context */
  data: Record<string, any>;
  /** State history */
  history: StateHistoryEntry[];
  /** Created timestamp */
  createdAt: Date;
  /** Started timestamp */
  startedAt?: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Failed timestamp */
  failedAt?: Date;
  /** Aborted timestamp */
  abortedAt?: Date;
  /** Error message if failed */
  error?: string;
  /** User who started the workflow */
  startedBy?: string;
  /** User who completed/aborted the workflow */
  completedBy?: string;
}

/**
 * State history entry
 */
export interface StateHistoryEntry {
  /** From state */
  fromState: string;
  /** To state */
  toState: string;
  /** Transition name */
  transition: string;
  /** Timestamp */
  timestamp: Date;
  /** User who triggered the transition */
  triggeredBy?: string;
  /** Transition data */
  data?: Record<string, any>;
}

/**
 * Workflow context
 * Available to guards and actions
 */
export interface WorkflowContext {
  /** Workflow instance */
  instance: WorkflowInstance;
  /** Workflow definition */
  definition: WorkflowDefinition;
  /** Current state config */
  currentState: StateConfig;
  /** Transition being executed (if any) */
  transition?: {
    name: string;
    config: TransitionConfig;
  };
  /** Logger */
  logger: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
  /** Get workflow data */
  getData: <T = any>(key?: string) => T;
  /** Set workflow data */
  setData: (key: string, value: any) => void;
}

/**
 * Workflow task
 */
export interface WorkflowTask {
  /** Task ID */
  id: string;
  /** Workflow instance ID */
  instanceId: string;
  /** Task name */
  name: string;
  /** Task description */
  description?: string;
  /** Assigned to user */
  assignedTo?: string;
  /** Task status */
  status: 'pending' | 'completed' | 'rejected' | 'delegated' | 'escalated';
  /** Created timestamp */
  createdAt: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Task data */
  data?: Record<string, any>;
  /** Task result */
  result?: Record<string, any>;
  /** Original assignee (for delegation) */
  originalAssignee?: string;
  /** Delegated to user */
  delegatedTo?: string;
  /** Delegation timestamp */
  delegatedAt?: Date;
  /** Delegation reason */
  delegationReason?: string;
  /** Escalated to user */
  escalatedTo?: string;
  /** Escalation timestamp */
  escalatedAt?: Date;
  /** Escalation reason */
  escalationReason?: string;
  /** Due date for the task */
  dueDate?: Date;
  /** Auto-escalate if not completed by due date */
  autoEscalate?: boolean;
  /** Escalation target user */
  escalationTarget?: string;
}

/**
 * Workflow query options
 */
export interface WorkflowQueryOptions {
  /** Filter by workflow ID */
  workflowId?: string;
  /** Filter by status */
  status?: WorkflowStatus | WorkflowStatus[];
  /** Filter by started user */
  startedBy?: string;
  /** Limit results */
  limit?: number;
  /** Skip results */
  skip?: number;
  /** Sort by field */
  sortBy?: 'createdAt' | 'startedAt' | 'completedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Workflow storage interface
 */
export interface WorkflowStorage {
  /** Save a workflow definition */
  saveDefinition(definition: WorkflowDefinition): Promise<void>;
  
  /** Get a workflow definition */
  getDefinition(id: string, version?: string): Promise<WorkflowDefinition | null>;
  
  /** List workflow definitions */
  listDefinitions(): Promise<WorkflowDefinition[]>;
  
  /** Save a workflow instance */
  saveInstance(instance: WorkflowInstance): Promise<void>;
  
  /** Get a workflow instance */
  getInstance(id: string): Promise<WorkflowInstance | null>;
  
  /** Update a workflow instance */
  updateInstance(id: string, updates: Partial<WorkflowInstance>): Promise<void>;
  
  /** Query workflow instances */
  queryInstances(options: WorkflowQueryOptions): Promise<WorkflowInstance[]>;
  
  /** Save a task */
  saveTask(task: WorkflowTask): Promise<void>;
  
  /** Get a task */
  getTask(id: string): Promise<WorkflowTask | null>;
  
  /** Get tasks for an instance */
  getInstanceTasks(instanceId: string): Promise<WorkflowTask[]>;
  
  /** Update a task */
  updateTask(id: string, updates: Partial<WorkflowTask>): Promise<void>;
}

/**
 * Workflow plugin configuration
 */
export interface WorkflowPluginConfig {
  /** Whether workflow processing is enabled */
  enabled?: boolean;
  /** Directory to load workflow definitions from (default: ./workflows) */
  workflowsDir?: string;
  /** Custom storage implementation */
  storage?: WorkflowStorage;
  /** Default workflow timeout in milliseconds */
  defaultTimeout?: number;
  /** Maximum number of state transitions */
  maxTransitions?: number;
}

/**
 * YAML workflow definition structure
 */
export interface YAMLWorkflowDefinition {
  /** Workflow name */
  name: string;
  /** Workflow description */
  description?: string;
  /** Workflow type */
  type: WorkflowType;
  /** Workflow version */
  version?: string;
  /** States configuration */
  states: Record<string, YAMLStateConfig>;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * YAML state configuration
 */
export interface YAMLStateConfig {
  /** Is this the initial state? */
  initial?: boolean;
  /** Is this a final state? */
  final?: boolean;
  /** Actions on enter */
  on_enter?: (string | ActionConfig)[];
  /** Actions on exit */
  on_exit?: (string | ActionConfig)[];
  /** Transitions */
  transitions?: Record<string, YAMLTransitionConfig>;
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * YAML transition configuration
 */
export interface YAMLTransitionConfig {
  /** Target state (can be string or object) */
  target?: string;
  /** Guards */
  guards?: (string | GuardConfig)[];
  /** Actions */
  actions?: (string | ActionConfig)[];
  /** Metadata */
  metadata?: Record<string, any>;
}

/**
 * Notification channel type
 */
export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'sms';

/**
 * Notification configuration
 */
export interface NotificationConfig {
  /** Notification channel */
  channel: NotificationChannel;
  /** Recipients (email addresses, Slack channels, phone numbers, etc.) */
  recipients: string[];
  /** Template ID or name */
  template?: string;
  /** Subject (for email) */
  subject?: string;
  /** Message body */
  message?: string;
  /** Additional data for template rendering */
  data?: Record<string, any>;
}

/**
 * Notification handler interface
 */
export interface NotificationHandler {
  /** Send a notification */
  send(config: NotificationConfig, context: WorkflowContext): Promise<void>;
  /** Check if handler supports this channel */
  supports(channel: NotificationChannel): boolean;
}

/**
 * Approval chain configuration
 */
export interface ApprovalChain {
  /** Approval levels */
  levels: ApprovalLevel[];
  /** Auto-approve if no action within timeout */
  autoApproveTimeout?: number;
  /** Auto-escalate if no action within timeout */
  autoEscalateTimeout?: number;
}

/**
 * Approval level configuration
 */
export interface ApprovalLevel {
  /** Level number (1, 2, 3, etc.) */
  level: number;
  /** Approver user or role */
  approver: string;
  /** Optional description */
  description?: string;
  /** Required for approval */
  required?: boolean;
  /** Escalation target if not approved in time */
  escalationTarget?: string;
  /** Escalation timeout in milliseconds */
  escalationTimeout?: number;
}

/**
 * Delegation request
 */
export interface DelegationRequest {
  /** Task ID to delegate */
  taskId: string;
  /** User to delegate to */
  delegateTo: string;
  /** Delegation reason */
  reason?: string;
  /** Delegated by user */
  delegatedBy: string;
}

/**
 * Escalation request
 */
export interface EscalationRequest {
  /** Task ID to escalate */
  taskId: string;
  /** User to escalate to */
  escalateTo: string;
  /** Escalation reason */
  reason?: string;
  /** Escalated by user */
  escalatedBy?: string;
  /** Is this an automatic escalation */
  automatic?: boolean;
}
