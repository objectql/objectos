/**
 * Job Scheduler
 * 
 * Cron-based job scheduling implementation
 */

import CronParser from 'cron-parser';
const { parseExpression } = CronParser;
import type {
    Job,
    JobConfig,
    JobStorage,
} from './types.js';
import { JobQueue } from './queue.js';

export class JobScheduler {
    private storage: JobStorage;
    private queue: JobQueue;
    private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
    private running = false;
    private checkInterval: NodeJS.Timeout | null = null;
    private logger: any;

    constructor(options: {
        storage: JobStorage;
        queue: JobQueue;
        logger?: any;
    }) {
        this.storage = options.storage;
        this.queue = options.queue;
        this.logger = options.logger || console;
    }

    /**
     * Schedule a recurring job with cron expression
     */
    async scheduleJob(config: JobConfig): Promise<Job> {
        if (!config.cronExpression) {
            throw new Error('Cron expression is required for scheduled jobs');
        }

        // Validate cron expression
        try {
            parseExpression(config.cronExpression);
        } catch (error) {
            throw new Error(`Invalid cron expression: ${config.cronExpression}`);
        }

        // Calculate next run time
        const nextRun = this.getNextRunTime(config.cronExpression);

        const job: Job = {
            id: config.id,
            name: config.name,
            data: config.data || {},
            status: 'scheduled',
            priority: config.priority || 'normal',
            attempts: 0,
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 1000,
            timeout: config.timeout || 60000,
            cronExpression: config.cronExpression,
            nextRun,
            createdAt: new Date(),
        };

        await this.storage.save(job);
        this.logger.info(`[Scheduler] Scheduled job: ${job.id} (${job.name}) - Next run: ${nextRun.toISOString()}`);

        // Start scheduler if not running
        if (!this.running) {
            this.start();
        }

        return job;
    }

    /**
     * Unschedule a job
     */
    async unscheduleJob(jobId: string): Promise<void> {
        const job = await this.storage.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        if (job.status !== 'scheduled') {
            throw new Error(`Job ${jobId} is not scheduled`);
        }

        await this.storage.update(jobId, { status: 'cancelled' });
        this.logger.info(`[Scheduler] Unscheduled job: ${jobId}`);
    }

    /**
     * Start the scheduler
     */
    start(): void {
        if (this.running) {
            return;
        }

        this.running = true;
        this.logger.info('[Scheduler] Started');

        // Check for due jobs every second
        this.checkInterval = setInterval(() => {
            this.checkScheduledJobs().catch(error => {
                this.logger.error('[Scheduler] Check error:', error);
            });
        }, 1000);
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (!this.running) {
            return;
        }

        this.running = false;

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        // Clear all scheduled timers
        for (const timeout of this.scheduledJobs.values()) {
            clearTimeout(timeout);
        }
        this.scheduledJobs.clear();

        this.logger.info('[Scheduler] Stopped');
    }

    /**
     * Check for scheduled jobs that are due
     */
    private async checkScheduledJobs(): Promise<void> {
        try {
            const dueJobs = await this.storage.getScheduledDue();

            for (const job of dueJobs) {
                await this.executeScheduledJob(job);
            }
        } catch (error) {
            this.logger.error('[Scheduler] Error checking scheduled jobs:', error);
        }
    }

    /**
     * Execute a scheduled job
     */
    private async executeScheduledJob(job: Job): Promise<void> {
        this.logger.info(`[Scheduler] Executing scheduled job: ${job.id} (${job.name})`);

        try {
            // Create a new job instance for execution
            const executionJobId = `${job.id}_${Date.now()}`;
            await this.queue.enqueue({
                id: executionJobId,
                name: job.name,
                data: job.data,
                priority: job.priority,
                maxRetries: job.maxRetries,
                retryDelay: job.retryDelay,
                timeout: job.timeout,
            });

            // Update the scheduled job with next run time
            if (job.cronExpression) {
                const nextRun = this.getNextRunTime(job.cronExpression);
                await this.storage.update(job.id, { nextRun });
                this.logger.info(`[Scheduler] Next run for ${job.id}: ${nextRun.toISOString()}`);
            }
        } catch (error) {
            this.logger.error(`[Scheduler] Error executing scheduled job ${job.id}:`, error);
        }
    }

    /**
     * Calculate next run time from cron expression
     */
    private getNextRunTime(cronExpression: string): Date {
        const interval = parseExpression(cronExpression);
        return interval.next().toDate();
    }

    /**
     * Get all scheduled jobs
     */
    async getScheduledJobs(): Promise<Job[]> {
        return this.storage.query({ status: 'scheduled' });
    }

    /**
     * Update job schedule
     */
    async updateSchedule(jobId: string, cronExpression: string): Promise<void> {
        const job = await this.storage.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        if (job.status !== 'scheduled') {
            throw new Error(`Job ${jobId} is not scheduled`);
        }

        // Validate cron expression
        try {
            parseExpression(cronExpression);
        } catch (error) {
            throw new Error(`Invalid cron expression: ${cronExpression}`);
        }

        const nextRun = this.getNextRunTime(cronExpression);
        await this.storage.update(jobId, {
            cronExpression,
            nextRun,
        });

        this.logger.info(`[Scheduler] Updated schedule for ${jobId} - Next run: ${nextRun.toISOString()}`);
    }
}
