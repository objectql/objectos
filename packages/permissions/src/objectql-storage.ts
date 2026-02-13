/**
 * ObjectQL Permission Storage Implementation
 *
 * Storage adapter that persists permission data to ObjectOS/ObjectQL database
 */

import type { PluginContext } from '@objectstack/runtime';
import type { PermissionSet } from './types.js';
import type { PermissionStorage } from './storage.js';

export class ObjectQLPermissionStorage implements PermissionStorage {
  private context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  /**
   * Store a permission set
   */
  async storePermissionSet(permissionSet: PermissionSet): Promise<void> {
    await (this.context as any).broker.call('data.create', {
      object: 'permission_set',
      doc: {
        _id: permissionSet.name,
        name: permissionSet.name,
        object_name: permissionSet.objectName,
        description: permissionSet.description,
        permissions: permissionSet,
      },
    });
  }

  /**
   * Get a permission set by name
   */
  async getPermissionSet(name: string): Promise<PermissionSet | null> {
    try {
      const result = await (this.context as any).broker.call('data.get', {
        object: 'permission_set',
        id: name,
      });
      return result ? this.mapDocToPermissionSet(result) : null;
    } catch (err: any) {
      // If not found, return null
      if (err.message && err.message.includes('not found')) return null;
      throw err;
    }
  }

  /**
   * Get permission set for a specific object
   */
  async getPermissionSetForObject(objectName: string): Promise<PermissionSet | null> {
    try {
      const results = await (this.context as any).broker.call('data.find', {
        object: 'permission_set',
        query: { object_name: objectName },
        limit: 1,
      });
      return results && results.length > 0 ? this.mapDocToPermissionSet(results[0]) : null;
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) return null;
      throw err;
    }
  }

  /**
   * Get all permission sets
   */
  async getAllPermissionSets(): Promise<PermissionSet[]> {
    const results = await (this.context as any).broker.call('data.find', {
      object: 'permission_set',
      query: {},
    });
    return results.map((doc: any) => this.mapDocToPermissionSet(doc));
  }

  /**
   * Delete a permission set
   */
  async deletePermissionSet(name: string): Promise<void> {
    await (this.context as any).broker.call('data.delete', {
      object: 'permission_set',
      id: name,
    });
  }

  /**
   * Clear all permission sets
   */
  async clear(): Promise<void> {
    const allSets = await this.getAllPermissionSets();
    for (const permSet of allSets) {
      await this.deletePermissionSet(permSet.name);
    }
  }

  /**
   * Map document to PermissionSet
   */
  private mapDocToPermissionSet(doc: any): PermissionSet {
    return (
      doc.permissions || {
        name: doc.name,
        objectName: doc.object_name,
        description: doc.description,
      }
    );
  }
}
