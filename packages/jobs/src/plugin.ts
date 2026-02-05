/**
 * Jobs Plugin for ObjectOS
 * 
 * This plugin provides comprehensive job queue and scheduling capabilities including:
 * - Background job processing with queue management
 * - Cron-based job scheduling
 * - Automatic retry logic with exponential backoff
 * - Job monitoring and statistics
 * - Built-in jobs for common tasks (cleanup, reports, backups)
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
    JobPluginConfig,
    JobDefinition,
    JobConfig,
    Job,
    JobQueryOptions,
    JobQueueStats,
} from './types.js';
import { InMemoryJobStorage } from './storage.js';
import { JobQueue } from './queue.js';
import { JobScheduler } from './scheduler.js';
import {
    createDataCleanupJob,
    createReportJob,
    createBackupJob,
} from './built-in-jobs.js';

/**
 * Jobs Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class JobsPlugin implements Plugin {
    name = '@objectos/jobs';
    version = '0.1.0';
    dependencies: string[] = [];

    private config: JobPluginConfig;
    private storage: any;
    private queue: JobQueue;
    private scheduler: JobScheduler;
    private context?: PluginContext;

    constructor(config: JobPluginConfig = {}) {
        this.config = {
            enabled: true,
            concurrency: 5,
            pollInterval: 1000,
            defaultMaxRetries: 3,
            defaultRetryDelay: 1000,
            defaultTimeout: 60000,
            enableBuiltInJobs: true,
            ...config,
        };
        
        this.storage = config.storage || new InMemoryJobStorage();
        
        // Initialize queue
        this.queue = new JobQueue({
            storage: this.storage,
            concurrency: this.config.concurrency,
            defaultMaxRetries: this.config.defaultMaxRetries,
            defaultRetryDelay: this.config.defaultRetryDelay,
            defaultTimeout: this.config.defaultTimeout,
        });

        // Initialize scheduler
        this.scheduler = new JobScheduler({
            storage: this.storage,
            queue: this.queue,
        });
    }

    /**
     * Initialize plugin - Register services and subscribe to events
     */
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;

        // Update loggers
        (this.queue as any).logger = context.logger;
        (this.scheduler as any).logger = context.logger;

        // Register jobs service
        context.registerService('jobs', this);

        // Register built-in jobs if enabled
        if (this.config.enableBuiltInJobs) {
            this.registerBuiltInJobs();
        }

        // Set up event listeners using kernel hooks
        await this.setupEventListeners(context);

        context.logger.info('[Jobs Plugin] Initialized successfully');
    }

    /**
     * Register built-in job handlers
     */
    private registerBuiltInJobs(): void {
        // Data cleanup job
        const cleanupJob = createDataCleanupJob({
            objects: [],
            retentionDays: 90,
        });
        this.queue.registerHandler(cleanupJob);

        // Report generation job
        const reportJob = createReportJob({
            reportType: 'default',
        });
        this.queue.registerHandler(reportJob);

        // Backup job
        const backupJob = createBackupJob({
            destination: '/tmp/backups',
        });
        this.queue.registerHandler(backupJob);

        this.context?.logger.info('[Jobs Plugin] Built-in jobs registered');
    }

    /**
     * Set up event listeners for job lifecycle using kernel hooks
     */
    private async setupEventListeners(context: PluginContext): Promise<void> {
        // Listen for data events that might trigger jobs
        context.hook('data.create', async (data: any) => {
            await this.emitEvent('job.trigger', { type: 'data.create', data });
        });

        this.context?.logger.info('[Jobs Plugin] Event listeners registered');
    }

    /**
     * Emit job events using kernel trigger system
     */
    private async emitEvent(event: string, data: any): Promise<void> {
        if (this.context) {
            await this.context.trigger(event, data);
        }
    }

    /**
     * Register a custom job handler
     */
    registerHandler(definition: JobDefinition): void {
        this.queue.registerHandler(definition);
    }

    /**
     * Add a job to the queue
     */
    async enqueue(config: JobConfig): Promise<Job> {
        const job = await this.queue.enqueue(config);
        await this.emitEvent('job.enqueued', job);
        return job;
    }

    /**
     * Schedule a recurring job
     */
    async schedule(config: JobConfig): Promise<Job> {
        const job = await this.scheduler.scheduleJob(config);
        await this.emitEvent('job.scheduled', job);
        return job;
    }

    /**
     * Cancel a job
     */
    async cancel(jobId: string): Promise<void> {
        await this.queue.cancel(jobId);
        await this.emitEvent('job.cancelled', { jobId });
    }

    /**
     * Get job by ID
     */
    async getJob(jobId: string): Promise<Job | null> {
        return this.queue.getJob(jobId);
    }

    /**
     * Query jobs
     */
    async queryJobs(options: JobQueryOptions): Promise<Job[]> {
        return this.queue.queryJobs(options);
    }

    /**
     * Get queue statistics
     */
    async getStats(): Promise<JobQueueStats> {
        return this.queue.getStats();
    }

    /**
     * Start job processing
     */
    async start(context: PluginContext): Promise<void> {
        this.scheduler.start();
        context.logger.info('[Jobs Plugin] Started');
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        await this.queue.stopProcessing();
        this.scheduler.stop();
        this.context?.logger.info('[Jobs Plugin] Destroyed');
    }
}

/**
 * Helper function to access the jobs API from kernel
 */
export function getJobsAPI(kernel: any): JobsPlugin | null {
    try {
        return kernel.getService('jobs');
    } catch {
        return null;
    }
}
