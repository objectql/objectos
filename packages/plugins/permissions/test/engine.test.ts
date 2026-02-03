/**
 * Tests for Permission Engine
 */

import { PermissionEngine } from '../src/engine';
import { InMemoryPermissionStorage } from '../src/storage';
import type { PermissionSet, PermissionContext } from '../src/types';

describe('PermissionEngine', () => {
    let storage: InMemoryPermissionStorage;
    let engine: PermissionEngine;

    beforeEach(() => {
        storage = new InMemoryPermissionStorage();
        engine = new PermissionEngine(storage, {
            defaultDeny: true,
            enableCache: false, // Disable cache for testing
        });
    });

    describe('checkPermission', () => {
        it('should allow permission when profile has access', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
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

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            const result = await engine.checkPermission(context, 'contacts', 'read');

            expect(result.allowed).toBe(true);
            expect(result.reason).toBeUndefined();
        });

        it('should deny permission when profile lacks access', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: false,
                        allowDelete: false,
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['sales'],
            };

            const result = await engine.checkPermission(context, 'contacts', 'delete');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('No permission for action');
        });

        it('should allow permission when user has multiple profiles', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    admin: {
                        objectName: 'contacts',
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: true,
                        allowDelete: true,
                    },
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['sales', 'admin'],
            };

            const result = await engine.checkPermission(context, 'contacts', 'delete');

            expect(result.allowed).toBe(true);
        });

        it('should return filters when defined in profile', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        viewFilters: {
                            owner: '{{ userId }}',
                        },
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['sales'],
            };

            const result = await engine.checkPermission(context, 'contacts', 'read');

            expect(result.allowed).toBe(true);
            expect(result.filters).toBeDefined();
            expect(result.filters?.owner).toBe('{{ userId }}');
        });

        it('should deny by default when no permission set exists', async () => {
            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            const result = await engine.checkPermission(context, 'contacts', 'read');

            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('No permission set defined');
        });

        it('should allow by default when configured and no permission set exists', async () => {
            const engine2 = new PermissionEngine(storage, {
                defaultDeny: false,
            });

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            const result = await engine2.checkPermission(context, 'contacts', 'read');

            expect(result.allowed).toBe(true);
        });
    });

    describe('checkFieldPermission', () => {
        it('should allow field access when profile is in visibleTo', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                fieldPermissions: {
                    salary: {
                        fieldName: 'salary',
                        visibleTo: ['admin', 'hr'],
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            const result = await engine.checkFieldPermission(context, 'contacts', 'salary', 'read');

            expect(result).toBe(true);
        });

        it('should deny field access when profile is not in visibleTo', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                fieldPermissions: {
                    salary: {
                        fieldName: 'salary',
                        visibleTo: ['admin', 'hr'],
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['sales'],
            };

            const result = await engine.checkFieldPermission(context, 'contacts', 'salary', 'read');

            expect(result).toBe(false);
        });

        it('should allow field edit when profile is in editableBy', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                fieldPermissions: {
                    salary: {
                        fieldName: 'salary',
                        visibleTo: ['admin', 'hr'],
                        editableBy: ['admin'],
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            const result = await engine.checkFieldPermission(context, 'contacts', 'salary', 'edit');

            expect(result).toBe(true);
        });

        it('should deny field edit when profile is not in editableBy', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                fieldPermissions: {
                    salary: {
                        fieldName: 'salary',
                        visibleTo: ['admin', 'hr'],
                        editableBy: ['admin'],
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['hr'],
            };

            const result = await engine.checkFieldPermission(context, 'contacts', 'salary', 'edit');

            expect(result).toBe(false);
        });

        it('should allow by default when field permission not defined', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                fieldPermissions: {},
            };

            await storage.storePermissionSet(permissionSet);

            const engine2 = new PermissionEngine(storage, {
                defaultDeny: false,
            });

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['sales'],
            };

            const result = await engine2.checkFieldPermission(context, 'contacts', 'name', 'read');

            expect(result).toBe(true);
        });
    });

    describe('filterFields', () => {
        it('should return only allowed fields', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                fieldPermissions: {
                    salary: {
                        fieldName: 'salary',
                        visibleTo: ['admin'],
                    },
                    ssn: {
                        fieldName: 'ssn',
                        visibleTo: ['admin', 'hr'],
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['hr'],
            };

            const fields = ['name', 'email', 'salary', 'ssn'];
            const allowedFields = await engine.filterFields(context, 'contacts', fields, 'read');

            expect(allowedFields).toContain('ssn');
            expect(allowedFields).not.toContain('salary');
        });
    });

    describe('getRecordFilters', () => {
        it('should return filters with userId replaced', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        viewFilters: {
                            owner: '{{ userId }}',
                        },
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user123',
                profiles: ['sales'],
            };

            const filters = await engine.getRecordFilters(context, 'contacts');

            expect(filters.owner).toBe('user123');
        });

        it('should replace multiple template variables', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        viewFilters: {
                            owner: '{{ userId }}',
                            department: '{{ dept }}',
                        },
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user123',
                profiles: ['sales'],
                metadata: {
                    dept: 'engineering',
                },
            };

            const filters = await engine.getRecordFilters(context, 'contacts');

            expect(filters.owner).toBe('user123');
            expect(filters.department).toBe('engineering');
        });

        it('should merge filters from multiple profiles', async () => {
            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    sales: {
                        objectName: 'contacts',
                        allowRead: true,
                        viewFilters: {
                            owner: '{{ userId }}',
                        },
                    },
                    manager: {
                        objectName: 'contacts',
                        allowRead: true,
                        viewFilters: {
                            department: 'sales',
                        },
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user123',
                profiles: ['sales', 'manager'],
            };

            const filters = await engine.getRecordFilters(context, 'contacts');

            expect(filters.owner).toBe('user123');
            expect(filters.department).toBe('sales');
        });
    });

    describe('cache', () => {
        it('should cache permission check results', async () => {
            const engineWithCache = new PermissionEngine(storage, {
                enableCache: true,
                cacheTTL: 1000,
            });

            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    admin: {
                        objectName: 'contacts',
                        allowRead: true,
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            // First call - should hit storage
            const result1 = await engineWithCache.checkPermission(context, 'contacts', 'read');

            // Clear storage to verify cache is used
            await storage.clear();

            // Second call - should use cache
            const result2 = await engineWithCache.checkPermission(context, 'contacts', 'read');

            expect(result1.allowed).toBe(true);
            expect(result2.allowed).toBe(true);
        });

        it('should expire cached results after TTL', async () => {
            const engineWithCache = new PermissionEngine(storage, {
                enableCache: true,
                cacheTTL: 100, // 100ms
            });

            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    admin: {
                        objectName: 'contacts',
                        allowRead: true,
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            // First call
            await engineWithCache.checkPermission(context, 'contacts', 'read');

            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            // Clear storage
            await storage.clear();

            // Should fail because cache expired and storage is empty
            const result = await engineWithCache.checkPermission(context, 'contacts', 'read');
            expect(result.allowed).toBe(false);
        });

        it('should clear cache', async () => {
            const engineWithCache = new PermissionEngine(storage, {
                enableCache: true,
            });

            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    admin: {
                        objectName: 'contacts',
                        allowRead: true,
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            await engineWithCache.checkPermission(context, 'contacts', 'read');

            engineWithCache.clearCache();
            await storage.clear();

            const result = await engineWithCache.checkPermission(context, 'contacts', 'read');
            expect(result.allowed).toBe(false);
        });

        it('should clear cache for specific user', async () => {
            const engineWithCache = new PermissionEngine(storage, {
                enableCache: true,
            });

            const permissionSet: PermissionSet = {
                name: 'contact-permissions',
                objectName: 'contacts',
                profiles: {
                    admin: {
                        objectName: 'contacts',
                        allowRead: true,
                    },
                },
            };

            await storage.storePermissionSet(permissionSet);

            const context1: PermissionContext = {
                userId: 'user1',
                profiles: ['admin'],
            };

            const context2: PermissionContext = {
                userId: 'user2',
                profiles: ['admin'],
            };

            await engineWithCache.checkPermission(context1, 'contacts', 'read');
            await engineWithCache.checkPermission(context2, 'contacts', 'read');

            engineWithCache.clearUserCache('user1');
            await storage.clear();

            // user1 cache cleared - should fail
            const result1 = await engineWithCache.checkPermission(context1, 'contacts', 'read');
            expect(result1.allowed).toBe(false);

            // user2 cache still active - should succeed
            const result2 = await engineWithCache.checkPermission(context2, 'contacts', 'read');
            expect(result2.allowed).toBe(true);
        });
    });
});
