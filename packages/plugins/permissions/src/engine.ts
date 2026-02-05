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
        const collectedFilters: Array<Record<string, any>> = [];
        let hasFullAccess = false; // If true, means at least one profile gives access without filters

        for (const profile of context.profiles) {
            const profilePermissions = permissionSet.profiles?.[profile];
            
            if (!profilePermissions) {
                continue;
            }

            // Check the specific action permission
            const actionAllowed = this.checkActionPermission(profilePermissions, action);
            
            if (actionAllowed) {
                allowed = true;
                
                // Collect view filters for record-level security
                if (profilePermissions.viewFilters && Object.keys(profilePermissions.viewFilters).length > 0) {
                    collectedFilters.push(profilePermissions.viewFilters);
                } else {
                    // One of the profiles allows action without restrictions
                    hasFullAccess = true;
                }
            }
        }

        // Determine final filters
        let finalFilters: Record<string, any> | undefined;

        if (allowed) {
            if (hasFullAccess) {
                // If any profile grants full access, we don't apply any filters
                finalFilters = undefined;
            } else if (collectedFilters.length > 0) {
                if (collectedFilters.length === 1) {
                    finalFilters = collectedFilters[0];
                } else {
                    // Combine multiple profiles filters with OR
                    finalFilters = { $or: collectedFilters };
                }
            }
        }

        const result: PermissionCheckResult = {
            allowed,
            reason: allowed ? undefined : `No permission for action '${action}' on object '${objectName}'`,
            filters: finalFilters,
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

        const collectedFilters: Array<Record<string, any>> = [];
        let hasFullAccess = false;

        // Collect filters from all profiles
        for (const profile of context.profiles) {
            const profilePermissions = permissionSet.profiles?.[profile];
            
            // Check if profile has read permission (assumption: getting filters implies reading)
            // Or should we just collect filters if they exist regardless of base permission? 
            // Usually if you don't have read access, filters don't matter.
            // But this method just returns filters. Let's assume caller checked basic permission.
            
            if (profilePermissions) {
                 if (profilePermissions.viewFilters && Object.keys(profilePermissions.viewFilters).length > 0) {
                    collectedFilters.push(profilePermissions.viewFilters);
                 } else {
                     // If a profile has permissions defined but no viewFilters, 
                     // it usually implies full access for that profile.
                     // But we should verify if 'allowRead' is true?
                     if (profilePermissions.allowRead) {
                         hasFullAccess = true;
                     }
                 }
            }
        }

        let finalFilters: Record<string, any> = {};

        if (!hasFullAccess && collectedFilters.length > 0) {
             if (collectedFilters.length === 1) {
                finalFilters = collectedFilters[0];
            } else {
                finalFilters = { $or: collectedFilters };
            }
        }

        // Replace template variables (e.g., {{ userId }})
        return this.replaceTemplateVariables(finalFilters, context);
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
     * Replace template variables in filters (Recursive)
     */
    private replaceTemplateVariables(
        filters: any,
        context: PermissionContext
    ): any {
        if (!filters) return filters;
        
        // Handle Array
        if (Array.isArray(filters)) {
            return filters.map(item => this.replaceTemplateVariables(item, context));
        }

        // Handle Object
        if (typeof filters === 'object') {
            const result: Record<string, any> = {};
            for (const [key, value] of Object.entries(filters)) {
                result[key] = this.replaceTemplateVariables(value, context);
            }
            return result;
        }

        // Handle String
        if (typeof filters === 'string') {
            let result = filters;
            
            // Replace {{ userId }}
            if (result.includes('{{ userId }}')) {
                 result = result.replace(/\{\{\s*userId\s*\}\}/g, context.userId);
            }

            // Replace {{ profile }} - use the first profile as default context if simpler logic needed
            if (result.includes('{{ profile }}') && context.profiles.length > 0) {
                 result = result.replace(/\{\{\s*profile\s*\}\}/g, context.profiles[0]);
            }
            
            // Replace custom metadata
            if (context.metadata) {
                for (const [metaKey, metaValue] of Object.entries(context.metadata)) {
                    const pattern = new RegExp(`\\{\\{\\s*${metaKey}\\s*\\}\\}`, 'g');
                    if (pattern.test(result)) {
                        result = result.replace(pattern, String(metaValue));
                    }
                }
            }
            return result;
        }

        // Return other primitives as is
        return filters;
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
