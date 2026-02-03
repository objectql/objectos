# @objectstack/runtime

> **⚠️ DEPRECATED: This local package is no longer maintained. Please use the published npm version `@objectstack/runtime@0.9.0` instead.**
>
> Install the published version:
> ```bash
> npm install @objectstack/runtime@0.9.0
> ```

The micro-kernel runtime for ObjectStack, implementing a plugin-based architecture.

## Overview

`@objectstack/runtime` provides a lightweight kernel that manages plugin lifecycle and provides core services:

- **Plugin Lifecycle Manager** - Register, initialize, start, and destroy plugins
- **Service Registry** - Dependency injection container for sharing services between plugins
- **Event Bus** - Hook system for inter-plugin communication
- **Dependency Resolver** - Automatic topological sorting of plugin dependencies

## Installation

```bash
npm install @objectstack/runtime
```

## Quick Start

```typescript
import { ObjectKernel, ObjectQLPlugin, DriverPlugin } from '@objectstack/runtime';
import { KnexDriver } from '@objectql/driver-sql';

// Create kernel
const kernel = new ObjectKernel();

// Register plugins
const driver = new KnexDriver({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});

kernel
  .use(new ObjectQLPlugin())
  .use(new DriverPlugin(driver, 'default'));

// Start the kernel
await kernel.bootstrap();

// Access services
const ql = kernel.getService('objectql');

// Use ObjectQL
const result = await ql.query('contacts', { filters: [] });

// Shutdown
await kernel.shutdown();
```

## Plugin Interface

All plugins must implement the `Plugin` interface:

```typescript
interface Plugin {
  name: string;              // Unique plugin identifier
  version?: string;          // Plugin version
  dependencies?: string[];   // Plugin dependencies
  
  init?(ctx: PluginContext): Promise<void> | void;    // Register services, subscribe to events
  start?(ctx: PluginContext): Promise<void> | void;   // Connect to databases, start servers
  destroy?(): Promise<void> | void;                   // Clean up resources
}
```

## Plugin Context

The `PluginContext` provides access to kernel services:

```typescript
interface PluginContext {
  // Service Registry
  registerService(name: string, service: any): void;
  getService<T>(name: string): T;
  hasService(name: string): boolean;
  
  // Event System
  hook(name: string, handler: Function): void;
  trigger(name: string, ...args: any[]): Promise<void>;
  
  // Logger
  logger: Logger;
}
```

## Creating Custom Plugins

```typescript
import { Plugin, PluginContext } from '@objectstack/runtime';

export class MyPlugin implements Plugin {
  name = 'com.mycompany.my-plugin';
  dependencies = ['com.objectstack.engine.objectql'];
  
  async init(ctx: PluginContext): Promise<void> {
    ctx.logger.info('MyPlugin initializing');
    
    // Register a service
    ctx.registerService('my-service', {
      doSomething: () => console.log('Hello!'),
    });
    
    // Subscribe to events
    ctx.hook('kernel:ready', async () => {
      ctx.logger.info('Kernel is ready!');
    });
  }
  
  async start(ctx: PluginContext): Promise<void> {
    ctx.logger.info('MyPlugin starting');
    
    // Get other services
    const ql = ctx.getService('objectql');
  }
  
  async destroy(): Promise<void> {
    // Clean up resources
  }
}
```

## Built-in Plugins

### ObjectQLPlugin

Registers the ObjectQL query engine as a service.

```typescript
import { ObjectQLPlugin } from '@objectstack/runtime';
import { ObjectQL } from '@objectql/core';

// Use default ObjectQL instance
kernel.use(new ObjectQLPlugin());

// Or bring your own instance
const customQL = new ObjectQL({ /* config */ });
kernel.use(new ObjectQLPlugin(customQL));
```

**Registers service:** `objectql`

### DriverPlugin

Registers a database driver with ObjectQL.

```typescript
import { DriverPlugin } from '@objectstack/runtime';
import { KnexDriver } from '@objectql/driver-sql';

const driver = new KnexDriver({
  client: 'pg',
  connection: 'postgresql://localhost/mydb'
});

kernel.use(new DriverPlugin(driver, 'postgres'));
```

**Dependencies:** `['com.objectstack.engine.objectql']`

## Plugin Lifecycle

```
┌──────┐
│ idle │
└──┬───┘
   │ kernel.use(plugin)
   ▼
┌──────┐
│ init │ ← Register services, subscribe to events
└──┬───┘
   │ kernel.bootstrap()
   ▼
┌───────┐
│ start │ ← Connect to databases, start servers
└──┬────┘
   │
   ▼
┌─────────┐
│ running │
└──┬──────┘
   │ kernel.shutdown()
   ▼
┌─────────┐
│ destroy │ ← Clean up resources
└─────────┘
```

## Events

Standard kernel events:

- `kernel:init` - Before plugins init
- `kernel:ready` - After all plugins start
- `kernel:shutdown` - Before shutdown

## License

AGPL-3.0
