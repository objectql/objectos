# @objectos/plugin-audit-log

Comprehensive audit logging plugin for ObjectOS. Provides event recording, audit tracking, and field history capabilities.

## Features

### ✅ 审计事件记录 (Audit Event Recording)
Automatically captures all CRUD operations (Create, Read, Update, Delete) with complete metadata.

### ✅ 审计跟踪 (Audit Tracking)
Tracks who did what, when, and where, with full context including:
- User identification (userId, userName)
- Timestamp (ISO 8601 format)
- Resource identification (objectName, recordId)
- Event type (create, update, delete, read)
- Success/failure status
- Additional metadata (IP address, user agent, session ID)

### ✅ 字段历史 (Field History)
Maintains complete field-level change history with before/after values for every update.

## Installation

```bash
pnpm add @objectos/plugin-audit-log
```

## Quick Start

### Basic Usage

```typescript
import { AuditLogPlugin } from '@objectos/plugin-audit-log';
import { ObjectOS } from '@objectos/kernel';

const os = new ObjectOS({
  plugins: [AuditLogPlugin]
});
```

### Custom Configuration

```typescript
import { createAuditLogPlugin } from '@objectos/plugin-audit-log';

const auditPlugin = createAuditLogPlugin({
  // Enable/disable audit logging
  enabled: true,
  
  // Track field-level changes
  trackFieldChanges: true,
  
  // Audit specific objects only (empty = all objects)
  auditedObjects: ['users', 'orders', 'payments'],
  
  // Exclude sensitive fields
  excludedFields: ['password', 'token', 'secret', 'apiKey'],
  
  // Retention period in days (0 = keep forever)
  retentionDays: 90,
});

const os = new ObjectOS({
  plugins: [auditPlugin]
});
```

## API Usage

### Access the Audit API

```typescript
import { getAuditLogAPI } from '@objectos/plugin-audit-log';

const auditAPI = getAuditLogAPI(app);
```

### Query Audit Events

```typescript
// Get all audit events for a user
const userEvents = await auditAPI.queryEvents({
  userId: 'user123',
  limit: 100
});

// Get events for a specific object
const orderEvents = await auditAPI.queryEvents({
  objectName: 'orders',
  eventType: 'update',
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-31T23:59:59Z'
});

// Get recent events with pagination
const recentEvents = await auditAPI.queryEvents({
  limit: 20,
  offset: 0,
  sortOrder: 'desc'
});
```

### Get Audit Trail

Get the complete audit trail for a specific record:

```typescript
const trail = await auditAPI.getAuditTrail('orders', '12345');

// Trail contains all events (create, update, delete) for this record
trail.forEach(event => {
  console.log(`${event.timestamp}: ${event.type} by ${event.userName}`);
  
  if (event.changes) {
    event.changes.forEach(change => {
      console.log(`  ${change.field}: ${change.oldValue} → ${change.newValue}`);
    });
  }
});
```

### Get Field History

Get the complete change history for a specific field:

```typescript
const statusHistory = await auditAPI.getFieldHistory(
  'orders',    // objectName
  '12345',     // recordId
  'status'     // fieldName
);

// History contains all changes to this field
statusHistory.forEach(change => {
  console.log(`${change.oldValue} → ${change.newValue}`);
});
```

## Query Options

```typescript
interface AuditQueryOptions {
  // Filter by object name
  objectName?: string;
  
  // Filter by record ID
  recordId?: string;
  
  // Filter by field name
  fieldName?: string;
  
  // Filter by user ID
  userId?: string;
  
  // Filter by event type
  eventType?: 'create' | 'read' | 'update' | 'delete';
  
  // Date range (ISO 8601)
  startDate?: string;
  endDate?: string;
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Sort order
  sortOrder?: 'asc' | 'desc';
}
```

## Event Structure

### Audit Log Entry

```typescript
interface AuditLogEntry {
  id: string;              // Unique identifier
  timestamp: string;       // ISO 8601 timestamp
  type: AuditEventType;    // 'create' | 'read' | 'update' | 'delete'
  resource: string;        // Resource identifier (e.g., 'orders/12345')
  action: string;          // Action performed
  success: boolean;        // Whether action succeeded
  userId?: string;         // User who performed the action
  userName?: string;       // User's display name
  ipAddress?: string;      // IP address
  userAgent?: string;      // User agent string
  sessionId?: string;      // Session identifier
  metadata?: object;       // Additional metadata
}
```

### Audit Trail Entry

```typescript
interface AuditTrailEntry extends AuditLogEntry {
  objectName: string;      // Object/entity name
  recordId: string;        // Record identifier
  changes?: FieldChange[]; // Field-level changes
}
```

### Field Change

```typescript
interface FieldChange {
  field: string;           // Field name
  fieldLabel?: string;     // Field label for display
  oldValue: any;           // Value before change
  newValue: any;           // Value after change
  fieldType?: string;      // Data type
}
```

## Custom Storage

By default, the plugin uses in-memory storage. For production use, implement a custom storage backend:

```typescript
import { AuditStorage } from '@objectos/plugin-audit-log';

class DatabaseAuditStorage implements AuditStorage {
  async logEvent(entry: AuditLogEntry): Promise<void> {
    // Store in database
    await db.auditLogs.insert(entry);
  }
  
  async queryEvents(options: AuditQueryOptions): Promise<AuditLogEntry[]> {
    // Query from database
    return await db.auditLogs.find(options);
  }
  
  async getFieldHistory(
    objectName: string,
    recordId: string,
    fieldName: string
  ): Promise<FieldChange[]> {
    // Retrieve field history
    const trail = await this.getAuditTrail(objectName, recordId);
    // Extract field changes...
  }
  
  async getAuditTrail(
    objectName: string,
    recordId: string
  ): Promise<AuditTrailEntry[]> {
    // Retrieve audit trail
    return await db.auditLogs.find({ objectName, recordId });
  }
}

// Use custom storage
const auditPlugin = createAuditLogPlugin({
  storage: new DatabaseAuditStorage()
});
```

## Event-Driven Integration

The plugin automatically listens for these events:

- `data.create` - Triggered on record creation
- `data.update` - Triggered on record update
- `data.delete` - Triggered on record deletion
- `data.find` - Triggered on record read (optional)

And emits these events:

- `audit.event.recorded` - When an audit event is recorded
- `audit.trail.created` - When a new audit trail is created
- `audit.field.changed` - When a field value changes

## Best Practices

### 1. Configure Audited Objects

Only audit objects that require compliance tracking to reduce storage overhead:

```typescript
createAuditLogPlugin({
  auditedObjects: ['financial_transactions', 'customer_data', 'user_accounts']
})
```

### 2. Exclude Sensitive Fields

Always exclude sensitive fields to comply with data protection regulations:

```typescript
createAuditLogPlugin({
  excludedFields: ['password', 'token', 'ssn', 'credit_card', 'api_key']
})
```

### 3. Set Retention Policy

Define a retention period to manage storage costs:

```typescript
createAuditLogPlugin({
  retentionDays: 90  // Keep audit logs for 90 days
})
```

### 4. Use Database Storage in Production

Replace in-memory storage with a persistent database backend for production deployments.

## Compliance Use Cases

### GDPR Compliance

Track who accessed or modified personal data:

```typescript
const accessLog = await auditAPI.queryEvents({
  objectName: 'customers',
  recordId: customerID,
  eventType: 'read'
});
```

### Financial Audits

Maintain complete audit trail for financial transactions:

```typescript
const transactionHistory = await auditAPI.getAuditTrail(
  'financial_transactions',
  transactionID
);
```

### Security Investigations

Investigate suspicious activities:

```typescript
const suspiciousEvents = await auditAPI.queryEvents({
  userId: suspiciousUserID,
  startDate: incidentStartTime,
  endDate: incidentEndTime
});
```

## License

AGPL-3.0

## Support

For issues and questions, please visit:
https://github.com/objectstack-ai/objectos/issues
