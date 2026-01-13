import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'fast-glob';
import { ObjectQLPlugin, IObjectQL } from '@objectql/types';
import { mergeObjectConfig } from '../utils/merge';

async function loadFiles(app: IObjectQL, patterns: string[], handler: (ctx: any) => void, extraRoots: string[] = []) {
    const config = (app as any).config || {};
    const configSources: string[] = config.source ? (Array.isArray(config.source) ? config.source : [config.source]) : ['.'];
    // Merge config sources with extra roots (presets)
    // Note: path.resolve handles absolute paths (extraRoots) correctly by ignoring cwd
    const sources = [...configSources, ...extraRoots];
    
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
                    // Try to infer package name from path if it's inside node_modules
                    packageName: source.includes('node_modules') ? path.basename(source) : undefined
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
        
        // Resolve Presets to get their paths
        const config = (app as any).config || {};
        const presets = config.presets || config.packages || [];
        const presetRoots: string[] = [];
        
        for (const preset of presets) {
            try {
                // Try to resolve package.json to get root, or entry point and get dirname
                let entryPath;
                try {
                    // Try standard resolution
                    entryPath = require.resolve(`${preset}/package.json`);
                    presetRoots.push(path.dirname(entryPath));
                    console.log(`[ObjectOS] Resolved preset '${preset}' at ${path.dirname(entryPath)}`);
                } catch {
                     try {
                        entryPath = require.resolve(preset);
                        presetRoots.push(path.dirname(entryPath));
                        console.log(`[ObjectOS] Resolved preset '${preset}' entry at ${path.dirname(entryPath)}`);
                     } catch {
                        // Try resolving from process.cwd() (Project Root/Server Root)
                        entryPath = require.resolve(preset, { paths: [process.cwd()] });
                        // If it points to index.js, use dirname
                        presetRoots.push(path.dirname(entryPath));
                        console.log(`[ObjectOS] Resolved preset '${preset}' from cwd at ${path.dirname(entryPath)}`);
                     }
                }
            } catch (e) {
                console.warn(`[ObjectOS] Could not resolve preset '${preset}'. Make sure it is installed.`);
            }
        }

        // Objects
        await loadFiles(app, ['**/*.object.yml', '**/*.object.yaml'], (ctx) => {
             try {
                const doc = yaml.load(ctx.content) as any;
                const name = doc.name;
                if (name) {
                    // Check if object already exists - if so, merge instead of replacing
                    const existing = ctx.registry.getEntry('object', name);
                    
                    if (existing) {
                        // Merge new definition with existing
                        const mergedContent = mergeObjectConfig(existing.content, doc);
                        ctx.registry.register('object', {
                            type: 'object',
                            id: name,
                            path: ctx.file,
                            package: ctx.packageName,
                            content: mergedContent
                        });
                    } else {
                        // Register new object
                        ctx.registry.register('object', {
                            type: 'object',
                            id: name,
                            path: ctx.file,
                            package: ctx.packageName,
                            content: doc
                        });
                    }
                }
            } catch (e) {
                    console.error(`Error loading object from ${ctx.file}: ${e instanceof Error ? e.message : String(e)}`);
            }
        }, presetRoots);

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
        }, presetRoots);

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
