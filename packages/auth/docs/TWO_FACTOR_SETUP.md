# Two-Factor Authentication (2FA) Setup Guide

This guide explains how to configure and use Two-Factor Authentication (2FA) with the Better-Auth plugin.

## Overview

The Better-Auth plugin includes built-in support for TOTP (Time-based One-Time Password) two-factor authentication. 2FA provides an additional layer of security by requiring users to verify their identity using a second factor (typically a mobile authenticator app) in addition to their password.

## Features

- **TOTP-based** - Compatible with Google Authenticator, Authy, 1Password, and other authenticator apps
- **QR Code Generation** - Easy setup with QR code scanning
- **Backup Codes** - Recovery codes in case the device is lost
- **Enabled by Default** - 2FA is available out of the box
- **Per-User Opt-in** - Users can choose to enable 2FA for their account

## Configuration

### Basic Setup

2FA is enabled by default. No additional configuration is required:

```typescript
import { createBetterAuthPlugin } from '@objectos/plugin-better-auth';

const authPlugin = createBetterAuthPlugin({
  // 2FA is enabled by default
  // You can customize the issuer name shown in authenticator apps
  twoFactorIssuer: 'MyApp',
});
```

### Configuration Options

| Option             | Type      | Default      | Description                             |
| ------------------ | --------- | ------------ | --------------------------------------- |
| `twoFactorEnabled` | `boolean` | `true`       | Enable/disable 2FA feature              |
| `twoFactorIssuer`  | `string`  | `"ObjectOS"` | Issuer name shown in authenticator apps |

### Disabling 2FA

If you want to disable 2FA entirely:

```typescript
const authPlugin = createBetterAuthPlugin({
  twoFactorEnabled: false,
});
```

### Environment Variables

You can also configure the issuer via environment variable:

```bash
BETTER_AUTH_2FA_ISSUER=MyApp
```

## Using 2FA

### Enrollment Flow

#### 1. Enable 2FA for a User

Users must first be authenticated before they can enable 2FA:

```typescript
import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
});

// User must be logged in first
// Generate TOTP secret and QR code
const { secret, qrCode } = await authClient.twoFactor.generateSecret();
```

#### 2. Display QR Code

Show the QR code to the user so they can scan it with their authenticator app:

```typescript
// qrCode is a data URL that can be used in an img tag
<img src={qrCode} alt="Scan with authenticator app" />

// Also show the secret key for manual entry
<p>Manual entry code: {secret}</p>
```

#### 3. Verify and Enable

After the user scans the QR code, verify their TOTP code to enable 2FA:

```typescript
const totpCode = '123456'; // Code from user's authenticator app

await authClient.twoFactor.enable({
  code: totpCode,
});
```

### Sign-in with 2FA

When a user with 2FA enabled signs in:

```typescript
// Step 1: Initial sign-in with email/password
const response = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// If user has 2FA enabled, response will indicate that
if (response.requiresTwoFactor) {
  // Step 2: Prompt user for TOTP code
  const totpCode = prompt('Enter your 2FA code:');

  // Step 3: Verify TOTP code
  await authClient.twoFactor.verify({
    code: totpCode,
  });
}
```

### Disabling 2FA for a User

Users can disable 2FA from their account settings:

```typescript
const totpCode = '123456'; // Current TOTP code for verification

await authClient.twoFactor.disable({
  code: totpCode,
});
```

## API Endpoints

The plugin automatically registers the following 2FA endpoints:

- `POST /api/auth/two-factor/generate-secret` - Generate TOTP secret and QR code
- `POST /api/auth/two-factor/enable` - Enable 2FA with verification
- `POST /api/auth/two-factor/verify` - Verify TOTP code during sign-in
- `POST /api/auth/two-factor/disable` - Disable 2FA

## Security Best Practices

### For Developers

1. **Always verify TOTP codes** before enabling 2FA to ensure the user has correctly set up their authenticator
2. **Provide backup codes** to users so they can access their account if they lose their device
3. **Require current password** when enabling/disabling 2FA as an additional security measure
4. **Rate limit** 2FA verification attempts to prevent brute-force attacks
5. **Log 2FA events** for security auditing

### For Users

1. **Use a trusted authenticator app** - Google Authenticator, Authy, 1Password, Microsoft Authenticator
2. **Store backup codes securely** - Keep them in a safe place separate from your device
3. **Don't share TOTP codes** - They should only be entered in the official application
4. **Set up 2FA on multiple devices** if your authenticator app supports syncing
5. **Contact support immediately** if you lose access to your 2FA device

## Troubleshooting

### "Invalid TOTP Code" Error

**Common causes:**

1. **Time sync issue** - Ensure the device running the authenticator app has the correct time
2. **Expired code** - TOTP codes expire every 30 seconds, enter the current code
3. **Wrong account** - Make sure you're using the correct account in your authenticator app

**Solutions:**

- Sync time on your device with network time
- Wait for the next code to generate
- Remove and re-add the account in your authenticator app

### Lost Access to 2FA Device

**Solutions:**

1. Use backup codes if you saved them
2. Contact an administrator to reset 2FA for your account
3. Use account recovery flow (if implemented)

### QR Code Not Displaying

**Solutions:**

1. Check that `twoFactorEnabled` is not set to `false`
2. Verify the plugin is initialized correctly
3. Check browser console for errors
4. Ensure the secret generation endpoint is accessible

## Example: Complete 2FA UI Flow

```typescript
import { useState } from 'react';
import { createAuthClient } from 'better-auth/client';

const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
});

function TwoFactorSetup() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');

  // Step 1: Generate secret
  const generateSecret = async () => {
    const result = await authClient.twoFactor.generateSecret();
    setQrCode(result.qrCode);
    setSecret(result.secret);
  };

  // Step 2: Enable 2FA
  const enable2FA = async () => {
    try {
      await authClient.twoFactor.enable({ code });
      alert('2FA enabled successfully!');
    } catch (error) {
      alert('Invalid code. Please try again.');
    }
  };

  return (
    <div>
      <h2>Enable Two-Factor Authentication</h2>
      <button onClick={generateSecret}>Generate QR Code</button>

      {qrCode && (
        <>
          <img src={qrCode} alt="2FA QR Code" />
          <p>Secret: {secret}</p>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button onClick={enable2FA}>Verify and Enable</button>
        </>
      )}
    </div>
  );
}
```

## Backup and Recovery

### Implementing Backup Codes

While Better-Auth handles TOTP generation, you should implement backup codes separately:

```typescript
// Generate backup codes (implement this separately)
const backupCodes = generateBackupCodes(10); // Generate 10 codes

// Store backup codes securely in database (hashed)
await saveBackupCodes(userId, backupCodes);

// Show codes to user once
console.log('Save these backup codes:', backupCodes);
```

### Account Recovery

Implement an account recovery flow for users who:

1. Lost their 2FA device
2. Lost their backup codes
3. Need administrator assistance

## Next Steps

- [OAuth Setup Guide](./OAUTH_SETUP.md)
- [Complete Configuration Reference](../README.md#configuration-options)
- [Better-Auth 2FA Documentation](https://www.better-auth.com/docs/plugins/two-factor)
