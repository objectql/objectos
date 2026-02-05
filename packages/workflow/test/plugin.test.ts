/**
 * Plugin Tests
 * 
 * Integration tests for Workflow Plugin
 */

import {
    WorkflowPlugin,
    getWorkflowAPI,
} from '../src/plugin.js';
import { InMemoryWorkflowStorage } from '../src/storage.js';
import type { PluginContext } from '@objectstack/runtime';
import type { WorkflowDefinition } from '../src/types.js';

describe('Workflow Plugin', () => {
    let plugin: WorkflowPlugin;
    let mockContext: PluginContext;
    let mockKernel: any;

    beforeEach(() => {
        mockKernel = {
            getService: vi.fn(),
            services: new Map(),
        };

        mockContext = {
            logger: {
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
                debug: vi.fn(),
            },
            registerService: vi.fn((name: string, service: any) => {
                mockKernel.services.set(name, service);
                mockKernel.getService.mockImplementation((n: string) => {
                    if (n === name) return service;
                    throw new Error(`Service ${n} not found`);
                });
            }),
            hook: vi.fn(),
            trigger: vi.fn(),
        } as any;

        plugin = new WorkflowPlugin({
            enabled: true,
            storage: new InMemoryWorkflowStorage(),
        });
    });

    describe('plugin lifecycle', () => {
        it('should initialize successfully', async () => {
            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('workflow', plugin);
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Initialized successfully')
            );
        });

        it('should start successfully', async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Started successfully')
            );
        });

        it('should destroy successfully', async () => {
            await plugin.init(mockContext);
            await plugin.destroy();

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Destroyed')
            );
        });
    });

    describe('event integration', () => {
        it('should set up event listeners using kernel hooks', async () => {
            await plugin.init(mockContext);

            expect(mockContext.hook).toHaveBeenCalledWith('data.afterCreate', expect.any(Function));
        });

        it('should trigger workflow events', async () => {
            await plugin.init(mockContext);

            // Simulate data.create event
            const hookCallback = (mockContext.hook as any).mock.calls[0][1];
            await hookCallback({ objectName: 'test', record: {} });

            expect(mockContext.trigger).toHaveBeenCalledWith(
                'workflow.trigger',
                expect.objectContaining({ type: 'data.create' })
            );
        });
    });

    describe('getWorkflowAPI', () => {
        it('should return workflow plugin after init', async () => {
            await plugin.init(mockContext);

            const api = getWorkflowAPI(mockKernel);

            expect(api).toBeDefined();
            expect(api?.getAPI).toBeDefined();
            expect(api?.getEngine).toBeDefined();
        });

        it('should return null when service not registered', () => {
            mockKernel.getService.mockImplementation(() => {
                throw new Error('Service not found');
            });

            const api = getWorkflowAPI(mockKernel);

            expect(api).toBeNull();
        });

        it('should provide workflow API methods', async () => {
            await plugin.init(mockContext);

            const workflowPlugin = getWorkflowAPI(mockKernel);
            const api = workflowPlugin?.getAPI();

            expect(api).toBeDefined();
            expect(typeof api?.registerWorkflow).toBe('function');
            expect(typeof api?.startWorkflow).toBe('function');
            expect(typeof api?.executeTransition).toBe('function');
            expect(typeof api?.abortWorkflow).toBe('function');
        });
    });

    describe('workflow registration and execution', () => {
        let definition: WorkflowDefinition;

        beforeEach(() => {
            definition = {
                id: 'test-workflow',
                name: 'Test Workflow',
                type: 'sequential',
                version: '1.0.0',
                initialState: 'draft',
                states: {
                    draft: {
                        name: 'draft',
                        initial: true,
                        transitions: {
                            submit: { target: 'approved' },
                        },
                    },
                    approved: {
                        name: 'approved',
                        final: true,
                    },
                },
            };
        });

        it('should register and execute a workflow', async () => {
            await plugin.init(mockContext);

            const workflowPlugin = getWorkflowAPI(mockKernel);
            const api = workflowPlugin!.getAPI();

            await api.registerWorkflow(definition);

            const instance = await api.startWorkflow('test-workflow');

            expect(instance.status).toBe('running');
            expect(instance.currentState).toBe('draft');
        });

        it('should execute transitions on workflow', async () => {
            await plugin.init(mockContext);

            const workflowPlugin = getWorkflowAPI(mockKernel);
            const api = workflowPlugin!.getAPI();

            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const updated = await api.executeTransition(instance.id, 'submit');

            expect(updated.status).toBe('completed');
            expect(updated.currentState).toBe('approved');
        });

        it('should provide access to workflow engine', async () => {
            await plugin.init(mockContext);

            const workflowPlugin = getWorkflowAPI(mockKernel);
            const engine = workflowPlugin!.getEngine();

            expect(engine).toBeDefined();
            expect(typeof engine.registerGuard).toBe('function');
            expect(typeof engine.registerAction).toBe('function');
        });
    });

    describe('plugin configuration', () => {
        it('should accept custom configuration', async () => {
            const customPlugin = new WorkflowPlugin({
                enabled: true,
                defaultTimeout: 5000,
                maxTransitions: 500,
            });

            await customPlugin.init(mockContext);

            const workflowPlugin = getWorkflowAPI(mockKernel);
            expect(workflowPlugin).toBeDefined();
        });

        it('should use default configuration when not provided', async () => {
            const defaultPlugin = new WorkflowPlugin();

            await defaultPlugin.init(mockContext);

            const workflowPlugin = getWorkflowAPI(mockKernel);
            expect(workflowPlugin).toBeDefined();
        });
    });
});
