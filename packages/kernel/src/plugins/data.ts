import * as yaml from 'js-yaml';
import * as path from 'path';

/**
 * Data Loader Plugin (Legacy)
 * 
 * This plugin is deprecated in favor of the integrated ObjectOSPlugin.
 * It loads seed data files (*.data.yml) and attaches them to corresponding objects.
 * 
 * @deprecated Use ObjectOSPlugin instead, which handles apps, objects, and data in a unified manner.
 * 
 * @see {@link ObjectOSPlugin}
 */
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
