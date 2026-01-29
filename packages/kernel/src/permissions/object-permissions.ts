/**
 * Object Permission Checker
 * 
 * Provides object-level permission checking functionality.
 */

import { PermissionSet, User } from './types';
import { PermissionSetLoader } from './permission-set-loader';

/**
 * Object Permission Checker
 * 
 * Checks object-level permissions (CRUD operations) for users.
 */
export class ObjectPermissionChecker {
    private loader: PermissionSetLoader;

    constructor(loader: PermissionSetLoader) {
        this.loader = loader;
    }

    /**
     * Check if user can read records from an object
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @returns True if user can read
     */
    async canRead(user: User, objectName: string): Promise<boolean> {
        const permissionSets = await this.getUserPermissionSets(user);
        
        for (const permissionSet of permissionSets) {
            const objectPerm = permissionSet.objects[objectName];
            if (objectPerm && (objectPerm.allowRead || objectPerm.viewAllRecords)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if user can create records in an object
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @returns True if user can create
     */
    async canCreate(user: User, objectName: string): Promise<boolean> {
        const permissionSets = await this.getUserPermissionSets(user);
        
        for (const permissionSet of permissionSets) {
            const objectPerm = permissionSet.objects[objectName];
            if (objectPerm && objectPerm.allowCreate) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if user can edit records in an object
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @param recordId - Optional record ID for record-level checks
     * @returns True if user can edit
     */
    async canEdit(user: User, objectName: string, recordId?: string): Promise<boolean> {
        const permissionSets = await this.getUserPermissionSets(user);
        
        for (const permissionSet of permissionSets) {
            const objectPerm = permissionSet.objects[objectName];
            if (objectPerm && (objectPerm.allowEdit || objectPerm.modifyAllRecords)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if user can delete records from an object
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @param recordId - Optional record ID for record-level checks
     * @returns True if user can delete
     */
    async canDelete(user: User, objectName: string, recordId?: string): Promise<boolean> {
        const permissionSets = await this.getUserPermissionSets(user);
        
        for (const permissionSet of permissionSets) {
            const objectPerm = permissionSet.objects[objectName];
            if (objectPerm && objectPerm.allowDelete) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if user can view all records (bypassing sharing rules)
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @returns True if user has view all permission
     */
    async canViewAll(user: User, objectName: string): Promise<boolean> {
        const permissionSets = await this.getUserPermissionSets(user);
        
        for (const permissionSet of permissionSets) {
            const objectPerm = permissionSet.objects[objectName];
            if (objectPerm && objectPerm.viewAllRecords) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if user can modify all records (bypassing sharing rules)
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @returns True if user has modify all permission
     */
    async canModifyAll(user: User, objectName: string): Promise<boolean> {
        const permissionSets = await this.getUserPermissionSets(user);
        
        for (const permissionSet of permissionSets) {
            const objectPerm = permissionSet.objects[objectName];
            if (objectPerm && objectPerm.modifyAllRecords) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get all permission sets for a user
     * 
     * @param user - User to get permission sets for
     * @returns Array of permission sets
     */
    private async getUserPermissionSets(user: User): Promise<PermissionSet[]> {
        const permissionSets: PermissionSet[] = [];
        
        // Load profile (primary permission set)
        if (user.profile) {
            const profile = await this.loader.loadPermissionSet(user.profile);
            if (profile) {
                permissionSets.push(profile);
            }
        }
        
        // Load additional permission sets
        if (user.permissionSets && Array.isArray(user.permissionSets)) {
            for (const permSetName of user.permissionSets) {
                const permSet = await this.loader.loadPermissionSet(permSetName);
                if (permSet) {
                    permissionSets.push(permSet);
                }
            }
        }
        
        return permissionSets;
    }
}
