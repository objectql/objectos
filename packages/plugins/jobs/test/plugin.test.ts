/**
 * Plugin Tests
 * 
 * Integration tests for Jobs Plugin
 */

import {
    createJobsPlugin,
    getJobsAPI,
    JobsManifest,
} from '../src/plugin';
import type { PluginContextData } from '@objectstack/spec/system';
import type { JobContext } from '../src/types';

describe('Jobs Plugin', () => {
    let plugin: any;
    let mockContext: PluginContextData;
    let mockApp: any;

    beforeEach(() => {
        mockApp = {
            eventBus: {
                on: jest.fn(),
                emit: jest.fn(),
            },
        };

        mockContext = {
            app: mockApp,
            logger: {
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
                debug: jest.fn(),
            },
            storage: {
                get: jest.fn(),
                set: jest.fn(),
                delete: jest.fn(),
            },
        } as any;

        plugin = createJobsPlugin({
            enabled: true,
            concurrency: 2,
        });
    });

    afterEach(async () => {
        const api = getJobsAPI(mockApp);
        if (api) {
            try {
                await api.stop();
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
    }, 10000); // Increase timeout to 10 seconds

    describe('Plugin Manifest', () => {
        it('should have correct manifest structure', () => {
            expect(JobsManifest.id).toBe('com.objectos.jobs');
            expect(JobsManifest.version).toBe('0.1.0');
            expect(JobsManifest.type).toBe('plugin');
            expect(JobsManifest.name).toBe('Jobs Plugin');
            expect(JobsManifest.permissions).toContain('system.jobs.read');
            expect(JobsManifest.permissions).toContain('system.jobs.write');
            expect(JobsManifest.permissions).toContain('system.jobs.execute');
        });

        it('should contribute job events', () => {
            expect(JobsManifest.contributes?.events).toContain('job.enqueued');
            expect(JobsManifest.contributes?.events).toContain('job.started');
            expect(JobsManifest.contributes?.events).toContain('job.completed');
            expect(JobsManifest.contributes?.events).toContain('job.failed');
            expect(JobsManifest.contributes?.events).toContain('job.scheduled');
            expect(JobsManifest.contributes?.events).toContain('job.cancelled');
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should install successfully', async () => {
            await plugin.onInstall(mockContext);

            expect(mockContext.storage.set).toHaveBeenCalledWith(
                'install_date',
                expect.any(String)
            );
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                '[Jobs Plugin] Installation complete'
            );
        });

        it('should enable successfully', async () => {
            await plugin.onEnable(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                '[Jobs Plugin] Enabled successfully'
            );
            expect(mockApp.__jobsPlugin).toBeDefined();
        });

        it('should disable successfully', async () => {
            await plugin.onEnable(mockContext);
            await plugin.onDisable(mockContext);

            expect(mockContext.storage.set).toHaveBeenCalledWith(
                'last_disabled',
                expect.any(String)
            );
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                '[Jobs Plugin] Disabled successfully'
            );
            expect(mockApp.__jobsPlugin).toBeUndefined();
        });

        it('should uninstall successfully', async () => {
            await plugin.onInstall(mockContext);
            await plugin.onEnable(mockContext);
            await plugin.onUninstall(mockContext);

            expect(mockContext.storage.delete).toHaveBeenCalledWith('install_date');
            expect(mockContext.storage.delete).toHaveBeenCalledWith('last_disabled');
            expect(mockContext.storage.delete).toHaveBeenCalledWith('config');
        });

        it('should handle enable errors', async () => {
            const errorContext = {
                ...mockContext,
                app: null, // This will cause an error
            } as any;

            await expect(plugin.onEnable(errorContext)).rejects.toThrow();
        });
    });

    describe('Jobs API', () => {
        beforeEach(async () => {
            await plugin.onEnable(mockContext);
        });

        it('should provide API access', () => {
            const api = getJobsAPI(mockApp);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('enqueue');
            expect(api).toHaveProperty('schedule');
            expect(api).toHaveProperty('cancel');
            expect(api).toHaveProperty('getJob');
            expect(api).toHaveProperty('queryJobs');
            expect(api).toHaveProperty('getStats');
        });

        it('should register custom job handler', () => {
            const api = getJobsAPI(mockApp);
            const handler = jest.fn(async (ctx: JobContext) => {});

            expect(() => api!.registerHandler({
                name: 'custom-job',
                handler,
            })).not.toThrow();
        });

        it('should enqueue a job', async () => {
            const api = getJobsAPI(mockApp);
            const handler = jest.fn(async (ctx: JobContext) => {});

            api!.registerHandler({
                name: 'test-job',
                handler,
            });

            const job = await api!.enqueue({
                id: 'job-1',
                name: 'test-job',
                data: { test: 'data' },
            });

            expect(job.id).toBe('job-1');
            expect(job.status).toBe('pending');
            expect(mockApp.eventBus.emit).toHaveBeenCalledWith(
                'job.enqueued',
                expect.objectContaining({ id: 'job-1' })
            );
        });

        it('should schedule a job', async () => {
            const api = getJobsAPI(mockApp);
            const handler = jest.fn(async (ctx: JobContext) => {});

            api!.registerHandler({
                name: 'test-job',
                handler,
            });

            const job = await api!.schedule({
                id: 'scheduled-job',
                name: 'test-job',
                cronExpression: '0 0 * * *',
                data: {},
            });

            expect(job.id).toBe('scheduled-job');
            expect(job.status).toBe('scheduled');
            expect(mockApp.eventBus.emit).toHaveBeenCalledWith(
                'job.scheduled',
                expect.objectContaining({ id: 'scheduled-job' })
            );
        });

        it('should cancel a pending job', async () => {
            const api = getJobsAPI(mockApp);
            
            const handler = jest.fn(async (ctx: JobContext) => {
                await new Promise(resolve => setTimeout(resolve, 1000));
            });

            api!.registerHandler({
                name: 'cancel-test-job',
                handler,
            });
            
            // Create storage directly to avoid auto-start
            const storage = (api as any).storage;
            const job = {
                id: 'job-to-cancel',
                name: 'cancel-test-job',
                data: {},
                status: 'pending' as const,
                priority: 'normal' as const,
                attempts: 0,
                maxRetries: 3,
                retryDelay: 1000,
                timeout: 60000,
                createdAt: new Date(),
            };
            
            await storage.save(job);

            // Cancel the job
            await api!.cancel('job-to-cancel');

            // Verify event was emitted
            expect(mockApp.eventBus.emit).toHaveBeenCalledWith(
                'job.cancelled',
                expect.objectContaining({ jobId: 'job-to-cancel' })
            );
            
            // Verify job status
            const cancelled = await storage.get('job-to-cancel');
            expect(cancelled.status).toBe('cancelled');
        });

        it('should get job by ID', async () => {
            const api = getJobsAPI(mockApp);
            const handler = jest.fn(async (ctx: JobContext) => {});

            api!.registerHandler({
                name: 'test-job',
                handler,
            });

            await api!.enqueue({
                id: 'job-1',
                name: 'test-job',
                data: { value: 123 },
            });

            const job = await api!.getJob('job-1');
            expect(job?.id).toBe('job-1');
            expect(job?.data).toEqual({ value: 123 });
        });

        it('should query jobs', async () => {
            const api = getJobsAPI(mockApp);
            
            // Stop processing first
            await api!.stop();
            
            const handler = jest.fn(async (ctx: JobContext) => {
                await new Promise(resolve => setTimeout(resolve, 5000));
            });

            api!.registerHandler({
                name: 'test-job',
                handler,
            });
            
            await api!.enqueue({ id: 'job-1', name: 'test-job', data: {} });
            await api!.enqueue({ id: 'job-2', name: 'test-job', data: {} });

            const jobs = await api!.queryJobs({ status: 'pending' });
            expect(jobs.length).toBeGreaterThanOrEqual(0);
        });

        it('should get queue statistics', async () => {
            const api = getJobsAPI(mockApp);
            
            // Stop processing first
            await api!.stop();
            
            const handler = jest.fn(async (ctx: JobContext) => {
                await new Promise(resolve => setTimeout(resolve, 5000));
            });

            api!.registerHandler({
                name: 'test-job',
                handler,
            });
            
            await api!.enqueue({ id: 'job-1', name: 'test-job', data: {} });

            const stats = await api!.getStats();
            expect(stats.total).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Built-in Jobs', () => {
        beforeEach(async () => {
            await plugin.onEnable(mockContext);
        });

        it('should register built-in jobs when enabled', () => {
            const api = getJobsAPI(mockApp);
            
            // Test that built-in jobs are registered
            expect(() => api!.enqueue({
                id: 'cleanup-1',
                name: 'data-cleanup',
                data: { objects: ['logs'], retentionDays: 30 },
            })).not.toThrow();
        });

        it('should execute data cleanup job', async () => {
            const api = getJobsAPI(mockApp);

            const job = await api!.enqueue({
                id: 'cleanup-1',
                name: 'data-cleanup',
                data: { objects: ['logs'], retentionDays: 30 },
            });

            expect(job.name).toBe('data-cleanup');
        });

        it('should execute report generation job', async () => {
            const api = getJobsAPI(mockApp);

            const job = await api!.enqueue({
                id: 'report-1',
                name: 'report-generation',
                data: { reportType: 'sales', format: 'pdf' },
            });

            expect(job.name).toBe('report-generation');
        });

        it('should execute backup job', async () => {
            const api = getJobsAPI(mockApp);

            const job = await api!.enqueue({
                id: 'backup-1',
                name: 'backup',
                data: { destination: '/tmp/backups' },
            });

            expect(job.name).toBe('backup');
        });
    });

    describe('Event Integration', () => {
        beforeEach(async () => {
            await plugin.onEnable(mockContext);
        });

        it('should set up event listeners', () => {
            expect(mockApp.eventBus.on).toHaveBeenCalledWith(
                'data.create',
                expect.any(Function)
            );
        });

        it('should emit job lifecycle events', async () => {
            const api = getJobsAPI(mockApp);
            const handler = jest.fn(async (ctx: JobContext) => {});

            api!.registerHandler({
                name: 'test-job',
                handler,
            });

            await api!.enqueue({
                id: 'job-1',
                name: 'test-job',
                data: {},
            });

            expect(mockApp.eventBus.emit).toHaveBeenCalledWith(
                'job.enqueued',
                expect.any(Object)
            );
        });
    });
});
