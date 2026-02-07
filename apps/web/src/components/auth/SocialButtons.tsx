import { signIn } from '@/lib/auth-client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { Loader2 } from 'lucide-react';

/**
 * Provider metadata: icon, label, and grid coloring.
 * Social providers use signIn.social(), enterprise SSO uses signIn.oauth2().
 */
interface ProviderMeta {
  label: string;
  icon: React.ReactNode;
  /** true = call signIn.social(), false = signIn.oauth2() (genericOAuth) */
  social: boolean;
}

const GoogleIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg className="size-4" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const GitLabIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="#E24329">
    <path d="M12 21.35l3.18-9.79H8.82L12 21.35zm0 0L8.82 11.56H1.44L12 21.35zm-10.56-9.79h7.38L6.15 2.62a.31.31 0 00-.59 0L1.44 11.56zm21.12 0h-7.38l2.67-8.94a.31.31 0 01.59 0l4.12 8.94zM12 21.35l3.18-9.79h7.38L12 21.35z" />
  </svg>
);

const DiscordIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="#5865F2">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="#0A66C2">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const AppleIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Enterprise SSO icons
const KeyIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

/** Registry of all known provider metadata */
const PROVIDER_REGISTRY: Record<string, ProviderMeta> = {
  // Social providers (signIn.social)
  google:   { label: 'Google',   icon: <GoogleIcon />,   social: true },
  github:   { label: 'GitHub',   icon: <Github className="size-4" />, social: true },
  microsoft:{ label: 'Microsoft',icon: <MicrosoftIcon />,social: true },
  apple:    { label: 'Apple',    icon: <AppleIcon />,    social: true },
  discord:  { label: 'Discord',  icon: <DiscordIcon />,  social: true },
  gitlab:   { label: 'GitLab',   icon: <GitLabIcon />,   social: true },
  linkedin: { label: 'LinkedIn', icon: <LinkedInIcon />,  social: true },
  twitter:  { label: 'X',        icon: <TwitterIcon />,  social: true },
  facebook: { label: 'Facebook', icon: <FacebookIcon />, social: true },
  // Enterprise SSO providers (signIn.oauth2 via genericOAuth)
  'microsoft-entra-id': { label: 'Microsoft Entra ID', icon: <MicrosoftIcon />, social: false },
  'auth0':      { label: 'Auth0',      icon: <KeyIcon />, social: false },
  'okta':       { label: 'Okta',       icon: <KeyIcon />, social: false },
  'keycloak':   { label: 'Keycloak',   icon: <KeyIcon />, social: false },
};

/**
 * Dynamically rendered social/SSO login buttons.
 *
 * Fetches `/api/v1/auth/providers` to discover which providers the server has
 * enabled. Falls back to an empty list (email-only auth) if the endpoint is
 * unavailable or returns an error.
 */
export function SocialButtons() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch('/api/v1/auth/providers')
      .then(r => r.json())
      .then(data => setProviders(data.providers ?? []))
      .catch(() => setProviders([]))
      .finally(() => setFetching(false));
  }, []);

  const handleLogin = async (providerId: string) => {
    setIsLoading(providerId);
    try {
      const meta = PROVIDER_REGISTRY[providerId];
      if (meta?.social) {
        await signIn.social({
          provider: providerId as any,
          callbackURL: '/dashboard',
        });
      } else {
        // Enterprise SSO via genericOAuth
        await (signIn as any).oauth2({
          providerId,
          callbackURL: '/dashboard',
        });
      }
    } catch (error) {
      console.error(`[SocialButtons] ${providerId} login error:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  // Nothing to render while loading or if no providers configured
  if (fetching) {
    return (
      <div className="flex justify-center py-2">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (providers.length === 0) return null;

  // Determine grid layout based on provider count
  const gridCols = providers.length === 1
    ? 'grid-cols-1'
    : providers.length <= 3
    ? 'grid-cols-2'
    : 'grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {providers.map(id => {
        const meta = PROVIDER_REGISTRY[id] ?? {
          label: id.charAt(0).toUpperCase() + id.slice(1),
          icon: <KeyIcon />,
          social: false,
        };
        return (
          <Button
            key={id}
            variant="outline"
            onClick={() => handleLogin(id)}
            disabled={!!isLoading}
            type="button"
          >
            {isLoading === id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              meta.icon
            )}
            {meta.label}
          </Button>
        );
      })}
    </div>
  );
}
