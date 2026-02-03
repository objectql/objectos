/**
 * Permission Storage Interface
 * 
 * Provides abstraction for storing and retrieving permission sets.
 * Implementations can use in-memory, database, or file-based storage.
 */

import type { PermissionSet } from './types';

/**
 * Permission Storage Interface
 */
export interface PermissionStorage {
    /**
     * Store a permission set
     */
    storePermissionSet(permissionSet: PermissionSet): Promise<void>;

    /**
     * Get a permission set by name
     */
    getPermissionSet(name: string): Promise<PermissionSet | null>;

    /**
     * Get permission set for a specific object
     */
    getPermissionSetForObject(objectName: string): Promise<PermissionSet | null>;

    /**
     * Get all permission sets
     */
    getAllPermissionSets(): Promise<PermissionSet[]>;

    /**
     * Delete a permission set
     */
    deletePermissionSet(name: string): Promise<void>;

    /**
     * Clear all permission sets
     */
    clear(): Promise<void>;
}

/**
 * In-Memory Permission Storage
 * 
 * Simple in-memory storage for permission sets.
 * Useful for testing and development.
 */
export class InMemoryPermissionStorage implements PermissionStorage {
    private permissionSets: Map<string, PermissionSet> = new Map();
    private objectIndex: Map<string, string> = new Map(); // objectName -> permissionSet name

    async storePermissionSet(permissionSet: PermissionSet): Promise<void> {
        this.permissionSets.set(permissionSet.name, permissionSet);
        this.objectIndex.set(permissionSet.objectName, permissionSet.name);
    }

    async getPermissionSet(name: string): Promise<PermissionSet | null> {
        return this.permissionSets.get(name) || null;
    }

    async getPermissionSetForObject(objectName: string): Promise<PermissionSet | null> {
        const name = this.objectIndex.get(objectName);
        if (!name) return null;
        return this.permissionSets.get(name) || null;
    }

    async getAllPermissionSets(): Promise<PermissionSet[]> {
        return Array.from(this.permissionSets.values());
    }

    async deletePermissionSet(name: string): Promise<void> {
        const permissionSet = this.permissionSets.get(name);
        if (permissionSet) {
            this.objectIndex.delete(permissionSet.objectName);
            this.permissionSets.delete(name);
        }
    }

    async clear(): Promise<void> {
        this.permissionSets.clear();
        this.objectIndex.clear();
    }
}
