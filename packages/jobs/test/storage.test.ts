/**
 * Storage Tests
 * 
 * Tests for InMemoryJobStorage
 */

import { InMemoryJobStorage } from '../src/storage.js';
import type { Job } from '../src/types.js';

describe('InMemoryJobStorage', () => {
    let storage: InMemoryJobStorage;

    beforeEach(() => {
        storage = new InMemoryJobStorage();
    });

    describe('save and get', () => {
        it('should save and retrieve a job', async () => {
            const job: Job = {
                id: 'job-1',
                name: 'test-job',
                data: { foo: 'bar' },
                status: 'pending',
                priority: 'normal',
                attempts: 0,
                maxRetries: 3,
                retryDelay: 1000,
                timeout: 60000,
                createdAt: new Date(),
            };

            await storage.save(job);
            const retrieved = await storage.get('job-1');

            expect(retrieved).toEqual(job);
        });

        it('should return null for non-existent job', async () => {
            const result = await storage.get('non-existent');
            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a job', async () => {
            const job: Job = {
                id: 'job-1',
                name: 'test-job',
                data: {},
                status: 'pending',
                priority: 'normal',
                attempts: 0,
                maxRetries: 3,
                retryDelay: 1000,
                timeout: 60000,
                createdAt: new Date(),
            };

            await storage.save(job);
            await storage.update('job-1', { status: 'running', attempts: 1 });

            const updated = await storage.get('job-1');
            expect(updated?.status).toBe('running');
            expect(updated?.attempts).toBe(1);
        });

        it('should throw error for non-existent job', async () => {
            await expect(storage.update('non-existent', { status: 'running' }))
                .rejects.toThrow('Job non-existent not found');
        });
    });

    describe('delete', () => {
        it('should delete a job', async () => {
            const job: Job = {
                id: 'job-1',
                name: 'test-job',
                data: {},
                status: 'pending',
                priority: 'normal',
                attempts: 0,
                maxRetries: 3,
                retryDelay: 1000,
                timeout: 60000,
                createdAt: new Date(),
            };

            await storage.save(job);
            await storage.delete('job-1');

            const result = await storage.get('job-1');
            expect(result).toBeNull();
        });
    });

    describe('query', () => {
        beforeEach(async () => {
            const jobs: Job[] = [
                {
                    id: 'job-1',
                    name: 'job-a',
                    data: {},
                    status: 'pending',
                    priority: 'high',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-01'),
                },
                {
                    id: 'job-2',
                    name: 'job-b',
                    data: {},
                    status: 'running',
                    priority: 'normal',
                    attempts: 1,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-02'),
                },
                {
                    id: 'job-3',
                    name: 'job-a',
                    data: {},
                    status: 'completed',
                    priority: 'low',
                    attempts: 1,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-03'),
                },
            ];

            for (const job of jobs) {
                await storage.save(job);
            }
        });

        it('should query by name', async () => {
            const results = await storage.query({ name: 'job-a' });
            expect(results).toHaveLength(2);
            expect(results.every(j => j.name === 'job-a')).toBe(true);
        });

        it('should query by status', async () => {
            const results = await storage.query({ status: 'pending' });
            expect(results).toHaveLength(1);
            expect(results[0].status).toBe('pending');
        });

        it('should query by multiple statuses', async () => {
            const results = await storage.query({ status: ['pending', 'running'] });
            expect(results).toHaveLength(2);
        });

        it('should query by priority', async () => {
            const results = await storage.query({ priority: 'high' });
            expect(results).toHaveLength(1);
            expect(results[0].priority).toBe('high');
        });

        it('should limit results', async () => {
            const results = await storage.query({ limit: 2 });
            expect(results).toHaveLength(2);
        });

        it('should skip results', async () => {
            const results = await storage.query({ skip: 1, limit: 2 });
            expect(results).toHaveLength(2);
        });

        it('should sort by createdAt ascending', async () => {
            const results = await storage.query({ sortBy: 'createdAt', sortOrder: 'asc' });
            expect(results[0].id).toBe('job-1');
            expect(results[2].id).toBe('job-3');
        });

        it('should sort by createdAt descending', async () => {
            const results = await storage.query({ sortBy: 'createdAt', sortOrder: 'desc' });
            expect(results[0].id).toBe('job-3');
            expect(results[2].id).toBe('job-1');
        });

        it('should sort by priority', async () => {
            const results = await storage.query({ sortBy: 'priority', sortOrder: 'desc' });
            expect(results[0].priority).toBe('high');
            expect(results[2].priority).toBe('low');
        });
    });

    describe('getStats', () => {
        it('should return correct statistics', async () => {
            const jobs: Job[] = [
                {
                    id: 'job-1',
                    name: 'test',
                    data: {},
                    status: 'pending',
                    priority: 'normal',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date(),
                },
                {
                    id: 'job-2',
                    name: 'test',
                    data: {},
                    status: 'running',
                    priority: 'normal',
                    attempts: 1,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date(),
                },
                {
                    id: 'job-3',
                    name: 'test',
                    data: {},
                    status: 'completed',
                    priority: 'normal',
                    attempts: 1,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date(),
                },
                {
                    id: 'job-4',
                    name: 'test',
                    data: {},
                    status: 'failed',
                    priority: 'normal',
                    attempts: 4,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date(),
                },
            ];

            for (const job of jobs) {
                await storage.save(job);
            }

            const stats = await storage.getStats();
            expect(stats.total).toBe(4);
            expect(stats.pending).toBe(1);
            expect(stats.running).toBe(1);
            expect(stats.completed).toBe(1);
            expect(stats.failed).toBe(1);
        });
    });

    describe('getNextPending', () => {
        it('should return highest priority job', async () => {
            const jobs: Job[] = [
                {
                    id: 'job-1',
                    name: 'test',
                    data: {},
                    status: 'pending',
                    priority: 'normal',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-02'),
                },
                {
                    id: 'job-2',
                    name: 'test',
                    data: {},
                    status: 'pending',
                    priority: 'high',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-03'),
                },
                {
                    id: 'job-3',
                    name: 'test',
                    data: {},
                    status: 'pending',
                    priority: 'critical',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-01'),
                },
            ];

            for (const job of jobs) {
                await storage.save(job);
            }

            const next = await storage.getNextPending();
            expect(next?.id).toBe('job-3'); // Critical priority
        });

        it('should return oldest job when priorities are equal', async () => {
            const jobs: Job[] = [
                {
                    id: 'job-1',
                    name: 'test',
                    data: {},
                    status: 'pending',
                    priority: 'normal',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-02'),
                },
                {
                    id: 'job-2',
                    name: 'test',
                    data: {},
                    status: 'pending',
                    priority: 'normal',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: new Date('2026-01-01'),
                },
            ];

            for (const job of jobs) {
                await storage.save(job);
            }

            const next = await storage.getNextPending();
            expect(next?.id).toBe('job-2'); // Older creation date
        });

        it('should return null when no pending jobs', async () => {
            const next = await storage.getNextPending();
            expect(next).toBeNull();
        });
    });

    describe('getScheduledDue', () => {
        it('should return jobs that are due', async () => {
            const now = new Date();
            const past = new Date(now.getTime() - 10000);
            const future = new Date(now.getTime() + 10000);

            const jobs: Job[] = [
                {
                    id: 'job-1',
                    name: 'test',
                    data: {},
                    status: 'scheduled',
                    priority: 'normal',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: now,
                    nextRun: past,
                },
                {
                    id: 'job-2',
                    name: 'test',
                    data: {},
                    status: 'scheduled',
                    priority: 'normal',
                    attempts: 0,
                    maxRetries: 3,
                    retryDelay: 1000,
                    timeout: 60000,
                    createdAt: now,
                    nextRun: future,
                },
            ];

            for (const job of jobs) {
                await storage.save(job);
            }

            const due = await storage.getScheduledDue();
            expect(due).toHaveLength(1);
            expect(due[0].id).toBe('job-1');
        });
    });
});
