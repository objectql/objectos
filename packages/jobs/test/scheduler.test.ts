/**
 * Scheduler Tests
 * 
 * Tests for JobScheduler
 */

import { JobScheduler } from '../src/scheduler.js';
import { JobQueue } from '../src/queue.js';
import { InMemoryJobStorage } from '../src/storage.js';
import type { JobContext } from '../src/types.js';

describe('JobScheduler', () => {
    let scheduler: JobScheduler;
    let queue: JobQueue;
    let storage: InMemoryJobStorage;

    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        storage = new InMemoryJobStorage();
        queue = new JobQueue({
            storage,
            logger: mockLogger,
        });
        scheduler = new JobScheduler({
            storage,
            queue,
            logger: mockLogger,
        });
    });

    afterEach(() => {
        scheduler.stop();
    });

    describe('scheduleJob', () => {
        it('should schedule a job with cron expression', async () => {
            const job = await scheduler.scheduleJob({
                id: 'daily-job',
                name: 'test-job',
                cronExpression: '0 0 * * *', // Daily at midnight
                data: {},
            });

            expect(job.id).toBe('daily-job');
            expect(job.status).toBe('scheduled');
            expect(job.cronExpression).toBe('0 0 * * *');
            expect(job.nextRun).toBeInstanceOf(Date);
        });

        it('should throw error for missing cron expression', async () => {
            await expect(scheduler.scheduleJob({
                id: 'job-1',
                name: 'test-job',
                data: {},
            })).rejects.toThrow('Cron expression is required');
        });

        it('should throw error for invalid cron expression', async () => {
            await expect(scheduler.scheduleJob({
                id: 'job-1',
                name: 'test-job',
                cronExpression: 'invalid',
                data: {},
            })).rejects.toThrow('Invalid cron expression');
        });
    });

    describe('unscheduleJob', () => {
        it('should unschedule a scheduled job', async () => {
            await scheduler.scheduleJob({
                id: 'daily-job',
                name: 'test-job',
                cronExpression: '0 0 * * *',
                data: {},
            });

            await scheduler.unscheduleJob('daily-job');

            const job = await storage.get('daily-job');
            expect(job?.status).toBe('cancelled');
        });

        it('should throw error for non-existent job', async () => {
            await expect(scheduler.unscheduleJob('non-existent'))
                .rejects.toThrow('Job non-existent not found');
        });

        it('should throw error for non-scheduled job', async () => {
            const handler = jest.fn(async (ctx: JobContext) => {});
            queue.registerHandler({ name: 'test-job', handler });

            await queue.enqueue({
                id: 'job-1',
                name: 'test-job',
                data: {},
            });

            await expect(scheduler.unscheduleJob('job-1'))
                .rejects.toThrow('Job job-1 is not scheduled');
        });
    });

    describe('start and stop', () => {
        it('should start the scheduler', () => {
            scheduler.start();
            expect(mockLogger.info).toHaveBeenCalledWith('[Scheduler] Started');
        });

        it('should stop the scheduler', () => {
            scheduler.start();
            scheduler.stop();
            expect(mockLogger.info).toHaveBeenCalledWith('[Scheduler] Stopped');
        });

        it('should not start twice', () => {
            scheduler.start();
            mockLogger.info.mockClear();
            scheduler.start();
            expect(mockLogger.info).not.toHaveBeenCalled();
        });
    });

    describe('scheduled job execution', () => {
        it('should execute job when due', async () => {
            const handler = jest.fn(async (ctx: JobContext) => {
                return { executed: true };
            });

            queue.registerHandler({
                name: 'test-job',
                handler,
            });

            // Schedule job to run every second
            await scheduler.scheduleJob({
                id: 'frequent-job',
                name: 'test-job',
                cronExpression: '* * * * * *', // Every second
                data: { test: 'data' },
            });

            scheduler.start();

            // Wait for job to execute
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Handler should be called at least once
            expect(handler).toHaveBeenCalled();

            scheduler.stop();
        });

        it('should update nextRun after execution', async () => {
            const handler = jest.fn(async (ctx: JobContext) => {});

            queue.registerHandler({
                name: 'test-job',
                handler,
            });

            const job = await scheduler.scheduleJob({
                id: 'test-job',
                name: 'test-job',
                cronExpression: '* * * * * *', // Every second
                data: {},
            });

            const originalNextRun = job.nextRun;
            
            scheduler.start();

            // Wait for execution
            await new Promise(resolve => setTimeout(resolve, 2000));

            const updated = await storage.get('test-job');
            expect(updated?.nextRun?.getTime()).toBeGreaterThan(originalNextRun!.getTime());

            scheduler.stop();
        });
    });

    describe('getScheduledJobs', () => {
        it('should return all scheduled jobs', async () => {
            await scheduler.scheduleJob({
                id: 'job-1',
                name: 'test-job',
                cronExpression: '0 0 * * *',
                data: {},
            });

            await scheduler.scheduleJob({
                id: 'job-2',
                name: 'test-job',
                cronExpression: '0 12 * * *',
                data: {},
            });

            const jobs = await scheduler.getScheduledJobs();
            expect(jobs).toHaveLength(2);
            expect(jobs.every(j => j.status === 'scheduled')).toBe(true);
        });
    });

    describe('updateSchedule', () => {
        it('should update job cron expression', async () => {
            await scheduler.scheduleJob({
                id: 'job-1',
                name: 'test-job',
                cronExpression: '0 0 * * *',
                data: {},
            });

            await scheduler.updateSchedule('job-1', '0 12 * * *');

            const job = await storage.get('job-1');
            expect(job?.cronExpression).toBe('0 12 * * *');
        });

        it('should throw error for invalid cron expression', async () => {
            await scheduler.scheduleJob({
                id: 'job-1',
                name: 'test-job',
                cronExpression: '0 0 * * *',
                data: {},
            });

            await expect(scheduler.updateSchedule('job-1', 'invalid'))
                .rejects.toThrow('Invalid cron expression');
        });

        it('should throw error for non-scheduled job', async () => {
            await expect(scheduler.updateSchedule('non-existent', '0 0 * * *'))
                .rejects.toThrow('Job non-existent not found');
        });
    });

    describe('cron expression parsing', () => {
        it('should correctly parse daily cron', async () => {
            const job = await scheduler.scheduleJob({
                id: 'daily-job',
                name: 'test-job',
                cronExpression: '0 0 * * *', // Daily at midnight
                data: {},
            });

            expect(job.nextRun).toBeInstanceOf(Date);
            expect(job.nextRun!.getHours()).toBe(0);
            expect(job.nextRun!.getMinutes()).toBe(0);
        });

        it('should correctly parse hourly cron', async () => {
            const job = await scheduler.scheduleJob({
                id: 'hourly-job',
                name: 'test-job',
                cronExpression: '0 * * * *', // Every hour
                data: {},
            });

            expect(job.nextRun).toBeInstanceOf(Date);
            expect(job.nextRun!.getMinutes()).toBe(0);
        });

        it('should correctly parse weekly cron', async () => {
            const job = await scheduler.scheduleJob({
                id: 'weekly-job',
                name: 'test-job',
                cronExpression: '0 0 * * 0', // Weekly on Sunday
                data: {},
            });

            expect(job.nextRun).toBeInstanceOf(Date);
            expect(job.nextRun!.getDay()).toBe(0); // Sunday
        });
    });
});
