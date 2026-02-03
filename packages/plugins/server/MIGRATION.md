# Migration Guide: Server Plugin Auth Integration

## Overview

The `@objectos/plugin-server` has been migrated to use `@objectos/plugin-better-auth` instead of maintaining its own duplicate Better-Auth implementation.

## What Changed

### Before (v0.0.x)

The server plugin included its own Better-Auth client implementation:

```typescript
// Duplicate Better-Auth implementation in packages/plugins/server/src/auth/
├── auth.client.ts        // Duplicate Better-Auth configuration
├── auth.controller.ts    // Direct Better-Auth handler
├── auth.middleware.ts    // Direct auth.api calls
└── auth.module.ts
```

### After (v0.1.0+)

The server plugin now integrates with the standalone Better-Auth plugin:

```typescript
// Simplified auth integration
├── auth.client.ts        // DEPRECATED (kept for compatibility)
├── auth.controller.ts    // Delegates to Better-Auth plugin
├── auth.middleware.ts    // Gets auth from Better-Auth plugin
└── auth.module.ts        // Provides Better-Auth plugin DI
```

## Benefits

1. **Single Source of Truth**: Authentication logic is centralized in `@objectos/plugin-better-auth`
2. **No Duplication**: Eliminated duplicate Better-Auth configuration
3. **Better Maintainability**: Auth updates only need to be made in one place
4. **Consistent Behavior**: All applications using ObjectOS share the same auth implementation
5. **Cleaner Dependencies**: Server plugin no longer directly depends on better-auth internals

## Migration Steps

### For Application Developers

**No action required** if you're using the server plugin through the ObjectOS kernel. The migration is backward compatible.

#### Example: Before

```typescript
import { createServerPlugin } from '@objectos/plugin-server';

const serverPlugin = createServerPlugin({
  port: 3000
});
```

#### Example: After

```typescript
import { createServerPlugin } from '@objectos/plugin-server';
import { BetterAuthPlugin } from '@objectos/plugin-better-auth';

// Ensure Better-Auth plugin is loaded in the kernel
const kernel = new ObjectKernel({
  plugins: [
    BetterAuthPlugin,  // Auth plugin MUST be loaded first
    createServerPlugin({ port: 3000 })
  ]
});
```

### For Plugin Developers

If you were directly importing from `@objectos/plugin-server/auth`, you should migrate to use `@objectos/plugin-better-auth`:

#### Before

```typescript
import { getAuth } from '@objectos/plugin-server/auth/auth.client';

const auth = await getAuth();
```

#### After

```typescript
import { getBetterAuth } from '@objectos/plugin-better-auth';

const auth = await getBetterAuth({
  databaseUrl: process.env.OBJECTQL_DATABASE_URL,
  // ... other config
});
```

## Deprecation Notice

### `auth.client.ts`

**Status**: DEPRECATED  
**Removal**: Version 0.2.0

The `auth.client.ts` file is now deprecated. It's kept for backward compatibility during the migration period.

**Migration Path**: Use `@objectos/plugin-better-auth` directly instead.

## Dependencies

### Updated Dependencies

**Removed from production dependencies**:
- `better-auth` (moved to better-auth plugin)
- `better-sqlite3` (moved to better-auth plugin)
- `mongodb` (moved to better-auth plugin)
- `pg` (moved to better-auth plugin)

**Added to production dependencies**:
- `@objectos/plugin-better-auth@workspace:*`

**Kept as devDependencies** (for deprecated auth.client.ts):
- `better-auth`
- `better-sqlite3`
- `mongodb`
- `pg`

## Architecture

### Plugin Dependency Chain

```
ObjectKernel
    ├── BetterAuthPlugin (com.objectos.auth.better-auth)
    │   └── Provides: Better-Auth instance
    │   └── Service: 'better-auth'
    │
    └── ServerPlugin (com.objectos.server)
        ├── Depends on: com.objectos.auth.better-auth
        └── Uses: Better-Auth instance from service registry
```

### Request Flow

```
HTTP Request
    ↓
NestJS Server (ServerPlugin)
    ↓
AuthMiddleware
    ↓
Get Better-Auth from Kernel Service Registry
    ↓
Extract Session
    ↓
Attach req.user
    ↓
Continue to Controller
```

## Configuration

### Environment Variables

No changes to environment variables. The same variables work for both:

- `OBJECTQL_DATABASE_URL` - Database connection
- `BETTER_AUTH_URL` - Base URL for auth endpoints
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth (if using)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - OAuth (if using)

See `@objectos/plugin-better-auth` documentation for complete configuration options.

## Testing

### Running Tests

```bash
# Test server plugin
cd packages/plugins/server
pnpm test

# Test better-auth plugin
cd packages/plugins/better-auth
pnpm test
```

### Integration Testing

Ensure both plugins are loaded when testing:

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { BetterAuthPlugin } from '@objectos/plugin-better-auth';
import { ServerPlugin } from '@objectos/plugin-server';

describe('Server with Auth Integration', () => {
  let kernel: ObjectKernel;

  beforeAll(async () => {
    kernel = new ObjectKernel({
      plugins: [
        BetterAuthPlugin,
        ServerPlugin
      ]
    });
    await kernel.init();
    await kernel.start();
  });

  afterAll(async () => {
    await kernel.destroy();
  });

  it('should authenticate users', async () => {
    // Your test here
  });
});
```

## Troubleshooting

### "Better-Auth plugin not available"

**Cause**: The Better-Auth plugin is not loaded in the kernel or not registered correctly.

**Solution**: Ensure `@objectos/plugin-better-auth` is:
1. Listed in your kernel's plugins array
2. Loaded **before** the server plugin (due to dependency chain)

```typescript
plugins: [
  BetterAuthPlugin,  // Must be first
  ServerPlugin
]
```

### "Better-Auth instance not initialized"

**Cause**: The Better-Auth plugin's `init()` method hasn't completed.

**Solution**: Ensure you call `await kernel.init()` before `await kernel.start()`.

### "Cannot find module '@objectos/plugin-better-auth'"

**Cause**: The workspace dependency isn't installed.

**Solution**:
```bash
cd /path/to/objectos
pnpm install --no-frozen-lockfile
```

## Rollback Instructions

If you need to rollback to the old implementation:

1. Checkout the previous version:
   ```bash
   git checkout v0.0.x packages/plugins/server
   ```

2. Reinstall dependencies:
   ```bash
   pnpm install --no-frozen-lockfile
   ```

3. Rebuild:
   ```bash
   cd packages/plugins/server
   pnpm build
   ```

## Support

For issues or questions:
- Create an issue at https://github.com/objectstack-ai/objectos/issues
- Check the documentation at `packages/plugins/better-auth/README.md`
- Review the integration plan at `BETTER_AUTH_INTEGRATION_PLAN.md`

## Related Documentation

- [Better-Auth Plugin README](../better-auth/README.md)
- [Better-Auth Integration Plan](../../BETTER_AUTH_INTEGRATION_PLAN.md)
- [Server Plugin README](./README.md)
- [ObjectOS Architecture](../../ARCHITECTURE.md)
