import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import glob from 'fast-glob';
import { ObjectQLPlugin, IObjectQL } from '@objectql/types';

/**
 * Loads metadata files from configured sources and preset packages.
 * 
 * This internal helper function:
 * 1. Resolves source directories from config
 * 2. Resolves preset package paths
 * 3. Scans for files matching the patterns
 * 4. Invokes the handler for each found file
 * 
 * @param app - The ObjectQL instance
 * @param patterns - Glob patterns to match files (e.g., '**\/*.object.yml')
 * @param handler - Function to process each matched file
 * @param extraRoots - Additional root directories to scan (typically preset packages)
 * 
 * @internal
 */
async function _loadFiles(app: IObjectQL, patterns: string[], handler: (ctx: any) => void, extraRoots: string[] = []) {
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

/**
 * ObjectOS Core Plugin
 * 
 * The heart of ObjectOS metadata loading system. This plugin automatically:
 * 
 * 1. **Objects**: Scans for `*.object.yml` files and registers business objects
 * 2. **Apps**: Scans for `*.app.yml` files and registers application configurations
 * 3. **Data**: Scans for `*.data.yml` files and attaches seed data to objects
 * 
 * The plugin searches in:
 * - Configured source directories (from `config.source`)
 * - Preset packages (from `config.presets`)
 * 
 * @example
 * File: contacts.object.yml
 * ```yaml
 * name: contacts
 * label: Contact
 * fields:
 *   first_name:
 *     type: text
 *     label: First Name
 *     required: true
 *   email:
 *     type: email
 *     label: Email
 * ```
 * 
 * File: crm.app.yml
 * ```yaml
 * name: crm
 * label: CRM Application
 * menu:
 *   - label: Contacts
 *     type: object
 *     object: contacts
 * ```
 * 
 * File: contacts.data.yml
 * ```yaml
 * - first_name: John
 *   email: john@example.com
 * - first_name: Jane
 *   email: jane@example.com
 * ```
 * 
 * @see {@link https://github.com/objectql/objectql} for ObjectQL protocol specification
 */
export const ObjectOSPlugin: ObjectQLPlugin = {
    name: 'objectos-core',
    async setup(app: IObjectQL) {
        
        // Phase 1: Resolve Preset Package Paths
        // Presets are npm packages containing reusable metadata (e.g., @objectos/preset-base)
        const config = (app as any).config || {};
        const presets = config.presets || config.packages || [];
        const presetRoots: string[] = [];
        
        for (const preset of presets) {
            try {
                // Attempt multiple resolution strategies:
                // 1. Try package.json resolution (standard npm package)
                // 2. Try direct entry point resolution
                // 3. Try resolution from process.cwd() (for local packages)
                let entryPath;
                try {
                    // Strategy 1: Standard npm package with package.json
                    entryPath = require.resolve(`${preset}/package.json`);
                    presetRoots.push(path.dirname(entryPath));
                    console.log(`[ObjectOS] Resolved preset '${preset}' at ${path.dirname(entryPath)}`);
                } catch {
                     try {
                        // Strategy 2: Entry point resolution (for packages without explicit package.json export)
                        entryPath = require.resolve(preset);
                        presetRoots.push(path.dirname(entryPath));
                        console.log(`[ObjectOS] Resolved preset '${preset}' entry at ${path.dirname(entryPath)}`);
                     } catch {
                        // Strategy 3: Resolution from current working directory
                        entryPath = require.resolve(preset, { paths: [process.cwd()] });
                        presetRoots.push(path.dirname(entryPath));
                        console.log(`[ObjectOS] Resolved preset '${preset}' from cwd at ${path.dirname(entryPath)}`);
                     }
                }
            } catch (e) {
                console.warn(`[ObjectOS] Could not resolve preset '${preset}'. Make sure it is installed.`);
            }
        }

        // Phase 2: Load Object Definitions
        // Objects are the core metadata type, defining business entities, fields, and relationships
        await _loadFiles(app, ['**/*.object.yml', '**/*.object.yaml'], (ctx) => {
             try {
                const doc = yaml.load(ctx.content) as any;
                const name = doc.name;
                if (name) {
                    // Register object in metadata registry
                    // The 'object' type is the primary metadata type in ObjectQL
                    // Each object becomes available for CRUD operations and can be referenced by apps
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
        }, presetRoots);

        // Phase 3: Load Application Definitions
        // Apps define navigation menus, branding, and organize objects into cohesive applications
        await _loadFiles(app, ['**/*.app.yml', '**/*.app.yaml'], (ctx) => {
            try {
                const doc = yaml.load(ctx.content) as any;
                // App ID can come from 'code', 'id', or 'name' (legacy support)
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

        // Phase 4: Load Seed Data
        // Data files contain arrays of records to insert into objects
        // Named as <objectname>.data.yml, the data is attached to the corresponding object
        await _loadFiles(app, ['**/*.data.yml', '**/*.data.yaml'], (ctx) => {
            try {
                const content = ctx.content;
                const data = yaml.load(content);
                
                // Data files must contain an array of records
                if (!Array.isArray(data)) return;

                // Extract object name from filename (e.g., contacts.data.yml -> contacts)
                const basename = path.basename(ctx.file);
                const objectName = basename.replace(/\.data\.ya?ml$/, '');
                
                // Attach data to the corresponding object if it exists
                const entry = ctx.registry.getEntry('object', objectName);
                if (entry) {
                    const config = entry.content as any;
                    config.data = data; 
                } else {
                    // Provide helpful error message if object not found
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
