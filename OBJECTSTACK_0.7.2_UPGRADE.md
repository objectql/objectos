# ObjectStack 0.7.2 Upgrade Guide

## Overview

This document describes the upgrade to @objectstack packages version 0.7.2 and the integration with @objectstack/cli.

## What Changed

### Package Upgrades
- `@objectstack/spec`: 0.7.1 → 0.7.2
- `@objectstack/runtime`: 0.7.1 → 0.7.2
- `@objectstack/objectql`: 0.7.1 → 0.7.2
- Added: `@objectstack/cli@0.7.2` as devDependency

### New Files
- `objectstack.config.ts`: Configuration file for @objectstack/cli compatibility
- `patches/@objectstack__runtime@0.7.2.patch`: Fixes missing .js extensions in ES module imports
- `patches/@objectstack__objectql@0.7.2.patch`: Fixes missing .js extensions and package.json entry points
- `patches/@objectstack__cli@0.7.2.patch`: Fixes incorrect kernel imports and API calls in serve command

### Scripts
- `dev`, `server`, `start`: Use the existing NestJS-based server (recommended for development)
- `objectstack:serve`: Use @objectstack/cli serve command (now working with patched version)

## Known Issues

### 1. @objectstack/cli Bug (FIXED)

The official @objectstack/cli@0.7.2 has multiple bugs in the `serve` command:

**Issues Fixed:**
1. Incorrect import: `ObjectStackKernel` should be `ObjectKernel`
2. Wrong package: `@objectstack/core` should be `@objectstack/runtime`
3. API mismatch: `registerPlugin()` should be `use()` and `boot()` should be `bootstrap()`

**Solution:** Applied pnpm patch (`patches/@objectstack__cli@0.7.2.patch`) to fix these issues.

**Status:** ✅ The `pnpm run objectstack:serve` command now works correctly with the patched version.

**Patch Details** (`patches/@objectstack__cli@0.7.2.patch`):
```diff
- const { ObjectStackKernel } = await import('@objectstack/core');
+ const { ObjectKernel } = await import('@objectstack/runtime');

- const kernel = new ObjectStackKernel({ metadata, objects });
+ const kernel = new ObjectKernel();

- kernel.registerPlugin(plugin);
+ kernel.use(plugin);

- await kernel.boot();
+ await kernel.bootstrap();
```

### 2. @objectstack 0.7.2 Packages Missing .js Extensions

Both @objectstack/runtime and @objectstack/objectql have missing `.js` extensions in their ES module imports, which causes Node.js to fail to resolve modules.

**Solution:** Applied pnpm patches to fix these issues automatically during installation.

### 3. @objectstack/objectql Package Entry Points

The package.json in @objectstack/objectql@0.7.2 incorrectly points to TypeScript source files instead of compiled JavaScript:

```json
{
  "main": "src/index.ts",  // Should be "dist/index.js"
  "types": "src/index.ts"   // Should be "dist/index.d.ts"
}
```

**Solution:** Fixed in the pnpm patch.

## Current Setup

### Starting the Server

You can now use either server option:

**Option 1: NestJS-based server (recommended for development)**
```bash
# Development mode with watch
pnpm run dev

# Production mode
pnpm run start
```

**Option 2: @objectstack/cli server (minimal setup)**
```bash
# Start with default config
pnpm run objectstack:serve

# Or use the CLI directly
objectstack serve
```

### Configuration

The server can use two different configuration files depending on which option you choose:

- **`objectql.config.ts`**: Used by the NestJS-based server (Option 1)
- **`objectstack.config.ts`**: Used by @objectstack/cli serve command (Option 2)

#### objectql.config.ts (current)
```typescript
export default {
    datasource: {
        default: {
            type: 'sqlite',
            filename: 'objectos.db'
        }
    },
    presets: [
        '@objectos/preset-base',
        '@objectql/starter-basic',
        '@objectql/starter-enterprise'
    ]
};
```

#### objectstack.config.ts (template for CLI use)

This is a template configuration showing the expected structure. Currently uses empty plugins array since the @objectstack packages are not installed as direct dependencies.

```typescript
export default {
  metadata: {},
  objects: {},
  plugins: [],  // Empty for now - see comments in file for example usage
  server: {
    port: process.env.PORT || 3000,
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    }
  }
};
```

For actual plugin configuration, you would need to install and import the packages:
```typescript
// Example (when packages are installed):
// import { KnexDriver } from '@objectql/driver-sql';
// import { ObjectQLPlugin } from '@objectstack/objectql';
// import { DriverPlugin } from '@objectstack/runtime';
```

## Testing

### Testing @objectstack/cli serve command

With the patches applied, the CLI serve command now works:

```bash
$ pnpm run objectstack:serve

🚀 ObjectStack Server
------------------------
📂 Config: objectstack.config.ts
🌐 Port: 3000

📦 Loading configuration...
✓ Configuration loaded
🔧 Initializing ObjectStack kernel...
  ✓ Registered HTTP server plugin (port: 3000)

🚀 Starting ObjectStack...
{"timestamp":"2026-02-01T02:17:06.767Z","level":"info","message":"Bootstrap started"}
...
✅ ObjectStack server is running!
```

### Testing NestJS server

The server starts successfully with all upgraded packages:

```bash
$ pnpm run dev

Loading config from /home/runner/work/objectos/objectos/objectql.config.ts
{"timestamp":"2026-01-31T19:06:54.189Z","level":"info","message":"Bootstrap started"}
{"timestamp":"2026-01-31T19:06:54.189Z","level":"info","message":"Phase 1: Init plugins"}
{"timestamp":"2026-01-31T19:06:54.189Z","level":"info","message":"Initializing plugin: com.objectstack.engine.objectql"}
...
{"timestamp":"2026-01-31T19:06:54.193Z","level":"info","message":"✅ Bootstrap complete","pluginCount":2}
[Nest] 4674  - 01/31/2026, 7:06:54 PM     LOG [NestApplication] Nest application successfully started +1ms
Application is running on: http://[::1]:3000
```

## Future Work

With the CLI patch in place, both server options are now available:

1. **Current Recommendation**: Continue using `pnpm run dev` for NestJS-based development server
2. **Alternative**: Use `pnpm run objectstack:serve` for @objectstack/cli-based server (minimal setup)
3. **When upstream fixes are released**: 
   - Update to fixed versions of @objectstack packages
   - Remove patches from `package.json` and `patches/` directory
   - Consider migrating fully to @objectstack/cli-based workflow

## Patches Maintenance

The pnpm patches are version-specific. When upgrading to @objectstack 0.7.3 or later:

1. Check if the bugs are fixed upstream
2. If fixed, remove the patches from `package.json` and `patches/` directory
3. If not fixed, regenerate patches for the new version:
   ```bash
   pnpm patch @objectstack/runtime@<version>
   # Apply fixes
   pnpm patch-commit
   ```

## References

- [@objectstack/spec NPM](https://www.npmjs.com/package/@objectstack/spec)
- [@objectstack/cli NPM](https://www.npmjs.com/package/@objectstack/cli)
- [ObjectStack GitHub](https://github.com/objectstack-ai/spec)
