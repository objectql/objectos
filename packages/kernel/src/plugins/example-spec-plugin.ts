/**
 * Example Plugin Using @objectstack/spec Protocol
 * 
 * This demonstrates how to create a plugin that conforms to the
 * ObjectStack specification for plugin lifecycle and context.
 */

import type { PluginDefinition, PluginContextData, ObjectStackManifest } from '@objectstack/spec/kernel';

/**
 * Plugin Manifest
 * Conforms to @objectstack/spec/kernel/ManifestSchema
 * 
 * This is typically stored in a package.json or manifest.json file
 * and loaded by the kernel. For this example, we define it inline.
 */
export const ExampleCRMManifest: ObjectStackManifest = {
    id: 'com.example.crm',
    version: '1.0.0',
    type: 'plugin',
    name: 'Example CRM Plugin',
    description: 'Demonstrates ObjectStack spec-compliant plugin development',
    permissions: [
        'system.user.read',
        'system.data.write',
    ],
    // Object files can be specified as glob patterns
    objects: ['./objects/*.object.yml'],
    // Or provided inline as compiled definitions
    definitions: {
        objects: {
            'crm_lead': {
                name: 'crm_lead',
                label: 'Lead',
                pluralLabel: 'Leads',
                description: 'Sales lead tracking',
                icon: 'user-plus',
                active: true,
                isSystem: false,
                abstract: false,
                datasource: 'default',
                fields: {
                    name: {
                        type: 'text',
                        label: 'Lead Name',
                        required: true,
                        searchable: true,
                        multiple: false,
                        unique: false,
                        deleteBehavior: 'set_null',
                        hidden: false,
                        readonly: false,
                        encryption: false,
                        index: false,
                        externalId: false,
                    },
                    email: {
                        type: 'email',
                        label: 'Email',
                        required: true,
                        searchable: true,
                        unique: true,
                        multiple: false,
                        deleteBehavior: 'set_null',
                        hidden: false,
                        readonly: false,
                        encryption: false,
                        index: true,
                        externalId: false,
                    },
                    status: {
                        type: 'select',
                        label: 'Status',
                        required: true,
                        searchable: true,
                        multiple: false,
                        unique: false,
                        deleteBehavior: 'set_null',
                        hidden: false,
                        readonly: false,
                        encryption: false,
                        index: false,
                        externalId: false,
                        options: [
                            { label: 'New', value: 'new', default: true },
                            { label: 'Contacted', value: 'contacted' },
                            { label: 'Qualified', value: 'qualified' },
                            { label: 'Converted', value: 'converted' },
                            { label: 'Lost', value: 'lost' },
                        ],
                    },
                },
            },
        },
    },
};

/**
 * Example CRM Plugin
 * 
 * This plugin demonstrates:
 * - Plugin lifecycle hooks (onInstall, onEnable, onLoad, onDisable, onUninstall)
 * - Using the plugin context (ql, os, logger, storage, etc.)
 * - Registering routes and scheduled jobs
 * 
 * Conforms to @objectstack/spec/kernel/PluginLifecycleSchema
 */
export const ExampleCRMPlugin: PluginDefinition = {

    /**
     * Called when the plugin is first installed
     */
    async onInstall(context: PluginContextData) {
        context.logger.info('CRM Plugin: Installing...');
        
        // Create initial data or setup
        await context.storage.set('install_date', new Date().toISOString());
        
        context.logger.info('CRM Plugin: Installation complete');
    },

    /**
     * Called when the plugin is enabled
     */
    async onEnable(context: PluginContextData) {
        context.logger.info('CRM Plugin: Enabling...');
        
        // The metadata from ExampleCRMManifest.definitions is loaded by the kernel
        // before this hook is called
        
        // Register custom routes
        context.app.router.post('/api/crm/leads/convert', async (req: any, res: any) => {
            try {
                const { leadId } = req.body;
                
                // Use ObjectQL to query data
                const lead = await context.ql.query('crm_lead', {
                    filters: { id: leadId },
                });
                
                if (!lead) {
                    return res.status(404).json({ error: 'Lead not found' });
                }
                
                // Update lead status
                await context.ql.object('crm_lead').update(leadId, {
                    status: 'converted',
                    converted_at: new Date(),
                });
                
                context.logger.info(`Lead ${leadId} converted`);
                
                return res.json({ success: true, lead });
            } catch (error) {
                context.logger.error('Error converting lead', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        });
        
        // Register scheduled jobs (if scheduler is available)
        if (context.app.scheduler) {
            context.app.scheduler.schedule(
                'clean-old-leads',
                '0 0 * * 0', // Every Sunday at midnight
                async () => {
                    context.logger.info('Running weekly lead cleanup...');
                    
                    // Find leads older than 90 days with no activity
                    const oldDate = new Date();
                    oldDate.setDate(oldDate.getDate() - 90);
                    
                    // This is just an example - actual cleanup logic would go here
                    context.logger.info('Lead cleanup completed');
                }
            );
        }
        
        context.logger.info('CRM Plugin: Enabled');
    },

    /**
     * Called when the plugin is disabled
     */
    async onDisable(context: PluginContextData) {
        context.logger.info('CRM Plugin: Disabling...');
        
        // Cleanup any runtime state
        await context.storage.set('last_disabled', new Date().toISOString());
        
        context.logger.info('CRM Plugin: Disabled');
    },

    /**
     * Called when the plugin is uninstalled
     */
    async onUninstall(context: PluginContextData) {
        context.logger.info('CRM Plugin: Uninstalling...');
        
        // Cleanup data and storage
        await context.storage.delete('install_date');
        await context.storage.delete('last_disabled');
        
        // Note: Object data is NOT automatically deleted
        // The administrator should handle data migration
        
        context.logger.warn('CRM Plugin: Uninstalled - Lead data preserved');
    },
};

/**
 * Usage Example:
 * 
 * ```typescript
 * import { ObjectOS } from '@objectos/kernel';
 * import { ExampleCRMPlugin, ExampleCRMManifest } from './plugins/example-spec-plugin';
 * 
 * // The manifest is typically loaded from package.json or manifest.json
 * // For this example, we use the exported manifest
 * 
 * const os = new ObjectOS({
 *   plugins: [ExampleCRMPlugin],
 *   // The kernel would load manifests separately and associate them with plugins
 *   // ... other config
 * });
 * 
 * await os.init();
 * ```
 * 
 * ## Plugin Architecture Notes
 * 
 * In the ObjectStack spec, plugins are separated into two parts:
 * 
 * 1. **Manifest** (@objectstack/spec/kernel/ManifestSchema)
 *    - Static configuration (id, version, name, permissions)
 *    - Object definitions and metadata
 *    - Typically stored in package.json or manifest.json
 * 
 * 2. **Lifecycle Hooks** (@objectstack/spec/kernel/PluginLifecycleSchema)
 *    - Runtime behavior (onInstall, onEnable, onLoad, etc.)
 *    - Executable code
 *    - Typically exported from index.ts or main.js
 * 
 * The kernel loads manifests first to understand what plugins are available,
 * then executes lifecycle hooks at appropriate times.
 */
