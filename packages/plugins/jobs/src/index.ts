/**
 * @objectos/plugin-jobs
 * 
 * Job queue and scheduling plugin for ObjectOS
 * 
 * Features:
 * - Background job processing with concurrent worker support
 * - Cron-based job scheduling
 * - Automatic retry logic with exponential backoff
 * - Job monitoring and statistics
 * - Built-in jobs for common tasks
 * 
 * @example
 * ```typescript
 * import { JobsPlugin, createJobsPlugin } from '@objectos/plugin-jobs';
 * 
 * // Use default plugin
 * const os = new ObjectOS({
 *   plugins: [JobsPlugin]
 * });
 * 
 * // Or create with custom configuration
 * const customJobsPlugin = createJobsPlugin({
 *   enabled: true,
 *   concurrency: 10,
 *   defaultMaxRetries: 3,
 *   enableBuiltInJobs: true
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Register a custom job handler
 * import { getJobsAPI } from '@objectos/plugin-jobs';
 * 
 * const jobsAPI = getJobsAPI(app);
 * 
 * jobsAPI.registerHandler({
 *   name: 'send-email',
 *   handler: async (context) => {
 *     const { to, subject, body } = context.data;
 *     // Send email logic
 *     context.logger.info(`Sent email to ${to}`);
 *   }
 * });
 * 
 * // Enqueue a job
 * await jobsAPI.enqueue({
 *   id: 'email-123',
 *   name: 'send-email',
 *   data: { to: 'user@example.com', subject: 'Hello', body: 'World' }
 * });
 * 
 * // Schedule a recurring job
 * await jobsAPI.schedule({
 *   id: 'daily-cleanup',
 *   name: 'data-cleanup',
 *   cronExpression: '0 0 * * *', // Daily at midnight
 *   data: { objects: ['logs'], retentionDays: 30 }
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Query jobs and get statistics
 * const pendingJobs = await jobsAPI.queryJobs({ status: 'pending' });
 * const stats = await jobsAPI.getStats();
 * console.log(`Total jobs: ${stats.total}, Pending: ${stats.pending}`);
 * ```
 */

export {
    JobsPlugin,
    JobsManifest,
    createJobsPlugin,
    getJobsAPI,
} from './plugin';

export {
    InMemoryJobStorage,
} from './storage';

export {
    JobQueue,
} from './queue';

export {
    JobScheduler,
} from './scheduler';

export {
    createDataCleanupJob,
    createReportJob,
    createBackupJob,
    builtInJobs,
} from './built-in-jobs';

export type {
    Job,
    JobConfig,
    JobContext,
    JobDefinition,
    JobHandler,
    JobPluginConfig,
    JobPriority,
    JobQueryOptions,
    JobQueueStats,
    JobStatus,
    JobStorage,
    DataCleanupJobConfig,
    ReportJobConfig,
    BackupJobConfig,
} from './types';
