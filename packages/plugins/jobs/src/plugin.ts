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

import type {
    PluginDefinition,
    PluginContextData,
    ObjectStackManifest,
} from '@objectstack/spec/system';

import type {
    JobPluginConfig,
    JobDefinition,
    JobConfig,
    Job,
    JobQueryOptions,
    JobQueueStats,
} from './types';
import { InMemoryJobStorage } from './storage';
import { JobQueue } from './queue';
import { JobScheduler } from './scheduler';
import {
    createDataCleanupJob,
    createReportJob,
    createBackupJob,
} from './built-in-jobs';

/**
 * Extended app context with event bus
 */
interface ExtendedAppContext {
    eventBus?: {
        on?: (event: string, handler: (data: any) => void) => void;
        emit?: (event: string, data: any) => void;
    };
}

/**
 * Plugin Manifest
 * Conforms to @objectstack/spec/system/ManifestSchema
 */
export const JobsManifest: ObjectStackManifest = {
    id: 'com.objectos.jobs',
    version: '0.1.0',
    type: 'plugin',
    name: 'Jobs Plugin',
    description: 'Background job processing and scheduling with cron support, retry logic, and job monitoring',
    permissions: [
        'system.jobs.read',
        'system.jobs.write',
        'system.jobs.execute',
    ],
    contributes: {
        // Register job-related events
        events: [
            'job.enqueued',
            'job.started',
            'job.completed',
            'job.failed',
            'job.scheduled',
            'job.cancelled',
        ],
    },
};

/**
 * Jobs Plugin Instance
 */
class JobsPluginInstance {
    private config: JobPluginConfig;
    private storage: any;
    private queue: JobQueue;
    private scheduler: JobScheduler;
    private context?: PluginContextData;

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
     * Initialize plugin and register built-in jobs
     */
    async initialize(context: PluginContextData): Promise<void> {
        this.context = context;

        // Update loggers
        (this.queue as any).logger = context.logger;
        (this.scheduler as any).logger = context.logger;

        // Register built-in jobs if enabled
        if (this.config.enableBuiltInJobs) {
            this.registerBuiltInJobs();
        }

        // Set up event listeners
        const app = context.app as ExtendedAppContext;
        if (app.eventBus) {
            this.setupEventListeners(app.eventBus);
        }

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
     * Set up event listeners for job lifecycle
     */
    private setupEventListeners(eventBus: any): void {
        // Listen for data events that might trigger jobs
        if (typeof eventBus.on === 'function') {
            eventBus.on('data.create', (data: any) => {
                this.emitEvent('job.trigger', { type: 'data.create', data });
            });
        }
    }

    /**
     * Emit job events
     */
    private emitEvent(event: string, data: any): void {
        const app = this.context?.app as ExtendedAppContext;
        if (app?.eventBus && typeof app.eventBus.emit === 'function') {
            app.eventBus.emit(event, data);
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
        this.emitEvent('job.enqueued', job);
        return job;
    }

    /**
     * Schedule a recurring job
     */
    async schedule(config: JobConfig): Promise<Job> {
        const job = await this.scheduler.scheduleJob(config);
        this.emitEvent('job.scheduled', job);
        return job;
    }

    /**
     * Cancel a job
     */
    async cancel(jobId: string): Promise<void> {
        await this.queue.cancel(jobId);
        this.emitEvent('job.cancelled', { jobId });
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
    async start(): Promise<void> {
        this.scheduler.start();
        this.context?.logger.info('[Jobs Plugin] Started');
    }

    /**
     * Stop job processing
     */
    async stop(): Promise<void> {
        await this.queue.stopProcessing();
        this.scheduler.stop();
        this.context?.logger.info('[Jobs Plugin] Stopped');
    }
}

/**
 * Create Jobs Plugin
 * Factory function to create the plugin with custom configuration
 */
export const createJobsPlugin = (config: JobPluginConfig = {}): PluginDefinition => {
    const instance = new JobsPluginInstance(config);

    return {
        /**
         * Called when the plugin is first installed
         */
        onInstall: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Jobs Plugin] Installing...');
            
            await context.storage.set('install_date', new Date().toISOString());
            await context.storage.set('config', JSON.stringify(config));
            
            context.logger.info('[Jobs Plugin] Installation complete');
        }) as any,

        /**
         * Called when the plugin is enabled
         */
        onEnable: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Jobs Plugin] Enabling...');
            
            try {
                await instance.initialize(context);
                await instance.start();
                
                // Store plugin instance reference for API access
                (context.app as any).__jobsPlugin = instance;
                
                context.logger.info('[Jobs Plugin] Enabled successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                context.logger.error(`[Jobs Plugin] Failed to enable: ${errorMessage}`, error);
                throw new Error(`Jobs Plugin initialization failed: ${errorMessage}`);
            }
        }) as any,

        /**
         * Called when the plugin is disabled
         */
        onDisable: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Jobs Plugin] Disabling...');
            
            try {
                await instance.stop();
                
                delete (context.app as any).__jobsPlugin;
                
                await context.storage.set('last_disabled', new Date().toISOString());
                
                context.logger.info('[Jobs Plugin] Disabled successfully');
            } catch (error) {
                context.logger.error('[Jobs Plugin] Error during disable:', error);
                throw error;
            }
        }) as any,

        /**
         * Called when the plugin is uninstalled
         */
        onUninstall: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Jobs Plugin] Uninstalling...');
            
            try {
                await instance.stop();
                
                await context.storage.delete('install_date');
                await context.storage.delete('last_disabled');
                await context.storage.delete('config');
                
                context.logger.warn('[Jobs Plugin] Uninstalled - Job data preserved');
            } catch (error) {
                context.logger.error('[Jobs Plugin] Error during uninstall:', error);
                throw error;
            }
        }) as any,
    };
};

/**
 * Default plugin instance with default configuration
 */
export const JobsPlugin: PluginDefinition = createJobsPlugin();

/**
 * Helper function to access the jobs API
 */
export function getJobsAPI(app: any): JobsPluginInstance | null {
    return app.__jobsPlugin || null;
}
