import * as yaml from 'js-yaml';
import * as path from 'path';

export const DataPlugin = {
    name: 'objectos-data-loader',
    setup(app: any) {
        app.addLoader({
            name: 'data',
            glob: ['**/*.data.yml', '**/*.data.yaml'],
            handler: (ctx: any) => {
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
