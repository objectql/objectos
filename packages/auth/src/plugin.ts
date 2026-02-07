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

            // Expose a Web-standard fetch handler (Request → Response)
            // HttpDispatcher calls: authService.handler(context.request)
            this.handler = async (request: Request): Promise<Response> => {
                return this.authInstance.handler(request);
            };

            // Register as 'auth' — the name HttpDispatcher.handleAuth() looks up
            context.registerService('auth', this);
            // Keep legacy alias for backward compatibility
            context.registerService('better-auth', this);

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
     * Start plugin - Can be minimal for auth plugin
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Better-Auth Plugin] Starting...');

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
