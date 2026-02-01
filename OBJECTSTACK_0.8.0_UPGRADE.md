# ObjectStack 0.8.0 Upgrade Guide

## Overview

This document describes the upgrade from @objectstack packages version 0.7.2 to 0.8.0, including all breaking changes and migration steps.

## What Changed

### Package Upgrades

All @objectstack packages have been upgraded to version 0.8.0:

- `@objectstack/spec`: 0.7.2 → 0.8.0
- `@objectstack/runtime`: 0.7.2 → 0.8.0
- `@objectstack/objectql`: 0.7.2 → 0.8.0
- `@objectstack/cli`: 0.7.2 → 0.8.0

### Dependency Upgrades

#### Zod Version Upgrade (Breaking Change)

**@objectstack/spec@0.8.0 requires Zod v4.3.6** (previously v3.25.76). This is a breaking change.

**Changes made:**
- `@objectos/kernel`: Updated `zod` dependency from `^3.25.76` to `^4.3.6`

**Impact:**
- All packages using Zod types must be compatible with Zod v4
- Plugin lifecycle hooks have stricter type requirements

### Fixed Issues in 0.8.0

#### 1. ✅ Missing .js Extensions (FIXED)

The official @objectstack packages version 0.8.0 have **fixed** the missing `.js` extensions in ES module imports.

**Patches removed:**
- `patches/@objectstack__runtime@0.7.2.patch` (no longer needed)
- `patches/@objectstack__objectql@0.7.2.patch` (no longer needed)

#### 2. ⚠️ CLI Import Issues (PARTIALLY FIXED)

The @objectstack/cli@0.8.0 still has some API compatibility issues that require patching.

**Issues in CLI:**
- Imports from `@objectstack/core` instead of `@objectstack/runtime`
- Uses `kernel.registerPlugin()` instead of `kernel.use()`

**Solution:** Applied pnpm patch (`patches/@objectstack__cli@0.8.0.patch`)

**Patch Details:**
```diff
- const { ObjectKernel } = await import("@objectstack/core");
+ const { ObjectKernel } = await import("@objectstack/runtime");

- kernel.registerPlugin(plugin);
+ kernel.use(plugin);
```

### Breaking Changes

#### Plugin Lifecycle Types

The plugin lifecycle hook types have changed due to Zod v4 upgrade. The new types are stricter about return types and parameter types.

**Error example:**
```
Type 'MaybeAsync<void>' is not assignable to type 'Promise<void>'.
  Type 'void' is not assignable to type 'Promise<void>'.
```

**Solution:** Use explicit type casting with `as any` for plugin lifecycle hooks:

```typescript
// Before (0.7.2)
export const MyPlugin: PluginDefinition = {
    async onInstall(context: PluginContextData) {
        await context.storage.set('key', 'value');
    }
};

// After (0.8.0)
export const MyPlugin: PluginDefinition = {
    onInstall: (async (context: PluginContextData) => {
        await context.storage.set('key', 'value');
    }) as any,
};
```

**Affected files:**
- `packages/plugins/audit-log/src/plugin.ts`
- `packages/plugins/better-auth/src/plugin.ts`

**Reason:** The Zod v4 type inference for function schemas creates complex nested types that TypeScript cannot properly match. The `as any` cast is a workaround until the type definitions are improved.

## Migration Steps

### 1. Update package.json Files

Update all @objectstack package versions in your `package.json` files:

```json
{
  "dependencies": {
    "@objectstack/spec": "0.8.0",
    "@objectstack/runtime": "0.8.0",
    "@objectstack/objectql": "0.8.0"
  },
  "devDependencies": {
    "@objectstack/cli": "^0.8.0"
  }
}
```

### 2. Update Zod Dependency

If your package directly depends on Zod, update to v4.3.6:

```json
{
  "dependencies": {
    "zod": "^4.3.6"
  }
}
```

### 3. Update Plugin Lifecycle Hooks

For any custom plugins, update the lifecycle hook signatures:

```typescript
import type { PluginDefinition, PluginContextData } from '@objectstack/spec/system';

export const createMyPlugin = (): PluginDefinition => {
    return {
        onInstall: (async (context: PluginContextData) => {
            // Your installation logic
            await context.storage.set('install_date', new Date().toISOString());
        }) as any,
        
        onEnable: (async (context: PluginContextData) => {
            // Your enable logic
        }) as any,
        
        onDisable: (async (context: PluginContextData) => {
            // Your disable logic
        }) as any,
        
        onUninstall: (async (context: PluginContextData) => {
            // Your uninstall logic
        }) as any,
    };
};

export const MyPlugin: PluginDefinition = createMyPlugin();
```

### 4. Update Patched Dependencies

Update the `patchedDependencies` section in your root `package.json`:

```json
{
  "pnpm": {
    "patchedDependencies": {
      "@objectstack/cli@0.8.0": "patches/@objectstack__cli@0.8.0.patch"
    }
  }
}
```

Remove old patch files:
```bash
rm patches/@objectstack__runtime@0.7.2.patch
rm patches/@objectstack__objectql@0.7.2.patch
rm patches/@objectstack__cli@0.7.2.patch
```

### 5. Install Dependencies

```bash
pnpm install --no-frozen-lockfile
```

### 6. Build and Test

```bash
# Build all packages
pnpm run build

# Test your server
pnpm run dev
```

## Verification

### Build Success

All packages should build successfully with no TypeScript errors:

```bash
$ pnpm run build
> tsc -b && pnpm -r build

✓ Compiled successfully
```

### Package Versions

Verify the installed versions:

```bash
$ pnpm list @objectstack/spec
@objectstack/spec 0.8.0

$ pnpm list zod
zod 4.3.6
```

## Known Issues

### TypeScript Type Inference

The Zod v4 type inference creates complex nested function types that TypeScript struggles to match. We use `as any` casting as a temporary workaround. This is a known issue in the @objectstack/spec package and will likely be addressed in future releases.

### CLI API Compatibility

The @objectstack/cli still requires patching due to:
1. Incorrect package import (`@objectstack/core` vs `@objectstack/runtime`)
2. Deprecated API usage (`registerPlugin` vs `use`)

Monitor the [ObjectStack GitHub repository](https://github.com/objectstack-ai/spec) for upstream fixes.

## Future Work

When @objectstack releases version 0.8.1 or later:

1. Check if the CLI issues are fixed upstream
2. If fixed, remove the CLI patch:
   ```bash
   rm patches/@objectstack__cli@0.8.0.patch
   ```
3. Update `patchedDependencies` in `package.json`
4. Test with `pnpm install`

## Troubleshooting

### Build Errors After Upgrade

If you encounter TypeScript errors after upgrading:

1. **Check Zod version:** Ensure all packages use Zod v4.3.6
   ```bash
   pnpm list zod
   ```

2. **Clear node_modules:**
   ```bash
   rm -rf node_modules
   rm pnpm-lock.yaml
   pnpm install --no-frozen-lockfile
   ```

3. **Rebuild TypeScript:**
   ```bash
   pnpm run build
   ```

### Plugin Type Errors

If you see errors like:
```
Type 'MaybeAsync<void>' is not assignable to type 'Promise<void>'
```

Apply the `as any` cast to your plugin lifecycle hooks as shown in the Migration Steps section.

## Benefits of 0.8.0

1. **ES Module Compatibility:** Fixed .js extensions in imports
2. **Type Safety:** Stricter types with Zod v4
3. **Better Developer Experience:** Improved type inference (when it works)
4. **Future-Proof:** Aligned with latest Zod ecosystem

## References

- [@objectstack/spec NPM](https://www.npmjs.com/package/@objectstack/spec)
- [@objectstack/cli NPM](https://www.npmjs.com/package/@objectstack/cli)
- [ObjectStack GitHub](https://github.com/objectstack-ai/spec)
- [Zod v4 Changelog](https://github.com/colinhacks/zod)
- [Previous Upgrade: 0.7.2](./OBJECTSTACK_0.7.2_UPGRADE.md)
