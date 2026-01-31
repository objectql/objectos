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

### Scripts
- `dev`, `server`, `start`: Continue to use the existing NestJS-based server
- `objectstack:serve`: New script for future use with @objectstack/cli (currently blocked by CLI bug)

## Known Issues

### 1. @objectstack/cli Bug

The official @objectstack/cli@0.7.2 has a bug where it tries to import `ObjectStackKernel` from `@objectstack/core`, but this export doesn't exist.

**Details:**
```javascript
// In @objectstack/cli/dist/bin.js
const { ObjectStackKernel } = await import('@objectstack/core');
```

**Available exports from @objectstack/core:**
- `ObjectKernel` 
- `EnhancedObjectKernel`

**Impact:** Cannot use `pnpm run objectstack:serve` until this is fixed upstream.

**Workaround:** Continue using `pnpm run dev` which uses the NestJS-based server.

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

Use the existing NestJS-based server:

```bash
# Development mode with watch
pnpm run dev

# Production mode
pnpm run start
```

### Configuration

The server reads configuration from `objectql.config.ts` (existing file). The new `objectstack.config.ts` is prepared for future use with @objectstack/cli once the CLI bug is fixed.

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

#### objectstack.config.ts (for future CLI use)
```typescript
import { KnexDriver } from '@objectql/driver-sql';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { DriverPlugin } from '@objectstack/runtime';

export default {
  metadata: {},
  objects: {},
  plugins: [
    new ObjectQLPlugin(),
    new DriverPlugin(
      new KnexDriver({
        client: 'sqlite3',
        connection: {
          filename: process.env.DATABASE_FILE || 'objectos.db'
        },
        useNullAsDefault: true
      }),
      'default'
    ),
  ],
  server: {
    port: process.env.PORT || 3000,
  }
};
```

## Testing

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

Once the @objectstack/cli bug is fixed:

1. Update to the fixed version of @objectstack/cli
2. Switch to using `pnpm run objectstack:serve` for starting the server
3. Migrate fully to the @objectstack/cli-based workflow

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
