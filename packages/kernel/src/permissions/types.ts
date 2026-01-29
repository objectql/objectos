/**
 * Permission System Type Definitions
 * 
 * Provides type definitions and interfaces for the ObjectOS permission system.
 */

// Re-export permission types from @objectstack/spec
import { Permission } from '@objectstack/spec';

export type PermissionSet = Permission.PermissionSet;
export type ObjectPermission = Permission.ObjectPermission;
export type FieldPermission = Permission.FieldPermission;

/**
 * User interface with permission context
 */
export interface User {
    /** User ID */
    id: string;
    /** Username */
    username?: string;
    /** User's assigned permission sets */
    permissionSets?: string[];
    /** User's profile (primary permission set) */
    profile?: string;
    /** User's role (for hierarchy-based access) */
    role?: string;
    /** Additional user properties */
    [key: string]: any;
}

/**
 * Permission check context
 * 
 * @remarks
 * This interface is reserved for future use in structured permission checking APIs.
 * Currently, permission methods use direct parameters.
 */
export interface PermissionContext {
    /** Current user */
    user: User;
    /** Object name being accessed */
    objectName: string;
    /** Optional record ID for record-level checks */
    recordId?: string;
    /** Optional field name for field-level checks */
    fieldName?: string;
}

/**
 * Permission check result
 * 
 * @remarks
 * This interface is reserved for future use in structured permission checking APIs.
 * Currently, permission methods return boolean values directly.
 */
export interface PermissionCheckResult {
    /** Whether permission is granted */
    allowed: boolean;
    /** Reason for denial (if not allowed) */
    reason?: string;
}
