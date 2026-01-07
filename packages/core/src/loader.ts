import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as glob from 'fast-glob';
import { MetadataRegistry } from './registry';
import { ObjectConfig } from './types';

export class MetadataLoader {
    constructor(private registry: MetadataRegistry) {}

    load(dir: string, packageName?: string) {
        this.loadObjects(dir, packageName);
        this.loadApps(dir, packageName);
        
        this.loadHooks(dir);
        this.loadActions(dir);
        this.loadData(dir);
    }

    private loadObjects(dir: string, packageName?: string) {
        const files = glob.sync(['**/*.object.yml', '**/*.object.yaml'], {
            cwd: dir,
            absolute: true
        });

        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const doc = yaml.load(content) as any;
                if (!doc) continue;

                if (doc.name && doc.fields) {
                    this.registerObject(doc, file, packageName);
                } else {
                    for (const [key, value] of Object.entries(doc)) {
                        if (typeof value === 'object' && (value as any).fields) {
                            const obj = value as any;
                            if (!obj.name) obj.name = key;
                            this.registerObject(obj, file, packageName);
                        }
                    }
                }
            } catch (e) {
                console.error(`Error loading object from ${file}:`, e);
            }
        }
    }

    private registerObject(obj: any, file: string, packageName?: string) {
        // Normalize fields
        if (obj.fields) {
            for (const [key, field] of Object.entries(obj.fields)) {
                if (typeof field === 'object' && field !== null) {
                    if (!(field as any).name) {
                        (field as any).name = key;
                    }
                }
            }
        }

        this.registry.register('object', {
            type: 'object',
            id: obj.name,
            path: file,
            package: packageName,
            content: obj
        });
    }

    private loadApps(dir: string, packageName?: string) {
        const files = glob.sync(['**/*.app.yml', '**/*.app.yaml'], {
            cwd: dir,
            absolute: true
        });
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const doc = yaml.load(content) as any;
                const id = doc.id || doc.name;
                if (id) {
                    this.registry.register('app', {
                        type: 'app',
                        id: id,
                        path: file,
                        package: packageName,
                        content: doc
                    });
                }
            } catch (e) {
                 console.error(`Error loading app from ${file}:`, e);
            }
        }
    }

    private loadHooks(dir: string) {
        const hookFiles = glob.sync(['**/*.hook.{js,ts}'], {
            cwd: dir,
            absolute: true
        });

        for (const file of hookFiles) {
            try {
                const hookModule = require(file);
                let objectName = hookModule.listenTo;
                
                if (!objectName) {
                    const basename = path.basename(file);
                    const match = basename.match(/^(.+)\.hook\.(ts|js)$/);
                    if (match) objectName = match[1];
                }

                if (objectName) {
                    const entry = this.registry.getEntry('object', objectName);
                    if (entry) {
                         const config = entry.content as ObjectConfig;
                         if (!config.listeners) config.listeners = {};
                         
                         const hookNames = [
                             'beforeFind', 'afterFind',
                             'beforeCreate', 'afterCreate',
                             'beforeUpdate', 'afterUpdate',
                             'beforeDelete', 'afterDelete'
                         ];

                         for (const name of hookNames) {
                             if (typeof hookModule[name] === 'function') {
                                 config.listeners[name as keyof typeof config.listeners] = hookModule[name];
                             }
                         }
                         if (hookModule.default && typeof hookModule.default === 'object') {
                              Object.assign(config.listeners, hookModule.default);
                         }

                         if (hookModule.actions && typeof hookModule.actions === 'object') {
                             if (!config.actions) config.actions = {};
                             for (const [actionName, handler] of Object.entries(hookModule.actions)) {
                                 if (!config.actions[actionName]) config.actions[actionName] = {};
                                 config.actions[actionName].handler = handler as any;
                             }
                         }
                    }
                }
            } catch (e) {
                console.error(`Error loading hook from ${file}:`, e);
            }
        }
    }

    private loadActions(dir: string) {
        const actionFiles = glob.sync(['**/*.action.{js,ts}'], {
            cwd: dir,
            absolute: true
        });

        for (const file of actionFiles) {
            try {
                const actionModule = require(file);
                let objectName = actionModule.listenTo;
                
                if (!objectName) {
                    const basename = path.basename(file);
                    const match = basename.match(/^(.+)\.action\.(ts|js)$/);
                    if (match) objectName = match[1];
                }

                if (objectName) {
                    const entry = this.registry.getEntry('object', objectName);
                    if (entry) {
                         const config = entry.content as ObjectConfig;
                         if (!config.actions) config.actions = {};
                         
                         for (const [key, value] of Object.entries(actionModule)) {
                             if (key === 'listenTo') continue;
                             if (typeof value === 'function') {
                                 if (!config.actions[key]) config.actions[key] = {};
                                 config.actions[key].handler = value as any;
                             }
                         }
                    }
                }
            } catch (e) {
                console.error(`Error loading action from ${file}:`, e);
            }
        }
    }

    private loadData(dir: string) {
        const dataFiles = glob.sync(['**/*.data.yml', '**/*.data.yaml'], {
            cwd: dir,
            absolute: true
        });

        for (const file of dataFiles) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const data = yaml.load(content);
                if (!Array.isArray(data)) continue;

                const basename = path.basename(file);
                const objectName = basename.replace(/\.data\.ya?ml$/, '');
                
                const entry = this.registry.getEntry('object', objectName);
                if (entry) {
                    const config = entry.content as ObjectConfig;
                    config.data = data;
                } else {
                    console.warn(`Found data for unknown object '${objectName}' in ${file}`);
                }
            } catch (e) {
                console.error(`Error loading data from ${file}:`, e);
            }
        }
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

