/**
 * Plugin Tests
 * 
 * Integration tests for Automation Plugin
 */

import {
    AutomationPlugin,
    getAutomationAPI,
} from '../src/plugin.js';
import type { PluginContext } from '@objectstack/runtime';
import type { AutomationRule, FormulaField } from '../src/types.js';

// Mock context for testing
const createMockContext = (): { context: PluginContext; kernel: any; hooks: Map<string, Function[]> } => {
    const hooks: Map<string, Function[]> = new Map();
    const kernel = {
        getService: vi.fn(),
        services: new Map(),
    };
    
    const context: PluginContext = {
        logger: {
            info: vi.fn(),
            warn: vi.fn((...args) => console.error('MOCK WARN:', ...args)),
            error: vi.fn((...args) => console.error('MOCK ERROR:', ...args)),
            debug: vi.fn(),
        },
        registerService: vi.fn((name: string, service: any) => {
            kernel.services.set(name, service);
            kernel.getService.mockImplementation((n: string) => {
                if (kernel.services.has(n)) return kernel.services.get(n);
                throw new Error(`Service ${n} not found`);
            });
        }),
        getService: vi.fn((name: string) => {
            if (kernel.services.has(name)) return kernel.services.get(name);
            throw new Error(`Service ${name} not found`);
        }),
        hasService: vi.fn((name: string) => kernel.services.has(name)),
        getServices: vi.fn(() => kernel.services),
        hook: vi.fn((name: string, handler: Function) => {
            if (!hooks.has(name)) {
                hooks.set(name, []);
            }
            hooks.get(name)!.push(handler);
        }),
        trigger: vi.fn(async (name: string, ...args: any[]) => {
            const handlers = hooks.get(name) || [];
            for (const handler of handlers) {
                await handler(...args);
            }
        }),
        getKernel: vi.fn(() => kernel),
    } as any;
    
    return { context, kernel, hooks };
};

describe('Automation Plugin', () => {
    let plugin: AutomationPlugin;
    let mockContext: PluginContext;
    let mockKernel: any;
    let hooks: Map<string, Function[]>;

    beforeEach(() => {
        const mock = createMockContext();
        mockContext = mock.context;
        mockKernel = mock.kernel;
        hooks = mock.hooks;

        plugin = new AutomationPlugin({
            enabled: true,
            enableEmail: true,
            enableHttp: true,
            enableScriptExecution: true,
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
    });

    describe('Plugin Metadata', () => {
        it('should have correct plugin metadata', () => {
            expect(plugin.name).toBe('@objectos/automation');
            expect(plugin.version).toBe('0.1.0');
            expect(plugin.dependencies).toEqual([]);
        });
    });

    describe('Plugin Lifecycle', () => {
        it('should initialize successfully', async () => {
            await plugin.init(mockContext);

            expect(mockContext.registerService).toHaveBeenCalledWith('automation', plugin);
            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Initialized successfully')
            );
        });

        it('should start successfully', async () => {
            await plugin.init(mockContext);
            await plugin.start(mockContext);

            expect(mockContext.logger.info).toHaveBeenCalledWith(
                expect.stringContaining('Starting')
            );
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

        it('should register event hooks during init', async () => {
            await plugin.init(mockContext);

            expect(mockContext.hook).toHaveBeenCalledWith('data.afterCreate', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.afterUpdate', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.afterDelete', expect.any(Function));
        });
    });

    describe('Event Integration', () => {
        beforeEach(async () => {
            await plugin.init(mockContext);
        });

        it('should set up event listeners', () => {
            expect(mockContext.hook).toHaveBeenCalledWith('data.afterCreate', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.afterUpdate', expect.any(Function));
            expect(mockContext.hook).toHaveBeenCalledWith('data.afterDelete', expect.any(Function));
        });

        it('should emit trigger fired event', async () => {
            const api = getAutomationAPI(mockKernel);

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
            await mockContext.trigger('data.afterCreate', {
                object: 'Contact',
                doc: { id: '123', name: 'John Doe' },
            });

            expect(mockContext.trigger).toHaveBeenCalledWith(
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
            await plugin.init(mockContext);
            await plugin.start(mockContext);
        });

        it('should register and retrieve a rule', async () => {
            const api = getAutomationAPI(mockKernel);

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
            const api = getAutomationAPI(mockKernel);

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
            const api = getAutomationAPI(mockKernel);

            const mockUpdateHandler = vi.fn().mockResolvedValue(undefined);
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
            await mockContext.trigger('data.afterCreate', {
                object: 'Contact',
                doc: { id: '123', name: 'John Doe' },
                record: { id: '123', name: 'John Doe' } // Keep record for compatibility if needed
            });

            // Wait for async queue processing
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(mockUpdateHandler).toHaveBeenCalledWith(
                'Contact',
                '123',
                { status: 'new' }
            );

            expect(mockContext.trigger).toHaveBeenCalledWith(
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
            await plugin.init(mockContext);
        });

        it('should register and calculate a formula', async () => {
            const api = getAutomationAPI(mockKernel);

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

            expect(mockContext.trigger).toHaveBeenCalledWith(
                'automation.formula.calculated',
                expect.objectContaining({
                    objectName: 'Order',
                    fieldName: 'totalAmount',
                    value: 500,
                })
            );
        });

        it('should throw error for non-existent formula', async () => {
            const api = getAutomationAPI(mockKernel);

            await expect(
                api!.calculateFormula('Order', 'nonExistent', {})
            ).rejects.toThrow('Formula not found: Order.nonExistent');
        });
    });

    describe('API Access', () => {
        it('should provide API access after init', async () => {
            await plugin.init(mockContext);

            const api = getAutomationAPI(mockKernel);
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

        it('should return null for API before init', () => {
            // Create a fresh kernel without the service
            const freshKernel = {
                getService: vi.fn(() => { throw new Error('Service not found'); }),
                services: new Map(),
            };
            const api = getAutomationAPI(freshKernel);
            expect(api).toBeNull();
        });

        it('should provide access to engines', async () => {
            await plugin.init(mockContext);

            const api = getAutomationAPI(mockKernel);
            const triggerEngine = api!.getTriggerEngine();
            const actionExecutor = api!.getActionExecutor();
            const formulaEngine = api!.getFormulaEngine();

            expect(triggerEngine).toBeDefined();
            expect(actionExecutor).toBeDefined();
            expect(formulaEngine).toBeDefined();
        });
    });
});

// ─── Contract Compliance (IAutomationService) ──────────────────────────────────

describe('Contract Compliance (IAutomationService)', () => {
    let plugin: AutomationPlugin;
    let mockContext: PluginContext;

    beforeEach(async () => {
        const mock = createMockContext();
        mockContext = mock.context;

        plugin = new AutomationPlugin({
            enabled: true,
            enableEmail: false,
            enableHttp: false,
            enableScriptExecution: false,
        });
        await plugin.init(mockContext);
        await plugin.start(mockContext);
    });

    afterEach(async () => {
        try { await plugin.destroy(); } catch { /* ignore */ }
    });

    describe('execute()', () => {
        it('should return a result with success field for unknown flow', async () => {
            const result = await plugin.execute('nonexistent-flow');
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should execute a registered rule by name', async () => {
            const rule: AutomationRule = {
                id: 'exec-rule',
                name: 'Exec Rule',
                status: 'active',
                trigger: { type: 'object.create', objectName: 'TestObj' },
                actions: [],
                createdAt: new Date(),
            };
            await plugin.registerRule(rule);

            const result = await plugin.execute('exec-rule', {
                object: 'TestObj',
                record: { id: '1' },
                event: 'create',
            });
            expect(result).toBeDefined();
            expect(typeof result.success).toBe('boolean');
        });
    });

    describe('listFlows()', () => {
        it('should return an array of flow name strings', async () => {
            const rule: AutomationRule = {
                id: 'flow-rule-1',
                name: 'Flow Rule',
                status: 'active',
                trigger: { type: 'object.create', objectName: 'Obj' },
                actions: [],
                createdAt: new Date(),
            };
            await plugin.registerRule(rule);

            const flows = await plugin.listFlows();
            expect(Array.isArray(flows)).toBe(true);
            expect(flows).toContain('flow-rule-1');
        });
    });

    describe('registerFlow() / unregisterFlow()', () => {
        it('should register a flow definition', () => {
            expect(() => plugin.registerFlow('new-flow', {
                id: 'new-flow',
                name: 'New Flow',
                status: 'active',
                trigger: { type: 'object.create', objectName: 'X' },
                actions: [],
                createdAt: new Date(),
            })).not.toThrow();
        });

        it('should unregister a flow by name', () => {
            plugin.registerFlow('del-flow', {
                id: 'del-flow',
                name: 'Del Flow',
                status: 'active',
                trigger: { type: 'object.create', objectName: 'X' },
                actions: [],
                createdAt: new Date(),
            });
            expect(() => plugin.unregisterFlow('del-flow')).not.toThrow();
        });
    });
});
