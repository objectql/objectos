/**
 * Example: Using Two-Factor Authentication (2FA)
 * 
 * This example demonstrates how to set up and use TOTP-based
 * two-factor authentication with the Better-Auth plugin.
 */

import { ObjectKernel } from '@objectstack/runtime';
import { createBetterAuthPlugin } from '@objectos/plugin-better-auth';

/**
 * Example 1: Basic 2FA Setup
 */
async function basic2FASetup() {
  const kernel = new ObjectKernel();

  // Configure the plugin with 2FA enabled (enabled by default)
  const authPlugin = createBetterAuthPlugin({
    databaseUrl: process.env.DATABASE_URL || 'sqlite:auth.db',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000/api/auth',
    
    // Two-Factor Authentication settings
    twoFactorEnabled: true, // Default: true
    twoFactorIssuer: 'MyApp', // Name shown in authenticator apps
  });

  kernel.use(authPlugin);
  await kernel.bootstrap();

  console.log('Two-Factor Authentication enabled!');
}

/**
 * Example 2: Disable 2FA
 */
async function disable2FA() {
  const kernel = new ObjectKernel();

  const authPlugin = createBetterAuthPlugin({
    twoFactorEnabled: false, // Disable 2FA entirely
  });

  kernel.use(authPlugin);
  await kernel.bootstrap();

  console.log('Two-Factor Authentication disabled');
}

/**
 * Example 3: Frontend - Enable 2FA for User
 */
async function enableTwoFactorForUser() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  // Step 1: Generate TOTP secret and QR code
  const { secret, qrCode } = await authClient.twoFactor.generateSecret();

  console.log('Show this QR code to the user:');
  console.log('QR Code Data URL:', qrCode);
  console.log('Manual entry code:', secret);

  // In your UI:
  // <img src={qrCode} alt="Scan with authenticator app" />
  // <p>Manual entry: {secret}</p>

  // Step 2: User scans QR code with authenticator app
  // Step 3: User enters the 6-digit code from the app
  const userEnteredCode = '123456'; // From user input

  // Step 4: Verify and enable 2FA
  try {
    await authClient.twoFactor.enable({
      code: userEnteredCode,
    });
    console.log('2FA enabled successfully!');
  } catch (error) {
    console.error('Invalid code. Please try again.');
  }
}

/**
 * Example 4: Sign In with 2FA
 */
async function signInWith2FA() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  // Step 1: Initial sign-in with email/password
  const response = await authClient.signIn.email({
    email: 'user@example.com',
    password: 'password123',
  });

  // Step 2: Check if 2FA is required
  if (response.requiresTwoFactor) {
    console.log('2FA code required');
    
    // Prompt user for TOTP code
    const totpCode = '123456'; // From user's authenticator app
    
    // Step 3: Verify TOTP code
    try {
      await authClient.twoFactor.verify({
        code: totpCode,
      });
      console.log('2FA verification successful!');
      console.log('User is now fully authenticated');
    } catch (error) {
      console.error('Invalid 2FA code');
    }
  } else {
    console.log('User authenticated (no 2FA required)');
  }
}

/**
 * Example 5: Disable 2FA for User
 */
async function disableTwoFactorForUser() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  // User must provide current TOTP code to disable 2FA
  const currentCode = '123456'; // From user's authenticator app

  try {
    await authClient.twoFactor.disable({
      code: currentCode,
    });
    console.log('2FA disabled successfully');
  } catch (error) {
    console.error('Failed to disable 2FA. Invalid code?');
  }
}

/**
 * Example 6: React Component - 2FA Setup
 */
function React2FASetupExample() {
  /*
  import { createAuthClient } from 'better-auth/client';
  import { useState } from 'react';

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  function TwoFactorSetup() {
    const [step, setStep] = useState<'generate' | 'verify'>('generate');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const generateSecret = async () => {
      try {
        const result = await authClient.twoFactor.generateSecret();
        setQrCode(result.qrCode);
        setSecret(result.secret);
        setStep('verify');
      } catch (err) {
        setError('Failed to generate 2FA secret');
      }
    };

    const enable2FA = async () => {
      try {
        await authClient.twoFactor.enable({ code });
        alert('2FA enabled successfully!');
        // Redirect to settings page
      } catch (err) {
        setError('Invalid code. Please try again.');
      }
    };

    return (
      <div>
        <h2>Enable Two-Factor Authentication</h2>
        
        {step === 'generate' && (
          <div>
            <p>Add an extra layer of security to your account</p>
            <button onClick={generateSecret}>
              Set Up 2FA
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div>
            <h3>Scan QR Code</h3>
            <img src={qrCode} alt="2FA QR Code" />
            <p>
              Or enter this code manually in your authenticator app:
              <br />
              <code>{secret}</code>
            </p>
            
            <h3>Verify Setup</h3>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <button onClick={enable2FA}>
              Verify and Enable
            </button>
            
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </div>
        )}
      </div>
    );
  }
  */
}

/**
 * Example 7: React Component - 2FA Sign In
 */
function React2FASignInExample() {
  /*
  import { createAuthClient } from 'better-auth/client';
  import { useState } from 'react';

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  function SignInWith2FA() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [needs2FA, setNeeds2FA] = useState(false);
    const [totpCode, setTotpCode] = useState('');
    const [error, setError] = useState('');

    const handleSignIn = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
        const response = await authClient.signIn.email({
          email,
          password,
        });

        if (response.requiresTwoFactor) {
          setNeeds2FA(true);
        } else {
          // Success - redirect to dashboard
          window.location.href = '/dashboard';
        }
      } catch (err) {
        setError('Invalid email or password');
      }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      try {
        await authClient.twoFactor.verify({
          code: totpCode,
        });
        // Success - redirect to dashboard
        window.location.href = '/dashboard';
      } catch (err) {
        setError('Invalid 2FA code');
      }
    };

    if (needs2FA) {
      return (
        <form onSubmit={handleVerify2FA}>
          <h2>Enter 2FA Code</h2>
          <input
            type="text"
            placeholder="6-digit code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            maxLength={6}
            required
          />
          <button type="submit">Verify</button>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
      );
    }

    return (
      <form onSubmit={handleSignIn}>
        <h2>Sign In</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign In</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    );
  }
  */
}

/**
 * Example 8: Check if User Has 2FA Enabled
 */
async function checkIf2FAEnabled() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  const session = await authClient.session.get();

  if (session) {
    const has2FA = session.user.twoFactorEnabled || false;
    console.log('User has 2FA:', has2FA);
    return has2FA;
  }

  return false;
}

// Export examples for use
export {
  basic2FASetup,
  disable2FA,
  enableTwoFactorForUser,
  signInWith2FA,
  disableTwoFactorForUser,
  React2FASetupExample,
  React2FASignInExample,
  checkIf2FAEnabled,
};

// Run example if executed directly
if (require.main === module) {
  basic2FASetup().catch(console.error);
}
