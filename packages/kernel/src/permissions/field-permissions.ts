/**
 * Field Permission Checker
 * 
 * Provides field-level permission checking functionality.
 */

import { PermissionSet, User } from './types';
import { PermissionSetLoader } from './permission-set-loader';

/**
 * Field Permission Checker
 * 
 * Checks field-level permissions (read/write) for users.
 */
export class FieldPermissionChecker {
    private loader: PermissionSetLoader;

    constructor(loader: PermissionSetLoader) {
        this.loader = loader;
    }

    /**
     * Get visible fields for a user on an object
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @param allFields - All available fields on the object
     * @returns Array of visible field names
     */
    async getVisibleFields(user: User, objectName: string, allFields: string[]): Promise<string[]> {
        const permissionSets = await this.getUserPermissionSets(user);
        const visibleFields = new Set<string>();

        // If no permission sets, no fields are visible
        if (permissionSets.length === 0) {
            return [];
        }

        // Check each field
        for (const field of allFields) {
            if (await this.canReadField(user, objectName, field, permissionSets)) {
                visibleFields.add(field);
            }
        }

        return Array.from(visibleFields);
    }

    /**
     * Get editable fields for a user on an object
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @param allFields - All available fields on the object
     * @returns Array of editable field names
     */
    async getEditableFields(user: User, objectName: string, allFields: string[]): Promise<string[]> {
        const permissionSets = await this.getUserPermissionSets(user);
        const editableFields = new Set<string>();

        // If no permission sets, no fields are editable
        if (permissionSets.length === 0) {
            return [];
        }

        // Check each field
        for (const field of allFields) {
            if (await this.canEditField(user, objectName, field, permissionSets)) {
                editableFields.add(field);
            }
        }

        return Array.from(editableFields);
    }

    /**
     * Check if user can read a specific field
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @param fieldName - Name of the field
     * @param permissionSets - Optional pre-loaded permission sets
     * @returns True if user can read the field
     */
    async canReadField(
        user: User,
        objectName: string,
        fieldName: string,
        permissionSets?: PermissionSet[]
    ): Promise<boolean> {
        if (!permissionSets) {
            permissionSets = await this.getUserPermissionSets(user);
        }

        // Build field key (objectName.fieldName)
        const fieldKey = `${objectName}.${fieldName}`;

        for (const permissionSet of permissionSets) {
            // Check if there's a specific field permission
            if (permissionSet.fields && permissionSet.fields[fieldKey]) {
                const fieldPerm = permissionSet.fields[fieldKey];
                if (fieldPerm.readable) {
                    return true;
                }
            } else {
                // If no specific field permission, default to object read permission
                const objectPerm = permissionSet.objects[objectName];
                if (objectPerm && (objectPerm.allowRead || objectPerm.viewAllRecords)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if user can edit a specific field
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @param fieldName - Name of the field
     * @param permissionSets - Optional pre-loaded permission sets
     * @returns True if user can edit the field
     */
    async canEditField(
        user: User,
        objectName: string,
        fieldName: string,
        permissionSets?: PermissionSet[]
    ): Promise<boolean> {
        if (!permissionSets) {
            permissionSets = await this.getUserPermissionSets(user);
        }

        // Build field key (objectName.fieldName)
        const fieldKey = `${objectName}.${fieldName}`;

        for (const permissionSet of permissionSets) {
            // Check if there's a specific field permission
            if (permissionSet.fields && permissionSet.fields[fieldKey]) {
                const fieldPerm = permissionSet.fields[fieldKey];
                if (fieldPerm.editable) {
                    return true;
                }
            } else {
                // If no specific field permission, default to object edit permission
                const objectPerm = permissionSet.objects[objectName];
                if (objectPerm && (objectPerm.allowEdit || objectPerm.modifyAllRecords)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Filter record fields based on user permissions
     * 
     * @param user - User to check permissions for
     * @param objectName - Name of the object
     * @param record - Record to filter
     * @returns Filtered record with only visible fields
     */
    async filterRecordFields(user: User, objectName: string, record: any): Promise<any> {
        if (!record || typeof record !== 'object') {
            return record;
        }

        const fieldNames = Object.keys(record);
        const visibleFields = await this.getVisibleFields(user, objectName, fieldNames);

        const filteredRecord: any = {};
        for (const field of visibleFields) {
            filteredRecord[field] = record[field];
        }

        return filteredRecord;
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
