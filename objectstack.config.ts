/**
 * ObjectStack Configuration
 * 
 * Configuration file for @objectstack/cli serve command.
 * This defines the kernel configuration, plugins, and metadata sources.
 */

import { KnexDriver } from '@objectql/driver-sql';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { DriverPlugin } from '@objectstack/runtime';

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
   */
  plugins: [
    // ObjectQL Data Engine Plugin
    new ObjectQLPlugin(),
    
    // Database Driver Plugin
    new DriverPlugin(
      new KnexDriver({
        client: 'sqlite3',
        connection: {
          filename: process.env.DATABASE_FILE || 'objectos.db'
        },
        useNullAsDefault: true
      }),
      'default' // datasource name
    ),
  ],

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
