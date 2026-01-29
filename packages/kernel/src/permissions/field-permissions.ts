/**
 * Field Permission Checker
 * 
 * Provides field-level permission checking functionality.
 */

import { PermissionSet, User } from './types';
import { PermissionSetLoader } from './permission-set-loader';

/**
 * Field Filter
 * 
 * Filters data fields based on a list of visible fields.
 */
export class FieldFilter {
    /**
     * Filter fields from data object
     * 
     * @param data - Data object to filter
     * @param visibleFields - Array of field names that should be visible
     * @returns Filtered data object containing only visible fields
     */
    filterFields(data: any, visibleFields: string[]): any {
        // Handle null, undefined, non-objects, and arrays
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            return data;
        }

        const filtered: any = {};
        for (const field of visibleFields) {
            if (field in data) {
                filtered[field] = data[field];
            }
        }
        return filtered;
    }

    /**
     * Filter fields from an array of data objects
     * 
     * @param dataArray - Array of data objects to filter
     * @param visibleFields - Array of field names that should be visible
     * @returns Array of filtered data objects
     */
    filterFieldsArray(dataArray: any[], visibleFields: string[]): any[] {
        if (!Array.isArray(dataArray)) {
            return dataArray;
        }

        return dataArray.map(data => this.filterFields(data, visibleFields));
    }
}

/**
 * Field Permission Checker
 * 
 * Checks field-level permissions (read/write) for users.
 */
export class FieldPermissionChecker {
    private loader: PermissionSetLoader;
    private fieldFilter: FieldFilter;

    constructor(loader: PermissionSetLoader) {
        this.loader = loader;
        this.fieldFilter = new FieldFilter();
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

        // First pass: Check for explicit denials
        // If any permission set explicitly denies field access, deny it
        for (const permissionSet of permissionSets) {
            if (permissionSet.fields && permissionSet.fields[fieldKey]) {
                const fieldPerm = permissionSet.fields[fieldKey];
                if (fieldPerm.readable === false) {
                    return false; // Explicit denial takes precedence
                }
            }
        }

        // Second pass: Check for explicit grants
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

        // First pass: Check for explicit denials
        // If any permission set explicitly denies field access, deny it
        for (const permissionSet of permissionSets) {
            if (permissionSet.fields && permissionSet.fields[fieldKey]) {
                const fieldPerm = permissionSet.fields[fieldKey];
                if (fieldPerm.editable === false) {
                    return false; // Explicit denial takes precedence
                }
            }
        }

        // Second pass: Check for explicit grants
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

        return this.fieldFilter.filterFields(record, visibleFields);
    }

    /**
     * Get the field filter instance
     * 
     * @returns FieldFilter instance
     */
    getFieldFilter(): FieldFilter {
        return this.fieldFilter;
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
