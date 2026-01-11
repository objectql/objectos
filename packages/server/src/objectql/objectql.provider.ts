import { Provider } from '@nestjs/common';
import { ObjectOS } from '@objectos/kernel';
import { KnexDriver } from '@objectql/driver-knex';
import * as path from 'path';
import * as fs from 'fs';

export const objectQLProvider: Provider = {
    provide: ObjectOS,
    useFactory: async () => {
        let config: any = {};
        
        // Try to locate objectql.config.ts or objectql.config.js
        // 1. Check process.cwd()
        // 2. Check up to 2 levels up (in case running from packages/server)
        
        const candidates = [
            path.resolve(process.cwd(), 'objectql.config.ts'),
            path.resolve(process.cwd(), 'objectql.config.js'),
            path.resolve(process.cwd(), '../objectql.config.ts'),
            path.resolve(process.cwd(), '../objectql.config.js'),
            path.resolve(process.cwd(), '../../objectql.config.ts'),
            path.resolve(process.cwd(), '../../objectql.config.js'),
            // Legacy fallbacks
            path.resolve(process.cwd(), 'objectos.config.js'),
            path.resolve(process.cwd(), '../objectos.config.js'),
            path.resolve(process.cwd(), '../../objectos.config.js'),
        ];

        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                try {
                    console.log(`Loading config from ${candidate}`);
                    const loaded = await import(candidate);
                    config = loaded.default || loaded;
                    break;
                } catch (e) {
                    console.error(`Error loading config from ${candidate}:`, e);
                }
            }
        }

        // Map config to ObjectQL options
        const datasources: Record<string, any> = {};
        
        if (config.datasource) {
            for (const [key, ds] of Object.entries(config.datasource)) {
                const datasourceConfig = ds as any;
                if (datasourceConfig.type === 'postgres') {
                    datasources[key] = new KnexDriver({
                        client: 'pg',
                        connection: datasourceConfig.url
                    });
                } else if (datasourceConfig.type === 'sqlite') {
                    datasources[key] = new KnexDriver({
                        client: 'sqlite3',
                        connection: {
                            filename: datasourceConfig.filename
                        },
                        useNullAsDefault: true
                    });
                }
            }
        }

        // Default if no datasource configured
        if (Object.keys(datasources).length === 0) {
            console.warn('No datasource found in config, using default SQLite connection.');
            datasources.default = new KnexDriver({ 
                client: 'sqlite3',
                connection: {
                    filename: ':memory:'
                },
                useNullAsDefault: true
            });
        }

        const presets = config.presets || ['@objectos/preset-base'];
        
        const objectos = new ObjectOS({
            datasources,
            presets
        });
        
        try {
            await objectos.init();
        } catch (error) {
            console.error('Failed to initialize ObjectOS:', error);
            if (error instanceof Error && error.message.includes('preset')) {
                console.error(`Hint: Ensure preset packages are installed: ${presets.join(', ')}`);
            }
            throw error;
        }
        
        return objectos;
    }
};

export default objectQLProvider;
