/**
 * Object Permission Checker Tests
 */

import { ObjectPermissionChecker } from '../src/permissions/object-permissions';
import { PermissionSetLoader } from '../src/permissions/permission-set-loader';
import { User, PermissionSet } from '../src/permissions/types';

describe('ObjectPermissionChecker', () => {
    let loader: PermissionSetLoader;
    let checker: ObjectPermissionChecker;

    beforeEach(() => {
        loader = new PermissionSetLoader({ enableCache: true });
        checker = new ObjectPermissionChecker(loader);
    });

    const createUser = (profile?: string, permissionSets?: string[]): User => ({
        id: 'user123',
        username: 'testuser',
        profile,
        permissionSets,
    });

    const addPermissionSet = (permSet: PermissionSet) => {
        loader.addPermissionSet(permSet);
    };

    describe('canRead', () => {
        it('should allow read when user has allowRead permission', async () => {
            addPermissionSet({
                name: 'sales_user',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canRead(user, 'contacts');
            expect(result).toBe(true);
        });

        it('should allow read when user has viewAllRecords permission', async () => {
            addPermissionSet({
                name: 'admin',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: false,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: true,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('admin');
            const result = await checker.canRead(user, 'contacts');
            expect(result).toBe(true);
        });

        it('should deny read when user has no read permission', async () => {
            addPermissionSet({
                name: 'no_access',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: false,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('no_access');
            const result = await checker.canRead(user, 'contacts');
            expect(result).toBe(false);
        });

        it('should combine permissions from multiple permission sets', async () => {
            addPermissionSet({
                name: 'basic_user',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: false,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            addPermissionSet({
                name: 'contact_reader',
                isProfile: false,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('basic_user', ['contact_reader']);
            const result = await checker.canRead(user, 'contacts');
            expect(result).toBe(true);
        });
    });

    describe('canCreate', () => {
        it('should allow create when user has allowCreate permission', async () => {
            addPermissionSet({
                name: 'sales_user',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canCreate(user, 'contacts');
            expect(result).toBe(true);
        });

        it('should deny create when user has no create permission', async () => {
            addPermissionSet({
                name: 'read_only',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('read_only');
            const result = await checker.canCreate(user, 'contacts');
            expect(result).toBe(false);
        });
    });

    describe('canEdit', () => {
        it('should allow edit when user has allowEdit permission', async () => {
            addPermissionSet({
                name: 'sales_user',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: true,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canEdit(user, 'contacts', 'rec123');
            expect(result).toBe(true);
        });

        it('should allow edit when user has modifyAllRecords permission', async () => {
            addPermissionSet({
                name: 'admin',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: true,
                    },
                },
            });

            const user = createUser('admin');
            const result = await checker.canEdit(user, 'contacts', 'rec123');
            expect(result).toBe(true);
        });
    });

    describe('canDelete', () => {
        it('should allow delete when user has allowDelete permission', async () => {
            addPermissionSet({
                name: 'admin',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: true,
                        allowDelete: true,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('admin');
            const result = await checker.canDelete(user, 'contacts', 'rec123');
            expect(result).toBe(true);
        });

        it('should deny delete when user has no delete permission', async () => {
            addPermissionSet({
                name: 'sales_user',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: true,
                        allowEdit: true,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canDelete(user, 'contacts', 'rec123');
            expect(result).toBe(false);
        });
    });

    describe('canViewAll', () => {
        it('should return true when user has viewAllRecords permission', async () => {
            addPermissionSet({
                name: 'manager',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: true,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('manager');
            const result = await checker.canViewAll(user, 'contacts');
            expect(result).toBe(true);
        });

        it('should return false when user does not have viewAllRecords permission', async () => {
            addPermissionSet({
                name: 'sales_user',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canViewAll(user, 'contacts');
            expect(result).toBe(false);
        });
    });

    describe('canModifyAll', () => {
        it('should return true when user has modifyAllRecords permission', async () => {
            addPermissionSet({
                name: 'admin',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: false,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: true,
                    },
                },
            });

            const user = createUser('admin');
            const result = await checker.canModifyAll(user, 'contacts');
            expect(result).toBe(true);
        });

        it('should return false when user does not have modifyAllRecords permission', async () => {
            addPermissionSet({
                name: 'sales_user',
                isProfile: true,
                objects: {
                    contacts: {
                        allowRead: true,
                        allowCreate: false,
                        allowEdit: true,
                        allowDelete: false,
                        allowTransfer: false,
                        allowRestore: false,
                        allowPurge: false,
                        viewAllRecords: false,
                        modifyAllRecords: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canModifyAll(user, 'contacts');
            expect(result).toBe(false);
        });
    });
});
