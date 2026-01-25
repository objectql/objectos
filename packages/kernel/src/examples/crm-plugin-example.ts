/**
 * Complete Example: Building a Spec-Compliant CRM Plugin
 */

import { ObjectOS } from '../objectos';
import type { ObjectStackManifest, PluginDefinition } from '@objectstack/spec/kernel';

export const CRMManifest: ObjectStackManifest = {
    id: 'com.example.crm',
    version: '1.0.0',
    type: 'plugin',
    name: 'Example CRM Plugin',
    description: 'A complete CRM plugin demonstrating spec compliance',
    permissions: ['system.user.read', 'system.data.write'],
    definitions: {
        objects: {
            crm_lead: {
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
                },
            },
        },
    },
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
