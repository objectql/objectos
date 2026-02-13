/**
 * Automation Queue System
 *
 * Provides job queueing capabilities for background task execution.
 * Supports swappable backends (In-Memory, Database, Redis).
 */

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  priority?: number; // 1-100
  attempts: number;
  maxAttempts: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number; // ms
  };
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'delayed';
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  nextRunAt?: Date;
}

export interface QueueConfig {
  name: string;
  isWorker?: boolean;
  concurrency?: number;
}

export interface Queue {
  /**
   * Add a job to the queue
   */
  add<T>(type: string, data: T, options?: Partial<Job>): Promise<Job<T>>;

  /**
   * process jobs
   */
  process<T>(type: string, handler: (job: Job<T>) => Promise<void>): void;

  /**
   * Get job by ID
   */
  getJob(id: string): Promise<Job | null>;

  /**
   * Start the queue processor
   */
  start(): Promise<void>;

  /**
   * Stop the queue processor
   */
  stop(): Promise<void>;
}

/**
 * In-Memory Queue Implementation
 * Good for development and simple single-instance deployments
 */
export class InMemoryQueue implements Queue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, (job: Job) => Promise<void>> = new Map();
  private processing: boolean = false;
  private timer?: NodeJS.Timeout;
  private config: QueueConfig;
  private logger: any;

  constructor(config: QueueConfig, logger: any = console) {
    this.config = config;
    this.logger = logger;
  }

  async add<T>(type: string, data: T, options: Partial<Job> = {}): Promise<Job<T>> {
    const id = options.id || Math.random().toString(36).substring(2, 15);
    const job: Job<T> = {
      id,
      type,
      data,
      priority: options.priority || 0,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      backoff: options.backoff || { type: 'fixed', delay: 1000 },
      status: 'pending',
      createdAt: new Date(),
      nextRunAt: new Date(),
      ...options,
    };

    this.jobs.set(id, job);
    if (this.config.isWorker && !this.processing) {
      this.tick(); // Trigger processing
    }
    return job;
  }

  process<T>(type: string, handler: (job: Job<T>) => Promise<void>): void {
    this.handlers.set(type, handler as any);
  }

  async getJob(id: string): Promise<Job | null> {
    return this.jobs.get(id) || null;
  }

  async start(): Promise<void> {
    if (this.config.isWorker) {
      this.processing = true;
      this.tick();
      this.logger.info(`[Queue:${this.config.name}] Started worker`);
    }
  }

  async stop(): Promise<void> {
    this.processing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.logger.info(`[Queue:${this.config.name}] Stopped worker`);
  }

  private tick() {
    if (!this.processing) return;

    // Simple tick loop
    this.timer = setTimeout(async () => {
      await this.processNextBatch();
      if (this.processing) this.tick();
    }, 100); // Check every 100ms
  }

  private async processNextBatch() {
    // Find pending jobs
    const now = new Date();
    const pendingJobs = Array.from(this.jobs.values())
      .filter(
        (j) =>
          (j.status === 'pending' || j.status === 'delayed') && j.nextRunAt && j.nextRunAt <= now,
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (pendingJobs.length === 0) return;

    // Take one (or up to concurrency)
    const job = pendingJobs[0];
    const handler = this.handlers.get(job.type);

    if (!handler) {
      this.logger.warn(`[Queue:${this.config.name}] No handler for job type: ${job.type}`);
      job.status = 'failed';
      job.error = 'No handler registered';
      return;
    }

    try {
      job.status = 'processing';
      job.processedAt = new Date();
      job.attempts++;

      await handler(job);

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (err: any) {
      this.logger.error(`[Queue:${this.config.name}] Job ${job.id} failed:`, err);

      job.error = err.message;

      if (job.attempts < job.maxAttempts) {
        job.status = 'delayed'; // Retry
        const delay =
          job.backoff?.type === 'exponential'
            ? job.backoff.delay * Math.pow(2, job.attempts - 1)
            : job.backoff?.delay || 1000;

        job.nextRunAt = new Date(Date.now() + delay);
        this.logger.info(
          `[Queue:${this.config.name}] Retrying job ${job.id} in ${delay}ms (Attempt ${job.attempts + 1}/${job.maxAttempts})`,
        );
      } else {
        job.status = 'failed';
        job.failedAt = new Date();
        this.logger.error(
          `[Queue:${this.config.name}] Job ${job.id} failed permanently after ${job.attempts} attempts`,
        );
      }
    }
  }
}
