# @objectstack/runtime

> Lightweight microkernel for ObjectOS plugin system

## Overview

`@objectstack/runtime` is the core microkernel that powers the ObjectOS plugin architecture. It provides:

- **Plugin Lifecycle Management**: Load, enable, disable, and unload plugins
- **Service Registry**: Dependency injection container for inter-plugin communication
- **Event Bus**: Event-driven communication between plugins
- **Dependency Resolution**: Automatic plugin load ordering based on dependencies
- **Plugin Isolation**: Scoped storage and logging for each plugin

## Installation

```bash
pnpm add @objectstack/runtime
```

## Quick Start

```typescript
import { ObjectStackRuntime } from '@objectstack/runtime';

// Create runtime instance
const runtime = new ObjectStackRuntime({
  mode: 'development',
  debug: true,
  plugins: [
    {
      id: 'my-plugin',
      name: 'My Plugin',
      version: '1.0.0',
      hooks: {
        onLoad: async (ctx) => {
          ctx.logger.info('Plugin loaded!');
        }
      }
    }
  ]
});

// Start runtime
await runtime.start();

// Stop runtime
await runtime.stop();
```

## Core Concepts

### Plugin Manifest

Every plugin must have a manifest that describes its metadata and dependencies:

```typescript
const manifest = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  description: 'A sample plugin',
  
  dependencies: {
    'other-plugin': '^1.0.0'
  },
  
  provides: {
    services: ['my-service'],
    objects: ['./objects/*.yml']
  },
  
  hooks: {
    onLoad: async (ctx) => {
      // Register services
      ctx.services.register('my-service', {
        doSomething: () => 'done'
      });
    }
  }
};
```

### Plugin Lifecycle

Plugins go through the following lifecycle:

1. **INSTALLED**: Plugin is registered but not loaded
2. **LOADED**: Manifest loaded, `onLoad` hook executed
3. **ENABLED**: Plugin is active, `onEnable` hook executed
4. **DISABLED**: Plugin is inactive, `onDisable` hook executed
5. **ERROR**: Plugin encountered an error

### Service Registry

Share functionality between plugins using the service registry:

```typescript
// Register a service
ctx.services.register('calculator', {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
});

// Use a service from another plugin
const calc = ctx.services.get('calculator');
const result = calc.add(5, 3); // 8
```

### Event Bus

Communicate between plugins using events:

```typescript
// Subscribe to events
ctx.events.on('user.created', async (data) => {
  console.log('New user:', data.user.name);
});

// Emit events
ctx.events.emit('user.created', {
  user: { id: 1, name: 'John' }
});
```

### Plugin Storage

Each plugin has isolated storage:

```typescript
// Save data
await ctx.storage.set('counter', 42);

// Load data
const counter = await ctx.storage.get('counter'); // 42

// Delete data
await ctx.storage.delete('counter');
```

## API Reference

### Runtime

#### `new ObjectStackRuntime(config?: RuntimeConfig)`

Create a new runtime instance.

**Config options:**
- `mode`: Runtime mode (`'development' | 'production' | 'test'`)
- `debug`: Enable debug logging
- `plugins`: Array of plugin manifests to auto-load
- `storage`: Storage backend configuration

#### `runtime.start(): Promise<void>`

Start the runtime and load all configured plugins.

#### `runtime.stop(): Promise<void>`

Stop the runtime and disable all plugins.

#### `runtime.loadPlugin(manifest): Promise<Plugin>`

Load a plugin from a manifest.

#### `runtime.getPlugin(id): Plugin | undefined`

Get a loaded plugin by ID.

#### `runtime.enablePlugin(id): Promise<void>`

Enable a loaded plugin.

#### `runtime.disablePlugin(id): Promise<void>`

Disable an enabled plugin.

### Plugin Context

Every plugin receives a context object with:

- `runtime`: Runtime instance
- `services`: Service registry
- `events`: Event bus
- `logger`: Plugin-scoped logger
- `config`: Plugin configuration
- `storage`: Plugin-scoped storage

## Examples

### Simple Plugin

```typescript
const myPlugin = {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0',
  
  hooks: {
    onLoad: async (ctx) => {
      ctx.logger.info('Hello from plugin!');
    },
    
    onEnable: async (ctx) => {
      ctx.events.emit('plugin.ready', {
        plugin: 'hello-world'
      });
    }
  }
};
```

### Plugin with Dependencies

```typescript
const dataPlugin = {
  id: 'data-plugin',
  name: 'Data Plugin',
  version: '1.0.0',
  
  dependencies: {
    'auth-plugin': '^1.0.0'
  },
  
  hooks: {
    onLoad: async (ctx) => {
      const auth = ctx.services.get('auth');
      
      ctx.services.register('data', {
        query: async (query) => {
          // Use auth service
          if (!auth.isAuthenticated()) {
            throw new Error('Not authenticated');
          }
          // Execute query
          return [];
        }
      });
    }
  }
};
```

## Testing

```bash
pnpm test              # Run tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report
```

## License

AGPL-3.0

## Links

- [ObjectOS Documentation](https://objectos.dev)
- [GitHub Repository](https://github.com/objectstack-ai/objectos)
- [@objectstack/spec](https://github.com/objectstack-ai/spec)
