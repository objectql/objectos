/**
 * Tests for Permission Storage
 */

import { InMemoryPermissionStorage } from '../src/storage.js';
import type { PermissionSet } from '../src/types.js';

describe('InMemoryPermissionStorage', () => {
  let storage: InMemoryPermissionStorage;

  beforeEach(() => {
    storage = new InMemoryPermissionStorage();
  });

  describe('storePermissionSet', () => {
    it('should store a permission set', async () => {
      const permissionSet: PermissionSet = {
        name: 'test-permissions',
        objectName: 'contacts',
        profiles: {
          admin: {
            objectName: 'contacts',
            allowRead: true,
            allowCreate: true,
            allowEdit: true,
            allowDelete: true,
          },
        },
      };

      await storage.storePermissionSet(permissionSet);

      const retrieved = await storage.getPermissionSet('test-permissions');
      expect(retrieved).toEqual(permissionSet);
    });

    it('should index permission set by object name', async () => {
      const permissionSet: PermissionSet = {
        name: 'contact-permissions',
        objectName: 'contacts',
        profiles: {},
      };

      await storage.storePermissionSet(permissionSet);

      const retrieved = await storage.getPermissionSetForObject('contacts');
      expect(retrieved).toEqual(permissionSet);
    });

    it('should overwrite existing permission set with same name', async () => {
      const permissionSet1: PermissionSet = {
        name: 'test-permissions',
        objectName: 'contacts',
        profiles: { admin: { objectName: 'contacts', allowRead: true } },
      };

      const permissionSet2: PermissionSet = {
        name: 'test-permissions',
        objectName: 'contacts',
        profiles: { admin: { objectName: 'contacts', allowRead: false } },
      };

      await storage.storePermissionSet(permissionSet1);
      await storage.storePermissionSet(permissionSet2);

      const retrieved = await storage.getPermissionSet('test-permissions');
      expect(retrieved?.profiles?.admin?.allowRead).toBe(false);
    });
  });

  describe('getPermissionSet', () => {
    it('should return null for non-existent permission set', async () => {
      const result = await storage.getPermissionSet('non-existent');
      expect(result).toBeNull();
    });

    it('should retrieve stored permission set', async () => {
      const permissionSet: PermissionSet = {
        name: 'test-permissions',
        objectName: 'contacts',
        profiles: {},
      };

      await storage.storePermissionSet(permissionSet);
      const retrieved = await storage.getPermissionSet('test-permissions');

      expect(retrieved).toEqual(permissionSet);
    });
  });

  describe('getPermissionSetForObject', () => {
    it('should return null for non-existent object', async () => {
      const result = await storage.getPermissionSetForObject('non-existent');
      expect(result).toBeNull();
    });

    it('should retrieve permission set by object name', async () => {
      const permissionSet: PermissionSet = {
        name: 'contact-permissions',
        objectName: 'contacts',
        profiles: {},
      };

      await storage.storePermissionSet(permissionSet);
      const retrieved = await storage.getPermissionSetForObject('contacts');

      expect(retrieved).toEqual(permissionSet);
    });
  });

  describe('getAllPermissionSets', () => {
    it('should return empty array when no permission sets stored', async () => {
      const result = await storage.getAllPermissionSets();
      expect(result).toEqual([]);
    });

    it('should return all stored permission sets', async () => {
      const permissionSet1: PermissionSet = {
        name: 'contact-permissions',
        objectName: 'contacts',
        profiles: {},
      };

      const permissionSet2: PermissionSet = {
        name: 'account-permissions',
        objectName: 'accounts',
        profiles: {},
      };

      await storage.storePermissionSet(permissionSet1);
      await storage.storePermissionSet(permissionSet2);

      const result = await storage.getAllPermissionSets();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(permissionSet1);
      expect(result).toContainEqual(permissionSet2);
    });
  });

  describe('deletePermissionSet', () => {
    it('should delete permission set and update index', async () => {
      const permissionSet: PermissionSet = {
        name: 'contact-permissions',
        objectName: 'contacts',
        profiles: {},
      };

      await storage.storePermissionSet(permissionSet);
      await storage.deletePermissionSet('contact-permissions');

      const byName = await storage.getPermissionSet('contact-permissions');
      const byObject = await storage.getPermissionSetForObject('contacts');

      expect(byName).toBeNull();
      expect(byObject).toBeNull();
    });

    it('should not throw error when deleting non-existent permission set', async () => {
      await expect(storage.deletePermissionSet('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all permission sets', async () => {
      const permissionSet1: PermissionSet = {
        name: 'contact-permissions',
        objectName: 'contacts',
        profiles: {},
      };

      const permissionSet2: PermissionSet = {
        name: 'account-permissions',
        objectName: 'accounts',
        profiles: {},
      };

      await storage.storePermissionSet(permissionSet1);
      await storage.storePermissionSet(permissionSet2);

      await storage.clear();

      const all = await storage.getAllPermissionSets();
      expect(all).toEqual([]);
    });
  });
});
