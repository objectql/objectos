# Integration Guide

## @objectos/plugin-audit-log Integration

This guide explains how to integrate the Audit Log plugin into your ObjectOS application.

## Prerequisites

- ObjectOS kernel (`@objectos/kernel`)
- Node.js 20+ or compatible runtime
- TypeScript 5.0+ (recommended)

## Installation Steps

### 1. Install the Package

```bash
pnpm add @objectos/plugin-audit-log
```

### 2. Import and Configure

```typescript
import { createAuditLogPlugin } from '@objectos/plugin-audit-log';
import { ObjectOS } from '@objectos/kernel';

// Create the plugin with your configuration
const auditPlugin = createAuditLogPlugin({
  enabled: true,
  trackFieldChanges: true,
  auditedObjects: ['users', 'orders', 'payments'],
  excludedFields: ['password', 'token'],
  retentionDays: 90,
});

// Add to ObjectOS
const os = new ObjectOS({
  plugins: [auditPlugin],
});
```

### 3. Verify Installation

Check that the plugin is loaded:

```typescript
// The plugin will log initialization messages
// Look for:
// [Audit Log Plugin] Installing...
// [Audit Log Plugin] Enabling...
// [Audit Log Plugin] Event listeners registered
```

## Configuration Options

### Full Configuration Example

```typescript
const auditPlugin = createAuditLogPlugin({
  // Enable or disable audit logging
  enabled: true,

  // Track field-level changes (before/after values)
  trackFieldChanges: true,

  // Specify which objects to audit
  // Empty array = audit all objects
  auditedObjects: [
    'users',
    'orders',
    'payments',
    'customer_data',
    'financial_transactions',
  ],

  // Fields to exclude from audit (sensitive data)
  excludedFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'ssn',
    'credit_card',
  ],

  // Retention period in days (0 = keep forever)
  retentionDays: 90,

  // Optional: Custom storage implementation
  // storage: new DatabaseAuditStorage(),
});
```

## Using the Audit API

### 1. Get API Instance

```typescript
import { getAuditLogAPI } from '@objectos/plugin-audit-log';

// In your application code
const auditAPI = getAuditLogAPI(app);

if (!auditAPI) {
  console.error('Audit Log plugin not enabled');
  return;
}
```

### 2. Query Audit Events

```typescript
// Get all events for a user
const userEvents = await auditAPI.queryEvents({
  userId: 'user123',
  limit: 50,
});

// Get events for a specific object type
const orderEvents = await auditAPI.queryEvents({
  objectName: 'orders',
  eventType: 'update',
});

// Get events in a date range
const events = await auditAPI.queryEvents({
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-31T23:59:59Z',
  limit: 100,
  offset: 0,
});
```

### 3. Get Audit Trail

```typescript
// Get complete history for a record
const trail = await auditAPI.getAuditTrail('orders', 'order123');

console.log('Audit Trail:');
trail.forEach(event => {
  console.log(`[${event.timestamp}] ${event.type} by ${event.userName || event.userId}`);
  
  if (event.changes) {
    event.changes.forEach(change => {
      console.log(`  ${change.field}: ${change.oldValue} → ${change.newValue}`);
    });
  }
});
```

### 4. Get Field History

```typescript
// Get all changes to a specific field
const history = await auditAPI.getFieldHistory(
  'orders',
  'order123',
  'status'
);

console.log('Status History:');
history.forEach((change, index) => {
  console.log(`Change ${index + 1}: ${change.oldValue} → ${change.newValue}`);
});
```

## Event Integration

The plugin automatically integrates with ObjectOS event system:

### Events the Plugin Listens To

```typescript
// These events trigger audit logging
'data.create'  // Record creation
'data.update'  // Record update
'data.delete'  // Record deletion
'data.find'    // Record read (optional)
```

### Events the Plugin Emits

```typescript
// Subscribe to audit events in your app
app.eventBus.on('audit.event.recorded', (event) => {
  console.log('Audit event recorded:', event);
});

app.eventBus.on('audit.trail.created', (trail) => {
  console.log('New audit trail:', trail);
});

app.eventBus.on('audit.field.changed', (change) => {
  console.log('Field changed:', change);
});
```

## Database Integration

### Implementing Custom Storage

For production use, implement persistent storage:

```typescript
import { AuditStorage, AuditLogEntry, AuditQueryOptions } from '@objectos/plugin-audit-log';

class PostgresAuditStorage implements AuditStorage {
  constructor(private db: any) {}

  async logEvent(entry: AuditLogEntry): Promise<void> {
    await this.db.query(
      `INSERT INTO audit_logs 
       (id, timestamp, type, resource, action, success, user_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.id,
        entry.timestamp,
        entry.type,
        entry.resource,
        entry.action,
        entry.success,
        entry.userId,
        JSON.stringify(entry.metadata),
      ]
    );
  }

  async queryEvents(options: AuditQueryOptions): Promise<AuditLogEntry[]> {
    // Build SQL query based on options
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (options.objectName) {
      query += ` AND metadata->>'objectName' = $${paramIndex++}`;
      params.push(options.objectName);
    }

    if (options.userId) {
      query += ` AND user_id = $${paramIndex++}`;
      params.push(options.userId);
    }

    // Add more filters...

    query += ` ORDER BY timestamp ${options.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
    
    if (options.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(options.limit);
    }

    const result = await this.db.query(query, params);
    return result.rows;
  }

  async getFieldHistory(/* ... */): Promise<FieldChange[]> {
    // Implementation
  }

  async getAuditTrail(/* ... */): Promise<AuditTrailEntry[]> {
    // Implementation
  }
}

// Use custom storage
const auditPlugin = createAuditLogPlugin({
  storage: new PostgresAuditStorage(db),
});
```

## REST API Endpoints (Example)

Add REST endpoints to expose audit functionality:

```typescript
// GET /api/audit/events
app.get('/api/audit/events', async (req, res) => {
  const auditAPI = getAuditLogAPI(app);
  
  const events = await auditAPI.queryEvents({
    objectName: req.query.objectName,
    userId: req.query.userId,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    limit: parseInt(req.query.limit) || 50,
    offset: parseInt(req.query.offset) || 0,
  });
  
  res.json(events);
});

// GET /api/audit/trail/:objectName/:recordId
app.get('/api/audit/trail/:objectName/:recordId', async (req, res) => {
  const auditAPI = getAuditLogAPI(app);
  
  const trail = await auditAPI.getAuditTrail(
    req.params.objectName,
    req.params.recordId
  );
  
  res.json(trail);
});

// GET /api/audit/field/:objectName/:recordId/:fieldName
app.get('/api/audit/field/:objectName/:recordId/:fieldName', async (req, res) => {
  const auditAPI = getAuditLogAPI(app);
  
  const history = await auditAPI.getFieldHistory(
    req.params.objectName,
    req.params.recordId,
    req.params.fieldName
  );
  
  res.json(history);
});
```

## Compliance Scenarios

### GDPR - Right to Access

```typescript
// Provide a user with all audit events about their data
async function generateGDPRReport(userId: string) {
  const auditAPI = getAuditLogAPI(app);
  
  const events = await auditAPI.queryEvents({
    userId,
    sortOrder: 'asc',
  });
  
  return {
    userId,
    eventCount: events.length,
    events: events.map(e => ({
      timestamp: e.timestamp,
      action: e.action,
      resource: e.resource,
    })),
  };
}
```

### SOX Compliance - Financial Audit Trail

```typescript
// Generate audit report for financial transactions
async function generateSOXReport(startDate: string, endDate: string) {
  const auditAPI = getAuditLogAPI(app);
  
  const events = await auditAPI.queryEvents({
    objectName: 'financial_transactions',
    startDate,
    endDate,
  });
  
  return {
    period: { startDate, endDate },
    transactionCount: events.length,
    events,
  };
}
```

## Troubleshooting

### Plugin Not Recording Events

1. Check that the plugin is enabled:
```typescript
const auditAPI = getAuditLogAPI(app);
if (!auditAPI) {
  console.error('Plugin not enabled');
}
```

2. Verify event bus is available:
```typescript
// The plugin requires app.eventBus to be present
```

3. Check configuration:
```typescript
// If auditedObjects is set, make sure your object is in the list
```

### Performance Issues

1. Limit audited objects to critical data only
2. Implement database-backed storage with indexes
3. Use retention policies to manage storage
4. Consider async event processing for high-volume systems

## Next Steps

- Implement custom storage backend for production
- Set up retention policies
- Create admin UI for viewing audit logs
- Integrate with compliance reporting tools
- Set up alerts for suspicious activities

## Support

For issues and questions:
https://github.com/objectstack-ai/objectos/issues
