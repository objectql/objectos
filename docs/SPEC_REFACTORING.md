# ObjectOS Spec Protocol Refactoring

## Overview

This document describes the alignment of ObjectOS with the [@objectstack/spec](https://github.com/objectstack-ai/spec) protocol.

**Current Version:** v0.4.1 (Updated: 2026-01-27)  
**Previous Version:** v0.3.3

## What is @objectstack/spec?

`@objectstack/spec` is the "Constitution" of the ObjectStack ecosystem. It defines:

1. **Zod Schemas**: Runtime validation for the Kernel and CLI
2. **TypeScript Interfaces**: Type-safe definitions for plugins and applications
3. **JSON Schemas**: Auto-generated schemas for VS Code IntelliSense

**Guiding Principle:** *"Strict Types, No Logic"*

## Protocol Namespaces

The specification is organized into five namespaces:

### 1. Data Protocol (`@objectstack/spec/data`)
*Business Kernel & Data Logic*
- `Object`, `Field`, `Validation`
- `Query` (AST), `Driver` (Interface), `Datasource`
- `Permission`, `Sharing`, `Flow`

### 2. System Protocol (`@objectstack/spec/system`) 
*Plugin System, Runtime Infrastructure & Security*
- `Manifest` - Plugin configuration with contribution points
- `Plugin` - Lifecycle hooks (onInstall, onEnable, onDisable, onUninstall)
- `Context` - Runtime context available to plugins (KernelContext, PluginContextData)
- `Logger` - Structured logging
- `Audit` - Audit logging and event tracking
- `Events` - Event bus and handlers
- `Job` - Scheduled jobs and background tasks

**Note:** In v0.4.1, the Kernel Protocol was merged into the System Protocol for better organization.

### 3. UI Protocol (`@objectstack/spec/ui`)
*Presentation & Interaction*
- `App`, `Page`, `View` (Grid/Kanban)
- `Dashboard` (Widgets), `Report`
- `Action` (Triggers)

### 4. API Protocol (`@objectstack/spec/api`)
*Connectivity & Contracts*
- `Contract` (DTOs), `Endpoint` (Gateway)
- `Discovery` (Metadata), `Realtime` (Socket)

### 5. Auth Protocol (`@objectstack/spec/auth`)
*Authentication & Authorization*
- `User`, `Session`, `Role`
- `Permission`, `Token`

## Changes Made

### 1. Dependencies

**Added:**
- `@objectstack/spec@0.3.3` - Core protocol specification

**Updated:**
- TypeScript module resolution to `node16` for better subpath export support

### 2. Type System Refactoring

**Before:**
```typescript
// Old: Direct ObjectQL types
export * from '@objectql/types';
```

**After:**
```typescript
// New: Spec-based types with legacy compatibility
export type { 
    PluginDefinition,
    PluginContextData,
    ObjectStackManifest,
} from '@objectstack/spec/kernel';

export type {
    ServiceObject,
    Field,
    QueryAST,
} from '@objectstack/spec/data';

export type {
    AuditEvent,
    Job,
} from '@objectstack/spec/system';

// Legacy compatibility maintained
export * from '@objectql/types';
```

### 3. Plugin Architecture

The spec defines a clear separation between:

**Manifest (Static Configuration):**
```typescript
const MyPluginManifest: ObjectStackManifest = {
    id: 'com.company.plugin',
    version: '1.0.0',
    type: 'plugin',
    name: 'My Plugin',
    permissions: ['system.user.read'],
    objects: ['./objects/*.yml'],
    definitions: { /* inline object schemas */ },
};
```

**Lifecycle Hooks (Runtime Behavior):**
```typescript
const MyPlugin: PluginDefinition = {
    async onInstall(context) { /* setup */ },
    async onEnable(context) { /* activate */ },
    async onDisable(context) { /* cleanup */ },
    async onUninstall(context) { /* final cleanup */ },
};
```

### 4. Plugin Context API

The spec defines a comprehensive `PluginContextData` interface providing:

- **`context.ql`**: ObjectQL data access
- **`context.os`**: ObjectOS system API
- **`context.logger`**: Structured logging
- **`context.storage`**: Plugin-scoped key-value storage
- **`context.i18n`**: Internationalization
- **`context.metadata`**: Access to object schemas
- **`context.events`**: Event bus
- **`context.app.router`**: HTTP route registration
- **`context.app.scheduler`**: Job scheduling
- **`context.drivers`**: Driver registry

### 5. Documentation Updates

**Updated Files:**
- `README.md` - Added protocol compliance section
- `ARCHITECTURE.md` - Added comprehensive spec explanation
- `packages/kernel/README.md` - Added spec-compliant plugin documentation

**Added Files:**
- `packages/kernel/src/plugins/example-spec-plugin.ts` - Complete example demonstrating spec compliance

## Migration Guide

### For Plugin Developers

**Old Style (ObjectQL Plugin):**
```typescript
export const MyPlugin: ObjectQLPlugin = {
    name: 'my-plugin',
    async setup(app: IObjectQL) {
        // Setup logic
    }
};
```

**New Style (ObjectStack Spec Plugin):**
```typescript
import type { PluginDefinition, PluginContextData } from '@objectstack/spec/kernel';

export const MyPlugin: PluginDefinition = {
    async onEnable(context: PluginContextData) {
        // Access all capabilities through context
        context.logger.info('Plugin enabled');
        
        // Register routes
        context.app.router.post('/api/my-endpoint', handler);
        
        // Access data
        const records = await context.ql.object('accounts').find({});
    }
};
```

### For Application Developers

The API remains mostly unchanged. The main difference is better type safety:

```typescript
import { ObjectOS } from '@objectos/kernel';
import type { ObjectStackManifest } from '@objectstack/spec/kernel';

const os = new ObjectOS({
    plugins: [MyPlugin],
    // ... other config
});

await os.init();
```

## Benefits

### 1. Type Safety
- All types are now centrally defined in `@objectstack/spec`
- Runtime validation with Zod schemas
- Compile-time type checking with TypeScript

### 2. Interoperability
- Consistent protocol across ObjectQL, ObjectOS, and ObjectUI
- Plugins work across different implementations
- JSON Schema for tooling support

### 3. Documentation
- Types serve as documentation
- Examples demonstrate best practices
- VS Code IntelliSense for YAML files

### 4. Future-Proof
- Protocol evolution through versioning
- Backward compatibility through legacy exports
- Clear migration paths

## Testing

All existing tests pass without modification. The refactoring is backward-compatible:

```bash
pnpm --filter @objectos/kernel test
# ✓ 27 tests passed
```

## Build Status

All packages build successfully:

```bash
pnpm --filter @objectos/kernel build  # ✓
pnpm --filter @objectos/server build  # ✓
```

## Example Plugin

See `packages/kernel/src/plugins/example-spec-plugin.ts` for a complete, production-ready example demonstrating:

- Proper manifest structure
- All lifecycle hooks
- Route registration
- Job scheduling
- Data access
- Error handling
- Logging best practices

## Next Steps

1. **Kernel Enhancement**: Implement manifest loader to separate manifest from lifecycle hooks
2. **Plugin Registry**: Build a plugin discovery and management system
3. **Runtime Validation**: Add Zod schema validation for plugin manifests
4. **Context Implementation**: Fully implement all PluginContextData capabilities
5. **Migration Tooling**: Create tools to help migrate existing plugins

## Resources

- [@objectstack/spec on GitHub](https://github.com/objectstack-ai/spec)
- [Example Plugin](../packages/kernel/src/plugins/example-spec-plugin.ts)
- [Kernel README](../packages/kernel/README.md)
- [Architecture Documentation](../ARCHITECTURE.md)

## Conclusion

This refactoring establishes ObjectOS as a spec-compliant member of the ObjectStack ecosystem, ensuring consistency, type safety, and interoperability while maintaining backward compatibility with existing code.
