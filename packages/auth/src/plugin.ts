/**
 * Better-Auth Plugin for ObjectOS
 * 
 * This plugin provides authentication capabilities using Better-Auth library.
 * It conforms to the @objectstack/runtime protocol for plugin lifecycle and context.
 * 
 * Features:
 * - Email/Password authentication
 * - Organization and team management
 * - Role-based access control (RBAC)
 * - Multi-database support (PostgreSQL, MongoDB, SQLite)
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import { getBetterAuth, resetAuthInstance, type BetterAuthConfig } from './auth-client.js';
import * as Objects from './objects/index.js';

/**
 * Plugin Configuration Options
 */
export interface BetterAuthPluginOptions extends BetterAuthConfig {
    // Additional plugin-specific options can be added here
}

/**
 * Better-Auth Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class BetterAuthPlugin implements Plugin {
    name = '@objectos/auth';
    version = '0.1.0';
    
    // Register objects
    objects = Object.values(Objects);
    dependencies: string[] = [];

    private config: BetterAuthPluginOptions;
    private context?: PluginContext;
    private authInstance?: any;
    public handler?: any;

    constructor(config: BetterAuthPluginOptions = {}) {
        this.config = config;
    }

    /**
     * Initialize plugin - Initialize Better-Auth and register as 'auth' service
     *
     * The ObjectStack HttpDispatcher routes `ALL /api/v1/auth/*` to whatever
     * service is registered under CoreServiceName 'auth'.  It calls
     *   `authService.handler(request: Request): Promise<Response>`
     * so we expose a thin fetch-style handler wrapping better-auth.
     */
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;

        context.logger.info('[Better-Auth Plugin] Initializing...');

        try {
            // Initialize Better-Auth with correct basePath for /api/v1/auth/*
            this.authInstance = await getBetterAuth(this.config);

            // Run database migrations to ensure auth tables exist
            try {
                const authCtx = await this.authInstance.$context;
                await authCtx.runMigrations();
                context.logger.info('[Better-Auth Plugin] Database migrations completed');
            } catch (migrationError: any) {
                context.logger.warn(`[Better-Auth Plugin] Migration warning: ${migrationError?.message || migrationError}`);
            }

            // Expose a Web-standard fetch handler (Request → Response)
            // HttpDispatcher calls: authService.handler(context.request)
            this.handler = async (request: Request): Promise<Response> => {
                return this.authInstance.handler(request);
            };

            // Register as 'auth' — the name HttpDispatcher.handleAuth() looks up.
            // The kernel (or another plugin like ObjectQL App) may have already
            // registered a stub 'auth' service.  Since the public Kernel API
            // does not expose replaceService(), we override via the services Map
            // when necessary.
            this.overrideOrRegister(context, 'auth', this);
            this.overrideOrRegister(context, 'better-auth', this);

            // Emit plugin initialized event
            await context.trigger('plugin.initialized', {
                pluginId: this.name,
                timestamp: new Date().toISOString()
            });

            context.logger.info('[Better-Auth Plugin] Initialized successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorObj = error instanceof Error ? error : undefined;
            context.logger.error(`[Better-Auth Plugin] Failed to initialize: ${errorMessage}`, errorObj);
            throw new Error(`Better-Auth Plugin initialization failed: ${errorMessage}`);
        }
    }

    /**
     * Start plugin - Mount better-auth handler on the Hono app
     *
     * The default createHonoApp auth route calls `c.req.parseBody()` which
     * consumes the Request body before passing `c.req.raw` to our handler.
     * better-auth needs to read the body itself (JSON), which fails with
     * "Body is unusable: Body has already been read".
     *
     * To fix this we mount a middleware on the raw Hono app that intercepts
     * /api/v1/auth/* BEFORE the standard route, passing a fresh Request
     * to better-auth directly.
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Better-Auth Plugin] Starting...');

        // Mount better-auth directly on Hono (bypasses body-consuming parseBody)
        try {
            const httpServer = context.getService('http.server') as any;
            const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
            if (rawApp && this.authInstance) {
                // Intercept all auth requests before the default dispatcher route
                rawApp.all('/api/v1/auth/*', async (c: any) => {
                    const response = await this.authInstance.handler(c.req.raw);
                    return response;
                });
                context.logger.info('[Better-Auth Plugin] Mounted auth handler on Hono app');
            }
        } catch (e: any) {
            context.logger.warn(`[Better-Auth Plugin] Could not mount on Hono: ${e?.message}`);
        }

        // Emit authentication ready event
        await context.trigger('auth.ready', {
            pluginId: this.name,
            timestamp: new Date().toISOString()
        });

        context.logger.info('[Better-Auth Plugin] Started successfully');
    }

    /**
     * Get the Better-Auth instance
     */
    getAuthInstance(): any {
        return this.authInstance;
    }

    /**
     * Register a service, overriding any existing stub.
     *
     * The ObjectStack kernel throws on duplicate registerService() calls.
     * The ObjectQL App plugin (or others) may pre-register an 'auth' stub
     * before BetterAuthPlugin.init() runs.  We detect that case and
     * replace the stub via the kernel's internal services Map so the
     * real better-auth handler takes precedence.
     */
    private overrideOrRegister(context: PluginContext, name: string, service: any): void {
        try {
            context.registerService(name, service);
        } catch {
            // Service already exists — replace it on kernel.services Map
            const kernel = context.getKernel() as any;
            if (kernel?.services instanceof Map) {
                kernel.services.set(name, service);
                context.logger.info(`[Better-Auth Plugin] Replaced existing '${name}' service`);
            } else {
                context.logger.warn(`[Better-Auth Plugin] Could not replace service '${name}'`);
            }
        }
    }

    /**
     * Get the Better-Auth fetch-style handler.
     * Returns (request: Request) => Promise<Response>
     */
    getHandler(): (request: Request) => Promise<Response> {
        if (!this.authInstance) {
            throw new Error('Better-Auth not initialized');
        }
        return (request: Request) => this.authInstance.handler(request);
    }

    /**
     * Cleanup and shutdown - Close database connections and reset auth instance
     */
    async destroy(): Promise<void> {
        this.context?.logger.info('[Better-Auth Plugin] Destroying...');

        try {
            // Close database connections and reset auth instance
            await resetAuthInstance();
            this.authInstance = undefined;

            // Emit plugin destroyed event
            if (this.context) {
                await this.context.trigger('plugin.destroyed', {
                    pluginId: this.name,
                    timestamp: new Date().toISOString()
                });
            }

            this.context?.logger.info('[Better-Auth Plugin] Destroyed successfully');
        } catch (error) {
            const errorObj = error instanceof Error ? error : undefined;
            this.context?.logger.error('[Better-Auth Plugin] Error during destroy:', errorObj);
            throw error;
        }
    }
}

/**
 * Helper function to access the Better-Auth API from kernel
 */
export function getBetterAuthAPI(kernel: any): BetterAuthPlugin | null {
    try {
        return kernel.getService('better-auth');
    } catch {
        return null;
    }
}

/**
 * Export helper function to get auth instance
 * This can be used by other plugins or modules
 */
export { getBetterAuth, BetterAuthConfig } from './auth-client.js';
