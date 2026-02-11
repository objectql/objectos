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
import type { IJobService, JobSchedule as SpecJobSchedule, JobHandler as SpecJobHandler, JobExecution as SpecJobExecution } from '@objectstack/spec/contracts';
import type {
    JobPluginConfig,
    JobDefinition,
    JobConfig,
    JobContext,
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
export class JobsPlugin implements Plugin, IJobService {
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
        context.registerService('job', this);

        // Register built-in jobs if enabled
        if (this.config.enableBuiltInJobs) {
            this.registerBuiltInJobs();
        }

        // Set up event listeners using kernel hooks
        await this.setupEventListeners(context);

        await this.emitEvent('plugin.initialized', { pluginId: this.name });
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
     * Schedule a recurring job (IJobService contract)
     */
    async schedule(name: string, schedule: SpecJobSchedule, handler: SpecJobHandler): Promise<void>;
    /**
     * Schedule a recurring job (legacy)
     */
    async schedule(config: JobConfig): Promise<Job>;
    async schedule(nameOrConfig: string | JobConfig, specSchedule?: SpecJobSchedule, handler?: SpecJobHandler): Promise<Job | void> {
        if (typeof nameOrConfig === 'string') {
            // IJobService contract: schedule(name, schedule, handler)
            const name = nameOrConfig;
            // Register handler for this job name
            this.queue.registerHandler({
                name,
                handler: async (ctx: JobContext) => {
                    await handler!({ jobId: ctx.jobId, data: ctx.data });
                },
            });
            // Schedule via internal scheduler
            const config: JobConfig = {
                id: `${name}_${Date.now()}`,
                name,
                cronExpression: specSchedule?.expression,
            };
            await this.scheduler.scheduleJob(config);
            await this.emitEvent('job.scheduled', { name });
            return;
        }
        // Legacy: schedule(config)
        const job = await this.scheduler.scheduleJob(nameOrConfig);
        await this.emitEvent('job.scheduled', job);
        return job;
    }

    /**
     * Trigger a job by name immediately (IJobService contract)
     */
    async trigger(name: string, data?: unknown): Promise<void> {
        const job = await this.enqueue({
            id: `${name}_trigger_${Date.now()}`,
            name,
            data,
        });
        await this.emitEvent('job.triggered', { name, jobId: job.id });
    }

    /**
     * Get recent executions for a job by name (IJobService contract)
     */
    async getExecutions(name: string, limit = 10): Promise<SpecJobExecution[]> {
        const jobs = await this.queryJobs({ name, limit });
        return jobs.map(job => ({
            jobId: job.id,
            status: job.status === 'completed' ? 'success' as const
                 : job.status === 'running' ? 'running' as const
                 : job.status === 'failed' ? 'failed' as const
                 : 'success' as const,
            startedAt: (job.startedAt ?? job.createdAt ?? new Date()).toISOString(),
            completedAt: job.completedAt?.toISOString(),
            error: job.error,
            durationMs: job.startedAt && job.completedAt
                ? job.completedAt.getTime() - job.startedAt.getTime()
                : undefined,
        }));
    }

    /**
     * List all registered job names (IJobService contract)
     */
    async listJobs(): Promise<string[]> {
        const jobs = await this.queryJobs({});
        const names = new Set(jobs.map(j => j.name));
        return Array.from(names);
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
        const start = Date.now();
        const status = this.config.enabled ? 'healthy' : 'degraded';
        let stats: JobQueueStats | undefined;
        try { stats = await this.queue.getStats(); } catch { /* ignore */ }
        const message = stats ? `Queue: ${stats.pending || 0} pending, ${stats.running || 0} running` : 'Job queue active';
        const latency = Date.now() - start;
        return {
            status,
            timestamp: new Date().toISOString(),
            message,
            metrics: {
                uptime: this.startedAt ? Date.now() - this.startedAt : 0,
                responseTime: latency,
            },
            checks: [{ name: 'job-queue', status: status === 'healthy' ? 'passed' : 'warning', message }],
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: {
                provides: [{
                    id: 'com.objectstack.service.job',
                    name: 'job',
                    version: { major: 0, minor: 1, patch: 0 },
                    methods: [
                        { name: 'registerHandler', description: 'Register a custom job handler', async: false },
                        { name: 'enqueue', description: 'Add a job to the queue', returnType: 'Promise<Job>', async: true },
                        { name: 'schedule', description: 'Schedule a recurring job', returnType: 'Promise<Job>', async: true },
                        { name: 'cancel', description: 'Cancel a job', async: true },
                        { name: 'getJob', description: 'Get job by ID', returnType: 'Promise<Job | null>', async: true },
                        { name: 'queryJobs', description: 'Query jobs with filters', returnType: 'Promise<Job[]>', async: true },
                        { name: 'getStats', description: 'Get queue statistics', returnType: 'Promise<JobQueueStats>', async: true },
                        { name: 'enqueueBatch', description: 'Enqueue a batch of jobs', returnType: 'Promise<Job[]>', async: true },
                    ],
                    stability: 'stable',
                }],
                requires: [],
            },
            security: {
                pluginId: 'jobs',
                trustLevel: 'trusted',
                permissions: { permissions: [], defaultGrant: 'deny' },
                sandbox: { enabled: false, level: 'none' },
            },
        };
    }

    /**
     * Startup result
     */
    getStartupResult(): PluginStartupResult {
        return { plugin: { name: this.name, version: this.version }, success: !!this.context, duration: 0 };
    }

    /**
     * Enqueue a batch of jobs
     */
    async enqueueBatch(configs: JobConfig[]): Promise<Job[]> {
        return Promise.all(configs.map(config => this.enqueue(config)));
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
        
        await this.emitEvent('plugin.started', { pluginId: this.name });
        context.logger.info('[Jobs Plugin] Started');
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        await this.queue.stopProcessing();
        this.scheduler.stop();
        await this.emitEvent('plugin.destroyed', { pluginId: this.name });
        this.context?.logger.info('[Jobs Plugin] Destroyed');
    }
}

/**
 * Helper function to access the jobs API from kernel
 */
export function getJobsAPI(kernel: any): JobsPlugin | null {
    try {
        return kernel.getService('job');
    } catch {
        return null;
    }
}
