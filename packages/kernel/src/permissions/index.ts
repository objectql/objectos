/**
 * Permission Manager
 * 
 * Central permission management system for ObjectOS.
 */

import { PermissionSetLoader, PermissionSetLoaderConfig } from './permission-set-loader';
import { ObjectPermissionChecker } from './object-permissions';
import { FieldPermissionChecker, FieldFilter } from './field-permissions';
import { User } from './types';

/**
 * Permission Manager Configuration
 */
export interface PermissionManagerConfig extends PermissionSetLoaderConfig {
    /** Enable permission checking (default: true) */
    enabled?: boolean;
}

/**
 * Permission Manager
 * 
 * Provides a unified interface for all permission checking operations.
 */
export class PermissionManager {
    private loader: PermissionSetLoader;
    private objectChecker: ObjectPermissionChecker;
    private fieldChecker: FieldPermissionChecker;
    private config: PermissionManagerConfig;

    constructor(config: PermissionManagerConfig = {}) {
        this.config = {
            enabled: true,
            ...config,
        };

        this.loader = new PermissionSetLoader(config);
        this.objectChecker = new ObjectPermissionChecker(this.loader);
        this.fieldChecker = new FieldPermissionChecker(this.loader);
    }

    /**
     * Initialize the permission manager
     * Loads all permission sets from configured directory
     */
    async init(): Promise<void> {
        // Load all permission sets
        await this.loader.loadAllPermissionSets();
    }

    /**
     * Check if user can read from an object
     */
    async canRead(user: User, objectName: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.objectChecker.canRead(user, objectName);
    }

    /**
     * Check if user can create in an object
     */
    async canCreate(user: User, objectName: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.objectChecker.canCreate(user, objectName);
    }

    /**
     * Check if user can edit in an object
     */
    async canEdit(user: User, objectName: string, recordId?: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.objectChecker.canEdit(user, objectName, recordId);
    }

    /**
     * Check if user can delete from an object
     */
    async canDelete(user: User, objectName: string, recordId?: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.objectChecker.canDelete(user, objectName, recordId);
    }

    /**
     * Check if user can view all records
     */
    async canViewAll(user: User, objectName: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.objectChecker.canViewAll(user, objectName);
    }

    /**
     * Check if user can modify all records
     */
    async canModifyAll(user: User, objectName: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.objectChecker.canModifyAll(user, objectName);
    }

    /**
     * Get visible fields for a user
     */
    async getVisibleFields(user: User, objectName: string, allFields: string[]): Promise<string[]> {
        if (!this.config.enabled) {
            return allFields;
        }
        return await this.fieldChecker.getVisibleFields(user, objectName, allFields);
    }

    /**
     * Get editable fields for a user
     */
    async getEditableFields(user: User, objectName: string, allFields: string[]): Promise<string[]> {
        if (!this.config.enabled) {
            return allFields;
        }
        return await this.fieldChecker.getEditableFields(user, objectName, allFields);
    }

    /**
     * Check if user can read a specific field
     */
    async canReadField(user: User, objectName: string, fieldName: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.fieldChecker.canReadField(user, objectName, fieldName);
    }

    /**
     * Check if user can edit a specific field
     */
    async canEditField(user: User, objectName: string, fieldName: string): Promise<boolean> {
        if (!this.config.enabled) {
            return true;
        }
        return await this.fieldChecker.canEditField(user, objectName, fieldName);
    }

    /**
     * Filter record fields based on user permissions
     */
    async filterRecordFields(user: User, objectName: string, record: any): Promise<any> {
        if (!this.config.enabled) {
            return record;
        }
        return await this.fieldChecker.filterRecordFields(user, objectName, record);
    }

    /**
     * Get the permission set loader
     */
    getLoader(): PermissionSetLoader {
        return this.loader;
    }

    /**
     * Get the object permission checker
     */
    getObjectChecker(): ObjectPermissionChecker {
        return this.objectChecker;
    }

    /**
     * Get the field permission checker
     */
    getFieldChecker(): FieldPermissionChecker {
        return this.fieldChecker;
    }
}
