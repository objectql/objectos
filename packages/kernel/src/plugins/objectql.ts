import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'fast-glob';
import { ObjectQLPlugin, IObjectQL } from '@objectql/types';

async function loadFiles(app: IObjectQL, patterns: string[], handler: (ctx: any) => void) {
    const config = (app as any).config || {};
    const sources: string[] = config.source ? (Array.isArray(config.source) ? config.source : [config.source]) : ['.'];
    
    for (const source of sources) {
        const cwd = path.resolve(process.cwd(), source);
        if (!fs.existsSync(cwd)) continue;

        const files = await glob(patterns, { cwd, absolute: true });
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                handler({
                    file,
                    content,
                    registry: app.metadata,
                });
            } catch (err) {
                console.error(`Error loading file ${file}`, err);
            }
        }
    }
}

export const ObjectOSPlugin: ObjectQLPlugin = {
    name: 'objectos-core',
    async setup(app: IObjectQL) {
        // Objects
        await loadFiles(app, ['**/*.object.yml', '**/*.object.yaml'], (ctx) => {
             try {
                const doc = yaml.load(ctx.content) as any;
                const name = doc.name;
                if (name) {
                    ctx.registry.register('object', {
                        type: 'object',
                        id: name,
                        path: ctx.file,
                        package: ctx.packageName,
                        content: doc
                    });
                }
            } catch (e) {
                    console.error(`Error loading object from ${ctx.file}: ${e instanceof Error ? e.message : String(e)}`);
            }
        });

        // Apps
        await loadFiles(app, ['**/*.app.yml', '**/*.app.yaml'], (ctx) => {
            try {
                const doc = yaml.load(ctx.content) as any;
                const id = doc.code || doc.id || doc.name;
                if (id) {
                    ctx.registry.register('app', {
                        type: 'app',
                        id: id,
                        path: ctx.file,
                        package: ctx.packageName,
                        content: doc
                    });
                }
            } catch (e) {
                    console.error(`Error loading app from ${ctx.file}: ${e instanceof Error ? e.message : String(e)}`);
                    console.error('Expected YAML structure: { name: string, label: string, menu?: [...] }');
            }
        });

        // Data
        await loadFiles(app, ['**/*.data.yml', '**/*.data.yaml'], (ctx) => {
            try {
                const content = ctx.content;
                const data = yaml.load(content);
                if (!Array.isArray(data)) return;

                const basename = path.basename(ctx.file);
                const objectName = basename.replace(/\.data\.ya?ml$/, '');
                
                const entry = ctx.registry.getEntry('object', objectName);
                if (entry) {
                    const config = entry.content as any;
                    config.data = data; 
                } else {
                    const availableObjects = Array.from((ctx.registry as any).store.get('object')?.keys() || []).join(', ') || 'none';
                    console.warn(`Found data for unknown object '${objectName}' in ${ctx.file}`);
                    console.warn(`Ensure the corresponding ${objectName}.object.yml file exists. Available objects: ${availableObjects}`);
                }
            } catch (e) {
                console.error(`Error loading data from ${ctx.file}: ${e instanceof Error ? e.message : String(e)}`);
                console.error('Expected YAML structure: Array of objects with field values');
            }
        });
    }
}
