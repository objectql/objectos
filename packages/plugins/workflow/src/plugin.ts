/**
 * Workflow Plugin for ObjectOS
 * 
 * This plugin provides comprehensive workflow and state machine capabilities including:
 * - Finite State Machine (FSM) from YAML
 * - State transitions with guards
 * - Transition actions
 * - Workflow versioning
 * - Different workflow types (approval, sequential, parallel, conditional)
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
    WorkflowPluginConfig,
    WorkflowDefinition,
} from './types';
import { InMemoryWorkflowStorage } from './storage';
import { WorkflowEngine } from './engine';
import { WorkflowAPI } from './api';
import { loadWorkflows } from './loader';
import * as path from 'path';

/**
 * Workflow Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class WorkflowPlugin implements Plugin {
    name = 'com.objectos.workflow';
    version = '0.1.0';
    dependencies: string[] = [];

    private config: WorkflowPluginConfig;
    private storage: any;
    private engine: WorkflowEngine;
    private api: WorkflowAPI;
    private context?: PluginContext;
    private logger: any = console; // Fallback logger before initialization

    constructor(config: WorkflowPluginConfig = {}) {
        this.config = {
            enabled: true,
            workflowsDir: './workflows',
            defaultTimeout: 3600000, // 1 hour
            maxTransitions: 1000,
            ...config,
        };

        this.storage = config.storage || new InMemoryWorkflowStorage();
        this.engine = new WorkflowEngine();
        this.api = new WorkflowAPI(this.storage, this.engine);
    }

    /**
     * Initialize plugin - Register services and subscribe to events
     */
    async init(context: PluginContext): Promise<void> {
        this.context = context;
        this.logger = context.logger;

        // Update engine logger
        (this.engine as any).logger = context.logger;

        // Register workflow service
        context.registerService('workflow', this);

        // Set up event listeners using kernel hooks
        await this.setupEventListeners(context);

        context.logger.info('[Workflow Plugin] Initialized successfully');
    }

    /**
     * Start plugin - Connect to databases, start servers
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Workflow Plugin] Starting...');
        Load workflows from directory
        if (this.config.workflowsDir) {
            // If path is relative, resolve from cwd. If absolute, use as is.
            const dirPath = path.isAbsolute(this.config.workflowsDir) 
                ? this.config.workflowsDir 
                : path.resolve(process.cwd(), this.config.workflowsDir);
            
            context.logger.info(`[Workflow Plugin] Loading workflows from ${dirPath}`);
            
            try {
                const workflows = await loadWorkflows(dirPath);
                for (const workflow of workflows) {
                    await this.registerWorkflow(workflow);
                }
                
                if (workflows.length > 0) {
                    context.logger.info(`[Workflow Plugin] Loaded ${workflows.length} workflows from disk`);
                } else {
                    context.logger.info(`[Workflow Plugin] No workflows found in ${dirPath}`);
                }
            } catch (err) {
                // Log but don't crash startup if workflows directory is missing or invalid
                context.logger.warn(`[Workflow Plugin] Could not load workflows from ${dirPath}: ${(err as Error).message}`);
            }
        }on-demand
        // via API calls or event triggers that are already registered in init().
        
        context.logger.info('[Workflow Plugin] Started successfully');
    }

    /**
     * Set up event listeners for workflow lifecycle using kernel hooks
     */
    private async setupEventListeners(context: PluginContext): Promise<void> {
        // Listen for data create events to trigger workflows
        context.hook('data.create', async (data: any) => {
            try {
                await this.emitEvent('workflow.trigger', { type: 'data.create', data });
            } catch (error) {
                const errorObj = error instanceof Error ? error : undefined;
                this.context?.logger.error('[Workflow Plugin] Error emitting workflow.trigger event:', errorObj);
            }
        });

        this.context?.logger.info('[Workflow Plugin] Event listeners registered');
    }

    /**
     * Emit workflow events using kernel trigger system
     */
    private async emitEvent(event: string, data: any): Promise<void> {
        if (!this.context) {
            this.logger.warn(`[Workflow Plugin] Cannot emit event before initialization: ${event}`);
            return;
        }
        await this.context.trigger(event, data);
    }

    /**
     * Register a workflow definition
     */
    async registerWorkflow(definition: WorkflowDefinition): Promise<void> {
        await this.api.registerWorkflow(definition);
        this.context?.logger.info(`[Workflow Plugin] Registered workflow: ${definition.name}`);
    }

    /**
     * Get the workflow API
     */
    getAPI(): WorkflowAPI {
        return this.api;
    }

    /**
     * Get the workflow engine (for registering guards/actions)
     */
    getEngine(): WorkflowEngine {
        return this.engine;
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        this.context?.logger.info('[Workflow Plugin] Destroyed');
    }
}

/**
 * Helper function to access the workflow API from kernel
 */
export function getWorkflowAPI(kernel: any): WorkflowPlugin | null {
    try {
        return kernel.getService('workflow');
    } catch {
        return null;
    }
}
