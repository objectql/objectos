export * from './metadata';

import { ObjectConfig } from './metadata';

export interface ObjectQLConfig {
    datasources: Record<string, any>;
    objects?: Record<string, ObjectConfig>;
}

export class ObjectQL {
    private objects: Record<string, ObjectConfig> = {};
    private datasources: Record<string, any> = {};

    constructor(config: ObjectQLConfig) {
        this.datasources = config.datasources;
        if (config.objects) {
            for (const obj of Object.values(config.objects)) {
                this.registerObject(obj);
            }
        }
    }

    registerObject(object: ObjectConfig) {
        // Normalize fields
        if (object.fields) {
            for (const [key, field] of Object.entries(object.fields)) {
                if (!field.name) {
                    field.name = key;
                }
            }
        }
        this.objects[object.name] = object;
    }

    getObject(name: string): ObjectConfig | undefined {
        return this.objects[name];
    }

    datasource(name: string) {
        const driver = this.datasources[name];
        if (!driver) {
            throw new Error(`Datasource '${name}' not found`);
        }
        return driver;
    }
}
