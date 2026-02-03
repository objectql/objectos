# ObjectOS Microkernel Quick Reference

> Quick guide for ObjectOS plugin development

---

## 🚀 Quick Start

### Installation

```bash
pnpm add @objectstack/runtime
```

### Create a Plugin

```typescript
import { PluginManifest, PluginContext } from '@objectstack/runtime';

// 1. Define manifest
export const manifest: PluginManifest = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0'
};

// 2. Implement plugin
export class MyPlugin {
  async onLoad(ctx: PluginContext) {
    ctx.logger.info('Plugin loaded');
  }
}
```

### Start Runtime

```typescript
import { ObjectStackRuntime } from '@objectstack/runtime';

const runtime = new ObjectStackRuntime({
  plugins: [
    { id: 'my-plugin', name: 'My Plugin', version: '1.0.0' }
  ]
});

await runtime.start();
```

---

## 📦 Core Concepts

### Plugin Lifecycle

```
Install → Load → Enable → (Running) → Disable → Uninstall
            ↓
          Error
```

### Lifecycle Hooks

| Hook | When | Purpose |
|------|------|---------|
| `onInstall` | First install | Initialize DB, create defaults |
| `onLoad` | Load manifest | Register services, subscribe to events |
| `onEnable` | Enable plugin | Start tasks, connect to services |
| `onDisable` | Disable plugin | Stop tasks, disconnect |
| `onUninstall` | Uninstall | Clean up, remove data |

---

## 🔧 Service Registry

### Register Service

```typescript
ctx.services.register('calculator', {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
});
```

### Use Service

```typescript
const calc = ctx.services.get('calculator');
const result = calc.add(5, 3); // 8
```

---

## 📡 Event Bus

### Subscribe to Event

```typescript
ctx.events.on('user.created', async (data) => {
  console.log('New user:', data.name);
});
```

### Publish Event

```typescript
ctx.events.emit('user.created', {
  id: '123',
  name: 'John',
  email: 'john@example.com'
});
```

---

## 💾 Storage

### Basic Operations

```typescript
// Save
await ctx.storage.set('counter', 42);

// Load
const counter = await ctx.storage.get('counter');

// Delete
await ctx.storage.delete('counter');

// Clear
await ctx.storage.clear();
```

---

## 📝 Logging

```typescript
ctx.logger.debug('Debug info');
ctx.logger.info('Info message');
ctx.logger.warn('Warning message');
ctx.logger.error('Error message', error);
```

---

## 🔗 Dependency Management

### Declare Dependencies

```typescript
export const manifest: PluginManifest = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  dependencies: {
    '@objectos/plugin-auth': '^1.0.0',
    '@objectos/plugin-database': '^1.0.0'
  }
};
```

### Check Dependencies

```typescript
async onLoad(ctx: PluginContext) {
  const auth = ctx.services.get('auth');
  if (!auth) {
    throw new Error('Auth service required');
  }
}
```

---

## 🎯 Common Patterns

### Register Service and Subscribe to Events

```typescript
export class MyPlugin {
  async onLoad(ctx: PluginContext) {
    // Register service
    ctx.services.register('my-service', {
      doSomething: () => 'done'
    });
    
    // Subscribe to events
    ctx.events.on('user.created', async (data) => {
      await this.handleUserCreated(data);
    });
  }
}
```

### Use Configuration

```typescript
export const manifest: PluginManifest = {
  id: 'my-plugin',
  // ...
  config: {
    apiKey: process.env.MY_PLUGIN_API_KEY || '',
    timeout: 5000
  }
};

async onLoad(ctx: PluginContext) {
  const apiKey = ctx.config.apiKey;
  if (!apiKey) {
    throw new Error('API Key required');
  }
}
```

### Cache Data

```typescript
async function getCached<T>(
  ctx: PluginContext,
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check cache
  const cached = await ctx.storage.get<T>(key);
  if (cached) return cached;
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await ctx.storage.set(key, data);
  
  return data;
}
```

---

## ⚠️ Best Practices

### 1. Error Handling

```typescript
async onLoad(ctx: PluginContext) {
  try {
    await this.initialize();
  } catch (error) {
    ctx.logger.error('Initialization failed', error as Error);
    throw error; // Re-throw to mark plugin as ERROR
  }
}
```

### 2. Graceful Shutdown

```typescript
async onDisable(ctx: PluginContext) {
  // Stop timers
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
  
  // Close connections
  if (this.connection) {
    await this.connection.close();
  }
  
  ctx.logger.info('Cleanup complete');
}
```

### 3. Type Safety

```typescript
interface MyService {
  doSomething(): string;
}

// Register with type
ctx.services.register<MyService>('my-service', {
  doSomething: () => 'done'
});

// Get with type
const service = ctx.services.get<MyService>('my-service');
```

---

## 📚 Example Plugins

### Simple Plugin

```typescript
import { PluginManifest, PluginContext } from '@objectstack/runtime';

export const manifest: PluginManifest = {
  id: 'hello-world',
  name: 'Hello World',
  version: '1.0.0'
};

export class HelloWorldPlugin {
  async onLoad(ctx: PluginContext) {
    ctx.logger.info('Hello, World!');
  }
}
```

### Plugin with Dependencies

```typescript
export const manifest: PluginManifest = {
  id: 'data-plugin',
  name: 'Data Plugin',
  version: '1.0.0',
  dependencies: {
    '@objectos/plugin-auth': '^1.0.0'
  }
};

export class DataPlugin {
  async onLoad(ctx: PluginContext) {
    const auth = ctx.services.get('auth');
    
    ctx.services.register('data', {
      query: async (query) => {
        if (!auth.isAuthenticated()) {
          throw new Error('Not authenticated');
        }
        return [];
      }
    });
  }
}
```

---

## 🧪 Testing

```typescript
import { ObjectStackRuntime } from '@objectstack/runtime';
import { manifest, MyPlugin } from '../src';

describe('MyPlugin', () => {
  let runtime: ObjectStackRuntime;
  
  beforeEach(async () => {
    runtime = new ObjectStackRuntime({
      plugins: [manifest]
    });
    await runtime.start();
  });
  
  afterEach(async () => {
    await runtime.stop();
  });
  
  it('should register service', () => {
    const service = runtime.services.get('my-service');
    expect(service).toBeDefined();
  });
});
```

---

## 🔍 Debugging

### Enable Debug Mode

```typescript
const runtime = new ObjectStackRuntime({
  mode: 'development',
  debug: true  // Enable verbose logging
});
```

### Check Plugin State

```typescript
const plugin = runtime.getPlugin('my-plugin');
console.log(plugin?.state); // 'loaded', 'enabled', 'disabled', 'error'
```

---

## 📖 Related Resources

- [Complete Development Guide](./PLUGIN_DEVELOPMENT_GUIDE.md)
- [Architecture Docs](./ARCHITECTURE.md)
- [API Reference](./packages/runtime/README.md)
- [Example Code](./examples/)

---

## ❓ FAQ

### Q: How to communicate between plugins?

A: Use service registry or event bus:

```typescript
// Method 1: Service registry
const otherService = ctx.services.get('other-service');

// Method 2: Event bus
ctx.events.emit('my-event', { data: 'value' });
```

### Q: How to persist data?

A: Use plugin storage:

```typescript
await ctx.storage.set('key', value);
const value = await ctx.storage.get('key');
```

### Q: How to handle plugin errors?

A: Catch and log errors in lifecycle hooks:

```typescript
async onLoad(ctx: PluginContext) {
  try {
    // Initialization logic
  } catch (error) {
    ctx.logger.error('Load failed', error as Error);
    throw error; // Let runtime know plugin failed
  }
}
```

---

*Quick Reference Version: 1.0.0*
