/**
 * @objectos/plugin-better-auth
 * 
 * Authentication plugin for ObjectOS based on Better-Auth library
 * 
 * @example
 * ```typescript
 * import { BetterAuthPlugin, createBetterAuthPlugin } from '@objectos/plugin-better-auth';
 * 
 * // Use default plugin
 * const os = new ObjectOS({
 *   plugins: [BetterAuthPlugin]
 * });
 * 
 * // Or create with custom configuration
 * const customAuthPlugin = createBetterAuthPlugin({
 *   databaseUrl: 'postgres://localhost:5432/mydb',
 *   baseURL: 'https://myapp.com/api/auth',
 *   trustedOrigins: ['https://myapp.com']
 * });
 * ```
 */

export {
    BetterAuthPlugin,
    BetterAuthManifest,
    createBetterAuthPlugin,
    getBetterAuth,
    type BetterAuthPluginOptions,
    type BetterAuthConfig,
} from './plugin';

export { resetAuthInstance } from './auth-client';
