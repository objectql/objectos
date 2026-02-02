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
export type TransitionGuard = (context: WorkflowContext) => boolean | Promise<boolean>;

/**
 * Transition action function
 * Executed when a transition occurs
 */
export type TransitionAction = (context: WorkflowContext) => void | Promise<void>;

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
  onEnter?: TransitionAction[];
  /** Actions to run when exiting this state */
  onExit?: TransitionAction[];
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
  guards?: TransitionGuard[];
  /** Actions to execute during transition */
  actions?: TransitionAction[];
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
  status: 'pending' | 'completed' | 'rejected';
  /** Created timestamp */
  createdAt: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Task data */
  data?: Record<string, any>;
  /** Task result */
  result?: Record<string, any>;
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
  on_enter?: string[];
  /** Actions on exit */
  on_exit?: string[];
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
  guards?: string[];
  /** Actions */
  actions?: string[];
  /** Metadata */
  metadata?: Record<string, any>;
}
