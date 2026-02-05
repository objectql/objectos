/**
 * @objectos/plugin-better-auth
 * 
 * Authentication plugin for ObjectOS based on Better-Auth library
 * 
 * @example
 * ```typescript
 * import { BetterAuthPlugin, getBetterAuthAPI } from '@objectos/plugin-better-auth';
 * 
 * // Create plugin instance
 * const authPlugin = new BetterAuthPlugin({
 *   databaseUrl: 'postgres://localhost:5432/mydb',
 *   baseURL: 'https://myapp.com/api/auth',
 *   trustedOrigins: ['https://myapp.com']
 * });
 * 
 * // Register with kernel
 * await kernel.registerPlugin(authPlugin);
 * 
 * // Later, access the plugin from kernel
 * const betterAuth = getBetterAuthAPI(kernel);
 * ```
 */

export {
    BetterAuthPlugin,
    getBetterAuth,
    getBetterAuthAPI,
    type BetterAuthPluginOptions,
    type BetterAuthConfig,
} from './plugin';

export { resetAuthInstance } from './auth-client';
