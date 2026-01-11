import { ObjectQL } from '@objectql/core';
import { ObjectQLConfig } from '@objectql/types';
import { ObjectOSPlugin } from './plugins/objectql';

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
}

