/**
 * Permission Engine
 * 
 * Core permission checking logic for ObjectOS.
 * Handles object-level, field-level, and record-level permissions.
 */

import type {
    PermissionAction,
    PermissionContext,
    PermissionCheckResult,
    PermissionSet,
    ObjectPermissions,
    FieldPermission,
} from './types';
import type { PermissionStorage } from './storage';

/**
 * Permission Engine Configuration
 */
export interface PermissionEngineConfig {
    /** Default deny if no permission found */
    defaultDeny?: boolean;
    /** Enable permission caching */
    enableCache?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
}

/**
 * Cache entry for permissions
 */
interface CacheEntry {
    result: PermissionCheckResult;
    timestamp: number;
}

/**
 * Permission Engine
 * 
 * Provides core permission checking functionality
 */
export class PermissionEngine {
    private storage: PermissionStorage;
    private config: PermissionEngineConfig;
    private cache: Map<string, CacheEntry> = new Map();

    constructor(storage: PermissionStorage, config: PermissionEngineConfig = {}) {
        this.storage = storage;
        this.config = {
            defaultDeny: true,
            enableCache: true,
            cacheTTL: 60000, // 1 minute default
            ...config,
        };
    }

    /**
     * Check if a user has permission to perform an action on an object
     */
    async checkPermission(
        context: PermissionContext,
        objectName: string,
        action: PermissionAction
    ): Promise<PermissionCheckResult> {
        // Check cache first
        const cacheKey = this.getCacheKey(context.userId, objectName, action);
        if (this.config.enableCache) {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                return cached;
            }
        }

        // Get permission set for the object
        const permissionSet = await this.storage.getPermissionSetForObject(objectName);
        
        if (!permissionSet) {
            const result = {
                allowed: !this.config.defaultDeny,
                reason: !this.config.defaultDeny ? 'No permission set defined - default allow' : 'No permission set defined',
            };
            
            this.setCache(cacheKey, result);
            return result;
        }

        // Check permissions for each profile the user has
        let allowed = false;
        let filters: Record<string, any> = {};

        for (const profile of context.profiles) {
            const profilePermissions = permissionSet.profiles?.[profile];
            
            if (!profilePermissions) {
                continue;
            }

            // Check the specific action permission
            const actionAllowed = this.checkActionPermission(profilePermissions, action);
            
            if (actionAllowed) {
                allowed = true;
                
                // Merge view filters for record-level security
                if (profilePermissions.viewFilters) {
                    filters = { ...filters, ...profilePermissions.viewFilters };
                }
                
                // If we found permission, we can stop checking
                // (unless we want to collect all filters)
                break;
            }
        }

        const result: PermissionCheckResult = {
            allowed,
            reason: allowed ? undefined : `No permission for action '${action}' on object '${objectName}'`,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
        };

        this.setCache(cacheKey, result);
        return result;
    }

    /**
     * Check if a user can access a specific field
     */
    async checkFieldPermission(
        context: PermissionContext,
        objectName: string,
        fieldName: string,
        action: 'read' | 'edit'
    ): Promise<boolean> {
        const permissionSet = await this.storage.getPermissionSetForObject(objectName);
        
        if (!permissionSet || !permissionSet.fieldPermissions) {
            return !this.config.defaultDeny;
        }

        const fieldPermission = permissionSet.fieldPermissions[fieldName];
        
        if (!fieldPermission) {
            return !this.config.defaultDeny;
        }

        // Check if any of the user's profiles have the required permission
        for (const profile of context.profiles) {
            if (action === 'read') {
                if (fieldPermission.visibleTo?.includes(profile)) {
                    return true;
                }
            } else if (action === 'edit') {
                if (fieldPermission.editableBy?.includes(profile)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Filter fields based on user permissions
     */
    async filterFields(
        context: PermissionContext,
        objectName: string,
        fields: string[],
        action: 'read' | 'edit'
    ): Promise<string[]> {
        const allowedFields: string[] = [];

        for (const field of fields) {
            const allowed = await this.checkFieldPermission(context, objectName, field, action);
            if (allowed) {
                allowedFields.push(field);
            }
        }

        return allowedFields;
    }

    /**
     * Get record-level filters for a user
     */
    async getRecordFilters(
        context: PermissionContext,
        objectName: string
    ): Promise<Record<string, any>> {
        const permissionSet = await this.storage.getPermissionSetForObject(objectName);
        
        if (!permissionSet) {
            return {};
        }

        let filters: Record<string, any> = {};

        // Collect filters from all profiles
        for (const profile of context.profiles) {
            const profilePermissions = permissionSet.profiles?.[profile];
            
            if (profilePermissions?.viewFilters) {
                filters = { ...filters, ...profilePermissions.viewFilters };
            }
        }

        // Replace template variables (e.g., {{ userId }})
        return this.replaceTemplateVariables(filters, context);
    }

    /**
     * Check if an action is allowed for a profile
     */
    private checkActionPermission(
        permissions: ObjectPermissions,
        action: PermissionAction
    ): boolean {
        switch (action) {
            case 'create':
                return permissions.allowCreate === true;
            case 'read':
                return permissions.allowRead === true;
            case 'update':
                return permissions.allowEdit === true;
            case 'delete':
                return permissions.allowDelete === true;
            default:
                return false;
        }
    }

    /**
     * Replace template variables in filters
     */
    private replaceTemplateVariables(
        filters: Record<string, any>,
        context: PermissionContext
    ): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(filters)) {
            if (typeof value === 'string') {
                // Replace {{ userId }}
                result[key] = value.replace('{{ userId }}', context.userId);
                // Replace {{ profile }}
                if (context.profiles.length > 0) {
                    result[key] = result[key].replace('{{ profile }}', context.profiles[0]);
                }
                // Replace custom metadata
                if (context.metadata) {
                    for (const [metaKey, metaValue] of Object.entries(context.metadata)) {
                        result[key] = result[key].replace(`{{ ${metaKey} }}`, String(metaValue));
                    }
                }
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Generate cache key
     */
    private getCacheKey(userId: string, objectName: string, action: PermissionAction): string {
        return `${userId}:${objectName}:${action}`;
    }

    /**
     * Get from cache
     */
    private getFromCache(key: string): PermissionCheckResult | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        const now = Date.now();
        const ttl = this.config.cacheTTL || 60000;
        
        if (now - entry.timestamp > ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.result;
    }

    /**
     * Set cache
     */
    private setCache(key: string, result: PermissionCheckResult): void {
        if (this.config.enableCache) {
            this.cache.set(key, {
                result,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Clear cache for a specific user
     */
    clearUserCache(userId: string): void {
        const keysToDelete: string[] = [];
        
        for (const key of this.cache.keys()) {
            if (key.startsWith(`${userId}:`)) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
    }
}
