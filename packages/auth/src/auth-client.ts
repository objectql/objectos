/**
 * Better-Auth Client Configuration
 * 
 * This module provides the Better-Auth instance configuration
 * with support for multiple database backends (PostgreSQL, MongoDB, SQLite)
 */

import type { AuthSecurityPolicies } from './types.js';

let authInstance: any;
let dbConnection: any; // Store database connection for cleanup

/**
 * Social OAuth provider credentials.
 * Each provider follows the pattern: { clientId, clientSecret }.
 */
export interface SocialProviderConfig {
    clientId: string;
    clientSecret: string;
}

/**
 * Enterprise SSO provider configurations (via genericOAuth plugin).
 */
export interface EnterpriseSSOConfig {
    /** Microsoft Entra ID (Azure AD) */
    microsoftEntraId?: SocialProviderConfig & { tenantId: string };
    /** Auth0 */
    auth0?: SocialProviderConfig & { domain: string };
    /** Okta */
    okta?: SocialProviderConfig & { issuer: string };
    /** Keycloak */
    keycloak?: SocialProviderConfig & { issuer: string };
    /** Custom OIDC provider */
    oidc?: SocialProviderConfig & {
        providerId: string;
        discoveryUrl?: string;
        authorizationUrl?: string;
        tokenUrl?: string;
        userInfoUrl?: string;
        scopes?: string[];
    };
}

export interface BetterAuthConfig {
    databaseUrl?: string;
    baseURL?: string;
    trustedOrigins?: string[];
    // Social OAuth providers — each is { clientId, clientSecret }
    google?: SocialProviderConfig;
    github?: SocialProviderConfig;
    microsoft?: SocialProviderConfig;
    apple?: SocialProviderConfig;
    discord?: SocialProviderConfig;
    gitlab?: SocialProviderConfig;
    linkedin?: SocialProviderConfig;
    twitter?: SocialProviderConfig;
    facebook?: SocialProviderConfig;
    // Enterprise SSO (genericOAuth plugin)
    sso?: EnterpriseSSOConfig;
    // Two-factor authentication
    twoFactorEnabled?: boolean;
    twoFactorIssuer?: string;
    /** Security policies for password and session management */
    securityPolicies?: AuthSecurityPolicies;
    /** Session lifecycle hook callback */
    onSessionEvent?: (event: string, data: Record<string, unknown>) => void | Promise<void>;
    /** @deprecated Use google.clientId / google.clientSecret instead */
    googleClientId?: string;
    /** @deprecated */
    googleClientSecret?: string;
    /** @deprecated Use github.clientId / github.clientSecret instead */
    githubClientId?: string;
    /** @deprecated */
    githubClientSecret?: string;
}

export const getBetterAuth = async (config: BetterAuthConfig = {}) => {
    if (authInstance) return authInstance;
    
    const { betterAuth } = await import("better-auth");
    const { organization, twoFactor } = await import("better-auth/plugins");
    const { role } = await import("better-auth/plugins/access");
    
    try {
        let database;
        const dbUrl = config.databaseUrl || process.env.OBJECTQL_DATABASE_URL;
        const isPostgres = dbUrl && dbUrl.startsWith('postgres');
        const isMongo = dbUrl && dbUrl.startsWith('mongodb');

        // ----- Plugins array -----
        const plugins: Array<any> = [];

        // Add Two-Factor Authentication (enabled by default unless explicitly disabled)
        if (config.twoFactorEnabled !== false) {
            plugins.push(twoFactor({
                issuer: config.twoFactorIssuer || process.env.BETTER_AUTH_2FA_ISSUER || "ObjectOS",
                totpPeriod: 30,
            }));
        }

        // ----- Social OAuth providers -----
        // Helper: resolve from config object, legacy flat fields, or env vars
        const resolveProvider = (
            name: string,
            cfgObj?: SocialProviderConfig,
            legacyId?: string,
            legacySecret?: string,
        ): SocialProviderConfig | undefined => {
            const id = cfgObj?.clientId || legacyId || process.env[`${name.toUpperCase()}_CLIENT_ID`];
            const secret = cfgObj?.clientSecret || legacySecret || process.env[`${name.toUpperCase()}_CLIENT_SECRET`];
            return id && secret ? { clientId: id, clientSecret: secret } : undefined;
        };

        // Track enabled provider IDs for the /providers API
        const enabledProviders: string[] = [];

        // Map of social provider name → import path
        const socialProviderMap: Record<string, { cfg: SocialProviderConfig | undefined }> = {
            google: { cfg: resolveProvider('google', config.google, config.googleClientId, config.googleClientSecret) },
            github: { cfg: resolveProvider('github', config.github, config.githubClientId, config.githubClientSecret) },
            microsoft: { cfg: resolveProvider('microsoft', config.microsoft) },
            apple: { cfg: resolveProvider('apple', config.apple) },
            discord: { cfg: resolveProvider('discord', config.discord) },
            gitlab: { cfg: resolveProvider('gitlab', config.gitlab) },
            linkedin: { cfg: resolveProvider('linkedin', config.linkedin) },
            twitter: { cfg: resolveProvider('twitter', config.twitter) },
            facebook: { cfg: resolveProvider('facebook', config.facebook) },
        };

        // Dynamically load and register each enabled social provider
        for (const [name, { cfg }] of Object.entries(socialProviderMap)) {
            if (cfg) {
                const mod = await import("better-auth/social-providers");
                const providerFn = (mod as any)[name];
                if (providerFn) {
                    plugins.push(providerFn({
                        clientId: cfg.clientId,
                        clientSecret: cfg.clientSecret,
                    }));
                    enabledProviders.push(name);
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(`[Better-Auth Plugin] ${name} OAuth enabled`);
                    }
                }
            }
        }

        // ----- Enterprise SSO (genericOAuth plugin) -----
        const genericConfigs: any[] = [];

        // Microsoft Entra ID (Azure AD)
        const msEntra = config.sso?.microsoftEntraId || (
            process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID
                ? { clientId: process.env.AZURE_AD_CLIENT_ID, clientSecret: process.env.AZURE_AD_CLIENT_SECRET, tenantId: process.env.AZURE_AD_TENANT_ID }
                : undefined
        );
        if (msEntra) {
            const { microsoftEntraId } = await import("better-auth/plugins/generic-oauth");
            genericConfigs.push(microsoftEntraId({
                clientId: msEntra.clientId,
                clientSecret: msEntra.clientSecret,
                tenantId: msEntra.tenantId,
            }));
            enabledProviders.push('microsoft-entra-id');
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Better-Auth Plugin] Microsoft Entra ID SSO enabled');
            }
        }

        // Auth0
        const auth0Cfg = config.sso?.auth0 || (
            process.env.AUTH0_CLIENT_ID && process.env.AUTH0_CLIENT_SECRET && process.env.AUTH0_DOMAIN
                ? { clientId: process.env.AUTH0_CLIENT_ID, clientSecret: process.env.AUTH0_CLIENT_SECRET, domain: process.env.AUTH0_DOMAIN }
                : undefined
        );
        if (auth0Cfg) {
            const { auth0 } = await import("better-auth/plugins/generic-oauth");
            genericConfigs.push(auth0({
                clientId: auth0Cfg.clientId,
                clientSecret: auth0Cfg.clientSecret,
                domain: auth0Cfg.domain,
            }));
            enabledProviders.push('auth0');
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Better-Auth Plugin] Auth0 SSO enabled');
            }
        }

        // Okta
        const oktaCfg = config.sso?.okta || (
            process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET && process.env.OKTA_ISSUER
                ? { clientId: process.env.OKTA_CLIENT_ID, clientSecret: process.env.OKTA_CLIENT_SECRET, issuer: process.env.OKTA_ISSUER }
                : undefined
        );
        if (oktaCfg) {
            const { okta } = await import("better-auth/plugins/generic-oauth");
            genericConfigs.push(okta({
                clientId: oktaCfg.clientId,
                clientSecret: oktaCfg.clientSecret,
                issuer: oktaCfg.issuer,
            }));
            enabledProviders.push('okta');
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Better-Auth Plugin] Okta SSO enabled');
            }
        }

        // Keycloak
        const keycloakCfg = config.sso?.keycloak || (
            process.env.KEYCLOAK_CLIENT_ID && process.env.KEYCLOAK_CLIENT_SECRET && process.env.KEYCLOAK_ISSUER
                ? { clientId: process.env.KEYCLOAK_CLIENT_ID, clientSecret: process.env.KEYCLOAK_CLIENT_SECRET, issuer: process.env.KEYCLOAK_ISSUER }
                : undefined
        );
        if (keycloakCfg) {
            const { keycloak } = await import("better-auth/plugins/generic-oauth");
            genericConfigs.push(keycloak({
                clientId: keycloakCfg.clientId,
                clientSecret: keycloakCfg.clientSecret,
                issuer: keycloakCfg.issuer,
            }));
            enabledProviders.push('keycloak');
            if (process.env.NODE_ENV !== 'production') {
                console.log('[Better-Auth Plugin] Keycloak SSO enabled');
            }
        }

        // Custom OIDC provider
        const oidcCfg = config.sso?.oidc || (
            process.env.OIDC_CLIENT_ID && process.env.OIDC_PROVIDER_ID
                ? {
                    providerId: process.env.OIDC_PROVIDER_ID,
                    clientId: process.env.OIDC_CLIENT_ID,
                    clientSecret: process.env.OIDC_CLIENT_SECRET,
                    discoveryUrl: process.env.OIDC_DISCOVERY_URL,
                    authorizationUrl: process.env.OIDC_AUTHORIZATION_URL,
                    tokenUrl: process.env.OIDC_TOKEN_URL,
                    userInfoUrl: process.env.OIDC_USERINFO_URL,
                    scopes: process.env.OIDC_SCOPES?.split(',').map(s => s.trim()),
                }
                : undefined
        );
        if (oidcCfg) {
            genericConfigs.push({
                providerId: oidcCfg.providerId,
                clientId: oidcCfg.clientId,
                clientSecret: oidcCfg.clientSecret,
                discoveryUrl: oidcCfg.discoveryUrl,
                authorizationUrl: oidcCfg.authorizationUrl,
                tokenUrl: oidcCfg.tokenUrl,
                userInfoUrl: oidcCfg.userInfoUrl,
                scopes: oidcCfg.scopes,
            });
            enabledProviders.push(oidcCfg.providerId);
            if (process.env.NODE_ENV !== 'production') {
                console.log(`[Better-Auth Plugin] Custom OIDC '${oidcCfg.providerId}' SSO enabled`);
            }
        }

        // Register the genericOAuth plugin if any enterprise providers are configured
        if (genericConfigs.length > 0) {
            const { genericOAuth } = await import("better-auth/plugins/generic-oauth");
            plugins.push(genericOAuth({ config: genericConfigs }));
        }

        // Add organization and team management
        plugins.push(organization({
            dynamicAccessControl: {
                enabled: true
            },
            teams: {
                enabled: true
            },
            creatorRole: 'owner',
            roles: {
                owner: role({
                    organization: ['update', 'delete', 'read'],
                    member: ['create', 'update', 'delete', 'read'],
                    invitation: ['create', 'cancel', 'read'],
                    team: ['create', 'update', 'delete', 'read']
                }),
                admin: role({
                    organization: ['update', 'read'],
                    member: ['create', 'update', 'delete', 'read'],
                    invitation: ['create', 'cancel', 'read'],
                    team: ['create', 'update', 'delete', 'read']
                }),
                user: role({
                    organization: ['read'],
                    member: ['read'],
                    team: ['read']
                })
            }
        }));

        // Initialize database connection based on database type
        if (isPostgres) {
            const { Pool } = await import("pg");
            dbConnection = new Pool({
                connectionString: dbUrl!
            });
            database = dbConnection;
        } else if (isMongo) {
            const { MongoClient } = await import("mongodb");
            const client = new MongoClient(dbUrl!);
            await client.connect();
            dbConnection = client;
            database = client.db();
        } else {
            const sqlite3Import = await import("better-sqlite3");
            // Handle both ESM/Interop (default export) and CJS (direct export)
            const Database = (sqlite3Import.default || sqlite3Import) as any;
            const filename = (dbUrl?.replace('sqlite:', '')) || 'objectos.db';
            console.log(`[Better-Auth Plugin] Initializing with SQLite database: ${filename}`);
            dbConnection = new Database(filename);
            database = dbConnection;
        }

        // Configure Better-Auth with organization and role plugins
        // basePath must match the ObjectStack Hono route: /api/v1/auth/*
        const passwordPolicy = config.securityPolicies?.password;
        const sessionPolicy = config.securityPolicies?.session;

        authInstance = betterAuth({
            database: database,
            baseURL: config.baseURL || process.env.BETTER_AUTH_URL || "http://localhost:5320",
            basePath: '/api/v1/auth',
            trustedOrigins: config.trustedOrigins || [
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://[::1]:*"
            ],
            emailAndPassword: {
                enabled: true,
                minPasswordLength: passwordPolicy?.minLength ?? 8,
                maxPasswordLength: passwordPolicy?.maxLength ?? 128,
                autoSignIn: true,
            },
            session: {
                expiresIn: sessionPolicy?.maxDurationMinutes
                    ? sessionPolicy.maxDurationMinutes * 60
                    : 60 * 60 * 24 * 7, // default: 7 days in seconds
                updateAge: sessionPolicy?.idleTimeoutMinutes
                    ? sessionPolicy.idleTimeoutMinutes * 60
                    : 60 * 60 * 24, // default: 1 day in seconds
            },
            user: {
                additionalFields: {
                    role: {
                        type: "string",
                        required: false,
                        defaultValue: 'user',
                        input: false
                    }
                }
            },
            databaseHooks: {
                user: {
                    create: {
                        before: async (user) => {
                            try {
                                let count = 0;
                                
                                // Get user count to determine if this is the first user (admin)
                                if (isPostgres) {
                                    const result = await database.query('SELECT count(*) FROM "user"');
                                    count = parseInt(result.rows[0].count);
                                } else if (isMongo) {
                                    const collection = database.collection('user');
                                    count = await collection.countDocuments();
                                } else {
                                    try {
                                        const stmt = database.prepare('SELECT count(*) as count FROM user');
                                        const result = stmt.get() as any;
                                        count = result.count;
                                    } catch {
                                        count = 0;
                                    }
                                }

                                // First user gets super_admin role
                                const role = count === 0 ? 'super_admin' : 'user';
                                console.log(`[Better-Auth Plugin] Creating user with role: ${role} (current count: ${count})`);
                                
                                return {
                                    data: {
                                        ...user,
                                        role
                                    }
                                };
                            } catch (e) {
                                console.error("[Better-Auth Plugin] Error in user create hook:", e);
                                // Ensure a default role is set even in error cases
                                return { 
                                    data: {
                                        ...user,
                                        role: 'user'
                                    }
                                };
                            }
                        }
                    }
                },
                session: {
                    create: {
                        after: async (session) => {
                            config.onSessionEvent?.('auth.session_created', {
                                sessionId: session.id,
                                userId: session.userId,
                                timestamp: new Date().toISOString(),
                            });
                        },
                    },
                },
            },
            plugins: plugins,
        });

        // Store enabled providers list for the /providers endpoint
        (authInstance as any).__enabledProviders = enabledProviders;
        
        console.log(`[Better-Auth Plugin] Initialized successfully (providers: ${enabledProviders.join(', ') || 'email-only'})`);
        return authInstance;
    } catch (e: any) {
        console.error("[Better-Auth Plugin] Initialization Error:", e);
        throw e;
    }
};

export const resetAuthInstance = async () => {
    // Close database connections before resetting
    if (dbConnection) {
        try {
            // Check connection type and close appropriately
            if (dbConnection.end) {
                // PostgreSQL Pool
                await dbConnection.end();
            } else if (dbConnection.close) {
                // MongoDB client or SQLite
                if (dbConnection.close.constructor.name === 'AsyncFunction') {
                    await dbConnection.close();
                } else {
                    dbConnection.close();
                }
            }
            console.log('[Better-Auth Plugin] Database connection closed');
        } catch (e) {
            console.error('[Better-Auth Plugin] Error closing database connection:', e);
        }
    }
    authInstance = undefined;
    dbConnection = undefined;
};

export { getBetterAuth as default };

/**
 * Returns the list of enabled OAuth/SSO provider IDs.
 * Available only after getBetterAuth() has been called.
 */
export const getEnabledProviders = (): string[] => {
    return (authInstance as any)?.__enabledProviders ?? [];
};
