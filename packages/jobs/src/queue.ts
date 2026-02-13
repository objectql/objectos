/**
 * Job Queue
 *
 * Core job queue implementation with retry logic and monitoring
 */

import type {
  Job,
  JobConfig,
  JobDefinition,
  JobHandler,
  JobContext,
  JobStorage,
  JobStatus,
  JobPriority,
  JobQueryOptions,
  JobQueueStats,
} from './types.js';
import { InMemoryJobStorage } from './storage.js';
import { PersistentJobStorage } from './persistent-storage.js';

export class JobQueue {
  private handlers: Map<string, JobHandler> = new Map();
  private storage: JobStorage;
  private processing = false;
  private activeJobs = 0;
  private maxConcurrency: number;
  private defaultMaxRetries: number;
  private defaultRetryDelay: number;
  private defaultTimeout: number;
  private logger: any;

  constructor(
    options: {
      storage?: JobStorage;
      concurrency?: number;
      defaultMaxRetries?: number;
      defaultRetryDelay?: number;
      defaultTimeout?: number;
      logger?: any;
    } = {},
  ) {
    this.storage = options.storage || new InMemoryJobStorage();
    this.maxConcurrency = options.concurrency || 5;
    this.defaultMaxRetries = options.defaultMaxRetries || 3;
    this.defaultRetryDelay = options.defaultRetryDelay || 1000;
    this.defaultTimeout = options.defaultTimeout || 60000;
    this.logger = options.logger || console;
  }

  /**
   * Register a job handler
   */
  registerHandler(definition: JobDefinition): void {
    if (this.handlers.has(definition.name)) {
      throw new Error(`Job handler "${definition.name}" is already registered`);
    }
    this.handlers.set(definition.name, definition.handler);
    this.logger.info(`[JobQueue] Registered handler: ${definition.name}`);
  }

  /**
   * Unregister a job handler
   */
  unregisterHandler(name: string): void {
    this.handlers.delete(name);
    this.logger.info(`[JobQueue] Unregistered handler: ${name}`);
  }

  /**
   * Add a job to the queue
   */
  async enqueue(config: JobConfig): Promise<Job> {
    const handler = this.handlers.get(config.name);
    if (!handler) {
      throw new Error(`No handler registered for job: ${config.name}`);
    }

    const job: Job = {
      id: config.id,
      name: config.name,
      data: config.data || {},
      status: 'pending',
      priority: config.priority || 'normal',
      attempts: 0,
      maxRetries: config.maxRetries ?? this.defaultMaxRetries,
      retryDelay: config.retryDelay ?? this.defaultRetryDelay,
      timeout: config.timeout ?? this.defaultTimeout,
      cronExpression: config.cronExpression,
      createdAt: new Date(),
    };

    await this.storage.save(job);
    this.logger.info(`[JobQueue] Enqueued job: ${job.id} (${job.name})`);

    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return job;
  }

  /**
   * Start processing jobs
   */
  private async startProcessing(): Promise<void> {
    if (this.processing) return;

    this.processing = true;
    this.logger.info('[JobQueue] Started processing');

    while (this.processing) {
      try {
        // Check if we can process more jobs
        if (this.activeJobs >= this.maxConcurrency) {
          await this.sleep(100);
          continue;
        }

        // Get next pending job
        const job = await this.storage.getNextPending();
        if (!job) {
          await this.sleep(100);
          continue;
        }

        // Process job asynchronously
        this.activeJobs++;
        this.processJob(job).finally(() => {
          this.activeJobs--;
        });
      } catch (error) {
        this.logger.error('[JobQueue] Processing error:', error);
        await this.sleep(1000);
      }
    }
  }

  /**
   * Stop processing jobs
   */
  async stopProcessing(): Promise<void> {
    this.processing = false;
    this.logger.info('[JobQueue] Stopped processing');

    // Wait for active jobs to complete
    while (this.activeJobs > 0) {
      await this.sleep(100);
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      this.logger.error(`[JobQueue] No handler for job: ${job.name}`);
      await this.failJob(job, 'No handler registered');
      return;
    }

    job.attempts++;
    await this.storage.update(job.id, {
      status: 'running',
      attempts: job.attempts,
      startedAt: new Date(),
    });

    this.logger.info(
      `[JobQueue] Processing job: ${job.id} (attempt ${job.attempts}/${job.maxRetries + 1})`,
    );

    try {
      // Create job context
      const context: JobContext = {
        jobId: job.id,
        name: job.name,
        data: job.data,
        attempt: job.attempts,
        logger: this.logger,
      };

      // Execute job with timeout
      const result = await this.executeWithTimeout(handler(context), job.timeout);

      // Mark job as completed
      await this.storage.update(job.id, {
        status: 'completed',
        completedAt: new Date(),
        result,
      });

      this.logger.info(`[JobQueue] Completed job: ${job.id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[JobQueue] Job failed: ${job.id} - ${errorMessage}`);

      // Check if we should retry
      if (job.attempts <= job.maxRetries) {
        await this.retryJob(job, errorMessage);
      } else {
        await this.failJob(job, errorMessage);
      }
    }
  }

  /**
   * Retry a failed job
   */
  private async retryJob(job: Job, error: string): Promise<void> {
    // Calculate retry delay with exponential backoff
    const retryDelay = job.retryDelay * Math.pow(2, job.attempts - 1);

    this.logger.info(`[JobQueue] Retrying job ${job.id} in ${retryDelay}ms`);

    // Schedule retry
    await this.sleep(retryDelay);
    await this.storage.update(job.id, {
      status: 'pending',
      error,
    });
  }

  /**
   * Mark a job as failed
   */
  private async failJob(job: Job, error: string): Promise<void> {
    await this.storage.update(job.id, {
      status: 'failed',
      failedAt: new Date(),
      error,
    });

    // Move to dead letter queue when using persistent storage
    if (this.storage instanceof PersistentJobStorage) {
      await this.storage.moveToDeadLetter(job, error);
    }

    this.logger.error(`[JobQueue] Job failed permanently: ${job.id} - ${error}`);
  }

  /**
   * Execute a promise with timeout
   */
  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Job timeout')), timeout)),
    ]);
  }

  /**
   * Cancel a job
   */
  async cancel(jobId: string): Promise<void> {
    const job = await this.storage.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === 'running') {
      throw new Error('Cannot cancel a running job');
    }

    await this.storage.update(jobId, {
      status: 'cancelled',
    });

    this.logger.info(`[JobQueue] Cancelled job: ${jobId}`);
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    return this.storage.get(jobId);
  }

  /**
   * Query jobs
   */
  async queryJobs(options: JobQueryOptions): Promise<Job[]> {
    return this.storage.query(options);
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<JobQueueStats> {
    return this.storage.getStats();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
