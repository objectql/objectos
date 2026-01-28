import { Provider } from '@nestjs/common';
import { ObjectKernel, ObjectQLPlugin, DriverPlugin } from '@objectstack/runtime';
import { ObjectOS } from '@objectos/kernel';
import { KnexDriver } from '@objectql/driver-sql';
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

        // Create the ObjectKernel
        const kernel = new ObjectKernel();
        
        // Create ObjectOS with presets
        const presets = config.presets || ['@objectos/preset-base'];
        const objectos = new ObjectOS({ presets });
        
        // Register ObjectOS as ObjectQL plugin
        kernel.use(new ObjectQLPlugin(objectos));

        // Map config to drivers and register them
        if (config.datasource) {
            for (const [key, ds] of Object.entries(config.datasource)) {
                const datasourceConfig = ds as any;
                let driver: any;
                
                if (datasourceConfig.type === 'postgres') {
                    driver = new KnexDriver({
                        client: 'pg',
                        connection: datasourceConfig.url
                    });
                } else if (datasourceConfig.type === 'sqlite') {
                    driver = new KnexDriver({
                        client: 'sqlite3',
                        connection: {
                            filename: datasourceConfig.filename
                        },
                        useNullAsDefault: true
                    });
                }
                
                if (driver) {
                    kernel.use(new DriverPlugin(driver, key));
                }
            }
        }

        // Default if no datasource configured
        if (!config.datasource || Object.keys(config.datasource).length === 0) {
            console.warn('No datasource found in config, using default SQLite connection.');
            const defaultDriver = new KnexDriver({ 
                client: 'sqlite3',
                connection: {
                    filename: ':memory:'
                },
                useNullAsDefault: true
            });
            kernel.use(new DriverPlugin(defaultDriver, 'default'));
        }

        try {
            // Bootstrap the kernel (this will init ObjectQL and connect drivers)
            await kernel.bootstrap();
            
            // Get the ObjectQL instance from the service registry
            const ql = kernel.getService('objectql');
            
            return ql;
        } catch (error) {
            console.error('Failed to bootstrap ObjectKernel:', error);
            if (error instanceof Error && error.message.includes('preset')) {
                console.error(`Hint: Ensure preset packages are installed: ${presets.join(', ')}`);
            }
            throw error;
        }
    }
};

export default objectQLProvider;
