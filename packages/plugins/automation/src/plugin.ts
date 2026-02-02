/**
 * Automation Plugin for ObjectOS
 * 
 * This plugin provides comprehensive automation capabilities including:
 * - Object triggers (onCreate, onUpdate, onDelete)
 * - Scheduled triggers (cron)
 * - Webhook triggers
 * - Actions (update field, create record, send email, HTTP, script)
 * - Formula fields (calculated, rollup, auto-number)
 */

import type {
    PluginDefinition,
    PluginContextData,
    ObjectStackManifest,
} from '@objectstack/spec/system';

import type {
    AutomationPluginConfig,
    AutomationRule,
    FormulaField,
    AutomationExecutionResult,
} from './types';
import { InMemoryAutomationStorage } from './storage';
import { TriggerEngine } from './triggers';
import { ActionExecutor } from './actions';
import { FormulaEngine } from './formulas';

/**
 * Extended app context with event bus
 */
interface ExtendedAppContext {
    eventBus?: {
        on?: (event: string, handler: (data: any) => void) => void;
        emit?: (event: string, data: any) => void;
    };
}

/**
 * Plugin Manifest
 * Conforms to @objectstack/spec/system/ManifestSchema
 */
export const AutomationManifest: ObjectStackManifest = {
    id: 'com.objectos.automation',
    version: '0.1.0',
    type: 'plugin',
    name: 'Automation Plugin',
    description: 'Automation engine with triggers, actions, and formula fields',
    permissions: [
        'system.automation.read',
        'system.automation.write',
        'system.automation.execute',
    ],
    contributes: {
        // Register automation-related events
        events: [
            'automation.rule.created',
            'automation.rule.executed',
            'automation.rule.failed',
            'automation.trigger.fired',
            'automation.action.executed',
            'automation.formula.calculated',
        ],
    },
};

/**
 * Automation Plugin Instance
 */
class AutomationPluginInstance {
    private config: AutomationPluginConfig;
    private storage: any;
    private triggerEngine: TriggerEngine;
    private actionExecutor: ActionExecutor;
    private formulaEngine: FormulaEngine;
    private context?: PluginContextData;

    constructor(config: AutomationPluginConfig = {}) {
        this.config = {
            enabled: true,
            maxExecutionTime: 30000,
            enableEmail: false,
            enableHttp: true,
            enableScriptExecution: false,
            ...config,
        };

        this.storage = config.storage || new InMemoryAutomationStorage();
        this.triggerEngine = new TriggerEngine();
        this.actionExecutor = new ActionExecutor({
            emailConfig: config.emailConfig,
            enableEmail: this.config.enableEmail,
            enableHttp: this.config.enableHttp,
            enableScriptExecution: this.config.enableScriptExecution,
            maxExecutionTime: this.config.maxExecutionTime,
        });
        this.formulaEngine = new FormulaEngine();
    }

    /**
     * Initialize plugin
     */
    async initialize(context: PluginContextData): Promise<void> {
        this.context = context;

        // Update loggers
        (this.triggerEngine as any).logger = context.logger;
        (this.actionExecutor as any).logger = context.logger;
        (this.formulaEngine as any).logger = context.logger;

        // Set up event listeners
        const app = context.app as ExtendedAppContext;
        if (app.eventBus) {
            await this.setupEventListeners(app.eventBus);
        }

        context.logger.info('[Automation Plugin] Initialized successfully');
    }

    /**
     * Set up event listeners for data events
     */
    private async setupEventListeners(eventBus: any): Promise<void> {
        if (typeof eventBus.on !== 'function') {
            return;
        }

        // Listen for data create events
        eventBus.on('data.create', async (data: any) => {
            await this.handleDataEvent('object.create', data);
        });

        // Listen for data update events
        eventBus.on('data.update', async (data: any) => {
            await this.handleDataEvent('object.update', data);
        });

        // Listen for data delete events
        eventBus.on('data.delete', async (data: any) => {
            await this.handleDataEvent('object.delete', data);
        });

        // Register scheduled triggers
        const rules = await this.storage.listRules({ status: 'active', triggerType: 'scheduled' });
        for (const rule of rules) {
            if (rule.trigger.type === 'scheduled') {
                this.triggerEngine.registerScheduledTrigger(
                    rule.id,
                    rule.trigger,
                    async () => { await this.executeRule(rule, {}); }
                );
            }
        }

        this.context?.logger.info('[Automation Plugin] Event listeners registered');
    }

    /**
     * Handle data events and trigger automations
     */
    private async handleDataEvent(
        eventType: 'object.create' | 'object.update' | 'object.delete',
        data: any
    ): Promise<void> {
        if (!this.config.enabled) return;

        const { objectName, record, oldRecord } = data;

        // Get active rules for this trigger type
        const rules = await this.storage.listRules({ 
            status: 'active', 
            triggerType: eventType 
        });

        for (const rule of rules) {
            if (rule.trigger.type !== eventType) continue;

            // Evaluate if trigger should fire
            const shouldFire = this.triggerEngine.evaluateObjectTrigger(
                rule.trigger as any,
                eventType,
                objectName,
                record,
                oldRecord
            );

            if (shouldFire) {
                this.emitEvent('automation.trigger.fired', { 
                    ruleId: rule.id, 
                    eventType, 
                    objectName 
                });

                // Execute the rule
                await this.executeRule(rule, { 
                    objectName, 
                    record, 
                    oldRecord, 
                    eventType 
                });
            }
        }
    }

    /**
     * Execute an automation rule
     */
    private async executeRule(rule: AutomationRule, triggerData: any): Promise<AutomationExecutionResult> {
        const startTime = Date.now();
        const actionResults: any[] = [];

        try {
            const context = {
                rule,
                triggerData,
                logger: this.context?.logger || console,
            };

            // Execute each action
            for (const action of rule.actions) {
                try {
                    const result = await this.actionExecutor.executeAction(action, context);
                    actionResults.push({ action: action.type, success: true, result });

                    this.emitEvent('automation.action.executed', {
                        ruleId: rule.id,
                        actionType: action.type,
                        success: true,
                    });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    actionResults.push({ action: action.type, success: false, error: errorMessage });

                    this.context?.logger.error(
                        `Error executing action ${action.type} in rule ${rule.id}:`,
                        errorMessage
                    );

                    // Continue with next action
                }
            }

            // Update execution stats
            await this.storage.updateRule(rule.id, {
                lastExecutedAt: new Date(),
                executionCount: (rule.executionCount || 0) + 1,
            });

            const result: AutomationExecutionResult = {
                ruleId: rule.id,
                success: true,
                executedAt: new Date(),
                actionsExecuted: rule.actions.length,
                results: actionResults,
            };

            this.emitEvent('automation.rule.executed', result);

            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Mark rule as errored
            await this.storage.updateRule(rule.id, {
                status: 'error',
                error: errorMessage,
            });

            const result: AutomationExecutionResult = {
                ruleId: rule.id,
                success: false,
                executedAt: new Date(),
                actionsExecuted: actionResults.length,
                error: errorMessage,
                results: actionResults,
            };

            this.emitEvent('automation.rule.failed', result);

            return result;
        }
    }

    /**
     * Emit automation events
     */
    private emitEvent(event: string, data: any): void {
        const app = this.context?.app as ExtendedAppContext;
        if (app?.eventBus && typeof app.eventBus.emit === 'function') {
            app.eventBus.emit(event, data);
        }
    }

    /**
     * Register an automation rule
     */
    async registerRule(rule: AutomationRule): Promise<void> {
        await this.storage.saveRule(rule);

        // Register scheduled trigger if applicable
        if (rule.status === 'active' && rule.trigger.type === 'scheduled') {
            this.triggerEngine.registerScheduledTrigger(
                rule.id,
                rule.trigger,
                async () => { await this.executeRule(rule, {}); }
            );
        }

        this.context?.logger.info(`[Automation Plugin] Registered rule: ${rule.name}`);
    }

    /**
     * Get an automation rule
     */
    async getRule(id: string): Promise<AutomationRule | null> {
        return this.storage.getRule(id);
    }

    /**
     * List automation rules
     */
    async listRules(filter?: any): Promise<AutomationRule[]> {
        return this.storage.listRules(filter);
    }

    /**
     * Register a formula field
     */
    async registerFormula(formula: FormulaField): Promise<void> {
        await this.storage.saveFormula(formula);
        this.context?.logger.info(
            `[Automation Plugin] Registered formula: ${formula.objectName}.${formula.name}`
        );
    }

    /**
     * Calculate a formula field
     */
    async calculateFormula(
        objectName: string,
        fieldName: string,
        record: any
    ): Promise<any> {
        const formula = await this.storage.getFormula(objectName, fieldName);
        if (!formula) {
            throw new Error(`Formula not found: ${objectName}.${fieldName}`);
        }

        const value = await this.formulaEngine.calculateFormula(formula, record);

        this.emitEvent('automation.formula.calculated', {
            objectName,
            fieldName,
            value,
        });

        return value;
    }

    /**
     * Get engines (for external configuration)
     */
    getTriggerEngine(): TriggerEngine {
        return this.triggerEngine;
    }

    getActionExecutor(): ActionExecutor {
        return this.actionExecutor;
    }

    getFormulaEngine(): FormulaEngine {
        return this.formulaEngine;
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown(): Promise<void> {
        this.triggerEngine.shutdown();
        this.context?.logger.info('[Automation Plugin] Shutdown');
    }
}

/**
 * Create Automation Plugin
 * Factory function to create the plugin with custom configuration
 */
export const createAutomationPlugin = (config: AutomationPluginConfig = {}): PluginDefinition => {
    const instance = new AutomationPluginInstance(config);

    return {
        /**
         * Called when the plugin is first installed
         */
        onInstall: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Automation Plugin] Installing...');

            await context.storage.set('install_date', new Date().toISOString());
            await context.storage.set('config', JSON.stringify(config));

            context.logger.info('[Automation Plugin] Installation complete');
        }) as any,

        /**
         * Called when the plugin is enabled
         */
        onEnable: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Automation Plugin] Enabling...');

            try {
                await instance.initialize(context);

                // Store plugin instance reference for API access
                (context.app as any).__automationPlugin = instance;

                context.logger.info('[Automation Plugin] Enabled successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                context.logger.error(`[Automation Plugin] Failed to enable: ${errorMessage}`, error);
                throw new Error(`Automation Plugin initialization failed: ${errorMessage}`);
            }
        }) as any,

        /**
         * Called when the plugin is disabled
         */
        onDisable: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Automation Plugin] Disabling...');

            try {
                await instance.shutdown();

                delete (context.app as any).__automationPlugin;

                await context.storage.set('last_disabled', new Date().toISOString());

                context.logger.info('[Automation Plugin] Disabled successfully');
            } catch (error) {
                context.logger.error('[Automation Plugin] Error during disable:', error);
                throw error;
            }
        }) as any,

        /**
         * Called when the plugin is uninstalled
         */
        onUninstall: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Automation Plugin] Uninstalling...');

            try {
                await instance.shutdown();

                await context.storage.delete('install_date');
                await context.storage.delete('last_disabled');
                await context.storage.delete('config');

                context.logger.warn('[Automation Plugin] Uninstalled - Automation data preserved');
            } catch (error) {
                context.logger.error('[Automation Plugin] Error during uninstall:', error);
                throw error;
            }
        }) as any,
    };
};

/**
 * Default plugin instance with default configuration
 */
export const AutomationPlugin: PluginDefinition = createAutomationPlugin();

/**
 * Helper function to access the automation API
 */
export function getAutomationAPI(app: any): AutomationPluginInstance | null {
    return app.__automationPlugin || null;
}
