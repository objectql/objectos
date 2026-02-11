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

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { IAutomationService, AutomationContext as SpecAutomationContext, AutomationResult as SpecAutomationResult } from '@objectstack/spec/contracts';
import type {
    AutomationPluginConfig,
    AutomationRule,
    FormulaField,
    AutomationExecutionResult,
    PluginHealthReport,
    PluginCapabilityManifest,
    PluginSecurityManifest,
    PluginStartupResult,
} from './types.js';
import { InMemoryAutomationStorage } from './storage.js';
import { TriggerEngine } from './triggers.js';
import { ActionExecutor } from './actions.js';
import { FormulaEngine } from './formulas.js';
import { InMemoryQueue, Queue, Job } from './queue.js';

/**
 * Automation Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class AutomationPlugin implements Plugin, IAutomationService {
    name = '@objectos/automation';
    version = '0.1.0';
    dependencies: string[] = [];

    private config: AutomationPluginConfig;
    private storage: any;
    private triggerEngine: TriggerEngine;
    private actionExecutor: ActionExecutor;
    private formulaEngine: FormulaEngine;
    private jobQueue: Queue; // Job Queue
    private context?: PluginContext;
    private startedAt?: number;

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
        
        // Initialize Queue (In-Memory for now)
        this.jobQueue = new InMemoryQueue({ 
            name: 'automation-jobs', 
            isWorker: true, 
            concurrency: 5 
        });
    }

    /**
     * Initialize plugin - Register services and subscribe to events
     */
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;
        this.startedAt = Date.now();

        // Update loggers
        (this.triggerEngine as any).logger = context.logger;
        (this.actionExecutor as any).logger = context.logger;
        (this.formulaEngine as any).logger = context.logger;
        (this.jobQueue as any).logger = context.logger;

        // Register automation service
        context.registerService('automation', this);

        // Register Queue Handler
        this.jobQueue.process('execute-rule', async (job: Job) => {
            const { rule, triggerData } = job.data;
            await this.executeRuleInternal(rule, triggerData);
        });

        // Set up event listeners using kernel hooks
        await this.setupEventListeners(context);

        context.logger.info('[Automation Plugin] Initialized successfully');

        await context.trigger('plugin.initialized', { pluginId: this.name, timestamp: new Date().toISOString() });
    }

    /**
     * Start plugin - Connect to databases, start servers
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Automation Plugin] Starting...');

        // Start Queue Worker
        await this.jobQueue.start();

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

        context.logger.info('[Automation Plugin] Started successfully');

        await context.trigger('plugin.started', { pluginId: this.name, timestamp: new Date().toISOString() });
    }

    /**
     * Stop plugin
     */
    async stop(): Promise<void> {
        this.triggerEngine.shutdown();
        await this.jobQueue.stop();
        this.context?.logger.info('[Automation Plugin] Stopped');
    }

    /**
     * Set up event listeners for data events using kernel hooks
     */
    private async setupEventListeners(context: PluginContext): Promise<void> {
        // Listen for data create events
        context.hook('data.afterCreate', async (data: any) => {
            if (data && data.object) {
                // Map kernel event format (data.object, data.doc) to helper format
                // In handleDataEvent we expect { objectName, record }
                // So we fix the call here.
                await this.handleDataEvent('object.create', { 
                    objectName: data.object, 
                    record: data.doc || data.data // flexible mapping
                });
            }
        });

        // Listen for data update events
        context.hook('data.afterUpdate', async (data: any) => {
            if (data && data.object) {
                 await this.handleDataEvent('object.update', {
                    objectName: data.object,
                    record: data.doc || data.data,
                    oldRecord: data.previous
                 });
            }
        });

        // Listen for data delete events
        context.hook('data.afterDelete', async (data: any) => {
            if (data && data.object) {
                 await this.handleDataEvent('object.delete', {
                    objectName: data.object,
                    record: data.doc || data.data || { id: data.id }
                 });
            }
        });

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
        // Filter by objectName efficiently if storage supports it
        const rules = await this.storage.listRules({ 
            status: 'active', 
            triggerType: eventType,
            objectName
        });

        for (const rule of rules) {
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

                // Enqueue the rule execution
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
     * Execute an automation rule (Queued)
     */
    private async executeRule(rule: AutomationRule, triggerData: any): Promise<void> {
         // Add to queue
        await this.jobQueue.add('execute-rule', {
            rule,
            triggerData
        }, {
            priority: rule.priority || 0,
            maxAttempts: 3, 
            backoff: { type: 'exponential', delay: 1000 }
        });
        
        this.context?.logger.info(`[Automation Plugin] Rule ${rule.id} queued`);
    }

    /**
     * Internal Rule Execution Logic (Worker)
     */
    private async executeRuleInternal(rule: AutomationRule, triggerData: any): Promise<AutomationExecutionResult> {
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
                        error instanceof Error ? error : new Error(errorMessage)
                    );
                    
                    // Throw to trigger Queue Retry
                    throw error; 
                }
            }

            // Update execution stats
            await this.storage.updateRule(rule.id, {
                lastExecutedAt: new Date(),
                executionCount: (rule.executionCount || 0) + 1,
            });
            
             // Log success
            this.logExecution({
                rule_id: rule.id,
                object_name: triggerData.objectName,
                status: 'success',
                executed_at: new Date(),
                duration: Date.now() - startTime,
                actions_executed: rule.actions.length,
                results: actionResults
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

            // Mark rule as errored if queue finally fails
            // But here we are inside one attempt.
            
            // Log failure for this attempt
             this.logExecution({
                rule_id: rule.id,
                object_name: triggerData.objectName,
                status: 'failed',
                executed_at: new Date(),
                duration: Date.now() - startTime,
                actions_executed: actionResults.length,
                results: actionResults,
                error: errorMessage
            });

            // We do NOT update rule status to 'error' globally yet, 
            // because Queue might retry and succeed. 
            // If we wanted to track final failure, we'd do it in a Queue 'failed' event handler.

            const result: AutomationExecutionResult = {
                ruleId: rule.id,
                success: false,
                executedAt: new Date(),
                actionsExecuted: actionResults.length,
                error: errorMessage,
                results: actionResults,
            };

            this.emitEvent('automation.rule.failed', result);

            throw error;
        }
    }
    
    private async logExecution(logData: any) {
        if ((this.context as any)?.broker) {
            try {
                logData.triggered_by = logData.triggered_by || 'auto';
                (this.context as any).broker.call('data.create', { object: 'automation_log', doc: logData })
                    .catch((e: any) => {}); // fire and forget
            } catch (ignore) {}
        }
    }

    /**
     * Emit automation events using kernel trigger system
     */
    private async emitEvent(event: string, data: any): Promise<void> {
        if (this.context) {
            await this.context.trigger(event, data);
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

    // ── IAutomationService contract methods ──

    /**
     * IAutomationService.execute — find and execute a named flow/rule
     */
    async execute(flowName: string, context?: SpecAutomationContext): Promise<SpecAutomationResult> {
        const startTime = Date.now();
        try {
            const rule = await this.storage.getRule(flowName);
            if (!rule) {
                return { success: false, error: `Flow not found: ${flowName}` };
            }
            const triggerData = {
                objectName: context?.object,
                record: context?.record,
                eventType: context?.event,
            };
            const result = await this.executeRuleInternal(rule, triggerData);
            return {
                success: result.success,
                output: result.results,
                durationMs: Date.now() - startTime,
                error: result.error,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                durationMs: Date.now() - startTime,
            };
        }
    }

    /**
     * IAutomationService.listFlows — list all registered rule names
     */
    async listFlows(): Promise<string[]> {
        const rules = await this.storage.listRules({});
        return rules.map((r: AutomationRule) => r.id);
    }

    /**
     * IAutomationService.registerFlow — register a flow definition (optional)
     */
    registerFlow(name: string, definition: unknown): void {
        const rule = definition as AutomationRule;
        this.registerRule({ ...rule, id: name }).catch((err) => {
            this.context?.logger.warn(`[Automation Plugin] Failed to register flow ${name}: ${err instanceof Error ? err.message : err}`);
        });
    }

    /**
     * IAutomationService.unregisterFlow — unregister a flow by name (optional)
     */
    unregisterFlow(name: string): void {
        if (this.storage.deleteRule) {
            this.storage.deleteRule(name).catch((err: unknown) => {
                this.context?.logger.warn(`[Automation Plugin] Failed to unregister flow ${name}: ${err instanceof Error ? err.message : err}`);
            });
        }
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
     * Health check
     */
    async healthCheck(): Promise<PluginHealthReport> {
        const start = Date.now();
        const status = this.config.enabled ? 'healthy' : 'degraded';
        const message = this.config.enabled ? 'Automation engine active' : 'Automation disabled';
        const latency = Date.now() - start;
        return {
            status,
            timestamp: new Date().toISOString(),
            message,
            metrics: {
                uptime: this.startedAt ? Date.now() - this.startedAt : 0,
                responseTime: latency,
            },
            checks: [{ name: 'automation-engine', status: status === 'healthy' ? 'passed' : 'warning', message }],
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: {
                provides: [{
                    id: 'com.objectstack.service.automation',
                    name: 'automation',
                    version: { major: 0, minor: 1, patch: 0 },
                    methods: [
                        { name: 'registerRule', description: 'Register a workflow rule', async: false },
                        { name: 'evaluateRules', description: 'Evaluate rules for a trigger event', async: true },
                        { name: 'getRules', description: 'Get all registered rules', async: false },
                        { name: 'getExecutionHistory', description: 'Get rule execution history', async: false },
                    ],
                    stability: 'stable',
                }],
                requires: [],
            },
            security: {
                pluginId: 'automation',
                trustLevel: 'trusted',
                permissions: { permissions: [], defaultGrant: 'deny' },
                sandbox: { enabled: false, level: 'none' },
            },
        };
    }

    /**
     * Startup result
     */
    getStartupResult(): PluginStartupResult {
        return { plugin: { name: this.name, version: this.version }, success: !!this.context, duration: 0 };
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        this.triggerEngine.shutdown();
        this.context?.logger.info('[Automation Plugin] Destroyed');

        if (this.context) {
            await this.context.trigger('plugin.destroyed', { pluginId: this.name, timestamp: new Date().toISOString() });
        }
    }
}

/**
 * Helper function to access the automation API from kernel
 */
export function getAutomationAPI(kernel: any): AutomationPlugin | null {
    try {
        return kernel.getService('automation');
    } catch {
        return null;
    }
}
