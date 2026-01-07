import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import * as glob from 'fast-glob';
import { ObjectQLConfig, ObjectConfig } from './types';

export function loadObjectConfigs(dir: string): Record<string, ObjectConfig> {
    const configs: Record<string, ObjectConfig> = {};
    
    // 1. Load YAML Configs
    const files = glob.sync(['**/*.object.yml', '**/*.object.yaml'], {
        cwd: dir,
        absolute: true
    });

    for (const file of files) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const doc = yaml.load(content) as any;
            
            if (doc.name && doc.fields) {
                configs[doc.name] = doc as ObjectConfig;
            } else {
                for (const [key, value] of Object.entries(doc)) {
                    if (typeof value === 'object' && (value as any).fields) {
                         configs[key] = value as ObjectConfig;
                         if (!configs[key].name) configs[key].name = key;
                    }
                }
            }
        } catch (e) {
            console.error(`Error loading object config from ${file}:`, e);
        }
    }

    // 2. Load Hooks (.hook.js, .hook.ts)
    // We only load .js if running in node, or .ts if ts-node/register is present.
    // simpler: look for both, require will handle extension resolution if we are careful.
    // Actually, in `dist` we only find .js. In `src` (test) we find .ts.
    const hookFiles = glob.sync(['**/*.hook.{js,ts}'], {
        cwd: dir,
        absolute: true
    });

    for (const file of hookFiles) {
        try {
            // Check if we should ignore .ts if .js exists? 
            // Or assume env handles it.
            // If we are in `dist`, `src` shouldn't be there usually.
            
            const hookModule = require(file);
            // Default export or named exports?
            // Convention: export const listenTo = 'objectName';
            // or filename based: 'project.hook.js' -> 'project' (flaky)
            
            let objectName = hookModule.listenTo;
            
            if (!objectName) {
                // Try to guess from filename? 
                // project.hook.ts -> project
                const basename = path.basename(file);
                const match = basename.match(/^(.+)\.hook\.(ts|js)$/);
                if (match) {
                    objectName = match[1];
                }
            }

            if (objectName && configs[objectName]) {
                 if (!configs[objectName].listeners) {
                     configs[objectName].listeners = {};
                 }
                 const listeners = configs[objectName].listeners!;
                 
                 // Merge exported functions into listeners
                 // Common hooks: beforeFind, afterFind, beforeCreate, etc.
                 const hookNames = [
                     'beforeFind', 'afterFind',
                     'beforeCreate', 'afterCreate',
                     'beforeUpdate', 'afterUpdate',
                     'beforeDelete', 'afterDelete'
                 ];

                 for (const name of hookNames) {
                     if (typeof hookModule[name] === 'function') {
                         listeners[name as keyof typeof listeners] = hookModule[name];
                     }
                 }
                 // Support default export having listeners object?
                 if (hookModule.default && typeof hookModule.default === 'object') {
                      Object.assign(listeners, hookModule.default);
                 }

                 // Load Actions
                 // Convention: export const actions = { myAction: (ctx, params) => ... }
                 // OR export function myAction(ctx, params) ... (Ambiguous with hooks? No, hooks have explicit names)
                 // Safer: look for `actions` export.
                 
                 if (hookModule.actions && typeof hookModule.actions === 'object') {
                     if (!configs[objectName].actions) {
                         configs[objectName].actions = {};
                     }
                     
                     for (const [actionName, handler] of Object.entries(hookModule.actions)) {
                         // We might have metadata from YAML already
                         if (!configs[objectName].actions![actionName]) {
                             configs[objectName].actions![actionName] = { };
                         }
                         // Attach handler
                         configs[objectName].actions![actionName].handler = handler as any;
                     }
                 }
            }
        } catch (e) {
            console.error(`Error loading hook from ${file}:`, e);
        }
    }

    // 3. Load Data (.data.yml, .data.yaml)
    const dataFiles = glob.sync(['**/*.data.yml', '**/*.data.yaml'], {
        cwd: dir,
        absolute: true
    });

    for (const file of dataFiles) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const data = yaml.load(content);

            if (!Array.isArray(data)) {
                console.warn(`Data file ${file} does not contain an array. Skipping.`);
                continue;
            }

            // Guess object name from filename
            // project.data.yml -> project
            const basename = path.basename(file);
            const objectName = basename.replace(/\.data\.ya?ml$/, '');

            if (configs[objectName]) {
                configs[objectName].data = data;
            } else {
                // Maybe the object config hasn't been found yet? 
                // loadObjectConfigs runs glob for objects first, so configs should be populated.
                console.warn(`Found data for unknown object '${objectName}' in ${file}`);
            }

        } catch (e) {
            console.error(`Error loading data from ${file}:`, e);
        }
    }

    // 4. Load Actions (.action.js, .action.ts)
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
                if (match) {
                    objectName = match[1];
                }
            }

            if (objectName && configs[objectName]) {
                 if (!configs[objectName].actions) {
                     configs[objectName].actions = {};
                 }
                 
                 // Treat all exported functions as actions
                 for (const [key, value] of Object.entries(actionModule)) {
                     if (key === 'listenTo') continue;
                     if (typeof value === 'function') {
                         if (!configs[objectName].actions![key]) {
                             configs[objectName].actions![key] = {};
                         }
                         configs[objectName].actions![key].handler = value as any;
                     }
                 }
            }
        } catch (e) {
            console.error(`Error loading action from ${file}:`, e);
        }
    }
    
    return configs;
}

