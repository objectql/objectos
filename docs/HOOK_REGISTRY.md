# Hook Registry

> **Version:** 1.0.0  
> **Date:** 2026-02-03  
> **Status:** Active

## Overview

This document provides a comprehensive registry of all available hooks in the ObjectOS ecosystem, organized by namespace and including practical usage examples.

## Quick Reference

| Category | Hook Count | Primary Use Case |
|----------|------------|------------------|
| Data | 6 | CRUD operations lifecycle |
| Plugin | 6 | Plugin lifecycle management |
| HTTP | 5 | HTTP server and request handling |
| Job | 3 | Background task execution |
| **Total** | **20** | |

---

## Data Hooks

### data.beforeInsert

**Trigger:** Before creating a new record in ObjectQL

**Payload:**
```typescript
{
  object: string;       // e.g., 'accounts'
  data: Record<string, any>;
  userId?: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('data.beforeInsert', async (payload) => {
  // Auto-generate unique identifier
  if (payload.object === 'accounts' && !payload.data.accountNumber) {
    payload.data.accountNumber = generateAccountNumber();
  }
  
  // Validate required fields
  if (!payload.data.name) {
    throw new Error('Account name is required');
  }
});
```

**Used By:**
- `@objectos/plugin-audit-log` - Log creation attempts
- `@objectos/plugin-automation` - Trigger automation rules
- `@objectos/plugin-permissions` - Check create permissions

---

### data.afterInsert

**Trigger:** After successfully creating a new record

**Payload:**
```typescript
{
  object: string;
  id: string;          // The newly created record ID
  data: Record<string, any>;
  userId?: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('data.afterInsert', async (payload) => {
  // Send notification
  if (payload.object === 'leads') {
    await sendEmail({
      to: 'sales@company.com',
      subject: `New lead: ${payload.data.name}`,
      body: `A new lead has been created with ID ${payload.id}`
    });
  }
  
  // Log to audit trail
  await logAuditEvent({
    action: 'CREATE',
    object: payload.object,
    recordId: payload.id,
    userId: payload.userId
  });
});
```

**Used By:**
- `@objectos/plugin-audit-log` - Create audit trail entry
- `@objectos/plugin-automation` - Execute post-creation actions
- `@objectos/plugin-workflow` - Start workflows

---

### data.beforeUpdate

**Trigger:** Before updating an existing record

**Payload:**
```typescript
{
  object: string;
  id: string;
  data: Record<string, any>;         // New data
  previousData?: Record<string, any>; // Current data (before update)
  userId?: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('data.beforeUpdate', async (payload) => {
  // Prevent status downgrade
  if (payload.object === 'opportunities') {
    const currentStage = payload.previousData?.stage;
    const newStage = payload.data.stage;
    
    if (isStageDowngrade(currentStage, newStage)) {
      throw new Error('Cannot downgrade opportunity stage');
    }
  }
  
  // Track field changes
  const changes = detectChanges(payload.previousData, payload.data);
  if (changes.length > 0) {
    payload.data._changeHistory = changes;
  }
});
```

**Used By:**
- `@objectos/plugin-audit-log` - Track changes
- `@objectos/plugin-automation` - Trigger on field changes
- `@objectos/plugin-permissions` - Check update permissions

---

### data.afterUpdate

**Trigger:** After successfully updating a record

**Payload:**
```typescript
{
  object: string;
  id: string;
  data: Record<string, any>;
  previousData?: Record<string, any>;
  userId?: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('data.afterUpdate', async (payload) => {
  // Invalidate cache
  await cache.invalidate(`${payload.object}:${payload.id}`);
  
  // Notify related records
  if (payload.object === 'accounts' && payload.data.status === 'inactive') {
    await notifyRelatedContacts(payload.id);
  }
  
  // Trigger workflow transitions
  if (payload.data.approvalStatus === 'approved') {
    await startApprovalWorkflow(payload.id);
  }
});
```

**Used By:**
- `@objectos/plugin-audit-log` - Log updates
- `@objectos/plugin-automation` - Execute update triggers
- `@objectos/plugin-workflow` - Handle state transitions

---

### data.beforeDelete

**Trigger:** Before deleting a record

**Payload:**
```typescript
{
  object: string;
  id: string;
  userId?: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('data.beforeDelete', async (payload) => {
  // Check for dependencies
  if (payload.object === 'accounts') {
    const relatedContacts = await countRelatedRecords('contacts', {
      accountId: payload.id
    });
    
    if (relatedContacts > 0) {
      throw new Error(
        `Cannot delete account with ${relatedContacts} related contacts`
      );
    }
  }
  
  // Archive before deletion
  await archiveRecord(payload.object, payload.id);
});
```

**Used By:**
- `@objectos/plugin-audit-log` - Log deletion attempts
- `@objectos/plugin-automation` - Pre-deletion triggers
- `@objectos/plugin-permissions` - Check delete permissions

---

### data.afterDelete

**Trigger:** After successfully deleting a record

**Payload:**
```typescript
{
  object: string;
  id: string;
  userId?: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('data.afterDelete', async (payload) => {
  // Clean up related data
  if (payload.object === 'accounts') {
    await deleteRelatedRecords('activities', { accountId: payload.id });
    await deleteRelatedRecords('notes', { accountId: payload.id });
  }
  
  // Invalidate caches
  await cache.delete(`${payload.object}:${payload.id}`);
  
  // Log audit trail
  await logDeletion(payload.object, payload.id, payload.userId);
});
```

**Used By:**
- `@objectos/plugin-audit-log` - Create deletion audit entry
- `@objectos/plugin-automation` - Post-deletion cleanup

---

## Plugin Hooks

### plugin.beforeInstall

**Trigger:** Before installing a plugin

**Payload:**
```typescript
{
  pluginId: string;
  version: string;
  dependencies?: string[];
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('plugin.beforeInstall', async (payload) => {
  // Check system requirements
  const nodeVersion = process.version;
  if (!meetsRequirements(payload.pluginId, nodeVersion)) {
    throw new Error(`Plugin requires Node.js >= 18.0.0`);
  }
  
  // Verify dependencies
  for (const dep of payload.dependencies || []) {
    if (!isPluginInstalled(dep)) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  }
});
```

---

### plugin.afterInstall

**Trigger:** After successfully installing a plugin

**Payload:**
```typescript
{
  pluginId: string;
  version: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('plugin.afterInstall', async (payload) => {
  // Run initial setup
  await runPluginSetup(payload.pluginId);
  
  // Log installation
  console.log(`Plugin ${payload.pluginId} v${payload.version} installed`);
  
  // Notify administrators
  await notifyAdmins({
    event: 'plugin_installed',
    plugin: payload.pluginId,
    version: payload.version
  });
});
```

---

### plugin.beforeEnable

**Trigger:** Before enabling a plugin

**Payload:**
```typescript
{
  pluginId: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('plugin.beforeEnable', async (payload) => {
  // Validate configuration
  const config = await getPluginConfig(payload.pluginId);
  if (!config.isValid) {
    throw new Error(`Plugin ${payload.pluginId} is not properly configured`);
  }
  
  // Check for conflicts
  const conflicts = await checkPluginConflicts(payload.pluginId);
  if (conflicts.length > 0) {
    throw new Error(`Plugin conflicts with: ${conflicts.join(', ')}`);
  }
});
```

---

### plugin.afterEnable

**Trigger:** After successfully enabling a plugin

**Payload:**
```typescript
{
  pluginId: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('plugin.afterEnable', async (payload) => {
  // Start plugin services
  await startPluginServices(payload.pluginId);
  
  // Register routes
  await registerPluginRoutes(payload.pluginId);
  
  // Log activation
  console.log(`Plugin ${payload.pluginId} is now active`);
});
```

---

### plugin.beforeDisable

**Trigger:** Before disabling a plugin

**Payload:**
```typescript
{
  pluginId: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('plugin.beforeDisable', async (payload) => {
  // Warn about dependent plugins
  const dependents = await getPluginDependents(payload.pluginId);
  if (dependents.length > 0) {
    console.warn(
      `Warning: Disabling ${payload.pluginId} will affect: ${dependents.join(', ')}`
    );
  }
  
  // Save plugin state
  await savePluginState(payload.pluginId);
});
```

---

### plugin.afterDisable

**Trigger:** After successfully disabling a plugin

**Payload:**
```typescript
{
  pluginId: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('plugin.afterDisable', async (payload) => {
  // Stop services
  await stopPluginServices(payload.pluginId);
  
  // Unregister routes
  await unregisterPluginRoutes(payload.pluginId);
  
  // Clean up resources
  await cleanupPluginResources(payload.pluginId);
  
  console.log(`Plugin ${payload.pluginId} has been disabled`);
});
```

---

## HTTP Hooks

### http.beforeStart

**Trigger:** Before the HTTP server starts

**Payload:**
```typescript
{
  port?: number;
  host?: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('http.beforeStart', async (payload) => {
  // Register routes from plugins
  app.post('/api/auth/*', betterAuthHandler);
  app.use('/api/graphql', graphqlHandler);
  
  // Setup middleware
  app.use(cors());
  app.use(helmet());
  app.use(rateLimit());
  
  console.log(`Server will start on ${payload.host}:${payload.port}`);
});
```

**Used By:**
- `@objectos/plugin-better-auth` - Register authentication routes
- `@objectos/plugin-server` - Setup HTTP middleware

---

### http.afterStart

**Trigger:** After the HTTP server has started

**Payload:**
```typescript
{
  port: number;
  host: string;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('http.afterStart', async (payload) => {
  console.log(`✅ Server is running at http://${payload.host}:${payload.port}`);
  
  // Register with service discovery
  await registerService({
    name: 'objectos-api',
    url: `http://${payload.host}:${payload.port}`
  });
  
  // Start health check monitoring
  startHealthCheckMonitoring();
});
```

---

### http.beforeRequest

**Trigger:** Before processing each HTTP request

**Payload:**
```typescript
{
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('http.beforeRequest', async (payload) => {
  // Authenticate request
  const token = payload.headers.authorization?.replace('Bearer ', '');
  const user = await validateToken(token);
  
  if (!user && !isPublicRoute(payload.path)) {
    throw new Error('Unauthorized');
  }
  
  // Rate limiting
  const limitKey = user?.id || payload.headers['x-forwarded-for'];
  if (await isRateLimited(limitKey)) {
    throw new Error('Rate limit exceeded');
  }
  
  // Request logging
  console.log(`${payload.method} ${payload.path} - User: ${user?.id || 'anonymous'}`);
});
```

---

### http.afterResponse

**Trigger:** After sending an HTTP response

**Payload:**
```typescript
{
  method: string;
  path: string;
  statusCode: number;
  duration?: number;  // Request duration in ms
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('http.afterResponse', async (payload) => {
  // Metrics collection
  metrics.recordRequest({
    method: payload.method,
    path: payload.path,
    status: payload.statusCode,
    duration: payload.duration
  });
  
  // Performance monitoring
  if (payload.duration && payload.duration > 1000) {
    console.warn(`Slow request: ${payload.method} ${payload.path} took ${payload.duration}ms`);
  }
  
  // Access logging
  accessLog.write(
    `${new Date().toISOString()} ${payload.method} ${payload.path} ${payload.statusCode} ${payload.duration}ms\n`
  );
});
```

---

### http.error

**Trigger:** When an HTTP error occurs

**Payload:**
```typescript
{
  method: string;
  path: string;
  statusCode: number;
  error: Error;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('http.error', async (payload) => {
  // Error logging
  console.error(`HTTP Error: ${payload.method} ${payload.path}`, {
    status: payload.statusCode,
    message: payload.error.message,
    stack: payload.error.stack
  });
  
  // Error reporting
  if (payload.statusCode >= 500) {
    await reportError({
      error: payload.error,
      context: {
        method: payload.method,
        path: payload.path,
        status: payload.statusCode
      }
    });
  }
  
  // Alert on critical errors
  if (payload.statusCode === 500) {
    await alertOps('Critical server error detected');
  }
});
```

---

## Job Hooks

### job.beforeExecute

**Trigger:** Before executing a background job

**Payload:**
```typescript
{
  jobId: string;
  jobType: string;
  data?: any;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('job.beforeExecute', async (payload) => {
  // Check prerequisites
  if (payload.jobType === 'email-campaign') {
    const emailService = await checkEmailService();
    if (!emailService.isAvailable) {
      throw new Error('Email service is unavailable');
    }
  }
  
  // Allocate resources
  await allocateJobResources(payload.jobId);
  
  // Log job start
  console.log(`Starting job ${payload.jobId} of type ${payload.jobType}`);
});
```

**Used By:**
- `@objectos/plugin-jobs` - Prepare job execution environment
- `@objectos/plugin-audit-log` - Log job execution attempts

---

### job.afterExecute

**Trigger:** After successfully executing a job

**Payload:**
```typescript
{
  jobId: string;
  jobType: string;
  data?: any;
  result?: any;
  duration: number;  // Execution time in ms
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('job.afterExecute', async (payload) => {
  // Release resources
  await releaseJobResources(payload.jobId);
  
  // Log completion
  console.log(
    `Job ${payload.jobId} completed in ${payload.duration}ms with result:`,
    payload.result
  );
  
  // Update metrics
  metrics.recordJobExecution({
    type: payload.jobType,
    duration: payload.duration,
    success: true
  });
  
  // Trigger dependent jobs
  if (payload.jobType === 'data-import') {
    await enqueueJob('data-validation', { importId: payload.result.importId });
  }
});
```

**Used By:**
- `@objectos/plugin-jobs` - Clean up after job completion
- `@objectos/plugin-audit-log` - Log successful job execution

---

### job.failed

**Trigger:** When a job execution fails

**Payload:**
```typescript
{
  jobId: string;
  jobType: string;
  data?: any;
  error: Error;
  retryCount?: number;
  timestamp: string;
}
```

**Example:**
```typescript
context.hook('job.failed', async (payload) => {
  // Error logging
  console.error(`Job ${payload.jobId} failed:`, {
    type: payload.jobType,
    error: payload.error.message,
    retries: payload.retryCount || 0
  });
  
  // Retry logic
  if ((payload.retryCount || 0) < 3) {
    const delay = Math.pow(2, payload.retryCount || 0) * 1000; // Exponential backoff
    await scheduleJobRetry(payload.jobId, delay);
    console.log(`Job ${payload.jobId} will retry in ${delay}ms`);
  } else {
    // Move to dead letter queue
    await moveToDeadLetterQueue(payload.jobId);
    
    // Alert administrators
    await alertAdmins({
      subject: `Job ${payload.jobType} failed permanently`,
      body: `Job ${payload.jobId} has failed after ${payload.retryCount} retries: ${payload.error.message}`
    });
  }
  
  // Record metrics
  metrics.recordJobFailure({
    type: payload.jobType,
    error: payload.error.name,
    retries: payload.retryCount || 0
  });
});
```

**Used By:**
- `@objectos/plugin-jobs` - Handle job failures and retries
- `@objectos/plugin-audit-log` - Log job failures

---

## Hook Usage Statistics

### Most Used Hooks

1. `data.afterInsert` - Used by audit-log, automation, workflow plugins
2. `data.afterUpdate` - Used by audit-log, automation, workflow plugins
3. `http.beforeRequest` - Used by better-auth, permissions plugins
4. `job.failed` - Used by jobs, audit-log plugins

### Hook Execution Performance

| Hook | Avg Execution Time | Max Listeners |
|------|-------------------|---------------|
| `data.beforeInsert` | < 10ms | 5 |
| `data.afterInsert` | < 50ms | 8 |
| `data.beforeUpdate` | < 10ms | 5 |
| `data.afterUpdate` | < 50ms | 8 |
| `http.beforeRequest` | < 5ms | 3 |
| `job.beforeExecute` | < 20ms | 4 |

---

## Testing Hooks

### Unit Testing Example

```typescript
import { createMockContext } from '@objectstack/runtime/testing';

describe('Hook Listeners', () => {
  it('should validate data before insert', async () => {
    const context = createMockContext();
    const plugin = new MyPlugin();
    
    await plugin.init(context);
    
    // Trigger hook
    await expect(
      context.trigger('data.beforeInsert', {
        object: 'accounts',
        data: { /* missing required fields */ },
        timestamp: new Date().toISOString()
      })
    ).rejects.toThrow('Name is required');
  });
});
```

### Integration Testing Example

```typescript
describe('Hook Integration', () => {
  it('should execute all hooks in order', async () => {
    const executionOrder: string[] = [];
    
    context.hook('data.beforeInsert', async () => {
      executionOrder.push('before-1');
    });
    
    context.hook('data.beforeInsert', async () => {
      executionOrder.push('before-2');
    });
    
    await context.trigger('data.beforeInsert', payload);
    
    expect(executionOrder).toEqual(['before-1', 'before-2']);
  });
});
```

---

## Best Practices

1. **Keep Hooks Fast**: Hooks should execute quickly (< 100ms). Use async jobs for long-running tasks.
2. **Error Handling**: Always catch and handle errors appropriately in hook listeners.
3. **Idempotency**: Design hooks to be idempotent when possible.
4. **Documentation**: Document what hooks your plugin listens to and triggers.
5. **Testing**: Always test hook listeners and triggers.

## See Also

- [Hook Naming Specification](./HOOK_NAMING_SPECIFICATION.md)
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- [@objectstack/spec Documentation](../packages/kernel/README.md)

---

**Document Maintainer:** ObjectOS Core Team  
**Last Updated:** 2026-02-03
