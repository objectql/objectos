/**
 * Complete Example: Building a Spec-Compliant CRM Plugin
 */

import { ObjectOS } from '../objectos';
import type { ObjectStackManifest, PluginDefinition } from '@objectstack/spec/system';

export const CRMManifest: ObjectStackManifest = {
    id: 'com.example.crm',
    version: '1.0.0',
    type: 'plugin',
    name: 'Example CRM Plugin',
    description: 'A complete CRM plugin demonstrating spec compliance',
    permissions: ['system.user.read', 'system.data.write'],
    // In v0.4.1, objects are defined via glob patterns pointing to object definition files
    objects: ['./objects/*.object.yml'],
    // Contribution points for extending the platform
    contributes: {
        // Register custom actions that can be invoked by flows or API
        actions: [
            {
                name: 'convertLead',
                label: 'Convert Lead to Account',
                description: 'Converts a lead to an account and contact',
            }
        ],
        // Register custom events that this plugin listens to
        events: ['lead.created', 'lead.converted'],
    }
};

export const CRMPlugin: PluginDefinition = {
    async onInstall(context) {
        context.logger.info('CRM Plugin: Installing...');
        await context.storage.set('install_date', new Date().toISOString());
    },

    async onEnable(context) {
        context.logger.info('CRM Plugin: Enabling...');
        context.app.router.post('/api/crm/leads/:id/convert', async (req: any, res: any) => {
            return res.json({ success: true });
        });
    },

    async onDisable(context) {
        context.logger.info('CRM Plugin: Disabling...');
    },

    async onUninstall(context) {
        context.logger.info('CRM Plugin: Uninstalling...');
    },
};
