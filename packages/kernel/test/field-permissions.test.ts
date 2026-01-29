/**
 * Field Permission Checker Tests
 */

import { FieldPermissionChecker } from '../src/permissions/field-permissions';
import { PermissionSetLoader } from '../src/permissions/permission-set-loader';
import { User, PermissionSet } from '../src/permissions/types';

describe('FieldPermissionChecker', () => {
    let loader: PermissionSetLoader;
    let checker: FieldPermissionChecker;

    beforeEach(() => {
        loader = new PermissionSetLoader({ enableCache: true });
        checker = new FieldPermissionChecker(loader);
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

    describe('getVisibleFields', () => {
        it('should return all fields when user has read permission on object', async () => {
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
            const allFields = ['first_name', 'last_name', 'email', 'phone'];
            const visibleFields = await checker.getVisibleFields(user, 'contacts', allFields);

            expect(visibleFields).toHaveLength(4);
            expect(visibleFields).toContain('first_name');
            expect(visibleFields).toContain('last_name');
            expect(visibleFields).toContain('email');
            expect(visibleFields).toContain('phone');
        });

        it('should exclude non-readable fields when field permissions are set', async () => {
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
                fields: {
                    'contacts.salary': {
                        readable: false,
                        editable: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const allFields = ['first_name', 'last_name', 'email', 'salary'];
            const visibleFields = await checker.getVisibleFields(user, 'contacts', allFields);

            expect(visibleFields).toHaveLength(3);
            expect(visibleFields).toContain('first_name');
            expect(visibleFields).toContain('last_name');
            expect(visibleFields).toContain('email');
            expect(visibleFields).not.toContain('salary');
        });

        it('should return empty array when user has no read permission', async () => {
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
            const allFields = ['first_name', 'last_name', 'email'];
            const visibleFields = await checker.getVisibleFields(user, 'contacts', allFields);

            expect(visibleFields).toHaveLength(0);
        });
    });

    describe('getEditableFields', () => {
        it('should return all fields when user has edit permission on object', async () => {
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
            const allFields = ['first_name', 'last_name', 'email', 'phone'];
            const editableFields = await checker.getEditableFields(user, 'contacts', allFields);

            expect(editableFields).toHaveLength(4);
            expect(editableFields).toContain('first_name');
            expect(editableFields).toContain('last_name');
            expect(editableFields).toContain('email');
            expect(editableFields).toContain('phone');
        });

        it('should exclude non-editable fields when field permissions are set', async () => {
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
                fields: {
                    'contacts.created_date': {
                        readable: true,
                        editable: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const allFields = ['first_name', 'last_name', 'email', 'created_date'];
            const editableFields = await checker.getEditableFields(user, 'contacts', allFields);

            expect(editableFields).toHaveLength(3);
            expect(editableFields).toContain('first_name');
            expect(editableFields).toContain('last_name');
            expect(editableFields).toContain('email');
            expect(editableFields).not.toContain('created_date');
        });

        it('should return empty array when user has no edit permission', async () => {
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
            const allFields = ['first_name', 'last_name', 'email'];
            const editableFields = await checker.getEditableFields(user, 'contacts', allFields);

            expect(editableFields).toHaveLength(0);
        });
    });

    describe('canReadField', () => {
        it('should allow reading field when user has object read permission', async () => {
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
            const result = await checker.canReadField(user, 'contacts', 'first_name');
            expect(result).toBe(true);
        });

        it('should deny reading field when field permission is set to false', async () => {
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
                fields: {
                    'contacts.salary': {
                        readable: false,
                        editable: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canReadField(user, 'contacts', 'salary');
            expect(result).toBe(false);
        });
    });

    describe('canEditField', () => {
        it('should allow editing field when user has object edit permission', async () => {
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
            const result = await checker.canEditField(user, 'contacts', 'first_name');
            expect(result).toBe(true);
        });

        it('should deny editing field when field permission is set to false', async () => {
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
                fields: {
                    'contacts.created_date': {
                        readable: true,
                        editable: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const result = await checker.canEditField(user, 'contacts', 'created_date');
            expect(result).toBe(false);
        });
    });

    describe('filterRecordFields', () => {
        it('should filter out non-visible fields from record', async () => {
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
                fields: {
                    'contacts.salary': {
                        readable: false,
                        editable: false,
                    },
                },
            });

            const user = createUser('sales_user');
            const record = {
                id: 'rec123',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                salary: 100000,
            };

            const filteredRecord = await checker.filterRecordFields(user, 'contacts', record);

            expect(filteredRecord).toHaveProperty('id');
            expect(filteredRecord).toHaveProperty('first_name');
            expect(filteredRecord).toHaveProperty('last_name');
            expect(filteredRecord).toHaveProperty('email');
            expect(filteredRecord).not.toHaveProperty('salary');
        });

        it('should return empty object when user has no read permission', async () => {
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
            const record = {
                id: 'rec123',
                first_name: 'John',
                last_name: 'Doe',
            };

            const filteredRecord = await checker.filterRecordFields(user, 'contacts', record);

            expect(Object.keys(filteredRecord)).toHaveLength(0);
        });
    });
});
