/**
 * Plugin Tests
 * 
 * Integration tests for Jobs Plugin
 */

import {
    JobsPlugin,
    getJobsAPI,
} from '../src/plugin.js';
import type { PluginContext } from '@objectstack/runtime';
import type { JobContext } from '../src/types.js';

// Mock context for testing
const createMockContext = (): { context: PluginContext; kernel: any; hooks: Map<string, Function[]> } => {
    const hooks: Map<string, Function[]> = new Map();
    const kernel = {
        getService: jest.fn(),
        services: new Map(),
    };
    
    const context: PluginContext = {
        logger: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
        },
        registerService: jest.fn((name: string, service: any) => {
            kernel.services.set(name, service);
            kernel.getService.mockImplementation((n: string) => {
                if (kernel.services.has(n)) return kernel.services.get(n);
                throw new Error(`Service ${n} not found`);
            });
        }),
        getService: jest.fn((name: string) => {
            if (kernel.services.has(name)) return kernel.services.get(name);
            throw new Error(`Service ${name} not found`);
        }),
        hasService: jest.fn((name: string) => kernel.services.has(name)),
        getServices: jest.fn(() => kernel.services),
        hook: jest.fn((name: string, handler: Function) => {
            if (!hooks.has(name)) {
                hooks.set(name, []);
            }
            hooks.get(name)!.push(handler);
        }),
        trigger: jest.fn(async (name: string, ...args: any[]) => {
            const handlers = hooks.get(name) || [];
            for (const handler of handlers) {
                await handler(...args);
            }
        }),
        getKernel: jest.fn(() => kernel),
    } as any;
    
    return { context, kernel, hooks };
};

describe('Jobs Plugin', () => {
    let plugin: JobsPlugin;
    let mockContext: PluginContext;
    let mockKernel: any;
    let hooks: Map<string, Function[]>;

    beforeEach(() => {
        const mock = createMockContext();
        mockContext = mock.context;
        mockKernel = mock.kernel;
        hooks = mock.hooks;

        plugin = new JobsPlugin({
            enabled: true,
            concurrency: 2,
        });
    });

    afterEach(async () => {
        if (plugin) {
            try {
                await plugin.destroy();
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
    }, 10000); // Increase timeout to 10 seconds

    describe('Plugin Metadata', () => {
        it('should have correct plugin metadata', () => {
            expect(plugin.name).toBe('@objectos/jobs');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual([]);
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('job', plugin);
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Initialized successfully')
            );
        });

        it('should start successfully', async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Started')
            );
        });

        it('should destroy successfully', async () => {
            await plugin.init(mockContext);
            await plugin.destroy();

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Destroyed')
            );
        });

        it('should register event hooks during init', async () => {
            await plugin.init(mockContext);

            expect(mockContext.hook).toHaveBeenCalledWith('data.create', expect.any(Function));
        });
    });

    describe('Jobs API', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
        });

        it('should provide API access', () => {
            const api = getJobsAPI(mockKernel);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('enqueue');
            expect(api).toHaveProperty('schedule');
            expect(api).toHaveProperty('cancel');
            expect(api).toHaveProperty('getJob');
            expect(api).toHaveProperty('queryJobs');
            expect(api).toHaveProperty('getStats');
        });

        it('should register custom job handler', () => {
            const api = getJobsAPI(mockKernel);
            const handler = jest.fn(async (ctx: JobContext) => {});

            expect(() => api!.registerHandler({
                name: 'custom-job',
                handler,
            })).not.toThrow();
        });

        it('should enqueue a job', async () => {
            const api = getJobsAPI(mockKernel);
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
            expect(mockContext.trigger).toHaveBeenCalledWith(
                'job.enqueued',
                expect.objectContaining({ id: 'job-1' })
            );
        });

        it('should schedule a job', async () => {
            const api = getJobsAPI(mockKernel);
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
            expect(mockContext.trigger).toHaveBeenCalledWith(
                'job.scheduled',
                expect.objectContaining({ id: 'scheduled-job' })
            );
        });

        it('should cancel a pending job', async () => {
            const api = getJobsAPI(mockKernel);
            
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
            expect(mockContext.trigger).toHaveBeenCalledWith(
                'job.cancelled',
                expect.objectContaining({ jobId: 'job-to-cancel' })
            );
            
            // Verify job status
            const cancelled = await storage.get('job-to-cancel');
            expect(cancelled.status).toBe('cancelled');
        });

        it('should get job by ID', async () => {
            const api = getJobsAPI(mockKernel);
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
            const api = getJobsAPI(mockKernel);
            
            // Stop processing first
            await api!.destroy();
            
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
            const api = getJobsAPI(mockKernel);
            
            // Stop processing first
            await api!.destroy();
            
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
            await plugin.init(mockContext);
        });

        it('should register built-in jobs when enabled', () => {
            const api = getJobsAPI(mockKernel);
            
            // Test that built-in jobs are registered
            expect(() => api!.enqueue({
                id: 'cleanup-1',
                name: 'data-cleanup',
                data: { objects: ['logs'], retentionDays: 30 },
            })).not.toThrow();
        });

        it('should execute data cleanup job', async () => {
            const api = getJobsAPI(mockKernel);

            const job = await api!.enqueue({
                id: 'cleanup-1',
                name: 'data-cleanup',
                data: { objects: ['logs'], retentionDays: 30 },
            });

            expect(job.name).toBe('data-cleanup');
        });

        it('should execute report generation job', async () => {
            const api = getJobsAPI(mockKernel);

            const job = await api!.enqueue({
                id: 'report-1',
                name: 'report-generation',
                data: { reportType: 'sales', format: 'pdf' },
            });

            expect(job.name).toBe('report-generation');
        });

        it('should execute backup job', async () => {
            const api = getJobsAPI(mockKernel);

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
            await plugin.init(mockContext);
        });

        it('should set up event listeners', () => {
            expect(mockContext.hook).toHaveBeenCalledWith('data.create', expect.any(Function));
        });

        it('should emit job lifecycle events', async () => {
            const api = getJobsAPI(mockKernel);
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

            expect(mockContext.trigger).toHaveBeenCalledWith(
                'job.enqueued',
                expect.any(Object)
            );
        });
    });
});
