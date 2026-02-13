import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

interface ProviderInfo {
  id: string;
  label: string;
  category: 'social' | 'enterprise';
  envHint: string;
}

/**
 * All providers the system supports, including env-var hints for admin guidance.
 */
const ALL_PROVIDERS: ProviderInfo[] = [
  // Social
  {
    id: 'google',
    label: 'Google',
    category: 'social',
    envHint: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET',
  },
  {
    id: 'github',
    label: 'GitHub',
    category: 'social',
    envHint: 'GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET',
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    category: 'social',
    envHint: 'MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET',
  },
  {
    id: 'apple',
    label: 'Apple',
    category: 'social',
    envHint: 'APPLE_CLIENT_ID, APPLE_CLIENT_SECRET',
  },
  {
    id: 'discord',
    label: 'Discord',
    category: 'social',
    envHint: 'DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET',
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    category: 'social',
    envHint: 'GITLAB_CLIENT_ID, GITLAB_CLIENT_SECRET',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    category: 'social',
    envHint: 'LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET',
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    category: 'social',
    envHint: 'TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    category: 'social',
    envHint: 'FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET',
  },
  // Enterprise SSO
  {
    id: 'microsoft-entra-id',
    label: 'Microsoft Entra ID',
    category: 'enterprise',
    envHint: 'AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID',
  },
  {
    id: 'auth0',
    label: 'Auth0',
    category: 'enterprise',
    envHint: 'AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN',
  },
  {
    id: 'okta',
    label: 'Okta',
    category: 'enterprise',
    envHint: 'OKTA_CLIENT_ID, OKTA_CLIENT_SECRET, OKTA_ISSUER',
  },
  {
    id: 'keycloak',
    label: 'Keycloak',
    category: 'enterprise',
    envHint: 'KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, KEYCLOAK_ISSUER',
  },
];

export default function SSOSettingsPage() {
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/auth/providers')
      .then((r) => r.json())
      .then((data) => setEnabledProviders(data.providers ?? []))
      .catch(() => setEnabledProviders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const socialProviders = ALL_PROVIDERS.filter((p) => p.category === 'social');
  const enterpriseProviders = ALL_PROVIDERS.filter((p) => p.category === 'enterprise');

  // Check if any custom OIDC provider is enabled (not in our known list)
  const knownIds = ALL_PROVIDERS.map((p) => p.id);
  const customProviders = enabledProviders.filter((id) => !knownIds.includes(id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Single Sign-On</h2>
        <p className="text-muted-foreground">
          Manage OAuth and enterprise SSO providers. Providers are configured via environment
          variables on the server.
        </p>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Shield className="size-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Provider Status</CardTitle>
            <CardDescription>
              {enabledProviders.length === 0
                ? 'No external providers configured. Users authenticate via email & password only.'
                : `${enabledProviders.length} provider${enabledProviders.length > 1 ? 's' : ''} enabled.`}
            </CardDescription>
          </div>
        </CardHeader>
        {enabledProviders.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {enabledProviders.map((id) => (
                <Badge key={id} variant="default">
                  {id}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Social Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Social Providers</CardTitle>
          <CardDescription>
            Standard OAuth 2.0 social login. Set the corresponding environment variables to enable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {socialProviders.map((p) => {
              const enabled = enabledProviders.includes(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {enabled ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <code className="text-xs text-muted-foreground">{p.envHint}</code>
                    </div>
                  </div>
                  <Badge variant={enabled ? 'default' : 'secondary'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enterprise SSO */}
      <Card>
        <CardHeader>
          <CardTitle>Enterprise SSO</CardTitle>
          <CardDescription>
            OIDC / SAML-compatible enterprise identity providers via the genericOAuth plugin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {enterpriseProviders.map((p) => {
              const enabled = enabledProviders.includes(p.id);
              return (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {enabled ? (
                      <CheckCircle2 className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">{p.label}</div>
                      <code className="text-xs text-muted-foreground">{p.envHint}</code>
                    </div>
                  </div>
                  <Badge variant={enabled ? 'default' : 'secondary'}>
                    {enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom OIDC */}
      {customProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom OIDC Providers</CardTitle>
            <CardDescription>
              Custom OIDC providers configured via OIDC_* environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {customProviders.map((id) => (
                <div key={id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <div className="font-medium">{id}</div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            SSO providers are configured via <strong>environment variables</strong> on the
            ObjectStack server. Restart the server after setting new variables.
          </p>
          <div className="rounded-md bg-muted p-3 font-mono text-xs">
            <div># Social provider example (GitHub)</div>
            <div>GITHUB_CLIENT_ID=your_client_id</div>
            <div>GITHUB_CLIENT_SECRET=your_client_secret</div>
            <div className="mt-2"># Enterprise SSO example (Microsoft Entra ID)</div>
            <div>AZURE_AD_CLIENT_ID=your_app_id</div>
            <div>AZURE_AD_CLIENT_SECRET=your_secret</div>
            <div>AZURE_AD_TENANT_ID=your_tenant_id</div>
            <div className="mt-2"># Custom OIDC provider</div>
            <div>OIDC_PROVIDER_ID=my-idp</div>
            <div>OIDC_CLIENT_ID=your_client_id</div>
            <div>OIDC_CLIENT_SECRET=your_secret</div>
            <div>OIDC_DISCOVERY_URL=https://idp.example.com/.well-known/openid-configuration</div>
          </div>
          <a
            href="https://www.better-auth.com/docs/authentication/social-sign-on"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            better-auth SSO Documentation <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
