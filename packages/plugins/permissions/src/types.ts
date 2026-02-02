/**
 * Permission System Types
 * 
 * Type definitions for the permission and authorization system
 */

/**
 * CRUD permission actions
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

/**
 * Permission level for an action
 */
export interface ActionPermission {
    /** Whether the action is allowed */
    allowed: boolean;
    /** Condition for the permission (e.g., "owner_only") */
    condition?: string;
}

/**
 * Object-level permissions for a profile/role
 */
export interface ObjectPermissions {
    /** Object name */
    objectName: string;
    /** Allow read */
    allowRead?: boolean;
    /** Allow create */
    allowCreate?: boolean;
    /** Allow edit/update */
    allowEdit?: boolean;
    /** Allow delete */
    allowDelete?: boolean;
    /** Custom view filters */
    viewFilters?: Record<string, any>;
}

/**
 * Field-level permissions
 */
export interface FieldPermission {
    /** Field name */
    fieldName: string;
    /** Profiles that can view this field */
    visibleTo?: string[];
    /** Profiles that can edit this field */
    editableBy?: string[];
}

/**
 * Permission set definition
 */
export interface PermissionSet {
    /** Unique permission set name */
    name: string;
    /** Display label */
    label?: string;
    /** Description */
    description?: string;
    /** Object this permission set applies to */
    objectName: string;
    /** Profile-based permissions */
    profiles?: Record<string, ObjectPermissions>;
    /** Field-level permissions */
    fieldPermissions?: Record<string, FieldPermission>;
}

/**
 * User permission context
 */
export interface PermissionContext {
    /** User ID */
    userId: string;
    /** User profiles/roles */
    profiles: string[];
    /** Additional context (e.g., team, department) */
    metadata?: Record<string, any>;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
    /** Whether permission is granted */
    allowed: boolean;
    /** Reason if denied */
    reason?: string;
    /** Applied filters (for RLS) */
    filters?: Record<string, any>;
}

/**
 * Permission plugin configuration
 */
export interface PermissionPluginConfig {
    /** Whether permission checking is enabled */
    enabled?: boolean;
    /** Default deny if no permission found */
    defaultDeny?: boolean;
    /** Permission sets directory */
    permissionsDir?: string;
    /** Cache permission sets */
    cachePermissions?: boolean;
}
