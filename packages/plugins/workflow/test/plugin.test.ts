/**
 * Plugin Tests
 * 
 * Integration tests for Workflow Plugin
 */

import {
    createWorkflowPlugin,
    getWorkflowAPI,
    WorkflowManifest,
} from '../src/plugin';
import type { PluginContextData } from '@objectstack/spec/system';
import type { WorkflowDefinition } from '../src/types';

describe('Workflow Plugin', () => {
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

        plugin = createWorkflowPlugin({
            enabled: true,
        });
    });

    describe('plugin lifecycle', () => {
        it('should install successfully', async () => {
            await plugin.onInstall(mockContext);

            expect(mockContext.storage.set).toHaveBeenCalledWith(
                'install_date',
                expect.any(String)
            );
            expect(mockContext.storage.set).toHaveBeenCalledWith(
                'config',
                expect.any(String)
            );
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Installation complete')
            );
        });

        it('should enable successfully', async () => {
            await plugin.onEnable(mockContext);

            expect(mockApp.__workflowPlugin).toBeDefined();
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Enabled successfully')
            );
        });

        it('should disable successfully', async () => {
            await plugin.onEnable(mockContext);
            await plugin.onDisable(mockContext);

            expect(mockApp.__workflowPlugin).toBeUndefined();
            expect(mockContext.storage.set).toHaveBeenCalledWith(
                'last_disabled',
                expect.any(String)
            );
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Disabled successfully')
            );
        });

        it('should uninstall successfully', async () => {
            await plugin.onInstall(mockContext);
            await plugin.onEnable(mockContext);
            await plugin.onUninstall(mockContext);

            expect(mockContext.storage.delete).toHaveBeenCalledWith('install_date');
            expect(mockContext.storage.delete).toHaveBeenCalledWith('last_disabled');
            expect(mockContext.storage.delete).toHaveBeenCalledWith('config');
            expect(mockContext.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Workflow data preserved')
            );
        });

        it('should handle enable errors gracefully', async () => {
            const errorContext = {
                ...mockContext,
                app: null, // This will cause an error
            };

            await expect(plugin.onEnable(errorContext as any))
                .rejects.toThrow();

            expect(errorContext.logger.error).toHaveBeenCalled();
        });

        it('should handle disable errors gracefully', async () => {
            // Setup by enabling first
            await plugin.onEnable(mockContext);
            
            // Force an error by making storage.set throw
            mockContext.storage.set = jest.fn().mockRejectedValue(new Error('Storage error'));

            await expect(plugin.onDisable(mockContext))
                .rejects.toThrow();

            expect(mockContext.logger.error).toHaveBeenCalled();
        });

        it('should handle uninstall errors gracefully', async () => {
            await plugin.onEnable(mockContext);
            
            // Force an error
            mockContext.storage.delete = jest.fn().mockRejectedValue(new Error('Delete error'));

            await expect(plugin.onUninstall(mockContext))
                .rejects.toThrow();

            expect(mockContext.logger.error).toHaveBeenCalled();
        });
    });

    describe('event integration', () => {
        it('should set up event listeners when event bus is available', async () => {
            await plugin.onEnable(mockContext);

            expect(mockApp.eventBus.on).toHaveBeenCalled();
        });

        it('should handle missing event bus gracefully', async () => {
            const contextWithoutEventBus = {
                ...mockContext,
                app: {},
            };

            await expect(plugin.onEnable(contextWithoutEventBus))
                .resolves.not.toThrow();
        });

        it('should emit events when event bus is available', async () => {
            await plugin.onEnable(mockContext);

            // Get the plugin instance and register a workflow
            const workflowPlugin = getWorkflowAPI(mockApp);
            expect(workflowPlugin).toBeDefined();
        });
    });

    describe('getWorkflowAPI', () => {
        it('should return workflow API after enable', async () => {
            await plugin.onEnable(mockContext);

            const api = getWorkflowAPI(mockApp);

            expect(api).toBeDefined();
            expect(api?.getAPI).toBeDefined();
            expect(api?.getEngine).toBeDefined();
        });

        it('should return null when plugin not enabled', () => {
            const api = getWorkflowAPI(mockApp);

            expect(api).toBeNull();
        });

        it('should provide workflow API methods', async () => {
            await plugin.onEnable(mockContext);

            const workflowPlugin = getWorkflowAPI(mockApp);
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
            await plugin.onEnable(mockContext);

            const workflowPlugin = getWorkflowAPI(mockApp);
            const api = workflowPlugin!.getAPI();

            await api.registerWorkflow(definition);

            const instance = await api.startWorkflow('test-workflow');

            expect(instance.status).toBe('running');
            expect(instance.currentState).toBe('draft');
        });

        it('should execute transitions on workflow', async () => {
            await plugin.onEnable(mockContext);

            const workflowPlugin = getWorkflowAPI(mockApp);
            const api = workflowPlugin!.getAPI();

            await api.registerWorkflow(definition);
            const instance = await api.startWorkflow('test-workflow');

            const updated = await api.executeTransition(instance.id, 'submit');

            expect(updated.status).toBe('completed');
            expect(updated.currentState).toBe('approved');
        });

        it('should provide access to workflow engine', async () => {
            await plugin.onEnable(mockContext);

            const workflowPlugin = getWorkflowAPI(mockApp);
            const engine = workflowPlugin!.getEngine();

            expect(engine).toBeDefined();
            expect(typeof engine.registerGuard).toBe('function');
            expect(typeof engine.registerAction).toBe('function');
        });
    });

    describe('WorkflowManifest', () => {
        it('should have correct manifest structure', () => {
            expect(WorkflowManifest.id).toBe('com.objectos.workflow');
            expect(WorkflowManifest.version).toBe('0.1.0');
            expect(WorkflowManifest.type).toBe('plugin');
            expect(WorkflowManifest.name).toBe('Workflow Plugin');
        });

        it('should declare necessary permissions', () => {
            expect(WorkflowManifest.permissions).toContain('system.workflow.read');
            expect(WorkflowManifest.permissions).toContain('system.workflow.write');
            expect(WorkflowManifest.permissions).toContain('system.workflow.execute');
        });

        it('should declare workflow events', () => {
            expect(WorkflowManifest.contributes?.events).toContain('workflow.started');
            expect(WorkflowManifest.contributes?.events).toContain('workflow.completed');
            expect(WorkflowManifest.contributes?.events).toContain('workflow.failed');
            expect(WorkflowManifest.contributes?.events).toContain('workflow.aborted');
            expect(WorkflowManifest.contributes?.events).toContain('workflow.transition');
            expect(WorkflowManifest.contributes?.events).toContain('workflow.task.created');
            expect(WorkflowManifest.contributes?.events).toContain('workflow.task.completed');
        });
    });

    describe('plugin configuration', () => {
        it('should accept custom configuration', async () => {
            const customPlugin = createWorkflowPlugin({
                enabled: true,
                defaultTimeout: 5000,
                maxTransitions: 500,
            });

            await customPlugin.onEnable!(mockContext);

            const workflowPlugin = getWorkflowAPI(mockApp);
            expect(workflowPlugin).toBeDefined();
        });

        it('should use default configuration when not provided', async () => {
            const defaultPlugin = createWorkflowPlugin();

            await defaultPlugin.onEnable!(mockContext);

            const workflowPlugin = getWorkflowAPI(mockApp);
            expect(workflowPlugin).toBeDefined();
        });
    });
});
