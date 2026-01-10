import * as yaml from 'js-yaml';

export const AppPlugin = {
    name: 'objectos-app-loader',
    setup(app: any) {
        app.addLoader({
            name: 'app',
            glob: ['**/*.app.yml', '**/*.app.yaml'],
            handler: (ctx: any) => {
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
    }
}
