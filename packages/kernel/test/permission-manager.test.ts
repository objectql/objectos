/**
 * Permission Manager Tests
 */

import { PermissionManager } from '../src/permissions';
import { User, PermissionSet } from '../src/permissions/types';

describe('PermissionManager', () => {
    let manager: PermissionManager;

    beforeEach(() => {
        manager = new PermissionManager({ enabled: true, enableCache: true });
        
        // Add test permission sets
        const loader = manager.getLoader();
        
        loader.addPermissionSet({
            name: 'test_user',
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
            fields: {
                'contacts.salary': {
                    readable: false,
                    editable: false,
                },
            },
        });
    });

    const createUser = (profile: string = 'test_user'): User => ({
        id: 'user123',
        username: 'testuser',
        profile,
    });

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            await expect(manager.init()).resolves.not.toThrow();
        });
    });

    describe('enabled/disabled behavior', () => {
        it('should enforce permissions when enabled', async () => {
            const enabledManager = new PermissionManager({ enabled: true });
            const loader = enabledManager.getLoader();
            
            loader.addPermissionSet({
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

            const user = { id: 'user1', profile: 'no_access' };
            const canRead = await enabledManager.canRead(user, 'contacts');
            expect(canRead).toBe(false);
        });

        it('should allow all operations when disabled', async () => {
            const disabledManager = new PermissionManager({ enabled: false });
            
            // No permission sets needed when disabled
            const user = { id: 'user1', profile: 'no_access' };
            
            expect(await disabledManager.canRead(user, 'contacts')).toBe(true);
            expect(await disabledManager.canCreate(user, 'contacts')).toBe(true);
            expect(await disabledManager.canEdit(user, 'contacts')).toBe(true);
            expect(await disabledManager.canDelete(user, 'contacts')).toBe(true);
        });

        it('should return all fields when disabled', async () => {
            const disabledManager = new PermissionManager({ enabled: false });
            const user = { id: 'user1', profile: 'no_access' };
            const allFields = ['field1', 'field2', 'field3'];
            
            const visibleFields = await disabledManager.getVisibleFields(user, 'contacts', allFields);
            expect(visibleFields).toEqual(allFields);
            
            const editableFields = await disabledManager.getEditableFields(user, 'contacts', allFields);
            expect(editableFields).toEqual(allFields);
        });
    });

    describe('object-level permission delegation', () => {
        it('should delegate canRead to ObjectPermissionChecker', async () => {
            const user = createUser();
            const result = await manager.canRead(user, 'contacts');
            expect(result).toBe(true);
        });

        it('should delegate canCreate to ObjectPermissionChecker', async () => {
            const user = createUser();
            const result = await manager.canCreate(user, 'contacts');
            expect(result).toBe(true);
        });

        it('should delegate canEdit to ObjectPermissionChecker', async () => {
            const user = createUser();
            const result = await manager.canEdit(user, 'contacts', 'rec123');
            expect(result).toBe(true);
        });

        it('should delegate canDelete to ObjectPermissionChecker', async () => {
            const user = createUser();
            const result = await manager.canDelete(user, 'contacts', 'rec123');
            expect(result).toBe(false);
        });

        it('should delegate canViewAll to ObjectPermissionChecker', async () => {
            const user = createUser();
            const result = await manager.canViewAll(user, 'contacts');
            expect(result).toBe(false);
        });

        it('should delegate canModifyAll to ObjectPermissionChecker', async () => {
            const user = createUser();
            const result = await manager.canModifyAll(user, 'contacts');
            expect(result).toBe(false);
        });
    });

    describe('field-level permission delegation', () => {
        it('should delegate getVisibleFields to FieldPermissionChecker', async () => {
            const user = createUser();
            const allFields = ['first_name', 'last_name', 'salary'];
            const visibleFields = await manager.getVisibleFields(user, 'contacts', allFields);
            
            expect(visibleFields).toContain('first_name');
            expect(visibleFields).toContain('last_name');
            expect(visibleFields).not.toContain('salary');
        });

        it('should delegate getEditableFields to FieldPermissionChecker', async () => {
            const user = createUser();
            const allFields = ['first_name', 'last_name', 'salary'];
            const editableFields = await manager.getEditableFields(user, 'contacts', allFields);
            
            expect(editableFields).toContain('first_name');
            expect(editableFields).toContain('last_name');
            expect(editableFields).not.toContain('salary');
        });

        it('should delegate canReadField to FieldPermissionChecker', async () => {
            const user = createUser();
            
            expect(await manager.canReadField(user, 'contacts', 'first_name')).toBe(true);
            expect(await manager.canReadField(user, 'contacts', 'salary')).toBe(false);
        });

        it('should delegate canEditField to FieldPermissionChecker', async () => {
            const user = createUser();
            
            expect(await manager.canEditField(user, 'contacts', 'first_name')).toBe(true);
            expect(await manager.canEditField(user, 'contacts', 'salary')).toBe(false);
        });

        it('should delegate filterRecordFields to FieldPermissionChecker', async () => {
            const user = createUser();
            const record = {
                id: 'rec123',
                first_name: 'John',
                last_name: 'Doe',
                salary: 100000,
            };

            const filtered = await manager.filterRecordFields(user, 'contacts', record);
            
            expect(filtered).toHaveProperty('id');
            expect(filtered).toHaveProperty('first_name');
            expect(filtered).toHaveProperty('last_name');
            expect(filtered).not.toHaveProperty('salary');
        });
    });

    describe('component access', () => {
        it('should provide access to PermissionSetLoader', () => {
            const loader = manager.getLoader();
            expect(loader).toBeDefined();
            expect(loader.getCachedPermissionSetNames()).toContain('test_user');
        });

        it('should provide access to ObjectPermissionChecker', () => {
            const checker = manager.getObjectChecker();
            expect(checker).toBeDefined();
        });

        it('should provide access to FieldPermissionChecker', () => {
            const checker = manager.getFieldChecker();
            expect(checker).toBeDefined();
        });
    });
});
