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

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { AuditEventType } from '@objectstack/spec/system';
import type {
    AuditLogConfig,
    AuditLogEntry,
    AuditTrailEntry,
    FieldChange,
    AuditQueryOptions,
} from './types.js';
import { InMemoryAuditStorage } from './storage.js';

/**
 * Audit Log Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class AuditLogPlugin implements Plugin {
    name = '@objectos/audit';
    version = '0.1.0';
    dependencies: string[] = [];

    private config: AuditLogConfig;
    private storage: any;
    private context?: PluginContext;

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
     * Initialize plugin - Register services and subscribe to events
     */
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;

        // Register audit log service
        context.registerService('audit-log', this);

        // Set up event listeners using kernel hooks
        await this.setupEventListeners(context);

        context.logger.info('[Audit Log] Initialized successfully');
    }

    /**
     * Start plugin - Connect to databases, start servers
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Audit Log] Starting...');
        context.logger.info('[Audit Log] Started successfully');
    }

    /**
     * Set up event listeners using kernel hooks
     */
    private async setupEventListeners(context: PluginContext): Promise<void> {
        // Subscribe to data events
        context.hook('data.create', async (data: any) => {
            await this.handleDataEvent('data.create', data);
        });

        context.hook('data.update', async (data: any) => {
            await this.handleDataEvent('data.update', data);
        });

        context.hook('data.delete', async (data: any) => {
            await this.handleDataEvent('data.delete', data);
        });

        context.hook('data.find', async (data: any) => {
            await this.handleDataEvent('data.find', data);
        });

        // Subscribe to job events
        context.hook('job.enqueued', async (data: any) => {
            await this.handleJobEvent('job.enqueued', data);
        });

        context.hook('job.started', async (data: any) => {
            await this.handleJobEvent('job.started', data);
        });

        context.hook('job.completed', async (data: any) => {
            await this.handleJobEvent('job.completed', data);
        });

        context.hook('job.failed', async (data: any) => {
            await this.handleJobEvent('job.failed', data);
        });

        context.hook('job.retried', async (data: any) => {
            await this.handleJobEvent('job.retried', data);
        });

        context.hook('job.cancelled', async (data: any) => {
            await this.handleJobEvent('job.cancelled', data);
        });

        context.hook('job.scheduled', async (data: any) => {
            await this.handleJobEvent('job.scheduled', data);
        });

        this.context?.logger.info('[Audit Log] Event listeners registered');
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

        // Emit audit event using kernel trigger system
        await this.emitEvent('audit.event.recorded', auditEntry);

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
     * Handle job events and create audit logs
     */
    private async handleJobEvent(event: string, data: any): Promise<void> {
        if (!this.config.enabled) return;

        const { jobId, id, name, attempt, error, result, status } = data;

        // Map event to audit event type
        const eventType = event as any; // Job events are extended audit event types

        // Create audit log entry
        const auditEntry: any = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            eventType,
            resource: `jobs/${jobId || id}`,
            action: event,
            success: event !== 'job.failed',
            metadata: {
                jobId: jobId || id,
                jobName: name,
                attempt,
                error,
                result,
                status,
                event,
                ...data,
            },
        };

        // Store the audit event
        await this.storage.logEvent(auditEntry);

        // Emit audit event using kernel trigger system
        await this.emitEvent('audit.event.recorded', auditEntry);

        this.context?.logger.debug(`[Audit Log] Recorded ${event} for job ${jobId || id}`);
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
     * Emit audit events using kernel trigger system
     */
    private async emitEvent(event: string, data: any): Promise<void> {
        if (this.context) {
            await this.context.trigger(event, data);
        }
    }

    /**
     * Generate unique ID for audit entries
     */
    private generateId(): string {
        return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        // Could implement retention policy cleanup here
        this.context?.logger.info('[Audit Log] Destroyed');
    }
}

/**
 * Helper function to access the audit log API from kernel
 */
export function getAuditLogAPI(kernel: any): AuditLogPlugin | null {
    try {
        return kernel.getService('audit-log');
    } catch {
        return null;
    }
}
