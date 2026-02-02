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
import { getBetterAuth, resetAuthInstance, BetterAuthConfig } from './auth-client';

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
    name = 'com.objectos.auth.better-auth';
    version = '0.1.0';
    dependencies: string[] = [];

    private config: BetterAuthPluginOptions;
    private context?: PluginContext;
    private authInstance?: any;

    constructor(config: BetterAuthPluginOptions = {}) {
        this.config = config;
    }

    /**
     * Initialize plugin - Initialize Better-Auth and register routes
     */
    async init(context: PluginContext): Promise<void> {
        this.context = context;

        context.logger.info('[Better-Auth Plugin] Initializing...');

        try {
            // Initialize Better-Auth
            this.authInstance = await getBetterAuth(this.config);

            // Register authentication routes
            // Better-Auth provides a Node.js handler that we need to mount
            const { toNodeHandler } = await import('better-auth/node');
            const handler = toNodeHandler(this.authInstance);

            // Register the plugin as a service
            context.registerService('better-auth', this);

            // Register route handler through a hook or service
            // The kernel should provide a way to register routes
            // For now, we'll use a hook to expose the handler
            context.hook('http.route.register', async (routeData: any) => {
                if (routeData?.path === '/api/auth/*') {
                    return handler;
                }
            });

            // Emit plugin initialized event
            await context.trigger('plugin.initialized', {
                pluginId: this.name,
                timestamp: new Date().toISOString()
            });

            context.logger.info('[Better-Auth Plugin] Initialized successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            context.logger.error(`[Better-Auth Plugin] Failed to initialize: ${errorMessage}`, error);
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
     * Get the Better-Auth handler for route registration
     */
    async getHandler(): Promise<any> {
        if (!this.authInstance) {
            throw new Error('Better-Auth not initialized');
        }

        const { toNodeHandler } = await import('better-auth/node');
        return toNodeHandler(this.authInstance);
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
            this.context?.logger.error('[Better-Auth Plugin] Error during destroy:', error);
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
export { getBetterAuth, BetterAuthConfig } from './auth-client';
