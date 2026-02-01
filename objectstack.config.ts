/**
 * ObjectStack Configuration
 * 
 * Configuration file for @objectstack/cli serve command.
 * This defines the kernel configuration, plugins, and metadata sources.
 * 
 * NOTE: This is a template configuration for future use with @objectstack/cli.
 * The ObjectKernel from @objectstack/runtime expects plugins to be passed directly.
 * Since we don't have the @objectstack packages installed as dependencies,
 * this config currently serves as documentation for the expected structure.
 */

export default {
  /**
   * Metadata sources
   * Define where to load object schemas, permissions, workflows, etc.
   */
  metadata: {},

  /**
   * Objects configuration
   * Can define objects inline or reference external files
   */
  objects: {},

  /**
   * Plugins to load
   * These are initialized in order during kernel bootstrap
   * 
   * Example (when @objectstack packages are installed):
   * 
   * import { KnexDriver } from '@objectql/driver-sql';
   * import { ObjectQLPlugin } from '@objectstack/objectql';
   * import { DriverPlugin } from '@objectstack/runtime';
   * 
   * plugins: [
   *   new ObjectQLPlugin(),
   *   new DriverPlugin(
   *     new KnexDriver({
   *       client: 'sqlite3',
   *       connection: { filename: 'objectos.db' },
   *       useNullAsDefault: true
   *     }),
   *     'default'
   *   ),
   * ]
   */
  plugins: [],

  /**
   * Server configuration (for HTTP server plugin)
   */
  server: {
    port: process.env.PORT || 3000,
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    }
  }
};
