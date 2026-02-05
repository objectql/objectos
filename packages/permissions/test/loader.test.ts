/**
 * Tests for Permission Loader
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    loadPermissionSetFromYAML,
    loadPermissionSetFromFile,
    loadPermissionSetsFromDirectory,
} from '../src/loader.js';
import type { PermissionSet } from '../src/types.js';

describe('Permission Loader', () => {
    const testDir = path.join(__dirname, 'test-permissions');

    beforeEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
        fs.mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
    });

    describe('loadPermissionSetFromYAML', () => {
        it('should load permission set from YAML string', () => {
            const yaml = `
name: contact-permissions
objectName: contacts
label: Contact Permissions
description: Permissions for contacts object
profiles:
  admin:
    objectName: contacts
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: true
  sales:
    objectName: contacts
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: false
fieldPermissions:
  salary:
    fieldName: salary
    visibleTo:
      - admin
      - hr
    editableBy:
      - admin
`;

            const permissionSet = loadPermissionSetFromYAML(yaml);

            expect(permissionSet.name).toBe('contact-permissions');
            expect(permissionSet.objectName).toBe('contacts');
            expect(permissionSet.label).toBe('Contact Permissions');
            expect(permissionSet.profiles?.admin?.allowRead).toBe(true);
            expect(permissionSet.profiles?.sales?.allowDelete).toBe(false);
            expect(permissionSet.fieldPermissions?.salary?.visibleTo).toContain('admin');
        });

        it('should throw error for invalid YAML', () => {
            const invalidYaml = `
name: contact-permissions
# Missing objectName
`;

            expect(() => loadPermissionSetFromYAML(invalidYaml)).toThrow('missing name or objectName');
        });

        it('should handle empty profiles and fieldPermissions', () => {
            const yaml = `
name: minimal-permissions
objectName: contacts
`;

            const permissionSet = loadPermissionSetFromYAML(yaml);

            expect(permissionSet.profiles).toEqual({});
            expect(permissionSet.fieldPermissions).toEqual({});
        });
    });

    describe('loadPermissionSetFromFile', () => {
        it('should load permission set from .yml file', async () => {
            const filePath = path.join(testDir, 'contacts.yml');
            const yaml = `
name: contact-permissions
objectName: contacts
profiles:
  admin:
    objectName: contacts
    allowRead: true
`;

            fs.writeFileSync(filePath, yaml, 'utf8');

            const permissionSet = await loadPermissionSetFromFile(filePath);

            expect(permissionSet).not.toBeNull();
            expect(permissionSet?.name).toBe('contact-permissions');
            expect(permissionSet?.objectName).toBe('contacts');
        });

        it('should load permission set from .yaml file', async () => {
            const filePath = path.join(testDir, 'accounts.yaml');
            const yaml = `
name: account-permissions
objectName: accounts
profiles:
  admin:
    objectName: accounts
    allowRead: true
`;

            fs.writeFileSync(filePath, yaml, 'utf8');

            const permissionSet = await loadPermissionSetFromFile(filePath);

            expect(permissionSet).not.toBeNull();
            expect(permissionSet?.name).toBe('account-permissions');
        });

        it('should return null for invalid file', async () => {
            const filePath = path.join(testDir, 'invalid.yml');
            const yaml = `
name: invalid
# Missing objectName
`;

            fs.writeFileSync(filePath, yaml, 'utf8');

            const permissionSet = await loadPermissionSetFromFile(filePath);

            expect(permissionSet).toBeNull();
        });

        it('should return null for non-existent file', async () => {
            const filePath = path.join(testDir, 'non-existent.yml');

            const permissionSet = await loadPermissionSetFromFile(filePath);

            expect(permissionSet).toBeNull();
        });
    });

    describe('loadPermissionSetsFromDirectory', () => {
        it('should load multiple permission sets from directory', async () => {
            const contactsYaml = `
name: contact-permissions
objectName: contacts
profiles:
  admin:
    objectName: contacts
    allowRead: true
`;

            const accountsYaml = `
name: account-permissions
objectName: accounts
profiles:
  admin:
    objectName: accounts
    allowRead: true
`;

            fs.writeFileSync(path.join(testDir, 'contacts.yml'), contactsYaml, 'utf8');
            fs.writeFileSync(path.join(testDir, 'accounts.yaml'), accountsYaml, 'utf8');

            const permissionSets = await loadPermissionSetsFromDirectory(testDir);

            expect(permissionSets).toHaveLength(2);
            
            const contactsPermissions = permissionSets.find(p => p.name === 'contact-permissions');
            const accountsPermissions = permissionSets.find(p => p.name === 'account-permissions');

            expect(contactsPermissions).toBeDefined();
            expect(accountsPermissions).toBeDefined();
        });

        it('should return empty array for non-existent directory', async () => {
            const nonExistentDir = path.join(testDir, 'non-existent');

            const permissionSets = await loadPermissionSetsFromDirectory(nonExistentDir);

            expect(permissionSets).toEqual([]);
        });

        it('should skip invalid files', async () => {
            const validYaml = `
name: valid-permissions
objectName: contacts
profiles:
  admin:
    objectName: contacts
    allowRead: true
`;

            const invalidYaml = `
name: invalid
# Missing objectName
`;

            fs.writeFileSync(path.join(testDir, 'valid.yml'), validYaml, 'utf8');
            fs.writeFileSync(path.join(testDir, 'invalid.yml'), invalidYaml, 'utf8');

            const permissionSets = await loadPermissionSetsFromDirectory(testDir);

            expect(permissionSets).toHaveLength(1);
            expect(permissionSets[0].name).toBe('valid-permissions');
        });

        it('should skip non-YAML files', async () => {
            const yaml = `
name: contact-permissions
objectName: contacts
profiles:
  admin:
    objectName: contacts
    allowRead: true
`;

            fs.writeFileSync(path.join(testDir, 'permissions.yml'), yaml, 'utf8');
            fs.writeFileSync(path.join(testDir, 'readme.txt'), 'This is a readme', 'utf8');
            fs.writeFileSync(path.join(testDir, 'config.json'), '{}', 'utf8');

            const permissionSets = await loadPermissionSetsFromDirectory(testDir);

            expect(permissionSets).toHaveLength(1);
            expect(permissionSets[0].name).toBe('contact-permissions');
        });
    });
});
