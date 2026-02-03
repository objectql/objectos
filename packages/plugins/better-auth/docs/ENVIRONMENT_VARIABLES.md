# Environment Variables Reference

Complete reference for all environment variables used by the Better-Auth plugin.

## Database Configuration

### `OBJECTQL_DATABASE_URL`

**Type:** `string`  
**Default:** `sqlite:objectos.db`  
**Required:** No

Database connection string. The plugin supports PostgreSQL, MongoDB, and SQLite.

**Examples:**

```bash
# PostgreSQL
OBJECTQL_DATABASE_URL=postgres://user:password@localhost:5432/mydb
OBJECTQL_DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# MongoDB
OBJECTQL_DATABASE_URL=mongodb://localhost:27017/mydb
OBJECTQL_DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/mydb

# SQLite (default)
OBJECTQL_DATABASE_URL=sqlite:auth.db
OBJECTQL_DATABASE_URL=sqlite:/path/to/database.db
```

## Authentication Configuration

### `BETTER_AUTH_URL`

**Type:** `string`  
**Default:** `http://localhost:3000/api/auth`  
**Required:** No

Base URL for authentication endpoints. This should match your application's URL.

**Examples:**

```bash
# Development
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Production
BETTER_AUTH_URL=https://myapp.com/api/auth
BETTER_AUTH_URL=https://api.myapp.com/auth
```

## OAuth Configuration

### Google OAuth

#### `GOOGLE_CLIENT_ID`

**Type:** `string`  
**Required:** No (required for Google OAuth)

Google OAuth 2.0 client ID obtained from Google Cloud Console.

```bash
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

#### `GOOGLE_CLIENT_SECRET`

**Type:** `string`  
**Required:** No (required for Google OAuth)

Google OAuth 2.0 client secret obtained from Google Cloud Console.

```bash
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

### GitHub OAuth

#### `GITHUB_CLIENT_ID`

**Type:** `string`  
**Required:** No (required for GitHub OAuth)

GitHub OAuth app client ID obtained from GitHub Developer Settings.

```bash
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
```

#### `GITHUB_CLIENT_SECRET`

**Type:** `string`  
**Required:** No (required for GitHub OAuth)

GitHub OAuth app client secret obtained from GitHub Developer Settings.

```bash
GITHUB_CLIENT_SECRET=abcdef1234567890abcdef1234567890abcdef12
```

## Two-Factor Authentication

### `BETTER_AUTH_2FA_ISSUER`

**Type:** `string`  
**Default:** `ObjectOS`  
**Required:** No

Issuer name displayed in authenticator apps (Google Authenticator, Authy, etc.) when users set up 2FA.

```bash
BETTER_AUTH_2FA_ISSUER=MyApp
BETTER_AUTH_2FA_ISSUER=Acme Corporation
```

## CORS Configuration

### `OBJECTQL_CORS_ORIGINS`

**Type:** `string` (comma-separated list)  
**Default:** `http://localhost:5173,http://localhost:3000`  
**Required:** No

Allowed origins for CORS. Multiple origins can be specified separated by commas.

**Examples:**

```bash
# Development
OBJECTQL_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Production
OBJECTQL_CORS_ORIGINS=https://myapp.com,https://www.myapp.com

# Mixed environments
OBJECTQL_CORS_ORIGINS=http://localhost:3000,https://staging.myapp.com,https://myapp.com
```

## Server Configuration

### `OBJECTQL_PORT`

**Type:** `number`  
**Default:** `3000`  
**Required:** No

Port number for the HTTP server.

```bash
OBJECTQL_PORT=3000
OBJECTQL_PORT=8080
```

### `OBJECTQL_DRIVER`

**Type:** `string`  
**Default:** `sqlite3`  
**Required:** No

Database driver to use. Options: `sqlite3`, `pg` (PostgreSQL), `mongodb`.

```bash
OBJECTQL_DRIVER=sqlite3
OBJECTQL_DRIVER=pg
OBJECTQL_DRIVER=mongodb
```

### `OBJECTQL_CONNECTION`

**Type:** `string` or `JSON`  
**Required:** No

Database connection configuration (alternative to `OBJECTQL_DATABASE_URL`).

**Examples:**

```bash
# SQLite
OBJECTQL_CONNECTION={"filename":"mydb.db"}

# PostgreSQL
OBJECTQL_CONNECTION={"host":"localhost","port":5432,"database":"mydb","user":"user","password":"pass"}
```

## Development and Debugging

### `NODE_ENV`

**Type:** `string`  
**Default:** `development`  
**Required:** No

Node.js environment. Affects logging, error handling, and security features.

```bash
NODE_ENV=development
NODE_ENV=production
NODE_ENV=test
```

### `DEBUG`

**Type:** `string`  
**Required:** No

Enable debug logging for specific modules.

```bash
DEBUG=better-auth:*
DEBUG=objectos:*
DEBUG=*
```

## Complete Example

Here's a complete `.env` file example with all common variables:

```bash
# Database
OBJECTQL_DATABASE_URL=postgres://user:password@localhost:5432/mydb
OBJECTQL_DRIVER=pg

# Server
OBJECTQL_PORT=3000
NODE_ENV=development

# Authentication
BETTER_AUTH_URL=http://localhost:3000/api/auth

# Google OAuth (optional)
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8
GITHUB_CLIENT_SECRET=abcdef1234567890abcdef12

# Two-Factor Authentication
BETTER_AUTH_2FA_ISSUER=MyApp

# CORS
OBJECTQL_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Debug (optional)
DEBUG=objectos:*
```

## Security Best Practices

### Protecting Secrets

1. **Never commit `.env` to version control**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use different `.env` files for different environments**
   ```bash
   .env.development
   .env.staging
   .env.production
   ```

3. **Use environment-specific secret management**
   - Development: Local `.env` files
   - Staging/Production: Secret management services (AWS Secrets Manager, Azure Key Vault, etc.)

4. **Rotate secrets regularly**
   - OAuth client secrets: Every 90 days
   - Database credentials: Every 30-90 days

5. **Use principle of least privilege**
   - Grant only necessary database permissions
   - Use separate database users for different environments

### Loading Environment Variables

The plugin automatically loads environment variables from:
1. System environment
2. `.env` file (if using dotenv)
3. Programmatic configuration (highest priority)

```typescript
// Priority: programmatic > .env > system env
const authPlugin = createBetterAuthPlugin({
  databaseUrl: process.env.DATABASE_URL, // Falls back to OBJECTQL_DATABASE_URL
  googleClientId: 'hardcoded-id', // Overrides env var
});
```

## Validation

The plugin validates environment variables on startup:

- Database URL format
- OAuth credentials (when OAuth is enabled)
- CORS origins format
- Port number range

Invalid configurations will cause startup errors with descriptive messages.

## See Also

- [OAuth Setup Guide](./OAUTH_SETUP.md)
- [Two-Factor Authentication Setup](./TWO_FACTOR_SETUP.md)
- [Main README](../README.md)
