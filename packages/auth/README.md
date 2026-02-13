# @objectos/plugin-better-auth

Identity and Session Management utilizing Better-Auth.

## Overview

Replaces legacy authentication systems with [Better-Auth](https://www.better-auth.com/). It handles the complexity of secure logins, sessions, and OAuth flows.

## Features

- ✅ **Authentication**: Email/Password, Magic Links.
- ✅ **Social Login**: Google, GitHub, Microsoft providers.
- ✅ **Session Management**: Secure, HTTP-only cookie-based sessions.
- ✅ **Two-Factor (2FA)**: TOTP support.
- ✅ **Organization Support**: Built-in multi-tenancy (Teams).

## Usage

Integrated directly into user objects.

```typescript
// checks session
const session = await auth.api.getSession({ headers: req.headers });
```

## Development Plan

- [ ] **LDAP/Active Directory**: Enterprise integration for corporate directories.
- [ ] **SAML / OIDC Provider**: Act as an Identity Provider (IdP) for other apps.
- [ ] **Account Linking**: Merge multiple social accounts to one user.
- [ ] **Passkeys**: WebAuthn support for passwordless login.
