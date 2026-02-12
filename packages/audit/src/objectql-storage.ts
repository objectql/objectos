/**
 * ObjectQL Audit Storage Implementation
 * 
 * Storage adapter that persists audit events to ObjectOS/ObjectQL database
 */

import type { PluginContext } from '@objectstack/runtime';
import type {
    AuditStorage,
    AuditLogEntry,
    AuditQueryOptions,
    FieldChange,
    AuditTrailEntry,
} from './types.js';

export class ObjectQLAuditStorage implements AuditStorage {
    private context: PluginContext;

    constructor(context: PluginContext) {
        this.context = context;
    }

    /**
     * Store an audit event
     */
    async logEvent(entry: AuditLogEntry): Promise<void> {
        await (this.context as any).broker.call('data.create', {
            object: 'audit_log',
            doc: {
                event_type: entry.eventType,
                object_name: (entry as any).objectName,
                record_id: (entry as any).recordId,
                user_id: entry.userId,
                timestamp: entry.timestamp || new Date().toISOString(),
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                session_id: entry.sessionId,
                changes: (entry as any).changes,
                metadata: entry.metadata,
            }
        });
    }

    /**
     * Query audit events with filtering and pagination
     */
    async queryEvents(options: AuditQueryOptions = {}): Promise<AuditLogEntry[]> {
        const query: any = {};

        // Apply filters
        if (options.objectName) {
            query.object_name = options.objectName;
        }
        if (options.recordId) {
            query.record_id = options.recordId;
        }
        if (options.userId) {
            query.user_id = options.userId;
        }
        if (options.eventType) {
            query.event_type = options.eventType;
        }
        if (options.startDate) {
            query.timestamp = { $gte: options.startDate };
        }
        if (options.endDate) {
            if (query.timestamp) {
                query.timestamp.$lte = options.endDate;
            } else {
                query.timestamp = { $lte: options.endDate };
            }
        }

        // Sort
        const sortOrder = options.sortOrder || 'desc';
        const sort = sortOrder === 'asc' ? 'timestamp' : '-timestamp';

        // Query
        const results = await (this.context as any).broker.call('data.find', {
            object: 'audit_log',
            query: query,
            sort: sort,
            limit: options.limit,
            skip: options.offset,
        });

        return results.map((doc: any) => this.mapDocToAuditEntry(doc));
    }

    /**
     * Get field history for a specific record and field
     */
    async getFieldHistory(
        objectName: string,
        recordId: string,
        fieldName: string
    ): Promise<FieldChange[]> {
        const auditTrail = await this.getAuditTrail(objectName, recordId);
        const fieldChanges: FieldChange[] = [];

        // Reverse to get chronological order (oldest first)
        const chronologicalTrail = [...auditTrail].reverse();
        
        for (const entry of chronologicalTrail) {
            if (entry.changes) {
                const change = entry.changes.find(c => c.field === fieldName);
                if (change) {
                    fieldChanges.push(change);
                }
            }
        }

        return fieldChanges;
    }

    /**
     * Get audit trail for a specific record
     */
    async getAuditTrail(
        objectName: string,
        recordId: string
    ): Promise<AuditTrailEntry[]> {
        const events = await this.queryEvents({ objectName, recordId });
        return events as AuditTrailEntry[];
    }

    /**
     * Delete events with timestamp before the given date
     * Optionally filter by event type
     */
    async deleteExpiredEvents(before: string, eventType?: string): Promise<number> {
        const query: any = {
            timestamp: { $lt: before }
        };
        
        if (eventType) {
            query.event_type = eventType;
        }

        const toDelete = await (this.context as any).broker.call('data.find', {
            object: 'audit_log',
            query: query,
        });

        for (const doc of toDelete) {
            await (this.context as any).broker.call('data.delete', {
                object: 'audit_log',
                id: doc._id || doc.id,
            });
        }

        return toDelete.length;
    }

    /**
     * Map document to AuditLogEntry
     */
    private mapDocToAuditEntry(doc: any): AuditLogEntry {
        const base = {
            eventType: doc.event_type,
            userId: doc.user_id,
            timestamp: doc.timestamp,
            ipAddress: doc.ip_address,
            userAgent: doc.user_agent,
            sessionId: doc.session_id,
            metadata: doc.metadata,
        };

        // Add objectName and recordId if present (for AuditTrailEntry)
        if (doc.object_name) {
            (base as any).objectName = doc.object_name;
        }
        if (doc.record_id) {
            (base as any).recordId = doc.record_id;
        }
        if (doc.changes) {
            (base as any).changes = doc.changes;
        }

        return base as AuditLogEntry;
    }
}
