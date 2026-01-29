/**
 * Audit Log Plugin for ObjectOS
 * 
 * This plugin provides comprehensive audit logging capabilities including:
 * - Audit event recording (审计事件记录)
 * - Audit tracking (审计跟踪)
 * - Field history (字段历史)
 * 
 * Features:
 * - Records all CRUD operations (Create, Read, Update, Delete)
 * - Tracks field-level changes with before/after values
 * - Captures user context (who, when, where)
 * - Provides query API for audit trail and field history
 */

import type {
    PluginDefinition,
    PluginContextData,
    ObjectStackManifest,
} from '@objectstack/spec/system';

import type { AuditEventType } from '@objectstack/spec/system';
import type {
    AuditLogConfig,
    AuditLogEntry,
    AuditTrailEntry,
    FieldChange,
    AuditQueryOptions,
} from './types';
import { InMemoryAuditStorage } from './storage';

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
export const AuditLogManifest: ObjectStackManifest = {
    id: 'com.objectos.audit-log',
    version: '0.1.0',
    type: 'plugin',
    name: 'Audit Log Plugin',
    description: 'Comprehensive audit logging with event recording, tracking, and field history',
    permissions: [
        'system.audit.read',
        'system.audit.write',
    ],
    contributes: {
        // Register audit-related events
        events: [
            'audit.event.recorded',
            'audit.trail.created',
            'audit.field.changed',
        ],
    },
};

/**
 * Audit Log Plugin Instance
 */
class AuditLogPluginInstance {
    private config: AuditLogConfig;
    private storage: any;
    private context?: PluginContextData;

    constructor(config: AuditLogConfig = {}) {
        this.config = {
            enabled: true,
            trackFieldChanges: true,
            retentionDays: 0,
            auditedObjects: [],
            excludedFields: ['password', 'token', 'secret'],
            ...config,
        };
        this.storage = config.storage || new InMemoryAuditStorage();
    }

    /**
     * Initialize plugin and set up event listeners
     */
    async initialize(context: PluginContextData): Promise<void> {
        this.context = context;

        const app = context.app as ExtendedAppContext;
        if (!app.eventBus) {
            context.logger.warn('[Audit Log] EventBus not available, event tracking disabled');
            return;
        }

        // Subscribe to data events
        const events = [
            'data.create',
            'data.update',
            'data.delete',
            'data.find',
        ];

        for (const event of events) {
            if (typeof app.eventBus.on === 'function') {
                app.eventBus.on(event, async (data: any) => {
                    await this.handleDataEvent(event, data);
                });
            }
        }

        context.logger.info('[Audit Log] Event listeners registered');
    }

    /**
     * Handle data events and create audit logs
     */
    private async handleDataEvent(event: string, data: any): Promise<void> {
        if (!this.config.enabled) return;

        const { objectName, recordId, userId, userName, changes, record } = data;

        // Check if object should be audited
        if (this.config.auditedObjects && this.config.auditedObjects.length > 0) {
            if (!this.config.auditedObjects.includes(objectName)) {
                return;
            }
        }

        // Map event to audit event type
        const eventTypeMap: Record<string, AuditEventType> = {
            'data.create': 'data.create',
            'data.update': 'data.update',
            'data.delete': 'data.delete',
            'data.find': 'data.read',
        };

        const eventType = eventTypeMap[event];
        if (!eventType) return;

        // Create audit log entry
        const auditEntry: AuditTrailEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            eventType: eventType,
            objectName,
            recordId: recordId || record?.id,
            userId,
            userName,
            resource: `${objectName}/${recordId || record?.id}`,
            action: eventType,
            success: true,
            metadata: {
                event,
                ...data.metadata,
            },
        };

        // Track field changes for update events
        if (eventType === 'data.update' && this.config.trackFieldChanges && changes) {
            auditEntry.changes = this.extractFieldChanges(changes);
        }

        // Store the audit event
        await this.storage.logEvent(auditEntry);

        // Emit audit event
        if (this.context) {
            const app = this.context.app as ExtendedAppContext;
            if (app.eventBus && typeof app.eventBus.emit === 'function') {
                app.eventBus.emit('audit.event.recorded', auditEntry);
            }
        }

        this.context?.logger.debug(`[Audit Log] Recorded ${eventType} event for ${objectName}/${recordId}`);
    }

    /**
     * Extract field changes from update data
     */
    private extractFieldChanges(changes: any): FieldChange[] {
        const fieldChanges: FieldChange[] = [];

        for (const [field, change] of Object.entries(changes)) {
            // Skip excluded fields
            if (this.config.excludedFields?.includes(field)) {
                continue;
            }

            if (typeof change === 'object' && change !== null && 'oldValue' in change && 'newValue' in change) {
                fieldChanges.push({
                    field,
                    oldValue: (change as any).oldValue,
                    newValue: (change as any).newValue,
                });
            }
        }

        return fieldChanges;
    }

    /**
     * Query audit events
     */
    async queryEvents(options: AuditQueryOptions): Promise<AuditLogEntry[]> {
        return this.storage.queryEvents(options);
    }

    /**
     * Get audit trail for a record
     */
    async getAuditTrail(objectName: string, recordId: string): Promise<AuditTrailEntry[]> {
        return this.storage.getAuditTrail(objectName, recordId);
    }

    /**
     * Get field history
     */
    async getFieldHistory(objectName: string, recordId: string, fieldName: string): Promise<FieldChange[]> {
        return this.storage.getFieldHistory(objectName, recordId, fieldName);
    }

    /**
     * Generate unique ID for audit entries
     */
    private generateId(): string {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown(): Promise<void> {
        // Could implement retention policy cleanup here
        this.context?.logger.info('[Audit Log] Plugin shutdown');
    }
}

/**
 * Create Audit Log Plugin
 * Factory function to create the plugin with custom configuration
 */
export const createAuditLogPlugin = (config: AuditLogConfig = {}): PluginDefinition => {
    const instance = new AuditLogPluginInstance(config);

    return {
        /**
         * Called when the plugin is first installed
         */
        async onInstall(context: PluginContextData) {
            context.logger.info('[Audit Log Plugin] Installing...');
            
            // Store installation configuration
            await context.storage.set('install_date', new Date().toISOString());
            await context.storage.set('config', JSON.stringify(config));
            
            context.logger.info('[Audit Log Plugin] Installation complete');
        },

        /**
         * Called when the plugin is enabled
         */
        async onEnable(context: PluginContextData) {
            context.logger.info('[Audit Log Plugin] Enabling...');
            
            try {
                // Initialize the audit logging system
                await instance.initialize(context);
                
                // Store plugin instance reference for API access
                (context.app as any).__auditLogPlugin = instance;
                
                context.logger.info('[Audit Log Plugin] Enabled successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                context.logger.error(`[Audit Log Plugin] Failed to enable: ${errorMessage}`, error);
                throw new Error(`Audit Log Plugin initialization failed: ${errorMessage}`);
            }
        },

        /**
         * Called when the plugin is disabled
         */
        async onDisable(context: PluginContextData) {
            context.logger.info('[Audit Log Plugin] Disabling...');
            
            try {
                // Shutdown the plugin
                await instance.shutdown();
                
                // Remove plugin instance reference
                delete (context.app as any).__auditLogPlugin;
                
                // Store last disabled timestamp
                await context.storage.set('last_disabled', new Date().toISOString());
                
                context.logger.info('[Audit Log Plugin] Disabled successfully');
            } catch (error) {
                context.logger.error('[Audit Log Plugin] Error during disable:', error);
                throw error;
            }
        },

        /**
         * Called when the plugin is uninstalled
         */
        async onUninstall(context: PluginContextData) {
            context.logger.info('[Audit Log Plugin] Uninstalling...');
            
            try {
                // Shutdown the plugin
                await instance.shutdown();
                
                // Cleanup plugin storage
                await context.storage.delete('install_date');
                await context.storage.delete('last_disabled');
                await context.storage.delete('config');
                
                context.logger.warn('[Audit Log Plugin] Uninstalled - Audit data preserved');
            } catch (error) {
                context.logger.error('[Audit Log Plugin] Error during uninstall:', error);
                throw error;
            }
        },
    };
};

/**
 * Default plugin instance with default configuration
 */
export const AuditLogPlugin = createAuditLogPlugin();

/**
 * Helper function to access the audit log API
 */
export function getAuditLogAPI(app: any): AuditLogPluginInstance | null {
    return app.__auditLogPlugin || null;
}
