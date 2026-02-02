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

import type {
    PluginDefinition,
    PluginContextData,
    ObjectStackManifest,
} from '@objectstack/spec/system';

import type {
    WorkflowPluginConfig,
    WorkflowDefinition,
} from './types';
import { InMemoryWorkflowStorage } from './storage';
import { WorkflowEngine } from './engine';
import { WorkflowAPI } from './api';

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
export const WorkflowManifest: ObjectStackManifest = {
    id: 'com.objectos.workflow',
    version: '0.1.0',
    type: 'plugin',
    name: 'Workflow Plugin',
    description: 'Workflow and state machine engine with FSM, guards, actions, and versioning',
    permissions: [
        'system.workflow.read',
        'system.workflow.write',
        'system.workflow.execute',
    ],
    contributes: {
        // Register workflow-related events
        events: [
            'workflow.started',
            'workflow.completed',
            'workflow.failed',
            'workflow.aborted',
            'workflow.transition',
            'workflow.task.created',
            'workflow.task.completed',
        ],
    },
};

/**
 * Workflow Plugin Instance
 */
class WorkflowPluginInstance {
    private config: WorkflowPluginConfig;
    private storage: any;
    private engine: WorkflowEngine;
    private api: WorkflowAPI;
    private context?: PluginContextData;

    constructor(config: WorkflowPluginConfig = {}) {
        this.config = {
            enabled: true,
            defaultTimeout: 3600000, // 1 hour
            maxTransitions: 1000,
            ...config,
        };

        this.storage = config.storage || new InMemoryWorkflowStorage();
        this.engine = new WorkflowEngine();
        this.api = new WorkflowAPI(this.storage, this.engine);
    }

    /**
     * Initialize plugin
     */
    async initialize(context: PluginContextData): Promise<void> {
        this.context = context;

        // Update logger
        (this.engine as any).logger = context.logger;

        // Set up event listeners
        const app = context.app as ExtendedAppContext;
        if (app.eventBus) {
            this.setupEventListeners(app.eventBus);
        }

        context.logger.info('[Workflow Plugin] Initialized successfully');
    }

    /**
     * Set up event listeners for workflow lifecycle
     */
    private setupEventListeners(eventBus: any): void {
        // Could listen to data events to trigger workflows
        if (typeof eventBus.on === 'function') {
            eventBus.on('data.create', (data: any) => {
                this.emitEvent('workflow.trigger', { type: 'data.create', data });
            });
        }
    }

    /**
     * Emit workflow events
     */
    private emitEvent(event: string, data: any): void {
        const app = this.context?.app as ExtendedAppContext;
        if (app?.eventBus && typeof app.eventBus.emit === 'function') {
            app.eventBus.emit(event, data);
        }
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
    async shutdown(): Promise<void> {
        this.context?.logger.info('[Workflow Plugin] Shutdown');
    }
}

/**
 * Create Workflow Plugin
 * Factory function to create the plugin with custom configuration
 */
export const createWorkflowPlugin = (config: WorkflowPluginConfig = {}): PluginDefinition => {
    const instance = new WorkflowPluginInstance(config);

    return {
        /**
         * Called when the plugin is first installed
         */
        onInstall: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Workflow Plugin] Installing...');

            await context.storage.set('install_date', new Date().toISOString());
            await context.storage.set('config', JSON.stringify(config));

            context.logger.info('[Workflow Plugin] Installation complete');
        }) as any,

        /**
         * Called when the plugin is enabled
         */
        onEnable: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Workflow Plugin] Enabling...');

            try {
                await instance.initialize(context);

                // Store plugin instance reference for API access
                (context.app as any).__workflowPlugin = instance;

                context.logger.info('[Workflow Plugin] Enabled successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                context.logger.error(`[Workflow Plugin] Failed to enable: ${errorMessage}`, error);
                throw new Error(`Workflow Plugin initialization failed: ${errorMessage}`);
            }
        }) as any,

        /**
         * Called when the plugin is disabled
         */
        onDisable: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Workflow Plugin] Disabling...');

            try {
                await instance.shutdown();

                delete (context.app as any).__workflowPlugin;

                await context.storage.set('last_disabled', new Date().toISOString());

                context.logger.info('[Workflow Plugin] Disabled successfully');
            } catch (error) {
                context.logger.error('[Workflow Plugin] Error during disable:', error);
                throw error;
            }
        }) as any,

        /**
         * Called when the plugin is uninstalled
         */
        onUninstall: (async (context: PluginContextData): Promise<void> => {
            context.logger.info('[Workflow Plugin] Uninstalling...');

            try {
                await instance.shutdown();

                await context.storage.delete('install_date');
                await context.storage.delete('last_disabled');
                await context.storage.delete('config');

                context.logger.warn('[Workflow Plugin] Uninstalled - Workflow data preserved');
            } catch (error) {
                context.logger.error('[Workflow Plugin] Error during uninstall:', error);
                throw error;
            }
        }) as any,
    };
};

/**
 * Default plugin instance with default configuration
 */
export const WorkflowPlugin: PluginDefinition = createWorkflowPlugin();

/**
 * Helper function to access the workflow API
 */
export function getWorkflowAPI(app: any): WorkflowPluginInstance | null {
    return app.__workflowPlugin || null;
}
