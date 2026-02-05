# Integration Guide: Better-Auth Plugin with ObjectOS Server

This guide explains how to integrate the `@objectos/plugin-better-auth` plugin into an ObjectOS application.

## Overview

The Better-Auth plugin provides authentication capabilities for ObjectOS applications using the [Better-Auth](https://www.better-auth.com/) library. It can be used as a standalone plugin or integrated with the existing `@objectos/server` package.

## Installation

The plugin is already part of the ObjectOS monorepo workspace. If you're using it in a separate project:

```bash
pnpm add @objectos/plugin-better-auth
```

## Basic Integration

### Option 1: Using with ObjectOS Kernel

```typescript
import { ObjectOS } from '@objectos/kernel';
import { BetterAuthPlugin } from '@objectos/plugin-better-auth';

const os = new ObjectOS({
  plugins: [BetterAuthPlugin],
});

await os.init();
```

### Option 2: Custom Configuration

```typescript
import { createBetterAuthPlugin } from '@objectos/plugin-better-auth';

const authPlugin = createBetterAuthPlugin({
  databaseUrl: process.env.DATABASE_URL,
  baseURL: 'https://myapp.com/api/auth',
  trustedOrigins: ['https://myapp.com']
});

const os = new ObjectOS({
  plugins: [authPlugin],
});
```

## Integration with @objectos/server

If you want to migrate from the existing auth implementation in `@objectos/server` to use this plugin:

### Step 1: Install the plugin

The plugin is already in the workspace, so just add it as a dependency:

```json
// packages/server/package.json
{
  "dependencies": {
    "@objectos/plugin-better-auth": "workspace:*"
  }
}
```

### Step 2: Replace auth imports

**Before:**
```typescript
import { getAuth } from './auth/auth.client';
```

**After:**
```typescript
import { getBetterAuth } from '@objectos/plugin-better-auth';
```

### Step 3: Update auth controller

The plugin automatically registers routes at `/api/auth/*` when enabled, so you can simplify your auth controller:

**Before (auth.controller.ts):**
```typescript
@Controller('auth')
export class AuthController {
  @All('*')
  async handler(@Req() req: Request, @Res() res: Response) {
    const auth = await getAuth();
    const { toNodeHandler } = await import('better-auth/node');
    return toNodeHandler(auth)(req, res);
  }
}
```

**After (using plugin):**
The plugin handles this automatically via lifecycle hooks. You can remove the controller or keep it for additional custom endpoints.

### Step 4: Load the plugin in your app module

```typescript
import { Module } from '@nestjs/common';
import { BetterAuthPlugin } from '@objectos/plugin-better-auth';

@Module({
  // ... other config
})
export class AppModule {
  async onModuleInit() {
    // The plugin will be loaded through the kernel
    // No additional setup needed
  }
}
```

## API Endpoints

Once the plugin is enabled, the following endpoints are available:

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session
- And all other Better-Auth endpoints

See [Better-Auth API documentation](https://www.better-auth.com/docs/api-reference) for complete API reference.

## Environment Variables

The plugin uses the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `OBJECTQL_DATABASE_URL` | `sqlite:objectos.db` | Database connection string |
| `BETTER_AUTH_URL` | `http://localhost:3000/api/auth` | Base URL for auth endpoints |

## Plugin Lifecycle

The plugin follows the ObjectOS plugin lifecycle:

1. **onInstall**: Stores installation metadata
2. **onEnable**: Initializes Better-Auth and registers routes at `/api/auth/*`
3. **onDisable**: Gracefully disables (preserves user data)
4. **onUninstall**: Cleans up plugin storage (preserves user data)

## Events

The plugin emits the following events that can be subscribed to:

- `auth.user.created` - Fired when a new user is created
- `auth.user.login` - Fired when a user logs in
- `auth.user.logout` - Fired when a user logs out
- `auth.session.created` - Fired when a new session is created
- `auth.session.expired` - Fired when a session expires

## Migration from Existing Implementation

If you're migrating from the existing `@objectos/server/auth` implementation:

1. The plugin provides the same functionality
2. Database schema is compatible (uses the same Better-Auth tables)
3. API endpoints remain the same (`/api/auth/*`)
4. Configuration can be passed through the plugin factory

## Standalone Usage

The plugin can also be used outside of the ObjectOS kernel:

```typescript
import { getBetterAuth } from '@objectos/plugin-better-auth';

const auth = await getBetterAuth({
  databaseUrl: 'postgres://...',
  baseURL: 'https://myapp.com/api/auth'
});

// Use auth instance directly
```

## Troubleshooting

### Plugin not registering routes

Make sure the plugin is loaded through the ObjectOS kernel and the `onEnable` hook is called:

```typescript
const os = new ObjectOS({
  plugins: [BetterAuthPlugin]
});
await os.init();  // This calls onEnable
```

### Database connection issues

Ensure `OBJECTQL_DATABASE_URL` is set correctly:

```bash
# PostgreSQL
export OBJECTQL_DATABASE_URL="postgres://user:pass@localhost:5432/db"

# MongoDB
export OBJECTQL_DATABASE_URL="mongodb://localhost:27017/db"

# SQLite (default)
export OBJECTQL_DATABASE_URL="sqlite:auth.db"
```

## Next Steps

- See [README.md](./README.md) for complete plugin documentation
- See [examples/usage.ts](./examples/usage.ts) for code examples
- See [Better-Auth documentation](https://www.better-auth.com/docs) for auth features
