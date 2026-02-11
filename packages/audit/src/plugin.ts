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
    PluginHealthReport,
    PluginCapabilityManifest,
    PluginSecurityManifest,
    PluginStartupResult,
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
    private startedAt?: number;

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
        this.startedAt = Date.now();

        // Register audit log service
        context.registerService('audit-log', this);

        // Set up event listeners using kernel hooks
        await this.setupEventListeners(context);

        context.logger.info('[Audit Log] Initialized successfully');

        await context.trigger('plugin.initialized', { pluginId: this.name, timestamp: new Date().toISOString() });
    }

    private retentionTimer?: ReturnType<typeof setInterval>;

    /**
     * Start plugin - Connect to databases, start servers
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Audit Log] Starting...');
        
        // Register HTTP routes for Audit API
        try {
            const httpServer = context.getService('http.server') as any;
            const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
            if (rawApp) {
                // GET /api/v1/audit/events - Query audit events
                rawApp.get('/api/v1/audit/events', async (c: any) => {
                    try {
                        const query = c.req.query();
                        const options: AuditQueryOptions = {
                            objectName: query.objectName,
                            recordId: query.recordId,
                            userId: query.userId,
                            eventType: query.eventType as AuditEventType,
                            startDate: query.startDate,
                            endDate: query.endDate,
                            limit: query.limit ? parseInt(query.limit) : undefined,
                            offset: query.offset ? parseInt(query.offset) : undefined,
                        };
                        const events = await this.queryEvents(options);
                        return c.json({ success: true, data: events });
                    } catch (error: any) {
                        context.logger.error('[Audit API] Query error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/audit/trail/:objectName/:recordId - Get audit trail
                rawApp.get('/api/v1/audit/trail/:objectName/:recordId', async (c: any) => {
                    try {
                        const objectName = c.req.param('objectName');
                        const recordId = c.req.param('recordId');
                        const trail = await this.getAuditTrail(objectName, recordId);
                        return c.json({ success: true, data: trail });
                    } catch (error: any) {
                        context.logger.error('[Audit API] Trail error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/audit/field-history/:objectName/:recordId/:fieldName - Get field history
                rawApp.get('/api/v1/audit/field-history/:objectName/:recordId/:fieldName', async (c: any) => {
                    try {
                        const objectName = c.req.param('objectName');
                        const recordId = c.req.param('recordId');
                        const fieldName = c.req.param('fieldName');
                        const history = await this.getFieldHistory(objectName, recordId, fieldName);
                        return c.json({ success: true, data: history });
                    } catch (error: any) {
                        context.logger.error('[Audit API] Field history error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                context.logger.info('[Audit Log] HTTP routes registered');
            }
        } catch (e: any) {
            context.logger.warn(`[Audit Log] Could not register HTTP routes: ${e?.message}`);
        }

        // Start retention policy cleanup if configured
        this.startRetentionCleanup();

        context.logger.info('[Audit Log] Started successfully');

        await context.trigger('plugin.started', { pluginId: this.name, timestamp: new Date().toISOString() });
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

        // Subscribe to auth events
        const authEvents = [
            'auth.login', 'auth.login_failed', 'auth.logout',
            'auth.session_created', 'auth.session_expired',
            'auth.password_reset', 'auth.password_changed',
            'auth.email_verified',
            'auth.mfa_enabled', 'auth.mfa_disabled',
            'auth.account_locked', 'auth.account_unlocked',
        ] as const;
        for (const event of authEvents) {
            context.hook(event, async (data: any) => {
                await this.handleGenericEvent(event, data);
            });
        }

        // Subscribe to authorization events
        const authzEvents = [
            'authz.permission_granted', 'authz.permission_revoked',
            'authz.role_assigned', 'authz.role_removed',
            'authz.role_created', 'authz.role_updated', 'authz.role_deleted',
            'authz.policy_created', 'authz.policy_updated', 'authz.policy_deleted',
        ] as const;
        for (const event of authzEvents) {
            context.hook(event, async (data: any) => {
                await this.handleGenericEvent(event, data);
            });
        }

        // Subscribe to system events
        const systemEvents = [
            'system.config_changed',
            'system.plugin_installed', 'system.plugin_uninstalled',
            'system.backup_created', 'system.backup_restored',
            'system.integration_added', 'system.integration_removed',
        ] as const;
        for (const event of systemEvents) {
            context.hook(event, async (data: any) => {
                await this.handleGenericEvent(event, data);
            });
        }

        // Subscribe to security events
        const securityEvents = [
            'security.access_denied', 'security.suspicious_activity',
            'security.data_breach',
            'security.api_key_created', 'security.api_key_revoked',
        ] as const;
        for (const event of securityEvents) {
            context.hook(event, async (data: any) => {
                await this.handleGenericEvent(event, data);
            });
        }

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
     * Handle generic events (auth, authz, system, security) and create audit logs
     */
    private async handleGenericEvent(event: string, data: any): Promise<void> {
        if (!this.config.enabled) return;

        const { userId, userName, ipAddress, userAgent, sessionId, resource, ...rest } = data;

        const auditEntry: AuditLogEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            eventType: event as AuditEventType,
            userId,
            userName,
            ipAddress,
            userAgent,
            sessionId,
            resource: resource || event,
            action: event,
            success: !event.includes('failed') && !event.includes('denied'),
            metadata: rest,
        };

        await this.storage.logEvent(auditEntry);
        await this.emitEvent('audit.event.recorded', auditEntry);

        this.context?.logger.debug(`[Audit Log] Recorded ${event} event`);
    }

    /**
     * Start periodic retention cleanup based on configured policy
     */
    private startRetentionCleanup(): void {
        const retention = this.config.retention;
        if (!retention?.enabled) return;

        // Default cleanup interval: every hour
        const intervalMs = 60 * 60 * 1000;

        this.retentionTimer = setInterval(async () => {
            await this.applyRetentionPolicy();
        }, intervalMs);

        // Run initial cleanup immediately
        this.applyRetentionPolicy().catch(err => {
            this.context?.logger.error('[Audit Log] Retention cleanup error:', err);
        });

        this.context?.logger.info('[Audit Log] Retention policy cleanup scheduled');
    }

    /**
     * Apply retention policy: delete expired events based on configured thresholds.
     * Per-event-type overrides are applied first, then default retention handles
     * any remaining events not covered by specific overrides.
     */
    async applyRetentionPolicy(): Promise<number> {
        const retention = this.config.retention;
        if (!retention?.enabled) return 0;

        let totalDeleted = 0;

        // Apply per-event-type retention overrides first
        const overriddenTypes = new Set<string>();
        if (retention.eventRetention) {
            for (const [eventType, days] of Object.entries(retention.eventRetention)) {
                overriddenTypes.add(eventType);
                const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
                const deleted = await this.storage.deleteExpiredEvents(cutoff, eventType);
                totalDeleted += deleted;
            }
        }

        // Apply default retention only to event types not covered by overrides
        if (retention.defaultRetentionDays && retention.defaultRetentionDays > 0) {
            const cutoff = new Date(Date.now() - retention.defaultRetentionDays * 24 * 60 * 60 * 1000).toISOString();
            const deleted = await this.storage.deleteExpiredEvents(cutoff);
            totalDeleted += deleted;
        }

        if (totalDeleted > 0) {
            this.context?.logger.info(`[Audit Log] Retention cleanup: deleted ${totalDeleted} expired events`);
        }

        return totalDeleted;
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
     * Health check
     */
    async healthCheck(): Promise<PluginHealthReport> {
        const start = Date.now();
        const status = this.config.enabled ? 'healthy' : 'degraded';
        const message = this.config.enabled ? 'Audit logging active' : 'Audit logging disabled';
        const latency = Date.now() - start;
        return {
            status,
            timestamp: new Date().toISOString(),
            message,
            metrics: {
                uptime: this.startedAt ? Date.now() - this.startedAt : 0,
                responseTime: latency,
            },
            checks: [{ name: 'audit-storage', status: status === 'healthy' ? 'passed' : 'warning', message }],
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: {
                provides: [{
                    id: 'com.objectstack.service.audit',
                    name: 'audit',
                    version: { major: 0, minor: 1, patch: 0 },
                    methods: [
                        { name: 'logEvent', description: 'Record an audit event', async: true },
                        { name: 'query', description: 'Query audit log entries', returnType: 'Promise<AuditLogEntry[]>', async: true },
                        { name: 'getTrail', description: 'Get audit trail for a record', returnType: 'Promise<AuditTrailEntry[]>', async: true },
                    ],
                    stability: 'stable',
                }],
                requires: [],
            },
            security: {
                pluginId: 'audit',
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
        if (this.retentionTimer) {
            clearInterval(this.retentionTimer);
            this.retentionTimer = undefined;
        }
        this.context?.logger.info('[Audit Log] Destroyed');

        if (this.context) {
            await this.context.trigger('plugin.destroyed', { pluginId: this.name, timestamp: new Date().toISOString() });
        }
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
