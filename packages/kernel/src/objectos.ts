import { ObjectQL } from '@objectql/core';
import { AppPlugin } from './plugins/app';
import { DataPlugin } from './plugins/data';

export class ObjectOS extends ObjectQL {

    constructor(config: { datasources?: any, packages?: string[] } = {}) {
        super({
            datasources: config.datasources || {},
            packages: config.packages,
            plugins: [AppPlugin, DataPlugin]
        });
    }
    
    async init(options?: any) {
        await super.init();
    }
    
    useDriver(driver: any) {
        (this as any).datasources['default'] = driver;
    }
}

