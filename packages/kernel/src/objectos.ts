import { ObjectQL } from '@objectql/core';
// Note: AppPlugin and DataPlugin are temporarily disabled because ObjectQL core
// doesn't yet support the addLoader API they require
// import { AppPlugin } from './plugins/app';
// import { DataPlugin } from './plugins/data';

export class ObjectOS extends ObjectQL {

    constructor(config: { datasources?: any, packages?: string[] } = {}) {
        super({
            datasources: config.datasources || {},
            packages: config.packages,
            // plugins: [AppPlugin, DataPlugin] // Temporarily disabled - waiting for ObjectQL core plugin API
        });
    }
    
    async init(options?: any) {
        await super.init();
    }
    
    useDriver(driver: any) {
        (this as any).datasources['default'] = driver;
    }
}

