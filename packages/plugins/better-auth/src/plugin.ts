/**
 * Better-Auth Plugin for ObjectOS
 * 
 * This plugin provides authentication capabilities using Better-Auth library.
 * It conforms to the @objectstack/spec protocol for plugin lifecycle and context.
 * 
 * Features:
 * - Email/Password authentication
 * - Organization and team management
 * - Role-based access control (RBAC)
 * - Multi-database support (PostgreSQL, MongoDB, SQLite)
 */

import type { PluginDefinition, PluginContextData, ObjectStackManifest } from '@objectstack/spec/system';
import { getBetterAuth, resetAuthInstance, BetterAuthConfig } from './auth-client';

/**
 * Extended app context with router and eventBus
 */
interface ExtendedAppContext {
    router?: {
        all?: (path: string, handler: (req: any, res: any) => any) => void;
    };
    eventBus?: {
        emit?: (event: string, data: any) => void;
    };
}

/**
 * Plugin Manifest
 * Conforms to @objectstack/spec/system/ManifestSchema
 */
export const BetterAuthManifest: ObjectStackManifest = {
    id: 'com.objectos.auth.better-auth',
    version: '0.1.0',
    type: 'plugin',
    name: 'Better-Auth Plugin',
    description: 'Authentication plugin based on Better-Auth library with organization and RBAC support',
    permissions: [
        'system.user.read',
        'system.user.write',
        'system.auth.manage',
    ],
    contributes: {
        // Register authentication events
        events: [
            'auth.user.created',
            'auth.user.login',
            'auth.user.logout',
            'auth.session.created',
            'auth.session.expired'
        ],
    },
};

/**
 * Plugin Configuration Options
 */
export interface BetterAuthPluginOptions extends BetterAuthConfig {
    // Additional plugin-specific options can be added here
}

/**
 * Create Better-Auth Plugin
 * Factory function to create the plugin with custom configuration
 */
export const createBetterAuthPlugin = (options: BetterAuthPluginOptions = {}): PluginDefinition => {
    return {
        /**
         * Called when the plugin is first installed
         */
        onInstall: (async (context: PluginContextData) => {
            context.logger.info('[Better-Auth Plugin] Installing...');
            
            // Store installation timestamp
            await context.storage.set('install_date', new Date().toISOString());
            await context.storage.set('config', JSON.stringify(options));
            
            context.logger.info('[Better-Auth Plugin] Installation complete');
        }) as any,

        /**
         * Called when the plugin is enabled
         */
        onEnable: (async (context: PluginContextData) => {
            context.logger.info('[Better-Auth Plugin] Enabling...');
            
            try {
                // Initialize Better-Auth
                const auth = await getBetterAuth(options);
                
                // Register authentication routes
                // Better-Auth provides a Node.js handler that we need to mount
                const { toNodeHandler } = await import('better-auth/node');
                const handler = toNodeHandler(auth);
                
                // Mount the auth handler on all /api/auth/* routes
                const app = context.app as ExtendedAppContext;
                if (app.router && typeof app.router.all === 'function') {
                    app.router.all('/api/auth/*', async (req: any, res: any) => {
                        // Pass the request to Better-Auth handler
                        return handler(req, res);
                    });
                    context.logger.info('[Better-Auth Plugin] Routes registered at /api/auth/*');
                } else {
                    context.logger.warn('[Better-Auth Plugin] Router not available, routes not registered');
                }
                
                // Emit plugin enabled event
                if (app.eventBus && typeof app.eventBus.emit === 'function') {
                    app.eventBus.emit('plugin.enabled', {
                        pluginId: BetterAuthManifest.id,
                        timestamp: new Date().toISOString()
                    });
                }
                
                context.logger.info('[Better-Auth Plugin] Enabled successfully');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                context.logger.error(`[Better-Auth Plugin] Failed to enable: ${errorMessage}`, error);
                throw new Error(`Better-Auth Plugin initialization failed: ${errorMessage}`);
            }
        }) as any,

        /**
         * Called when the plugin is disabled
         */
        onDisable: (async (context: PluginContextData) => {
            context.logger.info('[Better-Auth Plugin] Disabling...');
            
            try {
                // Close database connections and reset auth instance
                await resetAuthInstance();
                
                // Store last disabled timestamp
                await context.storage.set('last_disabled', new Date().toISOString());
                
                // Emit plugin disabled event
                const app = context.app as ExtendedAppContext;
                if (app.eventBus && typeof app.eventBus.emit === 'function') {
                    app.eventBus.emit('plugin.disabled', {
                        pluginId: BetterAuthManifest.id,
                        timestamp: new Date().toISOString()
                    });
                }
                
                context.logger.info('[Better-Auth Plugin] Disabled successfully');
            } catch (error) {
                context.logger.error('[Better-Auth Plugin] Error during disable:', error);
                throw error;
            }
        }) as any,

        /**
         * Called when the plugin is uninstalled
         */
        onUninstall: (async (context: PluginContextData) => {
            context.logger.info('[Better-Auth Plugin] Uninstalling...');
            
            try {
                // Close database connections and reset auth instance
                await resetAuthInstance();
                
                // Cleanup plugin storage
                await context.storage.delete('install_date');
                await context.storage.delete('last_disabled');
                await context.storage.delete('config');
                
                // Note: User data in the database is NOT automatically deleted
                // This should be handled by the administrator
                
                context.logger.warn('[Better-Auth Plugin] Uninstalled - User authentication data preserved in database');
            } catch (error) {
                context.logger.error('[Better-Auth Plugin] Error during uninstall:', error);
                throw error;
            }
        }) as any,
    };
};

/**
 * Default plugin instance with default configuration
 */
export const BetterAuthPlugin: PluginDefinition = createBetterAuthPlugin();

/**
 * Export helper function to get auth instance
 * This can be used by other plugins or modules
 */
export { getBetterAuth, BetterAuthConfig } from './auth-client';
