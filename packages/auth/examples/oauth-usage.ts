/**
 * Example: Using OAuth2/OIDC Authentication
 *
 * This example demonstrates how to set up and use OAuth providers
 * (Google and GitHub) with the Better-Auth plugin.
 */

import { ObjectKernel } from '@objectstack/runtime';
import { createBetterAuthPlugin } from '@objectos/plugin-better-auth';

/**
 * Example 1: Basic OAuth Setup
 */
async function basicOAuthSetup() {
  const kernel = new ObjectKernel();

  // Configure the plugin with OAuth providers
  const authPlugin = createBetterAuthPlugin({
    databaseUrl: process.env.DATABASE_URL || 'sqlite:auth.db',
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000/api/auth',

    // OAuth providers (automatically enabled if credentials are provided)
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  });

  kernel.use(authPlugin);
  await kernel.bootstrap();

  console.log('OAuth authentication ready!');
  console.log('- Google OAuth:', process.env.GOOGLE_CLIENT_ID ? 'Enabled' : 'Disabled');
  console.log('- GitHub OAuth:', process.env.GITHUB_CLIENT_ID ? 'Enabled' : 'Disabled');
}

/**
 * Example 2: Frontend Integration - Google OAuth
 */
async function frontendGoogleOAuth() {
  // This would be in your frontend code
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  // Sign in with Google
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/dashboard', // Redirect after successful login
  });

  // The user will be redirected to Google's OAuth consent page
  // After authorization, they'll be redirected back to your app
}

/**
 * Example 3: Frontend Integration - GitHub OAuth
 */
async function frontendGitHubOAuth() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  // Sign in with GitHub
  await authClient.signIn.social({
    provider: 'github',
    callbackURL: '/dashboard',
  });
}

/**
 * Example 4: Check Current Session (Works for All Auth Methods)
 */
async function checkSession() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  // Get current session (works for email/password, OAuth, etc.)
  const session = await authClient.session.get();

  if (session) {
    console.log('User is authenticated:');
    console.log('- User ID:', session.user.id);
    console.log('- Email:', session.user.email);
    console.log('- Name:', session.user.name);
    console.log('- Auth Method:', session.session.authMethod); // e.g., 'google', 'github', 'email'
  } else {
    console.log('User is not authenticated');
  }

  return session;
}

/**
 * Example 5: Sign Out
 */
async function signOut() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  await authClient.signOut();
  console.log('User signed out successfully');
}

/**
 * Example 6: React Component with OAuth
 */
function ReactOAuthExample() {
  /*
  import { createAuthClient } from 'better-auth/client';
  import { useState } from 'react';

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  function LoginPage() {
    const [loading, setLoading] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
      setLoading('google');
      try {
        await authClient.signIn.social({ 
          provider: 'google',
          callbackURL: '/dashboard'
        });
      } catch (error) {
        console.error('Google login failed:', error);
        setLoading(null);
      }
    };

    const handleGitHubLogin = async () => {
      setLoading('github');
      try {
        await authClient.signIn.social({ 
          provider: 'github',
          callbackURL: '/dashboard'
        });
      } catch (error) {
        console.error('GitHub login failed:', error);
        setLoading(null);
      }
    };

    return (
      <div>
        <h1>Sign In</h1>
        <button 
          onClick={handleGoogleLogin}
          disabled={loading !== null}
        >
          {loading === 'google' ? 'Signing in...' : 'Sign in with Google'}
        </button>
        <button 
          onClick={handleGitHubLogin}
          disabled={loading !== null}
        >
          {loading === 'github' ? 'Signing in...' : 'Sign in with GitHub'}
        </button>
      </div>
    );
  }
  */
}

/**
 * Example 7: Multiple OAuth Providers
 */
async function multipleProviders() {
  const kernel = new ObjectKernel();

  const authPlugin = createBetterAuthPlugin({
    // Enable multiple OAuth providers
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,

    // You can add more providers by extending the configuration
    // and adding them to auth-client.ts following the same pattern
  });

  kernel.use(authPlugin);
  await kernel.bootstrap();

  console.log('Multiple OAuth providers enabled');
}

/**
 * Example 8: OAuth with Custom Callback Handling
 */
async function customCallbackHandling() {
  const { createAuthClient } = await import('better-auth/client');

  const authClient = createAuthClient({
    baseURL: 'http://localhost:3000',
  });

  // You can specify a custom callback URL
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/auth/callback?provider=google&next=/profile',
  });

  // In your callback route handler (/auth/callback), you can:
  // 1. Extract the provider and next parameters
  // 2. Complete the OAuth flow
  // 3. Redirect to the intended destination
}

// Export examples for use
export {
  basicOAuthSetup,
  frontendGoogleOAuth,
  frontendGitHubOAuth,
  checkSession,
  signOut,
  ReactOAuthExample,
  multipleProviders,
  customCallbackHandling,
};

// Run example if executed directly
if (require.main === module) {
  basicOAuthSetup().catch(console.error);
}
