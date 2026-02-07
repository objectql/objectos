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
    PluginHealthReport,
    PluginCapabilityManifest,
    PluginSecurityManifest,
    PluginStartupResult,
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
    private startedAt?: number;

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
        this.startedAt = Date.now();

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
     * Health check
     */
    async healthCheck(): Promise<PluginHealthReport> {
        const status = this.config.enabled ? 'healthy' : 'degraded';
        let stats: JobQueueStats | undefined;
        try { stats = await this.queue.getStats(); } catch { /* ignore */ }
        return {
            pluginName: this.name,
            pluginVersion: this.version,
            status,
            uptime: this.startedAt ? Date.now() - this.startedAt : 0,
            checks: [{ name: 'job-queue', status, message: stats ? `Queue: ${stats.pending || 0} pending, ${stats.running || 0} running` : 'Job queue active', latency: 0, timestamp: new Date().toISOString() }],
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: {
                services: ['jobs'],
                emits: ['job.enqueued', 'job.scheduled', 'job.cancelled', 'job.trigger'],
                listens: ['data.create'],
                routes: [],
                objects: [],
            },
            security: { requiredPermissions: [], handlesSensitiveData: false, makesExternalCalls: false },
        };
    }

    /**
     * Startup result
     */
    getStartupResult(): PluginStartupResult {
        return { pluginName: this.name, success: !!this.context, duration: 0, servicesRegistered: ['jobs'] };
    }

    /**
     * Start job processing
     */
    async start(context: PluginContext): Promise<void> {
        this.scheduler.start();
        
        // Register HTTP routes for Jobs API
        try {
            const httpServer = context.getService('http.server') as any;
            const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
            if (rawApp) {
                // GET /api/v1/jobs - Query jobs
                rawApp.get('/api/v1/jobs', async (c: any) => {
                    try {
                        const query = c.req.query();
                        const options: JobQueryOptions = {
                            status: query.status as any,
                            name: query.name,
                            limit: query.limit ? parseInt(query.limit) : undefined,
                            skip: query.skip ? parseInt(query.skip) : undefined,
                        };
                        const jobs = await this.queryJobs(options);
                        return c.json({ success: true, data: jobs });
                    } catch (error: any) {
                        context.logger.error('[Jobs API] Query error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/jobs/stats - Get queue statistics
                rawApp.get('/api/v1/jobs/stats', async (c: any) => {
                    try {
                        const stats = await this.getStats();
                        return c.json({ success: true, data: stats });
                    } catch (error: any) {
                        context.logger.error('[Jobs API] Stats error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/jobs/:id - Get job by ID
                rawApp.get('/api/v1/jobs/:id', async (c: any) => {
                    try {
                        const id = c.req.param('id');
                        const job = await this.getJob(id);
                        if (!job) {
                            return c.json({ success: false, error: 'Job not found' }, 404);
                        }
                        return c.json({ success: true, data: job });
                    } catch (error: any) {
                        context.logger.error('[Jobs API] Get job error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // POST /api/v1/jobs/:id/retry - Retry failed job
                rawApp.post('/api/v1/jobs/:id/retry', async (c: any) => {
                    try {
                        const id = c.req.param('id');
                        const job = await this.getJob(id);
                        if (!job) {
                            return c.json({ success: false, error: 'Job not found' }, 404);
                        }
                        if (job.status !== 'failed') {
                            return c.json({ success: false, error: 'Only failed jobs can be retried' }, 400);
                        }
                        // Re-enqueue the job
                        const retriedJob = await this.enqueue({
                            id: `${job.id}_retry_${Date.now()}`,
                            name: job.name,
                            data: job.data,
                            priority: job.priority,
                        });
                        return c.json({ success: true, data: retriedJob });
                    } catch (error: any) {
                        context.logger.error('[Jobs API] Retry error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // POST /api/v1/jobs/:id/cancel - Cancel job
                rawApp.post('/api/v1/jobs/:id/cancel', async (c: any) => {
                    try {
                        const id = c.req.param('id');
                        await this.cancel(id);
                        return c.json({ success: true, message: 'Job cancelled' });
                    } catch (error: any) {
                        context.logger.error('[Jobs API] Cancel error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                context.logger.info('[Jobs Plugin] HTTP routes registered');
            }
        } catch (e: any) {
            context.logger.warn(`[Jobs Plugin] Could not register HTTP routes: ${e?.message}`);
        }
        
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
