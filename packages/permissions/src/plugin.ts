/**
 * Permissions Plugin for ObjectOS
 * 
 * This plugin provides comprehensive permission and authorization capabilities:
 * - Object-level permissions (CRUD)
 * - Field-level security
 * - Record-level security (RLS)
 * - Profile-based permissions
 * - Declarative YAML configuration
 * 
 * Features:
 * - Load permission sets from YAML files
 * - Check permissions before data operations
 * - Filter fields based on user permissions
 * - Apply record-level filters (RLS)
 * - Permission caching for performance
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
    PermissionPluginConfig,
    PermissionContext,
    PermissionAction,
    PluginHealthReport,
    PluginCapabilityManifest,
    PluginSecurityManifest,
    PluginStartupResult,
} from './types.js';
import { InMemoryPermissionStorage, PermissionStorage } from './storage.js';
import { PermissionEngine } from './engine.js';
import { SharingRuleEngine } from './sharing-rules.js';
import { RLSEvaluator } from './rls-evaluator.js';
import { loadPermissionSetsFromDirectory } from './loader.js';

/**
 * Permissions Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class PermissionsPlugin implements Plugin {
    name = '@objectos/permissions';
    version = '0.1.0';
    dependencies = ['@objectos/audit'];

    private config: PermissionPluginConfig;
    private storage: PermissionStorage;
    private engine: PermissionEngine;
    private sharingEngine: SharingRuleEngine;
    private rlsEvaluator: RLSEvaluator;
    private context?: PluginContext;
    private startedAt?: number;

    constructor(config: PermissionPluginConfig = {}) {
        this.config = {
            enabled: true,
            defaultDeny: true,
            permissionsDir: './permissions',
            cachePermissions: true,
            ...config,
        };

        this.storage = new InMemoryPermissionStorage();
        this.engine = new PermissionEngine(this.storage, {
            defaultDeny: this.config.defaultDeny,
            enableCache: this.config.cachePermissions,
        });
        this.sharingEngine = new SharingRuleEngine();
        this.rlsEvaluator = new RLSEvaluator(this.sharingEngine);
    }

    /**
     * Initialize plugin - Load permission sets, register services, subscribe to events
     */
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;
        this.startedAt = Date.now();

        // Load permission sets from YAML files
        await this.loadPermissionSets();

        // Register permission engine service
        context.registerService('permissions', this);

        // Subscribe to data.* hooks for permission checking
        await this.setupEventListeners(context);

        context.logger.info('[Permissions Plugin] Initialized successfully');
    }

    /**
     * Start plugin - Start the permission engine
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Permissions Plugin] Starting...');
        
        // Permissions plugin is stateless and doesn't need special startup
        // All permission checking is done on-demand via hooks
        
        // Register HTTP routes for Permissions API
        try {
            const httpServer = context.getService('http.server') as any;
            const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
            if (rawApp) {
                // GET /api/v1/permissions/sets - List all permission sets
                rawApp.get('/api/v1/permissions/sets', async (c: any) => {
                    try {
                        const sets = await this.storage.getAllPermissionSets();
                        return c.json({ success: true, data: sets });
                    } catch (error: any) {
                        context.logger.error('[Permissions API] List error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/permissions/sets/:name - Get permission set by name
                rawApp.get('/api/v1/permissions/sets/:name', async (c: any) => {
                    try {
                        const name = c.req.param('name');
                        const set = await this.storage.getPermissionSet(name);
                        if (!set) {
                            return c.json({ success: false, error: 'Permission set not found' }, 404);
                        }
                        return c.json({ success: true, data: set });
                    } catch (error: any) {
                        context.logger.error('[Permissions API] Get error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // GET /api/v1/permissions/object/:objectName - Get permissions for object
                rawApp.get('/api/v1/permissions/object/:objectName', async (c: any) => {
                    try {
                        const objectName = c.req.param('objectName');
                        const set = await this.storage.getPermissionSetForObject(objectName);
                        if (!set) {
                            return c.json({ success: false, error: 'No permissions found for object' }, 404);
                        }
                        return c.json({ success: true, data: set });
                    } catch (error: any) {
                        context.logger.error('[Permissions API] Get object permissions error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // POST /api/v1/permissions/check - Check permission
                rawApp.post('/api/v1/permissions/check', async (c: any) => {
                    try {
                        const body = await c.req.json();
                        const { userId, profileName, roleName, objectName, action, recordId } = body;
                        
                        if (!userId || !profileName || !objectName || !action) {
                            return c.json({ success: false, error: 'Missing required fields' }, 400);
                        }

                        const permissionContext: PermissionContext = {
                            userId,
                            profileName,
                            profiles: body.profiles || (profileName ? [profileName] : []),
                            roleName,
                            permissionSetNames: body.permissionSetNames || [],
                        };

                        const hasPermission = await this.engine.checkPermission(
                            permissionContext,
                            objectName,
                            action as any
                        );

                        return c.json({ success: true, data: { hasPermission } });
                    } catch (error: any) {
                        context.logger.error('[Permissions API] Check error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                context.logger.info('[Permissions Plugin] HTTP routes registered');
            }
        } catch (e: any) {
            context.logger.warn(`[Permissions Plugin] Could not register HTTP routes: ${e?.message}`);
        }
        
        context.logger.info('[Permissions Plugin] Started successfully');
    }

    /**
     * Load permission sets from YAML files
     */
    private async loadPermissionSets(): Promise<void> {
        if (!this.config.permissionsDir) {
            this.context?.logger.warn('[Permissions Plugin] No permissions directory configured');
            return;
        }

        try {
            const permissionSets = await loadPermissionSetsFromDirectory(this.config.permissionsDir);
            
            for (const permissionSet of permissionSets) {
                await this.storage.storePermissionSet(permissionSet);
                this.context?.logger.info(
                    `[Permissions Plugin] Loaded permission set: ${permissionSet.name} for object: ${permissionSet.objectName}`
                );
            }

            this.context?.logger.info(
                `[Permissions Plugin] Loaded ${permissionSets.length} permission set(s)`
            );
        } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            this.context?.logger.error('[Permissions Plugin] Error loading permission sets:', errorObj);
        }
    }

    /**
     * Set up event listeners for permission enforcement using kernel hooks
     */
    private async setupEventListeners(context: PluginContext): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        // Hook into data operations for permission checking (PRE-Operation)
        context.hook('data.beforeCreate', async (data: any) => {
            await this.checkDataPermission(data, 'create');
        });

        context.hook('data.beforeUpdate', async (data: any) => {
            await this.checkDataPermission(data, 'update');
        });

        context.hook('data.beforeDelete', async (data: any) => {
            await this.checkDataPermission(data, 'delete');
        });

        context.hook('data.beforeFind', async (data: any) => {
            await this.applyRecordLevelSecurity(data);
        });

        this.context?.logger.info('[Permissions Plugin] Event listeners registered');
    }

    /**
     * Check permission for a data operation
     */
    private async checkDataPermission(data: any, action: PermissionAction): Promise<void> {
        const { objectName, userId, userProfiles } = data;

        if (!userId) {
            // No user context, skip permission check
            return;
        }

        const permissionContext: PermissionContext = {
            userId,
            profiles: userProfiles || [],
            metadata: data.metadata,
        };

        const result = await this.engine.checkPermission(
            permissionContext,
            objectName,
            action
        );

        if (!result.allowed) {
            const error = new Error(result.reason || `Permission denied for ${action} on ${objectName}`);
            (error as any).code = 'PERMISSION_DENIED';
            (error as any).statusCode = 403;
            throw error;
        }

        // If there are filters, attach them to the data
        if (result.filters) {
            data.recordFilters = result.filters;
        }
    }

    /**
     * Apply record-level security filters
     */
    private async applyRecordLevelSecurity(data: any): Promise<void> {
        const { objectName, userId, userProfiles } = data;

        if (!userId) {
            // No user context, skip RLS
            return;
        }

        const permissionContext: PermissionContext = {
            userId,
            profiles: userProfiles || [],
            metadata: data.metadata,
        };

        // Get record-level filters
        const filters = await this.engine.getRecordFilters(permissionContext, objectName);

        // Merge with existing query filters
        if (Object.keys(filters).length > 0) {
            data.filters = { ...data.filters, ...filters };
        }
    }

    /**
     * Get the permission engine for direct API access
     */
    getEngine(): PermissionEngine {
        return this.engine;
    }

    /**
     * Get the permission storage
     */
    getStorage(): PermissionStorage {
        return this.storage;
    }

    /**
     * Get the sharing rule engine
     */
    getSharingEngine(): SharingRuleEngine {
        return this.sharingEngine;
    }

    /**
     * Get the RLS evaluator
     */
    getRLSEvaluator(): RLSEvaluator {
        return this.rlsEvaluator;
    }

    /**
     * Reload permission sets from disk
     */
    async reloadPermissions(): Promise<void> {
        await this.storage.clear();
        this.engine.clearCache();
        await this.loadPermissionSets();
        this.context?.logger.info('[Permissions Plugin] Permissions reloaded');
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<PluginHealthReport> {
        const status = this.config.enabled ? 'healthy' : 'degraded';
        const message = this.config.enabled ? 'Permission engine active' : 'Permissions disabled';
        return {
            status,
            timestamp: new Date().toISOString(),
            message,
            metrics: {
                uptime: this.startedAt ? Date.now() - this.startedAt : 0,
            },
            checks: [{ name: 'permissions-engine', status: status === 'healthy' ? 'passed' : 'warning', message }],
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: {},
            security: {
                pluginId: 'permissions',
                trustLevel: 'trusted',
                permissions: { permissions: [], defaultGrant: 'deny' },
                sandbox: { enabled: false, level: 'none' },
            },
        };
    }

    /**
     * Startup result
     */
    getStartupResult(): PluginStartupResult {
        return { plugin: { name: this.name, version: this.version }, success: !!this.context, duration: 0 };
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        this.engine.clearCache();
        this.sharingEngine.clear();
        this.rlsEvaluator.clear();
        await this.storage.clear();
        this.context?.logger.info('[Permissions Plugin] Destroyed');
    }
}

/**
 * Helper function to access the permissions API from kernel
 */
export function getPermissionsAPI(kernel: any): PermissionsPlugin | null {
    try {
        return kernel.getService('permissions');
    } catch {
        return null;
    }
}

/**
 * Create a permissions plugin instance with default configuration
 */
export function createPermissionsPlugin(config?: PermissionPluginConfig): PermissionsPlugin {
    return new PermissionsPlugin(config);
}
