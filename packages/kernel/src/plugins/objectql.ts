import * as yaml from 'js-yaml';
import * as path from 'path';
import { ObjectQLPlugin, IObjectQL } from '@objectql/types';

export const ObjectOSPlugin: ObjectQLPlugin = {
    name: 'objectos-core',
    setup(app: IObjectQL) {
        // Apps
        app.addLoader({
            name: 'app',
            glob: ['**/*.app.yml', '**/*.app.yaml'],
            handler: (ctx) => {
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
                     console.error(`Error loading app from ${ctx.file}:`, e);
                }
            }
        });

        // Data
        app.addLoader({
            name: 'data',
            glob: ['**/*.data.yml', '**/*.data.yaml'],
            handler: (ctx) => {
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
                        console.warn(`Found data for unknown object '${objectName}' in ${ctx.file}`);
                    }
                } catch (e) {
                    console.error(`Error loading data from ${ctx.file}:`, e);
                }
            }
        });
    }
}
