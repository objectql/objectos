import { ObjectQL } from '@objectql/core';
import { ObjectQLConfig, ObjectConfig } from '@objectql/types';
import { ObjectOSPlugin } from './plugins/objectql';
import { mergeObjectConfig } from './utils/merge';

export class ObjectOS extends ObjectQL {

    constructor(config: ObjectQLConfig = {}) {
        super({
            datasources: config.datasources || {},
            presets: config.presets || config.packages,
            plugins: [ObjectOSPlugin, ...(config.plugins || [])],
            source: config.source,
            objects: config.objects,
            connection: config.connection,
            remotes: config.remotes,
        });
    }
    
    async init(options?: any) {
        await super.init();
    }
    
    useDriver(driver: any) {
        (this as any).datasources['default'] = driver;
    }

    /**
     * Override registerObject to support field merging and deletion.
     * This allows extending existing objects without replacing them entirely.
     */
    registerObject(object: ObjectConfig): void {
        // Check if object already exists
        const existing = this.getObject(object.name);
        
        if (existing) {
            // Merge new definition with existing
            const merged = mergeObjectConfig(existing, object);
            // Call parent implementation with merged config
            super.registerObject(merged);
        } else {
            // For new objects, filter out null fields before registering
            const filtered = this.filterDeletedFields(object);
            super.registerObject(filtered);
        }
    }

    /**
     * Filter out fields marked for deletion (null or { _deleted: true })
     */
    private filterDeletedFields(object: ObjectConfig): ObjectConfig {
        if (!object.fields) return object;

        const filtered: ObjectConfig = { ...object, fields: {} };
        
        for (const [key, value] of Object.entries(object.fields)) {
            // Skip null or deleted fields
            if (value !== null && value !== undefined && 
                !(typeof value === 'object' && (value as any)._deleted === true)) {
                filtered.fields[key] = value;
            }
        }

        return filtered;
    }
}

