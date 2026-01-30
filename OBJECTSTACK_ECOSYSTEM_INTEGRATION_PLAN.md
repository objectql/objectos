# ObjectStack Ecosystem Integration Plan
## ObjectOS as the OS Sub-Project

**Document Version:** 1.0  
**Date:** 2026-01-30  
**Status:** Planning Phase  
**Author:** ObjectOS Lead Architect

---

## Executive Summary

This document outlines a comprehensive plan to optimize ObjectOS for seamless integration into the @objectstack ecosystem as the **OS (Operating System) sub-project**. ObjectOS serves as the "Business Operating System" - handling **State Management, Identity, Synchronization, and Orchestration** - while ObjectQL manages Data and ObjectUI manages Views.

### Current State Assessment

**Strengths:**
- ✅ Micro-kernel architecture with plugin system
- ✅ Full compliance with @objectstack/spec v0.6.1
- ✅ Dual-layer plugin architecture (kernel + runtime)
- ✅ Rich plugin context API with 10+ service categories
- ✅ Event-driven inter-plugin communication
- ✅ Two production plugins (audit-log, better-auth)

**Gaps Identified:**
- ⚠️ No plugin marketplace or discovery mechanism
- ⚠️ Missing ecosystem-wide type registry
- ⚠️ Limited cross-project integration patterns
- ⚠️ Plugin dependency resolution incomplete
- ⚠️ No hot-reload for plugins in production
- ⚠️ Manifest validation not enforced

### Vision

Transform ObjectOS into the **central orchestration layer** of the ObjectStack ecosystem, enabling:
1. **Plugin Marketplace** - Discover and install ecosystem plugins
2. **Cross-Project Integration** - Seamless communication between ObjectQL, ObjectOS, and ObjectUI
3. **Unified Type System** - Shared types across the entire stack
4. **Event Protocol** - Ecosystem-wide event bus for real-time sync
5. **Developer Platform** - Tools for building and publishing plugins

---

## Part 1: Architecture Analysis

### 1.1 Current Plugin Architecture

#### Layer 1: Kernel-Level Plugins (@objectos/kernel)

**Purpose:** Full-featured enterprise plugins with lifecycle management

**Key Components:**
```typescript
// Manifest (Configuration)
ObjectStackManifest {
  id: "com.company.plugin-name"
  version: "1.0.0"
  type: "plugin"
  permissions: ["data.read", "data.write"]
  objects: ["./objects/*.object.yml"]
  contributes: {
    actions: Action[]
    events: EventDefinition[]
    fieldTypes: FieldType[]
  }
}

// Definition (Code)
PluginDefinition {
  async onInstall(context: PluginContext)   // First-time setup
  async onEnable(context: PluginContext)    // Activation
  async onLoad(context: PluginContext)      // Metadata registration
  async onDisable(context: PluginContext)   // Deactivation
  async onUninstall(context: PluginContext) // Cleanup
}
```

**Plugin Context API (10 Service Categories):**
1. **Data Access** - `context.ql.object()`, `context.ql.query()`
2. **System API** - `context.os.getCurrentUser()`, `context.os.getConfig()`
3. **Logging** - `context.logger.{debug,info,warn,error}`
4. **Storage** - `context.storage.{get,set,delete}` (scoped per plugin)
5. **i18n** - `context.i18n.t()`, `context.i18n.getLocale()`
6. **Events** - `context.events.{on,emit}`
7. **HTTP Router** - `context.app.router.{get,post,put,patch,delete}`
8. **Scheduler** - `context.app.scheduler.schedule()`
9. **Metadata** - `context.metadata.{getObject,listObjects}`
10. **Drivers** - `context.drivers.{get,register}` (framework only)

**Implementation Files:**
- `packages/kernel/src/plugin-manager.ts` - 268 lines, lifecycle orchestration
- `packages/kernel/src/plugin-context.ts` - 341 lines, context builder
- `packages/kernel/src/scoped-storage.ts` - Plugin-isolated KV storage
- `packages/kernel/src/plugins/objectql.ts` - Object definition loader

#### Layer 2: Runtime-Level Micro-Plugins (@objectstack/runtime)

**Purpose:** Lightweight plugins for core infrastructure services

**Interface:**
```typescript
interface Plugin {
  name: string
  version?: string
  dependencies?: string[]
  
  async init(ctx: PluginContext): Promise<void>    // Register services
  async start(ctx: PluginContext): Promise<void>   // Initialize
  async destroy(): Promise<void>                   // Cleanup
}

interface PluginContext {
  registerService(name: string, service: any): void
  getService<T>(name: string): T
  hasService(name: string): boolean
  hook(name: string, handler: Function): void
  trigger(name: string, ...args: any[]): Promise<void>
  logger: Logger
}
```

**Implementation:**
- `packages/runtime/src/kernel.ts` - Micro-kernel with dependency resolution
- `packages/runtime/src/plugin-context.ts` - Simplified context
- `packages/runtime/src/plugins/objectql-plugin.ts` - ObjectQL service wrapper
- `packages/runtime/src/plugins/driver-plugin.ts` - Database driver wrapper

**Topological Sort for Dependencies:**
- Resolves plugin initialization order
- Detects circular dependencies
- Fails fast on missing dependencies

### 1.2 Ecosystem Integration Points

#### @objectstack/spec Compliance

**Current Version:** 0.6.1

**Type Definitions Used:**
```typescript
import {
  ObjectStackManifest,
  PluginDefinition,
  PluginContextData,
  AuditEventType,
  KernelContext,
  ServiceObject,
  Field,
  QueryAST,
  Hook
} from '@objectstack/spec';
```

**Protocol Namespaces:**
1. **Data Protocol** - Object schemas, fields, queries, hooks
2. **Kernel Protocol** - Plugin lifecycle, manifests, context
3. **System Protocol** - Audit logging, events, jobs
4. **UI Protocol** - App configurations, views, dashboards
5. **API Protocol** - Endpoint contracts, connectivity

#### Cross-Project Dependencies

**ObjectQL (Data Layer):**
```json
{
  "@objectql/core": "^3.0.1",
  "@objectql/types": "^3.0.1",
  "@objectql/driver-sql": "^3.0.1",
  "@objectql/driver-mongo": "^3.0.1",
  "@objectql/platform-node": "^3.0.1"
}
```

**ObjectStack Spec:**
```json
{
  "@objectstack/spec": "0.6.1",
  "@objectstack/runtime": "0.6.1",
  "@objectstack/objectql": "0.6.1"
}
```

**Patched Dependencies:**
```json
{
  "patchedDependencies": {
    "@objectstack/objectql@0.6.1": "patches/@objectstack__objectql@0.6.1.patch",
    "@objectstack/runtime@0.6.1": "patches/@objectstack__runtime@0.6.1.patch"
  }
}
```

### 1.3 Plugin Examples Analysis

#### Audit Log Plugin

**Location:** `packages/plugins/audit-log/`

**Manifest:**
```typescript
{
  id: "com.objectos.audit-log",
  version: "0.1.0",
  type: "plugin",
  permissions: [
    "data.read",
    "data.write",
    "events.subscribe"
  ],
  contributes: {
    events: [
      "audit.event.recorded",
      "audit.event.exported"
    ]
  }
}
```

**Features:**
- Listens to `data.create`, `data.update`, `data.delete`, `data.find` events
- Records all data operations to `_audit_log` object
- Provides field-level history tracking
- Exports audit trails in CSV/JSON formats

**Integration Pattern:**
```typescript
async onLoad(context) {
  // Subscribe to data events
  context.events.on('data.create', async (event) => {
    await this.recordAudit(context, 'create', event);
  });
  
  // Expose API
  context.registerService('audit-log', {
    query: (filters) => context.ql.query('_audit_log', filters),
    export: (format) => this.exportAuditTrail(format)
  });
}
```

#### Better-Auth Plugin

**Location:** `packages/plugins/better-auth/`

**Manifest:**
```typescript
{
  id: "com.objectos.auth.better-auth",
  version: "0.1.0",
  permissions: [
    "auth.manage",
    "routes.mount"
  ],
  contributes: {
    events: [
      "auth.user.login",
      "auth.user.logout",
      "auth.session.created"
    ]
  }
}
```

**Features:**
- Email/password authentication
- RBAC (Role-Based Access Control)
- Organization management
- Session management
- OIDC/SAML integration hooks

**Integration Pattern:**
```typescript
async onEnable(context) {
  // Mount auth routes
  context.app.router.all('/api/auth/*', betterAuthHandler);
  
  // Expose authentication service
  context.registerService('auth', {
    getUser: () => getCurrentUser(),
    checkPermission: (userId, permission) => hasPermission(userId, permission)
  });
  
  // Emit events
  context.events.emit('auth.user.login', { userId, timestamp });
}
```

---

## Part 2: Gap Analysis

### 2.1 Kernel-Level Gaps

#### Gap 1: Plugin Dependency Resolution (Incomplete)

**Current State:**
- Framework sketched in `plugin-manager.ts`
- Topological sort algorithm implemented in runtime
- No enforcement in kernel-level plugins

**Issues:**
- Plugins can declare dependencies but they're not validated
- No version compatibility checking (e.g., `plugin-a@^1.0.0`)
- Missing plugins fail silently at runtime, not at load time

**Impact:** High - Causes runtime failures when plugins depend on missing services

**Recommendation:**
```typescript
// Add to PluginManager
async validateDependencies(manifest: ObjectStackManifest): Promise<void> {
  for (const dep of manifest.dependencies || []) {
    const { name, version } = parseDependency(dep);
    const plugin = this.getPlugin(name);
    
    if (!plugin) {
      throw new Error(`Missing dependency: ${name}. Install it using 'npm install @objectos/plugin-${name}' or add it to your dependencies.`);
    }
    
    if (!semverSatisfies(plugin.version, version)) {
      throw new Error(`Version conflict: ${name} requires ${version}, got ${plugin.version}`);
    }
  }
}
```

#### Gap 2: Manifest Validation (Not Enforced)

**Current State:**
- `ObjectStackManifest` type defined in @objectstack/spec
- No runtime validation when loading plugins
- Malformed manifests can crash the system

**Issues:**
- Plugin IDs not validated (e.g., must match reverse DNS format)
- Permissions list not validated against known permissions
- Object paths not validated (may reference non-existent files)

**Impact:** Medium - Security risk and poor developer experience

**Recommendation:**
```typescript
import { ObjectStackManifestSchema } from '@objectstack/spec';

async loadPlugin(manifest: unknown): Promise<void> {
  // Validate manifest structure
  const validManifest = ObjectStackManifestSchema.parse(manifest);
  
  // Validate plugin ID format
  if (!/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/.test(validManifest.id)) {
    throw new Error(`Invalid plugin ID: ${validManifest.id}`);
  }
  
  // Validate permissions
  for (const perm of validManifest.permissions || []) {
    if (!KNOWN_PERMISSIONS.has(perm)) {
      console.warn(`Unknown permission: ${perm}`);
    }
  }
  
  // ... rest of loading logic
}
```

#### Gap 3: Hot Reload (Development Only)

**Current State:**
- No hot-reload mechanism for plugins
- Server restart required for any plugin change
- Slows development iteration

**Issues:**
- Poor DX (Developer Experience)
- Can't update plugins in production without downtime
- No A/B testing for plugin versions

**Impact:** Medium - Reduces development velocity

**Recommendation:**
```typescript
class PluginManager {
  async reloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    
    // 1. Disable old version
    await plugin.definition.onDisable?.(plugin.context);
    
    // 2. Clear require cache
    this.clearModuleCache(plugin.manifest.main);
    
    // 3. Reload manifest and definition
    const newManifest = await this.loadManifest(plugin.path);
    const newDefinition = await this.loadDefinition(plugin.path);
    
    // 4. Re-enable new version
    await newDefinition.onEnable?.(plugin.context);
    
    this.plugins.set(pluginId, { manifest: newManifest, definition: newDefinition });
    
    this.logger.info(`Reloaded plugin: ${pluginId}`);
  }
}
```

#### Gap 4: Driver Registry (Framework Only)

**Current State:**
- `context.drivers.get()`, `context.drivers.register()` defined
- No implementation in `plugin-context.ts`
- Drivers are manually passed to ObjectQL

**Issues:**
- Plugins can't register custom database drivers
- No multi-tenancy support (tenant-specific drivers)
- Hard to swap drivers at runtime

**Impact:** Medium - Limits extensibility

**Recommendation:**
```typescript
class DriverRegistry {
  private drivers = new Map<string, ObjectQLDriver>();
  
  register(name: string, driver: ObjectQLDriver): void {
    this.drivers.set(name, driver);
    this.logger.info(`Registered driver: ${name}`);
  }
  
  get(name: string): ObjectQLDriver {
    const driver = this.drivers.get(name);
    if (!driver) {
      const driverList = this.list().join(', ');
      const message = driverList 
        ? `Driver not found: ${name}. Available drivers: ${driverList}. Register a driver using drivers.register().`
        : `Driver not found: ${name}. No drivers registered. Register a driver using drivers.register().`;
      throw new Error(message);
    }
    return driver;
  }
  
  list(): string[] {
    return Array.from(this.drivers.keys());
  }
}
```

#### Gap 5: Error Handling & Diagnostics

**Current State:**
- Basic error logging via `context.logger`
- No structured error reporting
- No plugin health monitoring

**Issues:**
- Hard to debug plugin failures
- No metrics on plugin performance
- Can't identify misbehaving plugins

**Impact:** High - Reduces observability in production

**Recommendation:**
```typescript
interface PluginMetrics {
  id: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastError?: Error;
  eventCount: number;
  avgResponseTime: number;
  uptime: number;
}

class PluginMonitor {
  async getMetrics(pluginId: string): Promise<PluginMetrics> {
    // Collect metrics from event bus, service calls, etc.
  }
  
  async healthCheck(pluginId: string): Promise<boolean> {
    // Run plugin-specific health check
  }
}
```

### 2.2 Ecosystem Integration Gaps

#### Gap 6: Plugin Discovery & Marketplace

**Current State:**
- Plugins are manually installed in `node_modules/@objectos/plugin-*`
- No plugin registry or marketplace
- No versioning strategy beyond npm

**Issues:**
- Can't discover available plugins
- No quality metrics (downloads, ratings, etc.)
- No search functionality

**Impact:** High - Limits ecosystem growth

**Recommendation:**
```typescript
interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  downloads: number;
  rating: number;
  tags: string[];
  screenshots: string[];
  repository: string;
  license: string;
}

class PluginMarketplace {
  async search(query: string, filters?: {
    tags?: string[];
    minRating?: number;
  }): Promise<PluginMetadata[]> {
    // Query marketplace API
  }
  
  async install(pluginId: string, version?: string): Promise<void> {
    // Download and install plugin
  }
  
  async publish(manifest: ObjectStackManifest, tarball: Buffer): Promise<void> {
    // Publish to marketplace
  }
}
```

#### Gap 7: Cross-Project Type Sharing

**Current State:**
- Types defined in @objectstack/spec
- Each project (ObjectQL, ObjectOS, ObjectUI) has separate types
- No unified type registry

**Issues:**
- Type duplication across projects
- Inconsistent field type definitions
- Hard to add custom field types across the stack

**Impact:** Medium - Increases maintenance burden

**Recommendation:**
```typescript
// @objectstack/types (new package)
export interface FieldTypeDefinition {
  name: string;
  validate: (value: any) => boolean;
  format: (value: any) => string;
  parse: (input: string) => any;
  
  // UI-specific
  component?: string; // React component for ObjectUI
  
  // Storage-specific
  dbType?: string;    // SQL type for ObjectQL drivers
}

class TypeRegistry {
  registerFieldType(type: FieldTypeDefinition): void {
    // Available to ObjectQL (validation), ObjectOS (hooks), ObjectUI (rendering)
  }
}
```

#### Gap 8: Ecosystem Event Protocol

**Current State:**
- Event bus within ObjectOS only
- No cross-project event propagation
- Events don't reach ObjectUI for real-time updates

**Issues:**
- ObjectUI can't subscribe to data changes
- No real-time notifications
- Polling required for UI updates

**Impact:** High - Prevents real-time features

**Recommendation:**
```typescript
// @objectstack/events (new package)
interface EcosystemEvent {
  source: 'objectql' | 'objectos' | 'objectui';
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
  tenantId?: string;
}

class EcosystemEventBus {
  // Publishes to Redis/NATS for cross-process communication
  async publish(event: EcosystemEvent): Promise<void>;
  
  // Subscribes to events from any source
  subscribe(pattern: string, handler: (event: EcosystemEvent) => void): void;
}
```

#### Gap 9: ObjectUI Integration

**Current State:**
- ObjectUI is a separate project
- No formal integration protocol
- UI fetches metadata via REST API

**Issues:**
- No type safety between backend and frontend
- Manual API client generation
- No auto-generated forms/grids from metadata

**Impact:** Medium - Increases development time for UI features

**Recommendation:**
```typescript
// packages/kernel/src/ui-bridge.ts
class UIBridge {
  async getAppConfig(appId: string): Promise<UIApp> {
    // Generate ObjectUI app config from ObjectOS metadata
  }
  
  async generateTypeScript(objects: string[]): Promise<string> {
    // Generate TypeScript types for frontend
  }
  
  async generateReactComponents(objects: string[]): Promise<string> {
    // Generate React components from object metadata
  }
}
```

### 2.3 Developer Experience Gaps

#### Gap 10: CLI Tooling

**Current State:**
- No CLI for plugin development
- Manual scaffolding of plugin structure
- No code generation

**Issues:**
- High barrier to entry for plugin developers
- Inconsistent plugin structure
- Error-prone manual setup

**Impact:** High - Slows ecosystem growth

**Recommendation:**
```bash
# New @objectos/cli package
objectos plugin create <name>           # Scaffold new plugin
objectos plugin validate                # Validate manifest
objectos plugin test                    # Run plugin tests
objectos plugin publish                 # Publish to marketplace
objectos generate object <name>         # Generate object YAML
objectos generate api <object>          # Generate REST API for object
objectos dev                            # Development server with hot reload
```

---

## Part 3: Optimization Requirements

### 3.1 Performance Optimizations

#### Requirement 1: Plugin Lazy Loading

**Motivation:**
- Current: All plugins loaded at startup
- Issue: Slow startup time with many plugins
- Goal: Load plugins on-demand

**Implementation:**
```typescript
class PluginManager {
  private loadedPlugins = new Set<string>();
  
  async loadLazy(pluginId: string): Promise<void> {
    if (this.loadedPlugins.has(pluginId)) return;
    
    const manifest = await this.getManifest(pluginId);
    const definition = await this.getDefinition(pluginId);
    
    await definition.onEnable?.(this.buildContext(manifest));
    this.loadedPlugins.add(pluginId);
  }
}
```

**Benefits:**
- 50%+ faster startup for large deployments
- Reduced memory footprint
- Better multi-tenancy (load tenant-specific plugins)

#### Requirement 2: Service Registry Optimization

**Motivation:**
- Current: `Map<string, any>` with linear search
- Issue: Slow service lookup in hot paths
- Goal: O(1) service access with type safety

**Implementation:**
```typescript
class ServiceRegistry {
  private services = new Map<string, any>();
  private cache = new WeakMap<object, Map<string, any>>();
  
  getService<T>(requester: object, name: string): T {
    // Check per-requester cache
    let contextCache = this.cache.get(requester);
    if (!contextCache) {
      contextCache = new Map();
      this.cache.set(requester, contextCache);
    }
    
    if (contextCache.has(name)) {
      return contextCache.get(name) as T;
    }
    
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service not found: ${name}. Ensure the service is registered before use or check if the required plugin providing this service is enabled.`);
    }
    
    contextCache.set(name, service);
    return service as T;
  }
}
```

**Benefits:**
- 10x faster service lookup
- Reduced GC pressure
- Better memory locality

#### Requirement 3: Event Bus Optimization

**Motivation:**
- Current: Synchronous event processing blocks caller
- Issue: Slow response times when many listeners
- Goal: Async event dispatch with backpressure

**Implementation:**
```typescript
class EventBus {
  private queue = new AsyncQueue();
  
  async emit(event: string, payload: any): Promise<void> {
    // Non-blocking emit
    this.queue.push({ event, payload });
  }
  
  private async processQueue(): Promise<void> {
    while (true) {
      const { event, payload } = await this.queue.shift();
      
      const listeners = this.listeners.get(event) || [];
      await Promise.all(listeners.map(listener => listener(payload)));
    }
  }
}
```

**Benefits:**
- Non-blocking event emission
- Backpressure handling
- Better throughput under load

### 3.2 Security Enhancements

#### Requirement 4: Plugin Sandboxing

**Motivation:**
- Current: Plugins run in same process as kernel
- Issue: Malicious plugin can crash entire system
- Goal: Isolate plugins in separate contexts

**Implementation:**
```typescript
import { Worker } from 'worker_threads';

class PluginSandbox {
  async run(pluginId: string, method: string, ...args: any[]): Promise<any> {
    const worker = new Worker('./plugin-worker.js', {
      workerData: { pluginId, method, args }
    });
    
    return new Promise((resolve, reject) => {
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  }
}
```

**Benefits:**
- Crash isolation
- Resource limits (CPU, memory)
- Security boundary

#### Requirement 5: Permission Enforcement

**Motivation:**
- Current: Permissions declared but not enforced
- Issue: Plugins can access any service
- Goal: Runtime permission checks

**Implementation:**
```typescript
class PermissionChecker {
  checkPermission(pluginId: string, permission: string): boolean {
    const manifest = this.getManifest(pluginId);
    return manifest.permissions?.includes(permission) || false;
  }
}

class PluginContext {
  getService<T>(name: string): T {
    // Check permission before returning service
    const requiredPermission = SERVICE_PERMISSIONS[name];
    if (requiredPermission && !this.checker.checkPermission(this.pluginId, requiredPermission)) {
      throw new Error(`Permission denied: Plugin '${this.pluginId}' attempted to access service '${name}' which requires permission '${requiredPermission}'. Add this permission to the 'permissions' array in your plugin's manifest file.`);
    }
    
    return this.registry.getService(name);
  }
}
```

**Benefits:**
- Enforces least-privilege principle
- Prevents unauthorized access
- Clear security model

### 3.3 Developer Experience Enhancements

#### Requirement 6: TypeScript Plugin API

**Motivation:**
- Current: Context API defined but not typed for autocomplete
- Issue: Poor IDE support, typos in plugin code
- Goal: Full type safety with generics

**Implementation:**
```typescript
// Before
const user = context.ql.query('users', { filters: { id: '123' } }); // any

// After
interface PluginContext {
  ql: {
    object<T = any>(name: string): ObjectQLBuilder<T>;
    query<T = any>(name: string, options: QueryOptions): Promise<T[]>;
  };
}

const user = context.ql.query<User>('users', { filters: { id: '123' } }); // User[]
```

**Benefits:**
- Autocomplete in VSCode
- Compile-time error checking
- Better documentation via types

#### Requirement 7: Plugin Testing Framework

**Motivation:**
- Current: No standard way to test plugins
- Issue: Low test coverage, brittle tests
- Goal: First-class testing utilities

**Implementation:**
```typescript
import { createTestContext, mockService } from '@objectos/testing';

describe('MyPlugin', () => {
  it('should register service', async () => {
    const ctx = createTestContext();
    const plugin = new MyPlugin();
    
    await plugin.onEnable(ctx);
    
    expect(ctx.hasService('my-service')).toBe(true);
  });
  
  it('should handle events', async () => {
    const ctx = createTestContext({
      services: {
        'objectql': mockService('objectql', { query: jest.fn() })
      }
    });
    
    const plugin = new MyPlugin();
    await plugin.onLoad(ctx);
    
    ctx.events.emit('data.create', { object: 'contacts' });
    
    expect(ctx.getService('objectql').query).toHaveBeenCalled();
  });
});
```

**Benefits:**
- Easy to write tests
- Fast test execution
- High confidence in plugin quality

---

## Part 4: Development Plan

### Phase 1: Kernel Optimizations (Weeks 1-3)

#### Week 1: Dependency Resolution & Validation

**Tasks:**
1. ✅ Implement `validateDependencies()` in `PluginManager`
   - Parse semver dependency strings
   - Check plugin existence and version compatibility
   - Fail fast on missing/incompatible dependencies

2. ✅ Add manifest validation
   - Use Zod schema from @objectstack/spec
   - Validate plugin ID format (reverse DNS)
   - Validate permissions against known set
   - Validate object paths exist

3. ✅ Write tests
   - Test dependency resolution order
   - Test circular dependency detection
   - Test version conflict detection
   - Test malformed manifest rejection

**Deliverables:**
- `packages/kernel/src/dependency-resolver.ts`
- `packages/kernel/src/manifest-validator.ts`
- 30+ unit tests

**Acceptance Criteria:**
- Plugins with missing dependencies fail to load
- Plugins with circular dependencies are detected
- Malformed manifests are rejected at load time

#### Week 2: Hot Reload & Plugin Lifecycle

**Tasks:**
1. ✅ Implement hot reload mechanism
   - Add `reloadPlugin(pluginId)` to PluginManager
   - Clear require cache for plugin modules
   - Re-run lifecycle hooks (disable → enable)
   - Emit `plugin.reloaded` event

2. ✅ Add plugin versioning
   - Support multiple versions of same plugin
   - Allow side-by-side deployment
   - Implement version routing in service registry

3. ✅ Enhance error handling
   - Wrap plugin calls in try-catch
   - Isolate plugin failures (don't crash kernel)
   - Log structured errors with plugin context
   - Add error recovery hooks

**Deliverables:**
- `packages/kernel/src/hot-reload.ts`
- `packages/kernel/src/version-manager.ts`
- `packages/kernel/src/error-handler.ts`

**Acceptance Criteria:**
- Plugins can be reloaded without server restart
- Plugin failures don't crash the system
- Detailed error logs include plugin context

#### Week 3: Performance & Observability

**Tasks:**
1. ✅ Optimize service registry
   - Implement per-context cache
   - Add service dependency graph
   - Lazy-load services on first access

2. ✅ Optimize event bus
   - Async event dispatch
   - Event batching
   - Backpressure handling

3. ✅ Add plugin metrics
   - Track event handler execution time
   - Track service call counts
   - Track plugin uptime
   - Expose metrics via `/api/metrics` endpoint

**Deliverables:**
- `packages/kernel/src/metrics.ts`
- `packages/kernel/src/optimized-registry.ts`
- Performance benchmarks

**Acceptance Criteria:**
- 10x faster service lookup
- Non-blocking event emission
- Metrics available via API

### Phase 2: Ecosystem Integration (Weeks 4-6)

#### Week 4: Plugin Marketplace Foundation

**Tasks:**
1. ✅ Design marketplace protocol
   - Plugin metadata schema
   - Publication workflow
   - Versioning strategy
   - Distribution mechanism (npm, CDN, or custom registry)

2. ✅ Create plugin discovery API
   - Search endpoint: `GET /api/marketplace/search?q=audit&tags=logging`
   - Details endpoint: `GET /api/marketplace/plugins/:id`
   - Versions endpoint: `GET /api/marketplace/plugins/:id/versions`

3. ✅ Implement plugin installation
   - Download plugin tarball
   - Validate manifest and signatures
   - Install to plugins directory
   - Register with PluginManager

**Deliverables:**
- `packages/kernel/src/marketplace/client.ts`
- `packages/kernel/src/marketplace/installer.ts`
- Marketplace API specification (OpenAPI)

**Acceptance Criteria:**
- Can search for plugins
- Can install plugins programmatically
- Plugins are verified before installation

#### Week 5: Cross-Project Type Registry

**Tasks:**
1. ✅ Create `@objectstack/types` package
   - Define `FieldTypeDefinition` interface
   - Create `TypeRegistry` class
   - Add built-in types (text, number, date, email, etc.)

2. ✅ Integrate with ObjectQL
   - Register types with ObjectQL drivers
   - Use types for validation
   - Generate database schema from types

3. ✅ Integrate with ObjectUI
   - Generate React components from types
   - Auto-render forms based on types
   - Client-side validation using same types

**Deliverables:**
- `@objectstack/types` package
- Integration in ObjectQL and ObjectOS
- Type registration API

**Acceptance Criteria:**
- Custom types work across all 3 projects
- Type registry is extensible via plugins
- Type definitions are shared, not duplicated

#### Week 6: Ecosystem Event Protocol

**Tasks:**
1. ✅ Create `@objectstack/events` package
   - Define `EcosystemEvent` interface
   - Implement event bus with Redis/NATS
   - Add pub/sub pattern for cross-process communication

2. ✅ Integrate event bus with ObjectOS
   - Emit events from kernel (data.create, data.update, etc.)
   - Subscribe to events from other projects
   - Add event replay for debugging

3. ✅ Add WebSocket bridge for ObjectUI
   - Stream events to connected clients
   - Filter events by user permissions
   - Optimize for low latency

**Deliverables:**
- `@objectstack/events` package
- WebSocket server in ObjectOS
- Event subscription API

**Acceptance Criteria:**
- Events flow between ObjectQL, ObjectOS, and ObjectUI
- Real-time updates work in UI
- Event replay available for debugging

### Phase 3: Developer Tools (Weeks 7-8)

#### Week 7: CLI Development

**Tasks:**
1. ✅ Create `@objectos/cli` package
   - Scaffold: `objectos plugin create <name>`
   - Validation: `objectos plugin validate`
   - Testing: `objectos plugin test`
   - Publishing: `objectos plugin publish`

2. ✅ Add code generators
   - Generate object YAML from TypeScript types
   - Generate API routes from object definitions
   - Generate React components from metadata

3. ✅ Add development server
   - `objectos dev` with hot reload
   - Live metadata updates
   - Plugin debugging tools

**Deliverables:**
- `@objectos/cli` package
- CLI documentation
- Tutorial: "Build Your First Plugin"

**Acceptance Criteria:**
- Can scaffold a plugin in <1 minute
- Generated code passes validation
- Dev server provides instant feedback

#### Week 8: Testing Framework & Documentation

**Tasks:**
1. ✅ Create `@objectos/testing` package
   - `createTestContext()` helper
   - Mock service utilities
   - Event assertion helpers
   - Fixture generators

2. ✅ Write comprehensive documentation
   - Plugin development guide
   - API reference (all context methods)
   - Migration guide (kernel v0.2 → v1.0)
   - Security best practices

3. ✅ Create example plugins
   - Simple: Hello World plugin
   - Intermediate: Custom field type plugin
   - Advanced: Full CRM plugin with UI

**Deliverables:**
- `@objectos/testing` package
- 50+ pages of documentation
- 3 example plugins

**Acceptance Criteria:**
- All examples work out-of-the-box
- Documentation covers 100% of API surface
- Migration guide tested on real codebases

### Phase 4: Production Hardening (Weeks 9-10)

#### Week 9: Security & Stability

**Tasks:**
1. ✅ Implement plugin sandboxing
   - Run plugins in worker threads
   - Set CPU and memory limits
   - Enforce timeouts on plugin operations

2. ✅ Add permission enforcement
   - Check permissions at runtime
   - Audit permission usage
   - Warn on over-privileged plugins

3. ✅ Security audit
   - Review all plugin APIs for vulnerabilities
   - Add input validation
   - Implement rate limiting for plugin operations
   - Add CSRF protection for plugin routes

**Deliverables:**
- `packages/kernel/src/sandbox.ts`
- `packages/kernel/src/permission-enforcer.ts`
- Security audit report

**Acceptance Criteria:**
- Malicious plugins can't crash the system
- Unauthorized operations are blocked
- Security report shows no critical issues

#### Week 10: Load Testing & Optimization

**Tasks:**
1. ✅ Performance benchmarking
   - Benchmark plugin loading time (target: <100ms per plugin)
   - Benchmark service lookup (target: <1μs)
   - Benchmark event dispatch (target: <10ms)

2. ✅ Load testing
   - 1000+ concurrent users
   - 100+ plugins loaded
   - 10k+ events/second
   - Identify and fix bottlenecks

3. ✅ Production deployment guide
   - Docker images
   - Kubernetes manifests
   - Monitoring setup (Prometheus, Grafana)
   - Backup and disaster recovery

**Deliverables:**
- Performance benchmark report
- Load test results
- Production deployment guide

**Acceptance Criteria:**
- System handles production load
- Metrics show acceptable performance
- Deployment guide tested on real infrastructure

---

## Part 5: Testing Strategy

### 5.1 Unit Testing

**Coverage Target:** 90%+ for kernel, 80%+ for plugins

**Key Test Suites:**

1. **Plugin Lifecycle Tests**
   ```typescript
   describe('PluginManager', () => {
     it('should initialize plugins in dependency order');
     it('should detect circular dependencies');
     it('should fail on missing dependencies');
     it('should reload plugins without restart');
     it('should isolate plugin failures');
   });
   ```

2. **Service Registry Tests**
   ```typescript
   describe('ServiceRegistry', () => {
     it('should register and retrieve services');
     it('should throw on missing service');
     it('should enforce permissions');
     it('should support multiple versions');
   });
   ```

3. **Event Bus Tests**
   ```typescript
   describe('EventBus', () => {
     it('should emit events to all listeners');
     it('should support async handlers');
     it('should handle backpressure');
     it('should replay events for debugging');
   });
   ```

### 5.2 Integration Testing

**Test Scenarios:**

1. **Plugin Installation Flow**
   ```typescript
   it('should install plugin from marketplace', async () => {
     const marketplace = new PluginMarketplace();
     await marketplace.install('com.example.crm');
     
     const plugin = kernel.getPlugin('com.example.crm');
     expect(plugin).toBeDefined();
     expect(plugin.status).toBe('enabled');
   });
   ```

2. **Cross-Plugin Communication**
   ```typescript
   it('should allow plugins to communicate via events', async () => {
     const auditLog = kernel.getPlugin('com.objectos.audit-log');
     const crm = kernel.getPlugin('com.example.crm');
     
     // CRM creates contact
     await crm.createContact({ name: 'John Doe' });
     
     // Audit log should have recorded the event
     const logs = await auditLog.queryLogs({ object: 'contacts' });
     expect(logs).toHaveLength(1);
   });
   ```

3. **ObjectQL Integration**
   ```typescript
   it('should use ObjectQL for data operations', async () => {
     const ql = kernel.getService('objectql');
     
     await ql.insert('contacts', { name: 'Jane Doe' });
     const contacts = await ql.query('contacts', { filters: {} });
     
     expect(contacts).toHaveLength(1);
   });
   ```

### 5.3 Performance Testing

**Benchmarks:**

1. **Plugin Loading**
   - Target: <100ms per plugin
   - Test: Load 100 plugins and measure total time

2. **Service Lookup**
   - Target: <1μs per lookup
   - Test: 1M lookups and measure average

3. **Event Dispatch**
   - Target: <10ms per event
   - Test: Emit 10k events and measure p99

**Load Tests:**

```typescript
describe('Load Tests', () => {
  it('should handle 1000 concurrent requests', async () => {
    const requests = Array(1000).fill(null).map(() => 
      ql.query('contacts', { filters: {} })
    );
    
    const start = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // <5s for 1000 requests
  });
});
```

### 5.4 Security Testing

**Attack Scenarios:**

1. **Malicious Plugin**
   ```typescript
   it('should sandbox malicious plugin', async () => {
     const maliciousPlugin = {
       async onEnable(ctx) {
         // Try to crash the system
         process.exit(1);
       }
     };
     
     // Should not crash the kernel
     await expect(kernel.use(maliciousPlugin).bootstrap()).resolves.not.toThrow();
   });
   ```

2. **Unauthorized Access**
   ```typescript
   it('should block unauthorized service access', async () => {
     const plugin = {
       manifest: { permissions: [] }, // No permissions
       async onEnable(ctx) {
         // Try to access protected service
         ctx.getService('admin');
       }
     };
     
     await expect(kernel.use(plugin).bootstrap()).rejects.toThrow('Permission denied');
   });
   ```

---

## Part 6: Migration Path

### 6.1 For Existing Plugins

**Current Plugin (v0.2):**
```typescript
export const myPlugin = {
  id: 'com.example.my-plugin',
  async onEnable(context) {
    context.ql.object('contacts');
  }
};
```

**Future Plugin (v1.0):**
```typescript
import { Plugin, PluginContext } from '@objectos/kernel';

export class MyPlugin implements Plugin {
  manifest = {
    id: 'com.example.my-plugin',
    version: '1.0.0',
    permissions: ['data.read', 'data.write']
  };
  
  async onEnable(context: PluginContext) {
    const ql = context.getService<ObjectQL>('objectql');
    await ql.object('contacts');
  }
}
```

**Migration Steps:**
1. Convert plain objects to classes implementing `Plugin`
2. Add explicit `manifest` property
3. Add type annotations to context methods
4. Add permission declarations
5. Run `objectos plugin validate` to check compliance

**Automated Migration:**
```bash
objectos migrate plugin ./src/plugins/*.ts
```

### 6.2 For ObjectOS Users

**Current Usage (v0.2):**
```typescript
const objectos = new ObjectOS({
  datasources: { default: driver },
  presets: ['@objectos/preset-base']
});

await objectos.init();
```

**Future Usage (v1.0):**
```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { ObjectOS } from '@objectos/kernel';

const kernel = new ObjectKernel();
const objectos = new ObjectOS();

kernel
  .use(new ObjectQLPlugin(objectos))
  .use(new DriverPlugin(driver))
  .use(new AuditLogPlugin())
  .use(new BetterAuthPlugin());

await kernel.bootstrap();
```

**Benefits:**
- Explicit plugin loading
- Better dependency management
- Type-safe plugin APIs

---

## Part 7: Success Metrics

### 7.1 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Plugin Load Time | <100ms | Benchmark 100 plugins |
| Service Lookup Time | <1μs | 1M lookups average |
| Event Dispatch Time | <10ms | 10k events p99 |
| Test Coverage | >85% | Jest coverage report |
| Type Safety | 100% | No `any` types in public API |
| Security Issues | 0 critical | Security audit report |

### 7.2 Ecosystem Metrics

| Metric | Target (6 months) | Measurement |
|--------|-------------------|-------------|
| Published Plugins | 20+ | Marketplace count |
| Plugin Downloads | 10k+ | npm stats |
| Active Contributors | 30+ | GitHub contributors |
| GitHub Stars | 5k+ | GitHub stats |
| Documentation Pages | 100+ | VitePress site |

### 7.3 Developer Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to First Plugin | <30 min | Onboarding survey |
| Plugin Scaffold Time | <1 min | CLI benchmark |
| API Discoverability | 100% | All methods documented |
| Error Clarity | >90% | Developer survey |

---

## Part 8: Risk Assessment

### 8.1 Technical Risks

#### Risk 1: Breaking Changes (HIGH)

**Description:** New plugin API incompatible with existing plugins

**Mitigation:**
- Provide migration tool
- Maintain v0.2 compatibility layer for 6 months
- Extensive testing with existing plugins
- Clear deprecation warnings

**Contingency:**
- Rollback to v0.2 if adoption is slow
- Extend support period if needed

#### Risk 2: Performance Regression (MEDIUM)

**Description:** Optimizations introduce performance issues

**Mitigation:**
- Comprehensive benchmarking before and after
- Load testing with production-like data
- Gradual rollout with monitoring

**Contingency:**
- Feature flags to disable optimizations
- Quick rollback mechanism

#### Risk 3: Security Vulnerabilities (HIGH)

**Description:** Plugin sandboxing has bypass vulnerabilities

**Mitigation:**
- Security audit by external experts
- Fuzzing plugin APIs
- Bug bounty program
- Responsible disclosure policy

**Contingency:**
- Disable plugin system if critical vulnerability found
- Patch and redeploy within 24 hours

### 8.2 Ecosystem Risks

#### Risk 4: Low Adoption (MEDIUM)

**Description:** Developers don't adopt new plugin system

**Mitigation:**
- Excellent documentation
- Video tutorials
- Active community support
- Showcase example plugins
- Developer advocates

**Contingency:**
- Simplify API based on feedback
- Offer migration assistance
- Extend support for old API

#### Risk 5: Marketplace Quality (MEDIUM)

**Description:** Low-quality plugins harm ecosystem reputation

**Mitigation:**
- Plugin review process
- Quality guidelines
- Automated testing requirements
- User ratings and reviews
- Featured plugins section

**Contingency:**
- Manual review for critical plugins
- Stricter requirements
- Remove low-quality plugins

---

## Part 9: Timeline Summary

### Quarter 1 (Weeks 1-10): Foundation

- **Weeks 1-3:** Kernel optimizations
- **Weeks 4-6:** Ecosystem integration
- **Weeks 7-8:** Developer tools
- **Weeks 9-10:** Production hardening

**Deliverables:**
- Optimized kernel with hot reload
- Plugin marketplace foundation
- CLI and testing tools
- Security-hardened runtime

### Quarter 2 (Weeks 11-20): Ecosystem Growth

- **Weeks 11-14:** Build 5+ official plugins
- **Weeks 15-16:** Launch marketplace
- **Weeks 17-18:** Documentation and tutorials
- **Weeks 19-20:** Community outreach

**Deliverables:**
- 5+ production-ready plugins
- Public marketplace
- 100+ pages documentation
- Community forum launched

### Quarter 3 (Weeks 21-30): Scale & Refine

- **Weeks 21-24:** Performance optimization
- **Weeks 25-27:** Advanced features (multi-tenancy, etc.)
- **Weeks 28-30:** Enterprise features

**Deliverables:**
- 10x performance improvement
- Multi-tenancy support
- Enterprise-grade features

### Quarter 4 (Weeks 31-40): Maturity

- **Weeks 31-35:** Ecosystem plugins (20+ goal)
- **Weeks 36-38:** Certification program
- **Weeks 39-40:** v1.0 release

**Deliverables:**
- 20+ third-party plugins
- Developer certification
- v1.0 production release

---

## Part 10: Next Steps

### Immediate Actions (This Week)

1. ✅ Review and approve this plan
2. ✅ Set up project tracking (GitHub Projects)
3. ✅ Assign team leads for each phase
4. ✅ Create development branches
5. ✅ Schedule kickoff meeting

### Week 1 Actions

1. ✅ Implement dependency resolver
2. ✅ Add manifest validation
3. ✅ Write initial tests
4. ✅ Set up CI/CD for kernel package
5. ✅ Begin documentation site

### Communication Plan

- **Weekly Updates:** Progress reports every Friday
- **Monthly Demos:** Live demo of new features
- **Quarterly Reviews:** Stakeholder review meetings
- **Open Roadmap:** Public GitHub project board

---

## Appendix A: File Structure

```
objectos/
├── packages/
│   ├── kernel/                    # Core ObjectOS kernel
│   │   ├── src/
│   │   │   ├── plugin-manager.ts        # ✅ Existing
│   │   │   ├── plugin-context.ts        # ✅ Existing
│   │   │   ├── dependency-resolver.ts   # 🆕 Week 1
│   │   │   ├── manifest-validator.ts    # 🆕 Week 1
│   │   │   ├── hot-reload.ts           # 🆕 Week 2
│   │   │   ├── error-handler.ts        # 🆕 Week 2
│   │   │   ├── metrics.ts              # 🆕 Week 3
│   │   │   ├── optimized-registry.ts   # 🆕 Week 3
│   │   │   ├── sandbox.ts              # 🆕 Week 9
│   │   │   ├── permission-enforcer.ts  # 🆕 Week 9
│   │   │   └── marketplace/
│   │   │       ├── client.ts           # 🆕 Week 4
│   │   │       └── installer.ts        # 🆕 Week 4
│   │   └── test/
│   │       ├── dependency-resolver.test.ts
│   │       ├── hot-reload.test.ts
│   │       └── marketplace.test.ts
│   │
│   ├── runtime/                   # Micro-kernel runtime
│   │   └── src/
│   │       ├── kernel.ts              # ✅ Existing
│   │       └── plugins/
│   │           ├── objectql-plugin.ts # ✅ Existing
│   │           └── driver-plugin.ts   # ✅ Existing
│   │
│   ├── cli/                       # 🆕 Week 7 - CLI tools
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── create.ts
│   │   │   │   ├── validate.ts
│   │   │   │   ├── test.ts
│   │   │   │   └── publish.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── testing/                   # 🆕 Week 8 - Testing utilities
│   │   ├── src/
│   │   │   ├── test-context.ts
│   │   │   ├── mock-service.ts
│   │   │   └── fixtures.ts
│   │   └── package.json
│   │
│   └── plugins/
│       ├── audit-log/             # ✅ Existing
│       ├── better-auth/           # ✅ Existing
│       ├── crm/                   # 🆕 Example plugin
│       ├── custom-field/          # 🆕 Example plugin
│       └── hello-world/           # 🆕 Example plugin
│
└── docs/
    ├── guide/
    │   ├── getting-started.md
    │   ├── plugin-development.md      # 🆕 Week 8
    │   ├── api-reference.md          # 🆕 Week 8
    │   └── migration-guide.md        # 🆕 Week 8
    └── examples/
        ├── hello-world/
        ├── custom-field/
        └── full-crm/
```

---

## Appendix B: API Reference Preview

### PluginManager

```typescript
class PluginManager {
  // Plugin lifecycle
  async loadPlugin(manifest: ObjectStackManifest, definition: PluginDefinition): Promise<void>
  async enablePlugin(pluginId: string): Promise<void>
  async disablePlugin(pluginId: string): Promise<void>
  async reloadPlugin(pluginId: string): Promise<void>
  
  // Plugin queries
  getPlugin(pluginId: string): Plugin
  listPlugins(filters?: { status?: 'enabled' | 'disabled' }): Plugin[]
  hasPlugin(pluginId: string): boolean
  
  // Dependency management
  validateDependencies(manifest: ObjectStackManifest): Promise<void>
  resolveDependencyOrder(plugins: Plugin[]): Plugin[]
}
```

### PluginContext

```typescript
interface PluginContext {
  // Data access
  ql: {
    object<T>(name: string): ObjectDefinition<T>
    query<T>(name: string, options: QueryOptions): Promise<T[]>
    insert<T>(name: string, data: Partial<T>): Promise<T>
    update<T>(name: string, id: string, data: Partial<T>): Promise<T>
    delete(name: string, id: string): Promise<void>
  }
  
  // System API
  os: {
    getCurrentUser(): Promise<User>
    getConfig(key: string): any
    setConfig(key: string, value: any): Promise<void>
  }
  
  // Services
  registerService(name: string, service: any): void
  getService<T>(name: string): T
  hasService(name: string): boolean
  
  // Events
  events: {
    on(event: string, handler: (payload: any) => void | Promise<void>): void
    emit(event: string, payload: any): Promise<void>
    off(event: string, handler: Function): void
  }
  
  // Storage
  storage: {
    get(key: string): Promise<any>
    set(key: string, value: any): Promise<void>
    delete(key: string): Promise<void>
    list(): Promise<string[]>
  }
  
  // HTTP Router
  app: {
    router: {
      get(path: string, handler: RouteHandler): void
      post(path: string, handler: RouteHandler): void
      put(path: string, handler: RouteHandler): void
      patch(path: string, handler: RouteHandler): void
      delete(path: string, handler: RouteHandler): void
      all(path: string, handler: RouteHandler): void
      use(middleware: Middleware): void
    }
    scheduler: {
      schedule(cron: string, handler: () => void | Promise<void>): void
    }
  }
  
  // Metadata
  metadata: {
    getObject(name: string): ObjectDefinition
    listObjects(): ObjectDefinition[]
    getField(object: string, field: string): FieldDefinition
  }
  
  // Drivers
  drivers: {
    get(name: string): ObjectQLDriver
    register(name: string, driver: ObjectQLDriver): void
    list(): string[]
  }
  
  // Utilities
  logger: Logger
  i18n: {
    t(key: string, params?: Record<string, any>): string
    getLocale(): string
  }
}
```

### Marketplace

```typescript
class PluginMarketplace {
  async search(query: string, options?: {
    tags?: string[]
    minRating?: number
    limit?: number
  }): Promise<PluginMetadata[]>
  
  async getPlugin(id: string): Promise<PluginMetadata>
  async getVersions(id: string): Promise<string[]>
  
  async install(id: string, version?: string): Promise<void>
  async uninstall(id: string): Promise<void>
  async upgrade(id: string, version?: string): Promise<void>
  
  async publish(manifest: ObjectStackManifest, tarball: Buffer): Promise<void>
}
```

---

## Appendix C: Example Plugins

### Hello World Plugin

```typescript
import { Plugin, PluginContext } from '@objectos/kernel';

export class HelloWorldPlugin implements Plugin {
  manifest = {
    id: 'com.example.hello-world',
    version: '1.0.0',
    permissions: ['routes.mount']
  };
  
  async onEnable(context: PluginContext) {
    context.app.router.get('/api/hello', (req, res) => {
      res.json({ message: 'Hello from plugin!' });
    });
    
    context.logger.info('Hello World plugin enabled');
  }
}
```

### Custom Field Type Plugin

```typescript
import { Plugin, PluginContext } from '@objectos/kernel';

export class CustomFieldPlugin implements Plugin {
  manifest = {
    id: 'com.example.custom-field',
    version: '1.0.0',
    contributes: {
      fieldTypes: [{
        name: 'phone_number',
        label: 'Phone Number',
        validate: (value: string) => /^\+?[1-9]\d{1,14}$/.test(value)
      }]
    }
  };
  
  async onLoad(context: PluginContext) {
    // Register field type with ObjectQL
    const ql = context.getService('objectql');
    ql.registerFieldType('phone_number', {
      validate: (value) => /^\+?[1-9]\d{1,14}$/.test(value),
      format: (value) => {
        // Format phone number for display
        return value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      }
    });
  }
}
```

### CRM Plugin (Full Example)

```typescript
import { Plugin, PluginContext } from '@objectos/kernel';

export class CRMPlugin implements Plugin {
  manifest = {
    id: 'com.example.crm',
    version: '1.0.0',
    permissions: [
      'data.read',
      'data.write',
      'routes.mount',
      'events.subscribe'
    ],
    objects: ['./objects/*.object.yml'],
    dependencies: ['com.objectos.audit-log']
  };
  
  async onLoad(context: PluginContext) {
    // Load object definitions
    await context.ql.object('contacts');
    await context.ql.object('accounts');
    await context.ql.object('opportunities');
    
    // Subscribe to events
    context.events.on('data.create.contacts', async (event) => {
      // Auto-create task when contact is created
      await context.ql.insert('tasks', {
        subject: `Follow up with ${event.data.name}`,
        status: 'open',
        related_to: event.data.id
      });
    });
    
    // Register routes
    context.app.router.get('/api/crm/dashboard', async (req, res) => {
      const stats = await this.getDashboardStats(context);
      res.json(stats);
    });
    
    // Schedule jobs
    context.app.scheduler.schedule('0 9 * * *', async () => {
      // Daily reminder for open tasks
      await this.sendTaskReminders(context);
    });
  }
  
  private async getDashboardStats(context: PluginContext) {
    const [contacts, opportunities, revenue] = await Promise.all([
      // Note: In production, validate and sanitize date inputs to prevent injection attacks
      context.ql.query('contacts', { filters: { created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      context.ql.query('opportunities', { filters: { stage: 'closed_won' } }),
      // Note: Aggregation syntax follows ObjectQL v3.0.1 specification (see aggregation operators documentation)
      context.ql.query('opportunities', { 
        filters: { stage: 'closed_won' },
        aggregations: { total: { $sum: 'amount' } }
      })
    ]);
    
    return {
      newContacts: contacts.length,
      closedDeals: opportunities.length,
      revenue: revenue[0]?.total || 0
    };
  }
  
  private async sendTaskReminders(context: PluginContext) {
    const openTasks = await context.ql.query('tasks', {
      filters: { status: 'open', due_date: { $lte: new Date() } }
    });
    
    for (const task of openTasks) {
      // Send email notification
      context.logger.info(`Reminder: ${task.subject}`);
    }
  }
}
```

---

## Conclusion

This comprehensive plan transforms ObjectOS from a standalone runtime into a **first-class citizen of the ObjectStack ecosystem**. By implementing the outlined optimizations and integrations, ObjectOS will serve as the **central orchestration layer** - the "Operating System" that binds ObjectQL (Data), ObjectOS (System), and ObjectUI (View) into a cohesive, extensible platform.

### Key Outcomes

1. **Plugin Marketplace** - Thriving ecosystem of third-party plugins
2. **Unified Type System** - Shared types across entire stack
3. **Real-Time Events** - Cross-project event propagation
4. **Developer Platform** - CLI, testing tools, comprehensive docs
5. **Production-Ready** - Security-hardened, performance-optimized, battle-tested

### Success Criteria

- **Technical:** 90%+ test coverage, <100ms plugin load, 0 critical security issues
- **Ecosystem:** 20+ published plugins, 10k+ downloads, 30+ contributors
- **Developer Experience:** <30min to first plugin, 100+ doc pages, clear migration path

**Status:** Ready for implementation. Awaiting approval to proceed with Phase 1, Week 1.

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** 2026-01-30
- **Next Review:** 2026-02-06 (End of Week 1)
- **Approvers:** Product Lead, Engineering Lead, Security Lead
