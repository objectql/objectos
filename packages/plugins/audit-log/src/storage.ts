/**
 * In-Memory Audit Storage
 * 
 * Simple in-memory storage for audit events.
 * For production use, replace with database-backed storage.
 */

import type {
    AuditStorage,
    AuditLogEntry,
    AuditQueryOptions,
    FieldChange,
    AuditTrailEntry,
} from './types';

/**
 * In-memory implementation of AuditStorage
 * 
 * This is a simple implementation for development and testing.
 * In production, use a database-backed implementation.
 */
export class InMemoryAuditStorage implements AuditStorage {
    private events: AuditLogEntry[] = [];

    /**
     * Store an audit event
     */
    async logEvent(entry: AuditLogEntry): Promise<void> {
        this.events.push({
            ...entry,
            timestamp: entry.timestamp || new Date().toISOString(),
        });
    }

    /**
     * Query audit events with filtering and pagination
     */
    async queryEvents(options: AuditQueryOptions = {}): Promise<AuditLogEntry[]> {
        let results = [...this.events];

        // Apply filters
        if (options.objectName) {
            results = results.filter(e => 
                'objectName' in e && e.objectName === options.objectName
            );
        }

        if (options.recordId) {
            results = results.filter(e => 
                'recordId' in e && e.recordId === options.recordId
            );
        }

        if (options.userId) {
            results = results.filter(e => e.userId === options.userId);
        }

        if (options.eventType) {
            results = results.filter(e => e.eventType === options.eventType);
        }

        if (options.startDate) {
            results = results.filter(e => e.timestamp >= options.startDate!);
        }

        if (options.endDate) {
            results = results.filter(e => e.timestamp <= options.endDate!);
        }

        // Sort
        const sortOrder = options.sortOrder || 'desc';
        results.sort((a, b) => {
            const comparison = a.timestamp.localeCompare(b.timestamp);
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        // Pagination
        const offset = options.offset || 0;
        const limit = options.limit || results.length;
        
        return results.slice(offset, offset + limit);
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
     * Clear all audit events (for testing)
     */
    clear(): void {
        this.events = [];
    }

    /**
     * Get count of stored events
     */
    getEventCount(): number {
        return this.events.length;
    }
}
