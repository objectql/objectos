/**
 * Plugin Tests
 * 
 * Integration tests for Automation Plugin
 */

import {
    createAutomationPlugin,
    getAutomationAPI,
    AutomationManifest,
} from '../src/plugin';
import type { PluginContextData } from '@objectstack/spec/system';
import type { AutomationRule, FormulaField } from '../src/types';

describe('Automation Plugin', () => {
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

        plugin = createAutomationPlugin({
            enabled: true,
            enableEmail: true,
            enableHttp: true,
            enableScriptExecution: true,
        });
    });

    afterEach(async () => {
        const api = getAutomationAPI(mockApp);
        if (api) {
            try {
                await api.shutdown();
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
    });

    describe('Plugin Manifest', () => {
        it('should have correct manifest structure', () => {
            expect(AutomationManifest.id).toBe('com.objectos.automation');
            expect(AutomationManifest.version).toBe('0.1.0');
            expect(AutomationManifest.type).toBe('plugin');
            expect(AutomationManifest.name).toBe('Automation Plugin');
            expect(AutomationManifest.permissions).toContain('system.automation.read');
            expect(AutomationManifest.permissions).toContain('system.automation.write');
            expect(AutomationManifest.permissions).toContain('system.automation.execute');
        });

        it('should contribute automation events', () => {
            expect(AutomationManifest.contributes?.events).toContain('automation.rule.created');
            expect(AutomationManifest.contributes?.events).toContain('automation.rule.executed');
            expect(AutomationManifest.contributes?.events).toContain('automation.rule.failed');
            expect(AutomationManifest.contributes?.events).toContain('automation.trigger.fired');
            expect(AutomationManifest.contributes?.events).toContain('automation.action.executed');
            expect(AutomationManifest.contributes?.events).toContain('automation.formula.calculated');
        });
    });

    describe('Plugin Lifecycle', () => {
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
                '[Automation Plugin] Installation complete'
            );
        });

        it('should enable successfully', async () => {
            await plugin.onEnable(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                '[Automation Plugin] Enabled successfully'
            );
            expect(mockApp.__automationPlugin).toBeDefined();
        });

        it('should disable successfully', async () => {
            await plugin.onEnable(mockContext);
            await plugin.onDisable(mockContext);

            expect(mockContext.storage.set).toHaveBeenCalledWith(
                'last_disabled',
                expect.any(String)
            );
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                '[Automation Plugin] Disabled successfully'
            );
            expect(mockApp.__automationPlugin).toBeUndefined();
        });

        it('should uninstall successfully', async () => {
            await plugin.onInstall(mockContext);
            await plugin.onEnable(mockContext);
            await plugin.onUninstall(mockContext);

            expect(mockContext.storage.delete).toHaveBeenCalledWith('install_date');
            expect(mockContext.storage.delete).toHaveBeenCalledWith('last_disabled');
            expect(mockContext.storage.delete).toHaveBeenCalledWith('config');
            expect(mockContext.logger.warn).toHaveBeenCalledWith(
                expect.stringContaining('Uninstalled - Automation data preserved')
            );
        });

        it('should handle enable errors', async () => {
            const errorContext = {
                ...mockContext,
                app: null,
            } as any;

            await expect(plugin.onEnable(errorContext)).rejects.toThrow();
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
            expect(mockApp.eventBus.on).toHaveBeenCalledWith(
                'data.update',
                expect.any(Function)
            );
            expect(mockApp.eventBus.on).toHaveBeenCalledWith(
                'data.delete',
                expect.any(Function)
            );
        });

        it('should emit trigger fired event', async () => {
            const api = getAutomationAPI(mockApp);

            const rule: AutomationRule = {
                id: 'rule-1',
                name: 'Test Rule',
                status: 'active',
                trigger: {
                    type: 'object.create',
                    objectName: 'Contact',
                },
                actions: [],
                createdAt: new Date(),
            };

            await api!.registerRule(rule);

            // Simulate data.create event
            const eventHandler = mockApp.eventBus.on.mock.calls.find(
                (call: any) => call[0] === 'data.create'
            )[1];

            await eventHandler({
                objectName: 'Contact',
                record: { id: '123', name: 'John Doe' },
            });

            expect(mockApp.eventBus.emit).toHaveBeenCalledWith(
                'automation.trigger.fired',
                expect.objectContaining({
                    ruleId: 'rule-1',
                    eventType: 'object.create',
                    objectName: 'Contact',
                })
            );
        });
    });

    describe('Rule Execution', () => {
        beforeEach(async () => {
            await plugin.onEnable(mockContext);
        });

        it('should register and retrieve a rule', async () => {
            const api = getAutomationAPI(mockApp);

            const rule: AutomationRule = {
                id: 'rule-1',
                name: 'Test Rule',
                description: 'A test rule',
                status: 'active',
                trigger: {
                    type: 'object.create',
                    objectName: 'Contact',
                },
                actions: [
                    {
                        type: 'update_field',
                        objectName: 'Contact',
                        recordId: '{{record.id}}',
                        fields: { status: 'new' },
                    },
                ],
                createdAt: new Date(),
            };

            await api!.registerRule(rule);

            const retrieved = await api!.getRule('rule-1');
            expect(retrieved).toEqual(rule);
        });

        it('should list rules with filters', async () => {
            const api = getAutomationAPI(mockApp);

            const rules: AutomationRule[] = [
                {
                    id: 'rule-1',
                    name: 'Active Rule',
                    status: 'active',
                    trigger: { type: 'object.create', objectName: 'Contact' },
                    actions: [],
                    createdAt: new Date(),
                },
                {
                    id: 'rule-2',
                    name: 'Inactive Rule',
                    status: 'inactive',
                    trigger: { type: 'object.update', objectName: 'Contact' },
                    actions: [],
                    createdAt: new Date(),
                },
            ];

            for (const rule of rules) {
                await api!.registerRule(rule);
            }

            const activeRules = await api!.listRules({ status: 'active' });
            expect(activeRules).toHaveLength(1);
            expect(activeRules[0].id).toBe('rule-1');
        });

        it('should execute rule actions on trigger', async () => {
            const api = getAutomationAPI(mockApp);

            const mockUpdateHandler = jest.fn().mockResolvedValue(undefined);
            api!.getActionExecutor().setUpdateFieldHandler(mockUpdateHandler);

            const rule: AutomationRule = {
                id: 'rule-1',
                name: 'Update Status Rule',
                status: 'active',
                trigger: {
                    type: 'object.create',
                    objectName: 'Contact',
                },
                actions: [
                    {
                        type: 'update_field',
                        objectName: 'Contact',
                        recordId: '{{record.id}}',
                        fields: { status: 'new' },
                    },
                ],
                createdAt: new Date(),
            };

            await api!.registerRule(rule);

            // Simulate data.create event
            const eventHandler = mockApp.eventBus.on.mock.calls.find(
                (call: any) => call[0] === 'data.create'
            )[1];

            await eventHandler({
                objectName: 'Contact',
                record: { id: '123', name: 'John Doe' },
            });

            expect(mockUpdateHandler).toHaveBeenCalledWith(
                'Contact',
                '123',
                { status: 'new' }
            );

            expect(mockApp.eventBus.emit).toHaveBeenCalledWith(
                'automation.rule.executed',
                expect.objectContaining({
                    ruleId: 'rule-1',
                    success: true,
                })
            );
        });
    });

    describe('Formula Fields', () => {
        beforeEach(async () => {
            await plugin.onEnable(mockContext);
        });

        it('should register and calculate a formula', async () => {
            const api = getAutomationAPI(mockApp);

            const formula: FormulaField = {
                name: 'totalAmount',
                objectName: 'Order',
                type: 'calculated',
                config: {
                    type: 'calculated',
                    expression: '{quantity} * {price}',
                    returnType: 'number',
                },
                createdAt: new Date(),
            };

            await api!.registerFormula(formula);

            const record = { quantity: 5, price: 100 };
            const result = await api!.calculateFormula('Order', 'totalAmount', record);

            expect(result).toBe(500);

            expect(mockApp.eventBus.emit).toHaveBeenCalledWith(
                'automation.formula.calculated',
                expect.objectContaining({
                    objectName: 'Order',
                    fieldName: 'totalAmount',
                    value: 500,
                })
            );
        });

        it('should throw error for non-existent formula', async () => {
            const api = getAutomationAPI(mockApp);

            await expect(
                api!.calculateFormula('Order', 'nonExistent', {})
            ).rejects.toThrow('Formula not found: Order.nonExistent');
        });
    });

    describe('API Access', () => {
        it('should provide API access after enable', async () => {
            await plugin.onEnable(mockContext);

            const api = getAutomationAPI(mockApp);
            expect(api).toBeDefined();
            expect(api).toHaveProperty('registerRule');
            expect(api).toHaveProperty('getRule');
            expect(api).toHaveProperty('listRules');
            expect(api).toHaveProperty('registerFormula');
            expect(api).toHaveProperty('calculateFormula');
            expect(api).toHaveProperty('getTriggerEngine');
            expect(api).toHaveProperty('getActionExecutor');
            expect(api).toHaveProperty('getFormulaEngine');
        });

        it('should return null for API before enable', () => {
            const api = getAutomationAPI(mockApp);
            expect(api).toBeNull();
        });

        it('should provide access to engines', async () => {
            await plugin.onEnable(mockContext);

            const api = getAutomationAPI(mockApp);
            const triggerEngine = api!.getTriggerEngine();
            const actionExecutor = api!.getActionExecutor();
            const formulaEngine = api!.getFormulaEngine();

            expect(triggerEngine).toBeDefined();
            expect(actionExecutor).toBeDefined();
            expect(formulaEngine).toBeDefined();
        });
    });
});
