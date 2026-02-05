import { PermissionEngine } from '../src/engine.js';
import { InMemoryPermissionStorage } from '../src/storage.js';
import type { PermissionSet } from '../src/types.js';

describe('Permission Profile Merging Integration', () => {
    let engine: PermissionEngine;
    let storage: InMemoryPermissionStorage;

    beforeEach(() => {
        storage = new InMemoryPermissionStorage();
        engine = new PermissionEngine(storage, { enableCache: false });
    });

    test('should merge filters with $or when user has multiple profiles', async () => {
        const permSet: PermissionSet = {
            name: 'orders_permissions',
            objectName: 'orders',
            profiles: {
                user: {
                    objectName: 'orders',
                    allowRead: true,
                    viewFilters: { owner: '{{ userId }}' }
                },
                manager: {
                    objectName: 'orders',
                    allowRead: true,
                    viewFilters: { department: 'sales' }
                }
            }
        };

        await storage.storePermissionSet(permSet);

        const context = {
            userId: 'u1',
            profiles: ['user', 'manager']
        };

        const result = await engine.getRecordFilters(context, 'orders');

        expect(result).toBeDefined();
        // Since we don't know the order, we check for $or existence and content
        expect(result.$or).toBeDefined();
        expect(result.$or).toHaveLength(2);
        expect(result.$or).toContainEqual({ owner: 'u1' });
        expect(result.$or).toContainEqual({ department: 'sales' });
    });

    test('should ignore restrictions if one profile has full access (no filters)', async () => {
         const permSet: PermissionSet = {
            name: 'orders_permissions',
            objectName: 'orders',
            profiles: {
                user: {
                    objectName: 'orders',
                    allowRead: true,
                    viewFilters: { owner: '{{ userId }}' }
                },
                admin: {
                    objectName: 'orders',
                    allowRead: true
                    // No viewFilters implies full access
                }
            }
        };
        
        await storage.storePermissionSet(permSet);
         const context = {
            userId: 'u1',
            profiles: ['user', 'admin']
        };

        const result = await engine.getRecordFilters(context, 'orders');
        
        // Should return empty object (meaning no filter = full access)
        expect(result).toEqual({});
    });

    test('should prioritize full access over restricted access in checkPermission', async () => {
         const permSet: PermissionSet = {
            name: 'orders_permissions',
            objectName: 'orders',
            profiles: {
                restricted_user: {
                    objectName: 'orders',
                    allowRead: true,
                    viewFilters: { owner: '{{ userId }}' }
                },
                superuser: {
                    objectName: 'orders',
                    allowRead: true
                }
            }
        };
        
        await storage.storePermissionSet(permSet);
         const context = {
            userId: 'u1',
            profiles: ['restricted_user', 'superuser']
        };

        const result = await engine.checkPermission(context, 'orders', 'read');
        
        expect(result.allowed).toBe(true);
        expect(result.filters).toBeUndefined(); // Undefined filters means full access in checkResult
    });
});
