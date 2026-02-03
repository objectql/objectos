# ObjectStack 0.9.0 Upgrade Guide

## Overview

This document describes the upgrade from @objectstack packages version 0.8.x to 0.9.0, including all breaking changes and migration steps.

## What Changed

### Package Upgrades

All @objectstack packages have been upgraded to version 0.9.0:

- `@objectstack/spec`: 0.8.2 → 0.9.0
- `@objectstack/runtime`: 0.8.0 → 0.9.0  
- `@objectstack/objectql`: 0.8.0 → 0.9.0
- `@objectstack/cli`: 0.8.0 → 0.9.0

### Key Features in 0.9.0

Based on the package exports and structure, @objectstack/spec 0.9.0 includes:

1. **Expanded Protocol Coverage**
   - Automation Protocol: Approval flows, ETL, workflows
   - Integration Protocol: Connectors for databases, file storage, GitHub
   - Hub Protocol: Composer for building integrations
   - Auth Protocol: Enhanced authentication configuration

2. **New System Capabilities**
   - Cache management
   - Change management and compliance
   - Collaboration features
   - Encryption standards
   - Feature flags

3. **Enhanced API Protocol**
   - Batch operations
   - GraphQL support
   - HTTP caching
   - Improved documentation generation
   - Enhanced error handling

4. **AI-Ready Context**
   - LLM auto-discovery (llms.txt)
   - AI agent prompts and architectural context
   - Better integration with AI tools like Cursor/Copilot

### Breaking Changes

#### 1. CLI Import Path (Still Present in 0.9.0)

**Issue:** The CLI still imports from `@objectstack/core` instead of `@objectstack/runtime`

**Patch Applied:**
```diff
- const { ObjectKernel } = await import("@objectstack/core");
+ const { ObjectKernel } = await import("@objectstack/runtime");

- import { QA as CoreQA } from "@objectstack/core";
+ import { QA as CoreQA } from "@objectstack/runtime";
```

**Note:** The `registerPlugin` → `use` issue was fixed upstream in 0.9.0.

#### 2. Plugin Lifecycle Type Changes (From Zod v4)

The plugin lifecycle hook types remain strict due to Zod v4. The `as any` workaround may still be needed:

```typescript
export const MyPlugin: PluginDefinition = {
    onInstall: (async (context: PluginContextData) => {
        await context.storage.set('key', 'value');
    }) as any,
};
```

#### 3. Removed Packages

**Removed from dependencies:**
- `@objectql/starter-basic` - Had peer dependency conflicts with @objectql/core@4.x
- `@objectql/starter-enterprise` - Had peer dependency conflicts with @objectql/core@4.x

**Replacement:** Use `@objectos/preset-base` for core system objects.

## Migration Steps

### 1. Update package.json Files

Update all @objectstack package versions:

```json
{
  "dependencies": {
    "@objectstack/spec": "0.9.0",
    "@objectstack/runtime": "0.9.0",
    "@objectstack/objectql": "0.9.0"
  },
  "devDependencies": {
    "@objectstack/cli": "^0.9.0"
  }
}
```

### 2. Remove Starter Packages

If you're using the starter packages, remove them and use presets instead:

```diff
// objectql.config.ts
export default {
    presets: [
        '@objectos/preset-base',
-       '@objectql/starter-basic',
-       '@objectql/starter-enterprise'
    ]
};
```

### 3. Install Dependencies

```bash
# Use pnpm for workspace projects
pnpm install --no-frozen-lockfile

# Update lockfile
pnpm install
```

### 4. Apply CLI Patch (Temporary)

The CLI patch is currently applied manually via sed. For production, you may want to:
1. Wait for upstream fix
2. Use pnpm patch workflow
3. Apply manual patch in CI/CD

### 5. Build and Test

```bash
# Build all packages
pnpm run build

# Test
pnpm run test
```

## Known Issues

### 1. TypeScript Build Errors

**Current Status:** There are TypeScript compilation errors that need to be fixed:

1. **Missing @objectql/types imports** in kernel package
2. **MaybeAsync<void> type incompatibilities** in plugin lifecycle hooks
3. **ObjectQLPlugin export missing** from @objectstack/runtime
4. **PluginContext API changes** (hasService method)

These issues will be addressed in the next phase of the upgrade.

### 2. CLI Patch Management

The CLI patch is not currently managed via pnpm's patch system due to patch application errors. This needs to be resolved for production deployments.

## New Capabilities to Explore

With @objectstack/spec 0.9.0, you can now leverage:

### Automation Workflows
```typescript
import { Automation } from '@objectstack/spec';

const flow: Automation.Flow = {
  name: 'approval-flow',
  steps: [/* ... */]
};
```

### Integration Connectors
```typescript
import { Integration } from '@objectstack/spec';

const connector: Integration.Connector = {
  type: 'database',
  // ... configuration
};
```

## Next Steps

1. **Fix TypeScript Errors:** Address the build errors identified above
2. **Review Protocol Changes:** Deep dive into new AI, Automation, and Integration protocols
3. **Update Implementation Plan:** Revise development roadmap based on 0.9.0 capabilities
4. **Test Compatibility:** Ensure all existing features work with 0.9.0

## References

- [@objectstack/spec 0.9.0 on NPM](https://www.npmjs.com/package/@objectstack/spec/v/0.9.0)
- [Previous Upgrade: 0.8.0](./OBJECTSTACK_0.8.0_UPGRADE.md)
- [ObjectStack GitHub](https://github.com/objectstack-ai/spec)

---

**Status:** ⚠️ In Progress - TypeScript errors need resolution  
**Last Updated:** 2026-02-02
