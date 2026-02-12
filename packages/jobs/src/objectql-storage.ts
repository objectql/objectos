/**
 * ObjectQL Job Storage Implementation
 * 
 * Storage adapter that persists jobs to ObjectOS/ObjectQL database
 */

import type { PluginContext } from '@objectstack/runtime';
import type {
    Job,
    JobStorage,
    JobQueryOptions,
    JobQueueStats,
    JobStatus,
} from './types.js';

export class ObjectQLJobStorage implements JobStorage {
    private context: PluginContext;

    constructor(context: PluginContext) {
        this.context = context;
    }

    async save(job: Job): Promise<void> {
        await (this.context as any).broker.call('data.create', {
            object: 'job',
            doc: this.mapJobToDoc(job)
        });
    }

    async get(id: string): Promise<Job | null> {
        try {
            const result = await (this.context as any).broker.call('data.get', {
                object: 'job',
                id: id
            });
            return result ? this.mapDocToJob(result) : null;
        } catch (err: any) {
            if (err.message && err.message.includes('not found')) return null;
            throw err;
        }
    }

    async update(id: string, updates: Partial<Job>): Promise<void> {
        const docUpdates: any = {};
        
        if (updates.name !== undefined) docUpdates.name = updates.name;
        if (updates.status !== undefined) docUpdates.status = updates.status;
        if (updates.priority !== undefined) docUpdates.priority = updates.priority;
        if (updates.data !== undefined) docUpdates.data = updates.data;
        if (updates.result !== undefined) docUpdates.result = updates.result;
        if (updates.error !== undefined) docUpdates.error = updates.error;
        if (updates.attempts !== undefined) docUpdates.attempts = updates.attempts;
        if (updates.maxRetries !== undefined) docUpdates.max_retries = updates.maxRetries;
        if (updates.retryDelay !== undefined) docUpdates.retry_delay = updates.retryDelay;
        if (updates.timeout !== undefined) docUpdates.timeout = updates.timeout;
        if (updates.nextRun !== undefined) docUpdates.next_run = updates.nextRun;
        if (updates.cronExpression !== undefined) docUpdates.cron_expression = updates.cronExpression;
        if (updates.startedAt !== undefined) docUpdates.started_at = updates.startedAt;
        if (updates.completedAt !== undefined) docUpdates.completed_at = updates.completedAt;
        if (updates.createdAt !== undefined) docUpdates.created_at = updates.createdAt;

        await (this.context as any).broker.call('data.update', {
            object: 'job',
            id: id,
            doc: docUpdates
        });
    }

    async delete(id: string): Promise<void> {
        await (this.context as any).broker.call('data.delete', {
            object: 'job',
            id: id
        });
    }

    async query(options: JobQueryOptions = {}): Promise<Job[]> {
        const query: any = {};

        // Filter by name
        if (options.name) {
            query.name = options.name;
        }

        // Filter by status
        if (options.status) {
            const statuses = Array.isArray(options.status) 
                ? options.status 
                : [options.status];
            query.status = { $in: statuses };
        }

        // Filter by priority
        if (options.priority) {
            query.priority = options.priority;
        }

        // Sort
        let sort = '-created_at'; // default
        if (options.sortBy) {
            const sortOrder = options.sortOrder === 'desc' ? '-' : '';
            const field = options.sortBy === 'createdAt' ? 'created_at' 
                        : options.sortBy === 'nextRun' ? 'next_run'
                        : options.sortBy === 'priority' ? 'priority'
                        : 'created_at';
            sort = `${sortOrder}${field}`;
        }

        const results = await (this.context as any).broker.call('data.find', {
            object: 'job',
            query: query,
            sort: sort,
            limit: options.limit,
            skip: options.skip,
        });

        return results.map((doc: any) => this.mapDocToJob(doc));
    }

    async getStats(): Promise<JobQueueStats> {
        const allJobs = await this.query({});
        
        const stats: JobQueueStats = {
            total: allJobs.length,
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
            scheduled: 0,
        };

        for (const job of allJobs) {
            switch (job.status) {
                case 'pending':
                    stats.pending++;
                    break;
                case 'running':
                    stats.running++;
                    break;
                case 'completed':
                    stats.completed++;
                    break;
                case 'failed':
                    stats.failed++;
                    break;
                case 'cancelled':
                    stats.cancelled++;
                    break;
                case 'scheduled':
                    stats.scheduled++;
                    break;
            }
        }

        return stats;
    }

    async getNextPending(): Promise<Job | null> {
        const pendingJobs = await this.query({ 
            status: 'pending',
            sortBy: 'priority',
            sortOrder: 'desc',
            limit: 1
        });
        
        return pendingJobs.length > 0 ? pendingJobs[0] : null;
    }

    async getScheduledDue(): Promise<Job[]> {
        const now = new Date();
        const allScheduled = await this.query({ status: 'scheduled' });
        
        return allScheduled.filter(job => 
            job.nextRun && job.nextRun <= now
        );
    }

    /**
     * Clear all jobs (for testing)
     */
    async clear(): Promise<void> {
        const allJobs = await this.query({});
        for (const job of allJobs) {
            await this.delete(job.id);
        }
    }

    /**
     * Get all jobs (for testing)
     */
    async getAll(): Promise<Job[]> {
        return this.query({});
    }

    /**
     * Map Job to document
     */
    private mapJobToDoc(job: Job): any {
        return {
            _id: job.id,
            id: job.id,
            name: job.name,
            status: job.status,
            priority: job.priority,
            data: job.data,
            result: job.result,
            error: job.error,
            attempts: job.attempts,
            max_retries: job.maxRetries,
            retry_delay: job.retryDelay,
            timeout: job.timeout,
            next_run: job.nextRun,
            cron_expression: job.cronExpression,
            started_at: job.startedAt,
            completed_at: job.completedAt,
            created_at: job.createdAt,
        };
    }

    /**
     * Map document to Job
     */
    private mapDocToJob(doc: any): Job {
        return {
            id: doc.id || doc._id,
            name: doc.name,
            status: doc.status,
            priority: doc.priority,
            data: doc.data,
            result: doc.result,
            error: doc.error,
            attempts: doc.attempts || 0,
            maxRetries: doc.max_retries || 3,
            retryDelay: doc.retry_delay || 1000,
            timeout: doc.timeout,
            nextRun: doc.next_run ? new Date(doc.next_run) : undefined,
            cronExpression: doc.cron_expression,
            startedAt: doc.started_at ? new Date(doc.started_at) : undefined,
            completedAt: doc.completed_at ? new Date(doc.completed_at) : undefined,
            createdAt: new Date(doc.created_at || Date.now()),
        } as Job;
    }
}
