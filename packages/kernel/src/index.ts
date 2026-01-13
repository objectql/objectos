/**
 * @objectos/kernel
 * 
 * The Brain of ObjectOS - Core runtime engine for metadata-driven applications.
 * 
 * This package provides:
 * - ObjectOS class: Main runtime engine that extends ObjectQL
 * - ObjectOSPlugin: Core plugin for loading apps, objects, and data
 * - Type definitions: Extended types for apps, charts, and pages
 * 
 * @packageDocumentation
 * 
 * @example
 * ```typescript
 * import { ObjectOS } from '@objectos/kernel';
 * import { KnexDriver } from '@objectql/driver-sql';
 * 
 * const objectos = new ObjectOS({
 *   datasources: {
 *     default: new KnexDriver({ client: 'pg', connection: process.env.DATABASE_URL })
 *   },
 *   presets: ['@objectos/preset-base'],
 *   source: './metadata'
 * });
 * 
 * await objectos.init();
 * ```
 */

export * from './objectos';
export { ObjectOSPlugin } from './plugins/objectql';

// Re-export specific types if needed to avoid conflicts
export { 
    AppConfig, 
    AppMenuSection, 
    AppMenuItem, 
    isAppMenuSection,
    ChartConfig,
    PageConfig,
    PageComponent
} from './types';

