import { ObjectQL } from '@objectql/core';
import { MetadataLoader } from './loader';
import { registerObjectQLPlugins } from './plugins/objectql';

export class ObjectOS extends ObjectQL {
    public readonly componentLoader: MetadataLoader;

    constructor(config: { datasources?: any, packages?: string[] } = {}) {
        super({
            datasources: config.datasources || {},
            packages: config.packages
        });
        
        this.componentLoader = new MetadataLoader(this.metadata as any); 
        registerObjectQLPlugins(this.componentLoader);
    }
    
    async init(options?: any) {
        await super.init();
    }
    
    useDriver(driver: any) {
        (this as any).datasources['default'] = driver;
    }
}

