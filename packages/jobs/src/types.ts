/**
 * Job System Types
 * 
 * Type definitions for the job queue and scheduling system
 */

/**
 * Job status enumeration
 */
export type JobStatus = 
  | 'pending'    // Job is queued, waiting to be processed
  | 'running'    // Job is currently being processed
  | 'completed'  // Job completed successfully
  | 'failed'     // Job failed after all retries
  | 'cancelled'  // Job was cancelled
  | 'scheduled'; // Job is scheduled for future execution

/**
 * Job priority levels
 */
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Job configuration
 */
export interface JobConfig {
  /** Unique job ID */
  id: string;
  /** Job name/type */
  name: string;
  /** Job data payload */
  data?: any;
  /** Job priority */
  priority?: JobPriority;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
  /** Job timeout in milliseconds */
  timeout?: number;
  /** Cron expression for scheduled jobs */
  cronExpression?: string;
  /** Schedule start time */
  startTime?: Date;
  /** Schedule end time */
  endTime?: Date;
}

/**
 * Job execution context
 */
export interface JobContext {
  /** Job ID */
  jobId: string;
  /** Job name */
  name: string;
  /** Job data */
  data: any;
  /** Attempt number (1-based) */
  attempt: number;
  /** Logger instance */
  logger: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
}

/**
 * Job handler function
 */
export type JobHandler = (context: JobContext) => Promise<any>;

/**
 * Job definition for registration
 */
export interface JobDefinition {
  /** Job name/type */
  name: string;
  /** Job handler function */
  handler: JobHandler;
  /** Default configuration */
  defaultConfig?: Partial<JobConfig>;
}

/**
 * Job record in the queue
 */
export interface Job {
  /** Unique job ID */
  id: string;
  /** Job name/type */
  name: string;
  /** Job data payload */
  data: any;
  /** Job status */
  status: JobStatus;
  /** Job priority */
  priority: JobPriority;
  /** Number of retry attempts */
  attempts: number;
  /** Maximum retry attempts */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
  /** Job timeout in milliseconds */
  timeout: number;
  /** Cron expression for scheduled jobs */
  cronExpression?: string;
  /** Next execution time for scheduled jobs */
  nextRun?: Date;
  /** Created timestamp */
  createdAt: Date;
  /** Started timestamp */
  startedAt?: Date;
  /** Completed timestamp */
  completedAt?: Date;
  /** Failed timestamp */
  failedAt?: Date;
  /** Error message if failed */
  error?: string;
  /** Result data if completed */
  result?: any;
}

/**
 * Job queue statistics
 */
export interface JobQueueStats {
  /** Total jobs in queue */
  total: number;
  /** Pending jobs count */
  pending: number;
  /** Running jobs count */
  running: number;
  /** Completed jobs count */
  completed: number;
  /** Failed jobs count */
  failed: number;
  /** Cancelled jobs count */
  cancelled: number;
  /** Scheduled jobs count */
  scheduled: number;
}

/**
 * Job query options
 */
export interface JobQueryOptions {
  /** Filter by job name */
  name?: string;
  /** Filter by status */
  status?: JobStatus | JobStatus[];
  /** Filter by priority */
  priority?: JobPriority;
  /** Limit results */
  limit?: number;
  /** Skip results (for pagination) */
  skip?: number;
  /** Sort order */
  sortBy?: 'createdAt' | 'priority' | 'nextRun';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Job storage interface
 */
export interface JobStorage {
  /** Save a job */
  save(job: Job): Promise<void>;
  
  /** Get a job by ID */
  get(id: string): Promise<Job | null>;
  
  /** Update a job */
  update(id: string, updates: Partial<Job>): Promise<void>;
  
  /** Delete a job */
  delete(id: string): Promise<void>;
  
  /** Query jobs */
  query(options: JobQueryOptions): Promise<Job[]>;
  
  /** Get queue statistics */
  getStats(): Promise<JobQueueStats>;
  
  /** Get next pending job */
  getNextPending(): Promise<Job | null>;
  
  /** Get scheduled jobs due for execution */
  getScheduledDue(): Promise<Job[]>;
}

/**
 * Job plugin configuration
 */
export interface JobPluginConfig {
  /** Whether job processing is enabled */
  enabled?: boolean;
  /** Number of concurrent workers */
  concurrency?: number;
  /** Poll interval for checking new jobs (milliseconds) */
  pollInterval?: number;
  /** Default maximum retry attempts */
  defaultMaxRetries?: number;
  /** Default retry delay (milliseconds) */
  defaultRetryDelay?: number;
  /** Default job timeout (milliseconds) */
  defaultTimeout?: number;
  /** Custom storage implementation */
  storage?: JobStorage;
  /** Whether to enable built-in jobs */
  enableBuiltInJobs?: boolean;
}

/**
 * Built-in job configurations
 */
export interface DataCleanupJobConfig {
  /** Objects to clean up */
  objects: string[];
  /** Retention period in days */
  retentionDays: number;
  /** Soft delete or hard delete */
  softDelete?: boolean;
}

export interface ReportJobConfig {
  /** Report type */
  reportType: string;
  /** Report parameters */
  parameters?: Record<string, any>;
  /** Output format */
  format?: 'pdf' | 'csv' | 'xlsx' | 'json';
  /** Output destination */
  destination?: string;
}

export interface BackupJobConfig {
  /** Objects to backup (empty = all) */
  objects?: string[];
  /** Backup destination */
  destination: string;
  /** Compression enabled */
  compress?: boolean;
  /** Include metadata */
  includeMetadata?: boolean;
}
