/**
 * Permission Set Loader Tests
 */

import { PermissionSetLoader } from '../src/permissions/permission-set-loader';
import { PermissionSet } from '../src/permissions/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PermissionSetLoader', () => {
    let tempDir: string;
    let loader: PermissionSetLoader;

    beforeEach(() => {
        // Create a temporary directory for test files
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'permission-test-'));
        loader = new PermissionSetLoader({
            permissionSetsPath: tempDir,
            enableCache: true,
        });
    });

    afterEach(() => {
        // Clean up temp directory
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    describe('loadPermissionSet', () => {
        it('should load a valid permission set from YAML file', async () => {
            // Create a test permission set file
            const permissionSet: PermissionSet = {
                name: 'sales_user',
                label: 'Sales User',
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
            };

            const filePath = path.join(tempDir, 'sales_user.yml');
            fs.writeFileSync(filePath, `
name: sales_user
label: Sales User
isProfile: true
objects:
  contacts:
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: false
fields:
  contacts.salary:
    readable: false
    editable: false
`);

            const result = await loader.loadPermissionSet('sales_user');

            expect(result).toBeDefined();
            expect(result?.name).toBe('sales_user');
            expect(result?.label).toBe('Sales User');
            expect(result?.isProfile).toBe(true);
            expect(result?.objects.contacts.allowRead).toBe(true);
            expect(result?.objects.contacts.allowDelete).toBe(false);
            expect(result?.fields?.['contacts.salary']?.readable).toBe(false);
        });

        it('should return undefined for non-existent permission set', async () => {
            const result = await loader.loadPermissionSet('non_existent');
            expect(result).toBeUndefined();
        });

        it('should cache loaded permission sets', async () => {
            const filePath = path.join(tempDir, 'test_perm.yml');
            fs.writeFileSync(filePath, `
name: test_perm
objects:
  contacts:
    allowRead: true
`);

            // Load first time
            const result1 = await loader.loadPermissionSet('test_perm');
            expect(result1).toBeDefined();

            // Delete the file
            fs.unlinkSync(filePath);

            // Load second time (should come from cache)
            const result2 = await loader.loadPermissionSet('test_perm');
            expect(result2).toBeDefined();
            expect(result2).toEqual(result1);
        });

        it('should support both .yml and .yaml extensions', async () => {
            const ymlPath = path.join(tempDir, 'test_yml.yml');
            fs.writeFileSync(ymlPath, `
name: test_yml
objects:
  contacts:
    allowRead: true
`);

            const yamlPath = path.join(tempDir, 'test_yaml.yaml');
            fs.writeFileSync(yamlPath, `
name: test_yaml
objects:
  accounts:
    allowRead: true
`);

            const result1 = await loader.loadPermissionSet('test_yml');
            expect(result1).toBeDefined();
            expect(result1?.name).toBe('test_yml');

            const result2 = await loader.loadPermissionSet('test_yaml');
            expect(result2).toBeDefined();
            expect(result2?.name).toBe('test_yaml');
        });
    });

    describe('loadAllPermissionSets', () => {
        it('should load all permission sets from directory', async () => {
            // Create multiple permission set files
            fs.writeFileSync(path.join(tempDir, 'perm1.yml'), `
name: perm1
objects:
  contacts:
    allowRead: true
`);

            fs.writeFileSync(path.join(tempDir, 'perm2.yml'), `
name: perm2
objects:
  accounts:
    allowRead: true
`);

            const results = await loader.loadAllPermissionSets();

            expect(results).toHaveLength(2);
            expect(results.find(p => p.name === 'perm1')).toBeDefined();
            expect(results.find(p => p.name === 'perm2')).toBeDefined();
        });

        it('should return empty array for non-existent directory', async () => {
            const nonExistentLoader = new PermissionSetLoader({
                permissionSetsPath: '/non/existent/path',
            });

            const results = await nonExistentLoader.loadAllPermissionSets();
            expect(results).toEqual([]);
        });
    });

    describe('addPermissionSet', () => {
        it('should add a valid permission set to cache', () => {
            const permissionSet: PermissionSet = {
                name: 'test_add',
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
            };

            loader.addPermissionSet(permissionSet);

            const cached = loader.getCachedPermissionSetNames();
            expect(cached).toContain('test_add');
        });

        it('should throw error for invalid permission set', () => {
            const invalidPermissionSet: any = {
                // Missing required 'name' field
                objects: {},
            };

            expect(() => loader.addPermissionSet(invalidPermissionSet)).toThrow();
        });
    });

    describe('cache management', () => {
        it('should clear all cache', async () => {
            const filePath = path.join(tempDir, 'test_clear.yml');
            fs.writeFileSync(filePath, `
name: test_clear
objects:
  contacts:
    allowRead: true
`);

            await loader.loadPermissionSet('test_clear');
            expect(loader.getCachedPermissionSetNames()).toContain('test_clear');

            loader.clearCache();
            expect(loader.getCachedPermissionSetNames()).toHaveLength(0);
        });

        it('should remove specific permission set from cache', async () => {
            const filePath = path.join(tempDir, 'test_remove.yml');
            fs.writeFileSync(filePath, `
name: test_remove
objects:
  contacts:
    allowRead: true
`);

            await loader.loadPermissionSet('test_remove');
            expect(loader.getCachedPermissionSetNames()).toContain('test_remove');

            loader.removeFromCache('test_remove');
            expect(loader.getCachedPermissionSetNames()).not.toContain('test_remove');
        });
    });
});
