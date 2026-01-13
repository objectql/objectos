import { ObjectQL } from '@objectql/core';
import { ObjectQLConfig } from '@objectql/types';
import { ObjectOSPlugin } from './plugins/objectql';

/**
 * ObjectOS - The Runtime Engine for ObjectQL Metadata
 * 
 * ObjectOS is a metadata-driven runtime that brings enterprise applications to life.
 * It extends ObjectQL to provide additional features:
 * - Automatic loading of apps, objects, and data from YAML files
 * - Enhanced plugin system for business logic extensions
 * - Preset support for reusable metadata packages
 * 
 * @example
 * ```typescript
 * const objectos = new ObjectOS({
 *   datasources: {
 *     default: new KnexDriver({ client: 'pg', connection: 'postgres://...' })
 *   },
 *   presets: ['@objectos/preset-base'],
 *   source: './metadata'
 * });
 * 
 * await objectos.init();
 * 
 * // Query data
 * const contacts = await objectos.getObject('contacts').find();
 * ```
 * 
 * @see {@link https://github.com/objectql/objectql} for ObjectQL protocol
 * @see {@link ObjectQLConfig} for configuration options
 */
export class ObjectOS extends ObjectQL {

    /**
     * Creates a new ObjectOS instance with the specified configuration.
     * 
     * The ObjectOSPlugin is automatically registered to handle:
     * - Loading `*.object.yml` files (business objects)
     * - Loading `*.app.yml` files (application configurations)
     * - Loading `*.data.yml` files (seed data)
     * 
     * @param config - Configuration options for ObjectOS
     * @param config.datasources - Database drivers keyed by datasource name
     * @param config.presets - Array of preset package names to load (e.g., '@objectos/preset-base')
     * @param config.source - Directory or directories to scan for metadata files
     * @param config.objects - Object definitions to register directly (bypasses file loading)
     * @param config.plugins - Additional plugins to register
     * @param config.connection - Legacy connection configuration
     * @param config.remotes - Remote datasource configurations
     */
    constructor(config: ObjectQLConfig = {}) {
        super({
            datasources: config.datasources || {},
            presets: config.presets || config.packages, // Backward compatibility: packages → presets
            plugins: [ObjectOSPlugin, ...(config.plugins || [])],
            source: config.source,
            objects: config.objects,
            connection: config.connection,
            remotes: config.remotes,
        });
    }
    
    /**
     * Initializes the ObjectOS instance.
     * 
     * This method:
     * 1. Initializes the underlying ObjectQL engine
     * 2. Runs all registered plugins (including ObjectOSPlugin)
     * 3. Loads metadata from configured sources
     * 4. Validates object configurations
     * 
     * @param options - Optional initialization parameters (currently unused)
     * @throws {Error} If initialization fails (e.g., invalid metadata, missing presets)
     */
    async init(options?: any) {
        await super.init();
    }
    
    /**
     * Sets the default database driver.
     * 
     * Convenience method for configuring a default datasource after instantiation.
     * Useful in testing or when the driver is constructed dynamically.
     * 
     * @param driver - The database driver instance (e.g., KnexDriver, MongoDriver)
     * 
     * @example
     * ```typescript
     * const objectos = new ObjectOS();
     * objectos.useDriver(new KnexDriver({ client: 'sqlite3', connection: ':memory:' }));
     * await objectos.init();
     * ```
     */
    useDriver(driver: any) {
        (this as any).datasources['default'] = driver;
    }
}

