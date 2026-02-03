# OAuth2/OIDC Setup Guide

This guide explains how to configure OAuth2/OIDC authentication providers (Google, GitHub) with the Better-Auth plugin.

## Overview

The Better-Auth plugin supports multiple OAuth providers out of the box. OAuth allows users to sign in using their existing accounts from providers like Google, GitHub, and more.

## Supported Providers

Currently, the plugin includes built-in support for:

- **Google OAuth 2.0**
- **GitHub OAuth**

Additional providers from [better-auth/social-providers](https://www.better-auth.com/docs/authentication/social) can be added by following the same pattern.

## Google OAuth Setup

### 1. Create OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 3. Enable in Plugin Configuration

```typescript
import { createBetterAuthPlugin } from '@objectos/plugin-better-auth';

const authPlugin = createBetterAuthPlugin({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
});
```

## GitHub OAuth Setup

### 1. Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details and set callback URL to:
   - `http://localhost:3000/api/auth/callback/github` (development)
   - `https://yourdomain.com/api/auth/callback/github` (production)
4. Copy the **Client ID** and **Client Secret**

### 2. Configure Environment Variables

```bash
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## Using OAuth

```typescript
import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
});

// Sign in with Google
await authClient.signIn.social({ provider: 'google' });

// Sign in with GitHub
await authClient.signIn.social({ provider: 'github' });
```

## Available Endpoints

- `GET /api/auth/authorize/:provider` - Initiate OAuth flow
- `GET /api/auth/callback/:provider` - OAuth callback handler
- `GET /api/auth/get-session` - Get current session

## Security Best Practices

1. Never commit secrets to version control
2. Use HTTPS in production
3. Restrict callback URLs in OAuth app settings
4. Rotate secrets regularly

## Next Steps

- [Two-Factor Authentication Setup](./TWO_FACTOR_SETUP.md)
- [Complete Configuration Reference](../README.md#configuration-options)
