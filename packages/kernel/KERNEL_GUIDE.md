# ObjectOS Kernel Guide

## Overview

The `@objectos/kernel` package implements the core runtime engine for ObjectOS, fully compliant with the [@objectstack/spec](https://github.com/objectstack-ai/spec) v0.3.3 protocol.

## Key Features

### 1. Spec-Compliant Plugin System
- **Full Lifecycle Support**: onInstall, onEnable, onLoad, onDisable, onUninstall
- **Manifest-Based Configuration**: Separate static config from runtime behavior
- **Type-Safe**: Full TypeScript support with Zod validation

### 2. Rich Plugin Context
Plugins receive a complete API surface through `PluginContextData`:
- `context.ql` - ObjectQL data access
- `context.os` - System APIs (user, config)
- `context.logger` - Structured logging
- `context.storage` - Plugin-scoped key-value storage
- `context.i18n` - Internationalization
- `context.events` - Event bus
- `context.app.router` - HTTP route registration
- `context.app.scheduler` - Cron job scheduling

### 3. Kernel Context
- Instance identity (`instanceId`)
- Runtime modes (`development`, `production`, `test`, `provisioning`)
- Feature flags
- Application metadata

## Creating a Plugin

### Step 1: Define the Manifest

```typescript
import type { ObjectStackManifest } from '@objectstack/spec/kernel';

const MyManifest: ObjectStackManifest = {
    id: 'com.company.my-plugin',
    version: '1.0.0',
    type: 'plugin',
    name: 'My Plugin',
    description: 'Plugin description',
    permissions: ['system.data.read', 'system.data.write'],
};
```

### Step 2: Implement Lifecycle Hooks

```typescript
import type { PluginDefinition } from '@objectstack/spec/kernel';

const MyPlugin: PluginDefinition = {
    async onInstall(context) {
        // First-time setup
        await context.storage.set('installed_at', Date.now());
    },
    
    async onEnable(context) {
        // Register routes, jobs, event listeners
        context.app.router.post('/api/custom', async (req, res) => {
            res.json({ success: true });
        });
    },
    
    async onDisable(context) {
        // Cleanup runtime state
    },
    
    async onUninstall(context) {
        // Final cleanup
    },
};
```

### Step 3: Register with ObjectOS

```typescript
import { ObjectOS } from '@objectos/kernel';

const os = new ObjectOS({
    specPlugins: [
        { manifest: MyManifest, definition: MyPlugin },
    ],
});

await os.init();
```

## Complete Example

See `src/examples/crm-plugin-example.ts` for a complete, production-ready example.

## API Reference

### ObjectOS Class

```typescript
class ObjectOS {
    constructor(config: ObjectOSConfig)
    async init(): Promise<void>
    registerPlugin(manifest: ObjectStackManifest, definition: PluginDefinition): void
    getKernelContext(): KernelContext
    getPluginManager(): PluginManager
    getContextBuilder(): PluginContextBuilder
    getStorageManager(): StorageManager
}
```

### PluginManager

```typescript
class PluginManager {
    register(manifest: ObjectStackManifest, definition: PluginDefinition): void
    async install(pluginId: string): Promise<void>
    async enable(pluginId: string): Promise<void>
    async disable(pluginId: string): Promise<void>
    async uninstall(pluginId: string): Promise<void>
    hasPlugin(pluginId: string): boolean
    isEnabled(pluginId: string): boolean
    getEnabledPlugins(): PluginEntry[]
}
```

## Testing

Run tests with:

```bash
pnpm test
```

Test coverage includes:
- Kernel context management
- Scoped storage isolation
- Logger functionality
- Plugin lifecycle management
- Complete integration tests

## Migration from Legacy Plugins

Legacy ObjectQL plugins are still supported. To migrate to spec-compliant plugins:

1. Split your plugin into manifest and definition
2. Update lifecycle hooks to use new names
3. Use `context` parameter instead of `app`
4. Register using `specPlugins` config

## Links

- [@objectstack/spec Documentation](https://github.com/objectstack-ai/spec)
- [ObjectOS Architecture](../../ARCHITECTURE.md)
- [Example Plugin](src/plugins/example-spec-plugin.ts)
