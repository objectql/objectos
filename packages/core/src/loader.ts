import { MetadataRegistry } from './registry';
import { ObjectConfig } from './types';
import { MetadataLoader as BaseLoader, registerObjectQLPlugins } from '@objectql/metadata';

export class MetadataLoader extends BaseLoader {
    constructor(registry: MetadataRegistry) {
        super(registry);
        registerObjectQLPlugins(this);
        
        // Register Security Plugins
        this.registerPlugin('policy', {
            extensions: ['.policy.yml', '.policy.yaml'],
            loader: (content: any) => content // YAML parser is usually built-in or handled by BaseLoader if it returns object
        });
        
        this.registerPlugin('role', {
            extensions: ['.role.yml', '.role.yaml'],
            loader: (content: any) => content
        });
    }
}

export function loadObjectConfigs(dir: string): Record<string, ObjectConfig> {
    const registry = new MetadataRegistry();
    const loader = new MetadataLoader(registry);
    loader.load(dir);
    const result: Record<string, ObjectConfig> = {};
    for (const obj of registry.list<ObjectConfig>('object')) {
        result[obj.name] = obj;
    }
    return result;
}

