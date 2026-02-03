# Hook Naming Specification

> **Version:** 1.0.0  
> **Date:** 2026-02-03  
> **Status:** Active

## Overview

This document defines the standardized hook naming convention for ObjectOS plugins, based on the `@objectstack/spec` 0.9.0 event system. All plugins must use these standardized hook names to ensure consistency across the ecosystem.

## Hook Naming Convention

### General Principles

1. **Namespace-based**: All hooks use a namespace prefix (e.g., `data.`, `plugin.`, `http.`, `job.`)
2. **Temporal Clarity**: Use `before*` and `after*` prefixes to indicate timing
3. **Action-oriented**: Use verbs that clearly describe the action
4. **Lowercase with dots**: Use lowercase letters with dot separators (e.g., `data.beforeInsert`)

## Standard Hook Categories

### 1. Data Hooks

Data hooks are triggered during CRUD operations on ObjectQL entities.

| Hook Name | Trigger Point | Use Case |
|-----------|---------------|----------|
| `data.beforeInsert` | Before creating a new record | Validation, default values, authorization |
| `data.afterInsert` | After creating a new record | Audit logging, notifications, cascading updates |
| `data.beforeUpdate` | Before updating an existing record | Validation, change tracking, authorization |
| `data.afterUpdate` | After updating an existing record | Audit logging, notifications, cache invalidation |
| `data.beforeDelete` | Before deleting a record | Authorization, dependency checks |
| `data.afterDelete` | After deleting a record | Audit logging, cleanup, cascading deletes |

**Migration Notes:**
- `data.create` → Use both `data.beforeInsert` and `data.afterInsert`
- `data.update` → Use both `data.beforeUpdate` and `data.afterUpdate`
- `data.delete` → Use both `data.beforeDelete` and `data.afterDelete`
- `data.find` → Consider using `data.beforeFind` if needed (not in standard spec)

### 2. Plugin Hooks

Plugin hooks manage the plugin lifecycle.

| Hook Name | Trigger Point | Use Case |
|-----------|---------------|----------|
| `plugin.beforeInstall` | Before installing a plugin | Dependency checks, environment validation |
| `plugin.afterInstall` | After installing a plugin | Initial setup, configuration |
| `plugin.beforeEnable` | Before enabling a plugin | Pre-activation checks |
| `plugin.afterEnable` | After enabling a plugin | Start services, register routes |
| `plugin.beforeDisable` | Before disabling a plugin | Cleanup warnings, save state |
| `plugin.afterDisable` | After disabling a plugin | Stop services, unregister routes |

**Migration Notes:**
- `plugin.initialized` → Use `plugin.afterInstall` or `plugin.afterEnable`
- `plugin.destroyed` → Use `plugin.afterDisable`

### 3. HTTP Hooks

HTTP hooks handle web server and request lifecycle events.

| Hook Name | Trigger Point | Use Case |
|-----------|---------------|----------|
| `http.beforeStart` | Before HTTP server starts | Register routes, middleware setup |
| `http.afterStart` | After HTTP server starts | Logging, health checks |
| `http.beforeRequest` | Before processing each request | Authentication, rate limiting |
| `http.afterResponse` | After sending response | Logging, metrics collection |
| `http.error` | When an HTTP error occurs | Error logging, error reporting |

**Migration Notes:**
- `http.route.register` → Use `http.beforeStart`

### 4. Job Hooks

Job hooks manage background task execution.

| Hook Name | Trigger Point | Use Case |
|-----------|---------------|----------|
| `job.beforeExecute` | Before executing a job | Resource allocation, preconditions |
| `job.afterExecute` | After successfully executing a job | Cleanup, success notifications |
| `job.failed` | When a job execution fails | Error handling, retry logic, notifications |

**Migration Notes:**
- `job.enqueued` → Use `job.beforeExecute` if needed for preparation
- `job.started` → Use `job.beforeExecute`
- `job.completed` → Use `job.afterExecute`
- `job.cancelled`, `job.retried`, `job.scheduled` → Consider using `job.failed` or custom event system

## Hook Payload Standards

### Data Hook Payload

```typescript
interface DataHookPayload {
  object: string;        // Object name (e.g., 'accounts', 'contacts')
  id?: string;          // Record ID (for update/delete)
  data?: Record<string, any>;  // Record data (for insert/update)
  previousData?: Record<string, any>;  // Previous data (for update)
  userId?: string;      // User performing the action
  timestamp: string;    // ISO 8601 timestamp
}
```

### Plugin Hook Payload

```typescript
interface PluginHookPayload {
  pluginId: string;     // Plugin identifier
  version?: string;     // Plugin version
  timestamp: string;    // ISO 8601 timestamp
}
```

### HTTP Hook Payload

```typescript
interface HttpHookPayload {
  method?: string;      // HTTP method (GET, POST, etc.)
  path?: string;        // Request path
  headers?: Record<string, string>;
  body?: any;
  statusCode?: number;  // Response status code
  error?: Error;        // Error object (for http.error)
  timestamp: string;    // ISO 8601 timestamp
}
```

### Job Hook Payload

```typescript
interface JobHookPayload {
  jobId: string;        // Job identifier
  jobType: string;      // Job type/name
  data?: any;           // Job data
  error?: Error;        // Error object (for job.failed)
  duration?: number;    // Execution time in milliseconds
  timestamp: string;    // ISO 8601 timestamp
}
```

## Implementation Guidelines

### 1. Using Hooks in Plugins

```typescript
import type { Plugin, PluginContext } from '@objectstack/runtime';

export class MyPlugin implements Plugin {
  async init(context: PluginContext): Promise<void> {
    // Register hook listeners
    context.hook('data.beforeInsert', async (payload) => {
      // Validation logic
      if (!payload.data?.name) {
        throw new Error('Name is required');
      }
    });

    context.hook('data.afterInsert', async (payload) => {
      // Audit logging
      console.log(`Record created: ${payload.id}`);
    });
  }
}
```

### 2. Triggering Hooks

```typescript
// In kernel or plugin code
await context.trigger('data.beforeInsert', {
  object: 'accounts',
  data: { name: 'Acme Corp' },
  userId: 'user123',
  timestamp: new Date().toISOString()
});
```

### 3. Hook Execution Order

Hooks execute in the order they are registered:
1. All `before*` hooks execute sequentially
2. The main operation executes
3. All `after*` hooks execute sequentially

**Error Handling:**
- If a `before*` hook throws an error, the operation is aborted
- If an `after*` hook throws an error, it's logged but doesn't affect the operation

## Deprecation Timeline

| Hook Name | Deprecated | Removed |
|-----------|------------|---------|
| `data.create` | 2026-Q2 | 2027-Q1 |
| `data.update` | 2026-Q2 | 2027-Q1 |
| `data.delete` | 2026-Q2 | 2027-Q1 |
| `http.route.register` | 2026-Q2 | 2027-Q1 |
| `job.started` | 2026-Q2 | 2027-Q1 |
| `job.completed` | 2026-Q2 | 2027-Q1 |

## References

- [@objectstack/spec 0.9.0 Event System](../packages/kernel/README.md)
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- [Hook Registry](./HOOK_REGISTRY.md)

---

**Document Maintainer:** ObjectOS Core Team  
**Last Updated:** 2026-02-03
