# Plugin System and Extensibility Patterns: Microkernel Architecture

> **Author**: ObjectOS Core Team  
> **Date**: January 2026  
> **Version**: 1.0  
> **Target Audience**: Plugin Developers, System Architects

---

## Executive Summary

ObjectOS implements a **microkernel architecture** where core functionality is minimal, and features are added through **plugins**. This article explores the plugin system's design, lifecycle management, security boundaries, and best practices for building extensible enterprise applications.

**Core Philosophy**: *"The kernel is a minimal runtime. Everything else is a plugin."*

---

## 1. The Microkernel Philosophy

### 1.1 What is a Microkernel?

**Traditional Monolithic Architecture**:

```
┌────────────────────────────────────────┐
│         Application                    │
│  ┌──────────────────────────────────┐  │
│  │  Auth + CRM + HR + Workflow      │  │
│  │  + Reports + ... (All in One)    │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**Problems**:
- Tight coupling (one bug breaks everything)
- Can't disable features
- Hard to test components independently

**Microkernel Architecture**:

```
┌────────────────────────────────────────┐
│         Kernel (Core Runtime)          │
│  • Object Registry                     │
│  • Event Bus                           │
│  • Plugin Loader                       │
└────────┬───────────────────────────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    │         │         │         │
    ▼         ▼         ▼         ▼
┌───────┐ ┌──────┐ ┌──────┐ ┌──────┐
│ Auth  │ │ CRM  │ │  HR  │ │ Flow │
│Plugin │ │Plugin│ │Plugin│ │Plugin│
└───────┘ └──────┘ └──────┘ └──────┘
```

**Benefits**:
- ✅ Modularity (features are independent)
- ✅ Extensibility (add features without changing core)
- ✅ Testability (test plugins in isolation)
- ✅ Security (plugins run in sandboxes)

### 1.2 ObjectOS Plugin Model

**Key Concepts**:

1. **Plugins are NPM packages** (or local directories)
2. **Manifest-driven** (`plugin.json` defines capabilities)
3. **Event-based communication** (no direct imports between plugins)
4. **Lifecycle hooks** (onLoad, onStart, onStop, onUnload)

---

## 2. Plugin Structure

### 2.1 Plugin Manifest

**File**: `plugin.json`

```json
{
  "id": "steedos-crm",
  "name": "Steedos CRM",
  "version": "1.0.0",
  "description": "Customer Relationship Management",
  
  "author": "Steedos Team",
  "license": "AGPL-3.0",
  
  "dependencies": {
    "objectos": "^0.3.0",
    "@objectos/plugin-auth": "^1.0.0"
  },
  
  "capabilities": {
    "objects": ["./objects/*.object.yml"],
    "triggers": ["./triggers/*.js"],
    "workflows": ["./workflows/*.yml"],
    "api": ["./api/*.js"]
  },
  
  "permissions": {
    "required": ["read:contacts", "write:contacts"],
    "optional": ["admin:users"]
  },
  
  "lifecycle": {
    "onLoad": "./index.js#onLoad",
    "onStart": "./index.js#onStart",
    "onStop": "./index.js#onStop"
  }
}
```

### 2.2 Plugin Directory Structure

```
@steedos/plugin-crm/
├── plugin.json              # Manifest
├── index.js                 # Entry point
│
├── objects/                 # Object definitions
│   ├── accounts.object.yml
│   ├── contacts.object.yml
│   └── opportunities.object.yml
│
├── triggers/                # Lifecycle hooks
│   ├── account_triggers.js
│   └── opportunity_triggers.js
│
├── workflows/               # Business processes
│   └── lead_conversion.yml
│
├── api/                     # Custom endpoints
│   └── reports.js
│
├── ui/                      # UI components (optional)
│   └── components/
│
└── tests/
    └── crm.test.js
```

### 2.3 Plugin Entry Point

**File**: `index.js`

```typescript
// @steedos/plugin-crm/index.js
export async function onLoad(kernel) {
  console.log('CRM Plugin loading...');
  
  // Register custom field type
  kernel.registerFieldType('revenue', {
    validate: (value) => {
      if (value < 0) throw new Error('Revenue must be positive');
    },
    format: (value) => `$${value.toLocaleString()}`
  });
  
  // Register custom validator
  kernel.registerValidator('opportunity_stage', (value, record) => {
    const validStages = ['Prospecting', 'Qualification', 'Closed Won'];
    if (!validStages.includes(value)) {
      throw new Error(`Invalid stage: ${value}`);
    }
  });
}

export async function onStart(kernel) {
  console.log('CRM Plugin started');
  
  // Subscribe to events
  kernel.on('contact.created', async (event) => {
    await createWelcomeTask(event.data);
  });
}

export async function onStop(kernel) {
  console.log('CRM Plugin stopping...');
  
  // Cleanup resources
  await closeConnections();
}
```

---

## 3. Plugin Lifecycle

### 3.1 The Five Stages

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ DISCOVER │──▶│   LOAD   │──▶│  START   │──▶│ RUNNING  │──▶│   STOP   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │              │              │
     │              │              │              │              │
  Scan NPM       Parse         Execute         Handle         Cleanup
  packages      manifest       onLoad()        events        onStop()
                & deps
```

### 3.2 Discovery Phase

**Responsibility**: Find available plugins.

```typescript
// @objectos/kernel/src/plugin/PluginDiscovery.ts
export class PluginDiscovery {
  async discover(searchPaths: string[]): Promise<PluginManifest[]> {
    const plugins = [];
    
    // 1. Scan node_modules
    const nodeModules = await this.scanNodeModules();
    plugins.push(...nodeModules);
    
    // 2. Scan local directories
    for (const path of searchPaths) {
      const localPlugins = await this.scanDirectory(path);
      plugins.push(...localPlugins);
    }
    
    return plugins;
  }
  
  private async scanNodeModules(): Promise<PluginManifest[]> {
    const packages = await glob('node_modules/@*/plugin-*/plugin.json');
    
    return Promise.all(
      packages.map(path => this.loadManifest(path))
    );
  }
  
  private async loadManifest(path: string): Promise<PluginManifest> {
    const raw = await fs.readFile(path, 'utf-8');
    const manifest = JSON.parse(raw);
    
    // Validate manifest schema
    this.validateManifest(manifest);
    
    return {
      ...manifest,
      $path: path,
      $dir: dirname(path)
    };
  }
}
```

### 3.3 Load Phase

**Responsibility**: Initialize plugin and register capabilities.

```typescript
// @objectos/kernel/src/plugin/PluginLoader.ts
export class PluginLoader {
  async load(manifest: PluginManifest): Promise<Plugin> {
    console.log(`Loading plugin: ${manifest.name}`);
    
    // 1. Check dependencies
    await this.checkDependencies(manifest.dependencies);
    
    // 2. Load JavaScript module
    const module = await import(resolve(manifest.$dir, manifest.main || 'index.js'));
    
    // 3. Create plugin context
    const context = this.createContext(manifest);
    
    // 4. Execute onLoad hook
    if (module.onLoad) {
      await module.onLoad(context);
    }
    
    // 5. Register capabilities
    await this.registerCapabilities(manifest, context);
    
    return {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      module,
      context,
      status: 'loaded'
    };
  }
  
  private createContext(manifest: PluginManifest): PluginContext {
    return {
      id: manifest.id,
      logger: this.createLogger(manifest.id),
      kernel: this.kernel,
      
      // Plugin API
      registerObject: (obj) => this.kernel.registerObject(obj),
      registerTrigger: (trigger) => this.kernel.registerTrigger(trigger),
      registerAPI: (route) => this.kernel.registerAPI(route),
      
      // Event bus
      on: (event, handler) => this.kernel.on(event, handler),
      emit: (event, data) => this.kernel.emit(event, data)
    };
  }
}
```

### 3.4 Start Phase

**Responsibility**: Activate plugin features.

```typescript
async start(plugin: Plugin): Promise<void> {
  console.log(`Starting plugin: ${plugin.name}`);
  
  // Execute onStart hook
  if (plugin.module.onStart) {
    await plugin.module.onStart(plugin.context);
  }
  
  plugin.status = 'running';
  
  this.emit('plugin:started', { id: plugin.id });
}
```

### 3.5 Stop Phase

**Responsibility**: Gracefully shutdown plugin.

```typescript
async stop(plugin: Plugin): Promise<void> {
  console.log(`Stopping plugin: ${plugin.name}`);
  
  // Execute onStop hook
  if (plugin.module.onStop) {
    await plugin.module.onStop(plugin.context);
  }
  
  // Unregister event listeners
  this.kernel.removeAllListeners(plugin.id);
  
  // Clear timers/intervals
  clearAllTimers(plugin.id);
  
  plugin.status = 'stopped';
  
  this.emit('plugin:stopped', { id: plugin.id });
}
```

---

## 4. Dependency Management

### 4.1 Plugin Dependencies

**Scenario**: CRM plugin depends on Auth plugin.

```json
// @steedos/plugin-crm/plugin.json
{
  "id": "steedos-crm",
  "dependencies": {
    "objectos": "^0.3.0",
    "@objectos/plugin-auth": "^1.0.0"
  }
}
```

**Load Order Resolution**:

```typescript
// @objectos/kernel/src/plugin/DependencyResolver.ts
export class DependencyResolver {
  resolve(plugins: PluginManifest[]): PluginManifest[] {
    const graph = this.buildDependencyGraph(plugins);
    return this.topologicalSort(graph);
  }
  
  private buildDependencyGraph(plugins: PluginManifest[]): Graph {
    const graph = new Map();
    
    for (const plugin of plugins) {
      const deps = Object.keys(plugin.dependencies || {})
        .filter(dep => dep.startsWith('@objectos/plugin-'));
      
      graph.set(plugin.id, deps);
    }
    
    return graph;
  }
  
  private topologicalSort(graph: Graph): PluginManifest[] {
    // Kahn's algorithm (same as metadata dependency resolution)
    // ...
  }
}
```

**Result**: Auth plugin loads before CRM plugin.

### 4.2 Circular Dependency Detection

```typescript
private detectCycles(graph: Graph): void {
  const visited = new Set();
  const stack = new Set();
  
  for (const node of graph.keys()) {
    if (this.hasCycle(node, graph, visited, stack)) {
      throw new Error(`Circular dependency detected: ${Array.from(stack).join(' -> ')}`);
    }
  }
}

private hasCycle(node: string, graph: Graph, visited: Set, stack: Set): boolean {
  if (stack.has(node)) return true;  // Cycle found
  if (visited.has(node)) return false;
  
  visited.add(node);
  stack.add(node);
  
  for (const dep of graph.get(node) || []) {
    if (this.hasCycle(dep, graph, visited, stack)) {
      return true;
    }
  }
  
  stack.delete(node);
  return false;
}
```

---

## 5. Event-Based Communication

### 5.1 The Event Bus

**Core Concept**: Plugins communicate via events, not direct imports.

```typescript
// ❌ BAD: Direct coupling
import { ContactService } from '@steedos/plugin-crm';

// In auth plugin
await ContactService.createContact({ ... });  // Tight coupling!

// ✅ GOOD: Event-based decoupling
// In auth plugin
kernel.emit('user.registered', { email, name });

// In CRM plugin
kernel.on('user.registered', async (data) => {
  await createContactFromUser(data);
});
```

**Benefits**:
- Plugins don't know about each other
- Easy to add/remove features
- Testable (mock event bus)

### 5.2 Event Bus Implementation

```typescript
// @objectos/kernel/src/event/EventBus.ts
export class EventBus extends EventEmitter {
  private subscriptions = new Map<string, Subscription[]>();
  
  on(event: string, handler: EventHandler, pluginId?: string): void {
    super.on(event, handler);
    
    // Track subscriptions for cleanup
    if (pluginId) {
      if (!this.subscriptions.has(pluginId)) {
        this.subscriptions.set(pluginId, []);
      }
      this.subscriptions.get(pluginId).push({ event, handler });
    }
  }
  
  async emit(event: string, data: any): Promise<void> {
    console.log(`Event: ${event}`, data);
    
    // Emit event
    super.emit(event, data);
    
    // Log for audit
    await this.logEvent(event, data);
  }
  
  removeAllListeners(pluginId: string): void {
    const subs = this.subscriptions.get(pluginId) || [];
    
    for (const { event, handler } of subs) {
      super.removeListener(event, handler);
    }
    
    this.subscriptions.delete(pluginId);
  }
}
```

### 5.3 Standard Events

**ObjectOS Core Events**:

```typescript
// Lifecycle events
'kernel:started'
'kernel:stopping'

// Object events
'object:registered'
'object:updated'

// Data events
'data:beforeInsert'
'data:afterInsert'
'data:beforeUpdate'
'data:afterUpdate'
'data:beforeDelete'
'data:afterDelete'

// User events
'user:login'
'user:logout'
'user:registered'

// Sync events
'sync:started'
'sync:completed'
'sync:conflict'
```

**Plugin-Specific Events**:

```typescript
// CRM plugin
'contact:created'
'opportunity:closed'
'lead:converted'

// Workflow plugin
'workflow:started'
'workflow:completed'
'workflow:failed'
```

---

## 6. Security & Sandboxing

### 6.1 Permission Model

**Principle**: Plugins request permissions; kernel enforces them.

```json
// plugin.json
{
  "permissions": {
    "required": [
      "read:contacts",
      "write:contacts",
      "admin:users"
    ],
    "optional": [
      "send:email"
    ]
  }
}
```

**Permission Check**:

```typescript
// In plugin code
const contacts = await context.kernel.find('contacts', { ... });

// Kernel checks permission
class Kernel {
  async find(objectName: string, options: FindOptions): Promise<any[]> {
    const plugin = this.getCurrentPlugin();
    
    // Verify permission
    if (!plugin.hasPermission(`read:${objectName}`)) {
      throw new Error(`Plugin ${plugin.id} lacks permission read:${objectName}`);
    }
    
    return this.driver.find(objectName, options);
  }
}
```

### 6.2 Resource Limits

**Prevent resource exhaustion**:

```typescript
// @objectos/kernel/src/plugin/ResourceMonitor.ts
export class ResourceMonitor {
  private limits = {
    maxMemory: 100 * 1024 * 1024,  // 100MB per plugin
    maxCPU: 0.5,                    // 50% CPU usage
    maxDiskIO: 10 * 1024 * 1024,    // 10MB/s disk I/O
  };
  
  monitor(plugin: Plugin): void {
    setInterval(() => {
      const usage = this.getUsage(plugin);
      
      if (usage.memory > this.limits.maxMemory) {
        this.emit('plugin:memory-exceeded', { plugin, usage });
        this.throttle(plugin);
      }
      
      if (usage.cpu > this.limits.maxCPU) {
        this.emit('plugin:cpu-exceeded', { plugin, usage });
        this.throttle(plugin);
      }
    }, 5000);
  }
  
  private throttle(plugin: Plugin): void {
    // Reduce plugin priority
    // Queue plugin tasks instead of immediate execution
  }
}
```

### 6.3 Code Isolation (Future)

**Use VM or Worker Threads**:

```typescript
// Run plugin in isolated context
import { Worker } from 'worker_threads';

class PluginSandbox {
  async execute(plugin: Plugin, method: string, args: any[]): Promise<any> {
    const worker = new Worker('./plugin-worker.js');
    
    worker.postMessage({
      plugin: plugin.id,
      method,
      args
    });
    
    return new Promise((resolve, reject) => {
      worker.on('message', resolve);
      worker.on('error', reject);
      
      // Timeout after 30 seconds
      setTimeout(() => {
        worker.terminate();
        reject(new Error('Plugin timeout'));
      }, 30000);
    });
  }
}
```

---

## 7. Plugin API Design

### 7.1 Context API

**What plugins can access**:

```typescript
interface PluginContext {
  // Plugin metadata
  id: string;
  version: string;
  
  // Logging
  logger: Logger;
  
  // Data access
  find(object: string, query: Query): Promise<any[]>;
  insert(object: string, data: any): Promise<any>;
  update(object: string, id: string, data: any): Promise<any>;
  delete(object: string, id: string): Promise<void>;
  
  // Event bus
  on(event: string, handler: EventHandler): void;
  emit(event: string, data: any): void;
  
  // HTTP
  http: {
    get(url: string): Promise<Response>;
    post(url: string, body: any): Promise<Response>;
  };
  
  // Storage (key-value store for plugin state)
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
  };
  
  // Configuration
  config: Record<string, any>;
}
```

### 7.2 Extension Points

**Hooks plugins can register**:

```typescript
interface PluginHooks {
  // Lifecycle
  onLoad?(context: PluginContext): Promise<void>;
  onStart?(context: PluginContext): Promise<void>;
  onStop?(context: PluginContext): Promise<void>;
  
  // Data hooks
  beforeInsert?(context: DataContext): Promise<void>;
  afterInsert?(context: DataContext): Promise<void>;
  beforeUpdate?(context: DataContext): Promise<void>;
  afterUpdate?(context: DataContext): Promise<void>;
  beforeDelete?(context: DataContext): Promise<void>;
  afterDelete?(context: DataContext): Promise<void>;
  
  // Custom field types
  registerFieldType?(name: string, handler: FieldTypeHandler): void;
  
  // Custom validators
  registerValidator?(name: string, handler: ValidatorFn): void;
  
  // Custom API routes
  registerRoute?(route: RouteDefinition): void;
}
```

---

## 8. Plugin Examples

### 8.1 Simple Plugin: Email Notifications

```typescript
// @steedos/plugin-email/index.js
import nodemailer from 'nodemailer';

export async function onLoad(context) {
  // Configure email transport
  const transport = nodemailer.createTransport({
    host: context.config.smtp_host,
    port: context.config.smtp_port,
    auth: {
      user: context.config.smtp_user,
      pass: context.config.smtp_pass
    }
  });
  
  // Store in plugin state
  await context.storage.set('transport', transport);
}

export async function onStart(context) {
  // Listen for events
  context.on('contact:created', async (event) => {
    const transport = await context.storage.get('transport');
    
    await transport.sendMail({
      to: 'admin@example.com',
      subject: 'New Contact Created',
      text: `Contact ${event.data.name} was created`
    });
  });
}
```

### 8.2 Complex Plugin: Workflow Engine

```typescript
// @steedos/plugin-workflow/index.js
export async function onLoad(context) {
  // Register custom object
  context.registerObject({
    name: 'workflows',
    label: 'Workflow',
    fields: {
      name: { type: 'text', required: true },
      trigger: { type: 'select', options: ['manual', 'automatic'] },
      steps: { type: 'json' }
    }
  });
  
  // Register custom field type
  context.registerFieldType('workflow_state', {
    validate(value) {
      const validStates = ['pending', 'running', 'completed', 'failed'];
      if (!validStates.includes(value)) {
        throw new Error('Invalid workflow state');
      }
    }
  });
}

export async function onStart(context) {
  // Start workflow engine
  const engine = new WorkflowEngine(context);
  await engine.start();
  
  // Listen for workflow triggers
  context.on('workflow:trigger', async (event) => {
    await engine.execute(event.workflow_id, event.data);
  });
}
```

---

## 9. Plugin Distribution

### 9.1 NPM Registry

**Publish as NPM package**:

```bash
# Package structure
@steedos/plugin-crm/
├── package.json
├── plugin.json
└── ...

# Publish
npm publish --access public

# Install
npm install @steedos/plugin-crm
```

**Auto-discovery**: ObjectOS scans `node_modules/@steedos/plugin-*`

### 9.2 Plugin Marketplace

**Future**: Central plugin registry

```typescript
// Install plugin via CLI
objectos plugin:install @steedos/plugin-crm

// Browse marketplace
objectos plugin:search "crm"

// Update plugins
objectos plugin:update
```

---

## 10. Testing Strategies

### 10.1 Unit Tests

```typescript
describe('CRM Plugin', () => {
  let context: PluginContext;
  
  beforeEach(() => {
    context = createMockContext();
  });
  
  it('should create contact on user registration', async () => {
    await onStart(context);
    
    // Trigger event
    await context.emit('user:registered', {
      email: 'test@example.com',
      name: 'Test User'
    });
    
    // Verify contact created
    const contacts = await context.find('contacts', {
      filters: { email: 'test@example.com' }
    });
    
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe('Test User');
  });
});
```

### 10.2 Integration Tests

```typescript
describe('Plugin System', () => {
  it('should load plugins in dependency order', async () => {
    const plugins = [
      { id: 'crm', dependencies: { 'auth': '^1.0.0' } },
      { id: 'auth', dependencies: {} }
    ];
    
    const loaded = await kernel.loadPlugins(plugins);
    
    // Auth should load before CRM
    expect(loaded[0].id).toBe('auth');
    expect(loaded[1].id).toBe('crm');
  });
  
  it('should detect circular dependencies', async () => {
    const plugins = [
      { id: 'a', dependencies: { 'b': '^1.0.0' } },
      { id: 'b', dependencies: { 'a': '^1.0.0' } }
    ];
    
    await expect(kernel.loadPlugins(plugins)).rejects.toThrow('Circular dependency');
  });
});
```

---

## 11. Best Practices

### 11.1 Plugin Design Principles

**1. Single Responsibility**: One plugin, one purpose

```
✅ @steedos/plugin-email      (Email only)
❌ @steedos/plugin-everything (Email + SMS + Push + ...)
```

**2. Loose Coupling**: Use events, not imports

```typescript
// ✅ GOOD
context.emit('invoice:created', invoice);

// ❌ BAD
import { NotificationService } from '@steedos/plugin-notifications';
await NotificationService.send(...);
```

**3. Graceful Degradation**: Handle missing dependencies

```typescript
export async function onStart(context) {
  // Check if optional dependency is available
  if (context.hasPlugin('@steedos/plugin-sms')) {
    context.on('alert:critical', sendSMS);
  } else {
    context.logger.warn('SMS plugin not available, using email fallback');
    context.on('alert:critical', sendEmail);
  }
}
```

### 11.2 Performance Optimization

**1. Lazy Loading**: Only load when needed

```typescript
// Don't load all plugins at startup
const lazyPlugins = ['reports', 'analytics', 'advanced-charts'];

kernel.onDemand(lazyPlugins);

// Load when accessed
app.get('/reports', async (req, res) => {
  await kernel.loadPlugin('reports');
  // ...
});
```

**2. Caching**: Cache expensive computations

```typescript
export async function onStart(context) {
  // Cache configuration
  const config = await context.storage.get('config');
  
  if (!config) {
    const fetched = await fetchConfig();
    await context.storage.set('config', fetched, { ttl: 3600 });
  }
}
```

---

## 12. Conclusion

The ObjectOS Plugin System achieves **extreme extensibility** through:

1. **Microkernel Architecture**: Minimal core, maximum flexibility
2. **Manifest-Driven**: Declarative plugin definitions
3. **Event-Based Communication**: Loose coupling between plugins
4. **Lifecycle Management**: Controlled load/start/stop sequence
5. **Security Boundaries**: Permissions and resource limits

**Key Insight**: By treating features as **plugins**, ObjectOS becomes a **platform** rather than a product—enabling endless customization without forking the codebase.

---

**Next Article**: [Workflow Engine State Machine Design](./05-workflow-engine.md)
