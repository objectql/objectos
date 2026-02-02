/**
 * Audit Log Types
 * 
 * Type definitions for the audit logging system
 */

import type { AuditEvent, AuditEventType } from '@objectstack/spec/system';

/**
 * Extended audit event types for job tracking
 */
export type ExtendedAuditEventType = AuditEventType | 
    'job.enqueued' | 
    'job.started' | 
    'job.completed' | 
    'job.failed' | 
    'job.retried' |
    'job.cancelled' |
    'job.scheduled';

/**
 * Audit Event entry for storage
 */
export interface AuditLogEntry {
    /** Unique identifier for the audit entry */
    id: string;
    /** ISO 8601 timestamp */
    timestamp: string;
    /** Event type */
    eventType: ExtendedAuditEventType;
    /** User ID who performed the action */
    userId?: string;
    /** User name for display */
    userName?: string;
    /** IP address of the request */
    ipAddress?: string;
    /** User agent string */
    userAgent?: string;
    /** Session ID */
    sessionId?: string;
    /** Resource identifier */
    resource?: string;
    /** Action performed */
    action?: string;
    /** Success status */
    success?: boolean;
    /** Additional metadata */
    metadata?: Record<string, any>;
}

/**
 * Field change record for field history tracking
 */
export interface FieldChange {
    /** Field name */
    field: string;
    /** Field label for display */
    fieldLabel?: string;
    /** Value before the change */
    oldValue: any;
    /** Value after the change */
    newValue: any;
    /** Data type of the field */
    fieldType?: string;
}

/**
 * Audit trail entry with field-level changes
 */
export interface AuditTrailEntry extends AuditLogEntry {
    /** Object/entity name */
    objectName: string;
    /** Record ID */
    recordId: string;
    /** List of field changes */
    changes?: FieldChange[];
}

/**
 * Job audit entry with job-specific data
 */
export interface JobAuditEntry extends AuditLogEntry {
    /** Job ID */
    jobId: string;
    /** Job name/type */
    jobName: string;
    /** Job attempt number */
    attempt?: number;
    /** Job error if failed */
    error?: string;
    /** Job result if completed */
    result?: any;
}

/**
 * Query options for retrieving audit logs
 */
export interface AuditQueryOptions {
    /** Filter by object name */
    objectName?: string;
    /** Filter by record ID */
    recordId?: string;
    /** Filter by field name */
    fieldName?: string;
    /** Filter by user ID */
    userId?: string;
    /** Filter by event type */
    eventType?: AuditEventType;
    /** Start date (ISO 8601) */
    startDate?: string;
    /** End date (ISO 8601) */
    endDate?: string;
    /** Maximum number of results */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
    /** Sort direction */
    sortOrder?: 'asc' | 'desc';
}

/**
 * Audit storage interface
 */
export interface AuditStorage {
    /** Store an audit event */
    logEvent(entry: AuditLogEntry): Promise<void>;
    
    /** Query audit events */
    queryEvents(options: AuditQueryOptions): Promise<AuditLogEntry[]>;
    
    /** Get field history for a specific record and field */
    getFieldHistory(objectName: string, recordId: string, fieldName: string): Promise<FieldChange[]>;
    
    /** Get audit trail for a specific record */
    getAuditTrail(objectName: string, recordId: string): Promise<AuditTrailEntry[]>;
}

/**
 * Configuration options for the audit log plugin
 */
export interface AuditLogConfig {
    /** Whether to enable audit logging */
    enabled?: boolean;
    /** Objects to audit (empty = all objects) */
    auditedObjects?: string[];
    /** Fields to exclude from auditing */
    excludedFields?: string[];
    /** Whether to track field-level changes */
    trackFieldChanges?: boolean;
    /** Retention period in days (0 = keep forever) */
    retentionDays?: number;
    /** Custom storage implementation */
    storage?: AuditStorage;
}

/**
 * Export all types
 */
export type {
    AuditEvent,
    AuditEventType,
} from '@objectstack/spec/system';
