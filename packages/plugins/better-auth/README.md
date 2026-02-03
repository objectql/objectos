# @objectos/plugin-better-auth

Authentication plugin for ObjectOS based on [Better-Auth](https://www.better-auth.com/) library.

## Features

- 🔐 **Email/Password Authentication** - Built-in email and password authentication
- 🔑 **OAuth2/OIDC Support** - Social login with Google, GitHub, and more
- 🛡️ **Two-Factor Authentication (2FA)** - Enhanced security with TOTP-based 2FA
- 🏢 **Organization Management** - Multi-tenant organization support with teams
- 👥 **Role-Based Access Control (RBAC)** - Flexible role and permission system
- 💾 **Multi-Database Support** - Works with PostgreSQL, MongoDB, and SQLite
- 🔌 **Plugin Architecture** - Follows ObjectOS plugin lifecycle and conventions

## Installation

This plugin is part of the ObjectOS monorepo. It's already available in the workspace.

```bash
pnpm install
```

## Usage

### Basic Usage

```typescript
import { ObjectOS } from '@objectos/kernel';
import { BetterAuthPlugin } from '@objectos/plugin-better-auth';

const os = new ObjectOS({
  plugins: [BetterAuthPlugin],
  // ... other config
});

await os.init();
```

### Custom Configuration

```typescript
import { createBetterAuthPlugin } from '@objectos/plugin-better-auth';

const customAuthPlugin = createBetterAuthPlugin({
  databaseUrl: 'postgres://localhost:5432/mydb',
  baseURL: 'https://myapp.com/api/auth',
  trustedOrigins: ['https://myapp.com', 'https://app.myapp.com'],
  // OAuth providers (optional)
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  // Two-factor authentication (enabled by default)
  twoFactorEnabled: true,
  twoFactorIssuer: 'MyApp'
});

const os = new ObjectOS({
  plugins: [customAuthPlugin],
  // ... other config
});
```

## API Endpoints

Once enabled, the plugin registers the following authentication endpoints:

- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in/email` - Email/password login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/get-session` - Get current session
- And more... (see [Better-Auth documentation](https://www.better-auth.com/docs))

## Configuration Options

### BetterAuthPluginOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `databaseUrl` | `string` | `process.env.OBJECTQL_DATABASE_URL` | Database connection string |
| `baseURL` | `string` | `http://localhost:3000/api/auth` | Base URL for authentication endpoints |
| `trustedOrigins` | `string[]` | `['http://localhost:5173', 'http://localhost:3000']` | Allowed origins for CORS |
| `googleClientId` | `string` | `process.env.GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `googleClientSecret` | `string` | `process.env.GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `githubClientId` | `string` | `process.env.GITHUB_CLIENT_ID` | GitHub OAuth client ID (optional) |
| `githubClientSecret` | `string` | `process.env.GITHUB_CLIENT_SECRET` | GitHub OAuth client secret (optional) |
| `twoFactorEnabled` | `boolean` | `true` | Enable two-factor authentication |
| `twoFactorIssuer` | `string` | `ObjectOS` | Issuer name for 2FA TOTP tokens |

## Database Support

The plugin automatically detects the database type from the connection string:

- **PostgreSQL**: `postgres://...` or `postgresql://...`
- **MongoDB**: `mongodb://...`
- **SQLite**: `sqlite:...` or any other (default)

### First User Setup

The first user to register automatically receives the `super_admin` role. Subsequent users get the `user` role by default.

## Organization & Roles

The plugin includes Better-Auth's organization plugin with the following default roles:

- **owner** - Full organization control
- **admin** - Organization management (cannot delete organization)
- **user** - Read-only access

## Plugin Lifecycle

The plugin implements all standard ObjectOS plugin lifecycle hooks:

- `onInstall` - Stores installation metadata
- `onEnable` - Initializes Better-Auth and registers routes
- `onDisable` - Gracefully disables authentication (preserves data)
- `onUninstall` - Cleans up plugin storage (preserves user data)

## Events

The plugin contributes the following events to the ObjectOS event system:

- `auth.user.created` - Fired when a new user is created
- `auth.user.login` - Fired when a user logs in
- `auth.user.logout` - Fired when a user logs out
- `auth.session.created` - Fired when a new session is created
- `auth.session.expired` - Fired when a session expires

## Security

- First user automatically becomes `super_admin`
- Supports CORS with configurable trusted origins
- Session-based authentication with secure cookies
- Database hooks for user creation validation

## License

AGPL-3.0

## Related

- [Better-Auth Documentation](https://www.better-auth.com/docs)
- [ObjectOS Documentation](../../README.md)
- [@objectstack/spec](https://github.com/objectstack-ai/spec)
