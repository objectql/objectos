/**
 * Permission Set Loader
 * 
 * Loads and caches permission sets from YAML files or other sources.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { PermissionSet } from './types';
import { Permission } from '@objectstack/spec';

const PermissionSetSchema = Permission.PermissionSetSchema;

/**
 * Permission Set Loader Configuration
 */
export interface PermissionSetLoaderConfig {
    /** Directory containing permission set YAML files */
    permissionSetsPath?: string;
    /** Enable caching of loaded permission sets */
    enableCache?: boolean;
}

/**
 * Permission Set Loader
 * 
 * Loads permission sets from YAML files and manages caching.
 */
export class PermissionSetLoader {
    private cache: Map<string, PermissionSet> = new Map();
    private config: PermissionSetLoaderConfig;

    constructor(config: PermissionSetLoaderConfig = {}) {
        this.config = {
            enableCache: true,
            ...config,
        };
    }

    /**
     * Load a permission set by name
     * 
     * @param name - Permission set name
     * @returns Permission set or undefined if not found
     */
    async loadPermissionSet(name: string): Promise<PermissionSet | undefined> {
        // Check cache first
        if (this.config.enableCache && this.cache.has(name)) {
            return this.cache.get(name);
        }

        // Try to load from file
        if (this.config.permissionSetsPath) {
            const permissionSet = await this.loadFromFile(name);
            if (permissionSet) {
                // Cache the loaded permission set
                if (this.config.enableCache) {
                    this.cache.set(name, permissionSet);
                }
                return permissionSet;
            }
        }

        return undefined;
    }

    /**
     * Load all permission sets from the configured directory
     * 
     * @returns Array of permission sets
     */
    async loadAllPermissionSets(): Promise<PermissionSet[]> {
        if (!this.config.permissionSetsPath) {
            return [];
        }

        const permissionSets: PermissionSet[] = [];

        try {
            // Check if directory exists
            if (!fs.existsSync(this.config.permissionSetsPath)) {
                return [];
            }

            // Read all YAML files in the directory
            const files = fs.readdirSync(this.config.permissionSetsPath);
            
            for (const file of files) {
                if (file.endsWith('.yml') || file.endsWith('.yaml')) {
                    const filePath = path.join(this.config.permissionSetsPath, file);
                    const permissionSet = await this.loadFromFilePath(filePath);
                    if (permissionSet) {
                        permissionSets.push(permissionSet);
                        
                        // Cache the loaded permission set
                        if (this.config.enableCache) {
                            this.cache.set(permissionSet.name, permissionSet);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error loading permission sets:', error);
        }

        return permissionSets;
    }

    /**
     * Load permission set from file by name
     * 
     * @param name - Permission set name
     * @returns Permission set or undefined if not found
     */
    private async loadFromFile(name: string): Promise<PermissionSet | undefined> {
        if (!this.config.permissionSetsPath) {
            return undefined;
        }

        // Try .yml and .yaml extensions
        const extensions = ['.yml', '.yaml'];
        
        for (const ext of extensions) {
            const filePath = path.join(this.config.permissionSetsPath, `${name}${ext}`);
            
            if (fs.existsSync(filePath)) {
                return await this.loadFromFilePath(filePath);
            }
        }

        return undefined;
    }

    /**
     * Load permission set from file path
     * 
     * @param filePath - Path to YAML file
     * @returns Permission set or undefined if invalid
     */
    private async loadFromFilePath(filePath: string): Promise<PermissionSet | undefined> {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const data = yaml.load(fileContent);

            // Validate using Zod schema
            const result = PermissionSetSchema.safeParse(data);
            
            if (result.success) {
                return result.data;
            } else {
                console.error(`Invalid permission set in ${filePath}:`, result.error);
                return undefined;
            }
        } catch (error) {
            console.error(`Error loading permission set from ${filePath}:`, error);
            return undefined;
        }
    }

    /**
     * Add a permission set to the cache
     * 
     * @param permissionSet - Permission set to add
     */
    addPermissionSet(permissionSet: PermissionSet): void {
        // Validate the permission set
        const result = PermissionSetSchema.safeParse(permissionSet);
        
        if (!result.success) {
            throw new Error(`Invalid permission set: ${result.error.message}`);
        }

        this.cache.set(permissionSet.name, result.data);
    }

    /**
     * Clear the cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Remove a specific permission set from cache
     * 
     * @param name - Permission set name
     */
    removeFromCache(name: string): void {
        this.cache.delete(name);
    }

    /**
     * Get all cached permission set names
     * 
     * @returns Array of permission set names
     */
    getCachedPermissionSetNames(): string[] {
        return Array.from(this.cache.keys());
    }
}
