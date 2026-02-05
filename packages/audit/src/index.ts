/**
 * @objectos/plugin-audit-log
 * 
 * Audit logging plugin for ObjectOS
 * 
 * Features:
 * - 审计事件记录 (Audit Event Recording): Automatically records all CRUD operations
 * - 审计跟踪 (Audit Tracking): Tracks who did what, when, and where
 * - 字段历史 (Field History): Maintains field-level change history
 * 
 * @example
 * ```typescript
 * import { AuditLogPlugin, createAuditLogPlugin } from '@objectos/plugin-audit-log';
 * 
 * // Use default plugin
 * const os = new ObjectOS({
 *   plugins: [AuditLogPlugin]
 * });
 * 
 * // Or create with custom configuration
 * const customAuditPlugin = createAuditLogPlugin({
 *   enabled: true,
 *   trackFieldChanges: true,
 *   auditedObjects: ['users', 'orders', 'payments'],
 *   excludedFields: ['password', 'token'],
 *   retentionDays: 90
 * });
 * ```
 * 
 * @example
 * ```typescript
 * // Query audit events
 * import { getAuditLogAPI } from '@objectos/plugin-audit-log';
 * 
 * const auditAPI = getAuditLogAPI(app);
 * 
 * // Get audit trail for a record
 * const trail = await auditAPI.getAuditTrail('orders', '12345');
 * 
 * // Get field history
 * const history = await auditAPI.getFieldHistory('orders', '12345', 'status');
 * 
 * // Query events with filters
 * const events = await auditAPI.queryEvents({
 *   objectName: 'orders',
 *   userId: 'user123',
 *   eventType: 'update',
 *   startDate: '2026-01-01T00:00:00Z',
 *   limit: 100
 * });
 * ```
 */

export {
    AuditLogPlugin,
    getAuditLogAPI,
} from './plugin.js';

export {
    InMemoryAuditStorage,
} from './storage.js';

export type {
    AuditLogConfig,
    AuditLogEntry,
    AuditTrailEntry,
    JobAuditEntry,
    FieldChange,
    AuditQueryOptions,
    AuditStorage,
    AuditEvent,
    AuditEventType,
    ExtendedAuditEventType,
} from './types.js';
