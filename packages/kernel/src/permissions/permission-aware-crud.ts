/**
 * Permission-Aware CRUD Helper
 * 
 * This helper provides CRUD operations with built-in permission checking.
 */

import { ObjectOS } from '../objectos';
import { User } from './types';
import { FieldFilter } from './field-permissions';

/**
 * Error thrown when user lacks required permissions
 */
export class ForbiddenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ForbiddenError';
    }
}

/**
 * Permission-aware CRUD helper
 * 
 * Wraps ObjectQL operations with permission checks
 */
export class PermissionAwareCRUD {
    private fieldFilter: FieldFilter;

    constructor(private objectos: ObjectOS) {
        this.fieldFilter = new FieldFilter();
    }

    /**
     * Find records with permission checking
     * 
     * @param user - User making the request
     * @param objectName - Object to query
     * @param options - Query options
     * @returns Filtered records
     */
    async find(user: User, objectName: string, options: any = {}): Promise<any[]> {
        const permissionManager = this.objectos.getPermissionManager();

        // 1. Check read permission
        const canRead = await permissionManager.canRead(user, objectName);
        if (!canRead) {
            throw new ForbiddenError(`No read permission on ${objectName}`);
        }

        // 2. Execute query (ObjectQL handles the actual database query)
        // In a real implementation, this would call objectos.find()
        // For this example, we'll return mock data
        const records = await this.mockFind(objectName, options);

        // 3. Get visible fields
        if (records.length > 0) {
            const allFields = Object.keys(records[0]);
            const visibleFields = await permissionManager.getVisibleFields(user, objectName, allFields);
            
            // 4. Filter each record to only include visible fields using FieldFilter
            return this.fieldFilter.filterFieldsArray(records, visibleFields);
        }

        return records;
    }

    /**
     * Insert record with permission checking
     * 
     * @param user - User making the request
     * @param objectName - Object to insert into
     * @param data - Record data
     * @returns Inserted record
     */
    async insert(user: User, objectName: string, data: any): Promise<any> {
        const permissionManager = this.objectos.getPermissionManager();

        // 1. Check create permission
        const canCreate = await permissionManager.canCreate(user, objectName);
        if (!canCreate) {
            throw new ForbiddenError(`No create permission on ${objectName}`);
        }

        // 2. Get editable fields
        const allFields = Object.keys(data);
        const editableFields = await permissionManager.getEditableFields(user, objectName, allFields);

        // 3. Filter data to only include editable fields using FieldFilter
        const filteredData = this.fieldFilter.filterFields(data, editableFields);

        // 4. Add audit fields
        filteredData.created_by = user.id;
        filteredData.created_date = new Date().toISOString();

        // 5. Execute insert (ObjectQL handles the actual database insert)
        // In a real implementation, this would call objectos.insert()
        const insertedRecord = await this.mockInsert(objectName, filteredData);

        // 6. Filter result fields
        return await permissionManager.filterRecordFields(user, objectName, insertedRecord);
    }

    /**
     * Update record with permission checking
     * 
     * @param user - User making the request
     * @param objectName - Object to update
     * @param recordId - Record ID
     * @param data - Update data
     * @returns Updated record
     */
    async update(user: User, objectName: string, recordId: string, data: any): Promise<any> {
        const permissionManager = this.objectos.getPermissionManager();

        // 1. Check edit permission
        const canEdit = await permissionManager.canEdit(user, objectName, recordId);
        if (!canEdit) {
            throw new ForbiddenError(`No edit permission on ${objectName}`);
        }

        // 2. Get editable fields
        const allFields = Object.keys(data);
        const editableFields = await permissionManager.getEditableFields(user, objectName, allFields);

        // 3. Filter data to only include editable fields using FieldFilter
        const filteredData = this.fieldFilter.filterFields(data, editableFields);

        // 4. Add audit fields
        filteredData.modified_by = user.id;
        filteredData.modified_date = new Date().toISOString();

        // 5. Execute update (ObjectQL handles the actual database update)
        // In a real implementation, this would call objectos.update()
        const updatedRecord = await this.mockUpdate(objectName, recordId, filteredData);

        // 6. Filter result fields
        return await permissionManager.filterRecordFields(user, objectName, updatedRecord);
    }

    /**
     * Delete record with permission checking
     * 
     * @param user - User making the request
     * @param objectName - Object to delete from
     * @param recordId - Record ID
     */
    async delete(user: User, objectName: string, recordId: string): Promise<void> {
        const permissionManager = this.objectos.getPermissionManager();

        // 1. Check delete permission
        const canDelete = await permissionManager.canDelete(user, objectName, recordId);
        if (!canDelete) {
            throw new ForbiddenError(`No delete permission on ${objectName}`);
        }

        // 2. Execute delete (ObjectQL handles the actual database delete)
        // In a real implementation, this would call objectos.delete()
        await this.mockDelete(objectName, recordId);
    }

    /**
     * Find one record with permission checking
     * 
     * @param user - User making the request
     * @param objectName - Object to query
     * @param recordId - Record ID
     * @returns Filtered record
     */
    async findOne(user: User, objectName: string, recordId: string): Promise<any> {
        const permissionManager = this.objectos.getPermissionManager();

        // 1. Check read permission
        const canRead = await permissionManager.canRead(user, objectName);
        if (!canRead) {
            throw new ForbiddenError(`No read permission on ${objectName}`);
        }

        // 2. Execute query
        const record = await this.mockFindOne(objectName, recordId);

        if (!record) {
            return null;
        }

        // 3. Filter fields based on permissions
        return await permissionManager.filterRecordFields(user, objectName, record);
    }

    // Mock methods - In real implementation, these would call ObjectQL
    private async mockFind(objectName: string, options: any): Promise<any[]> {
        // Mock implementation
        return [];
    }

    private async mockInsert(objectName: string, data: any): Promise<any> {
        // Mock implementation
        return { id: 'mock_id', ...data };
    }

    private async mockUpdate(objectName: string, recordId: string, data: any): Promise<any> {
        // Mock implementation
        return { id: recordId, ...data };
    }

    private async mockDelete(objectName: string, recordId: string): Promise<void> {
        // Mock implementation
    }

    private async mockFindOne(objectName: string, recordId: string): Promise<any> {
        // Mock implementation
        return null;
    }
}

/**
 * Create a permission-aware CRUD helper
 * 
 * @param objectos - ObjectOS instance
 * @returns Permission-aware CRUD helper
 */
export function createPermissionAwareCRUD(objectos: ObjectOS): PermissionAwareCRUD {
    return new PermissionAwareCRUD(objectos);
}
