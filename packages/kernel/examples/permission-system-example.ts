/**
 * Permission System Usage Example
 * 
 * This example demonstrates how to use the ObjectOS permission system.
 */

import { ObjectOS } from '../src/objectos';
import { User } from '../src/permissions/types';
import * as path from 'path';

async function main() {
    console.log('=== ObjectOS Permission System Example ===\n');

    // 1. Initialize ObjectOS with permission system enabled
    const objectos = new ObjectOS({
        permissions: {
            // Path to permission set YAML files
            permissionSetsPath: path.join(__dirname, 'permissions'),
            // Enable caching for better performance
            enableCache: true,
            // Enable permission checking
            enabled: true,
        },
    });

    // Initialize the system
    await objectos.init();

    // Get the permission manager
    const permissionManager = objectos.getPermissionManager();

    console.log('ObjectOS initialized with permission system\n');

    // 2. Define test users with different permission sets
    const salesUser: User = {
        id: 'user1',
        username: 'john.sales',
        profile: 'sales_user',
        permissionSets: [],
    };

    const salesManager: User = {
        id: 'user2',
        username: 'jane.manager',
        profile: 'sales_user',
        permissionSets: ['sales_manager'],
    };

    const admin: User = {
        id: 'user3',
        username: 'admin',
        profile: 'system_admin',
        permissionSets: [],
    };

    const readOnlyUser: User = {
        id: 'user4',
        username: 'viewer',
        profile: 'read_only',
        permissionSets: [],
    };

    // 3. Check object-level permissions
    console.log('--- Object-Level Permissions ---\n');

    // Sales User permissions
    console.log('Sales User (john.sales):');
    console.log('  Can read contacts:', await permissionManager.canRead(salesUser, 'contacts'));
    console.log('  Can create contacts:', await permissionManager.canCreate(salesUser, 'contacts'));
    console.log('  Can edit contacts:', await permissionManager.canEdit(salesUser, 'contacts'));
    console.log('  Can delete contacts:', await permissionManager.canDelete(salesUser, 'contacts'));
    console.log('  Can view all contacts:', await permissionManager.canViewAll(salesUser, 'contacts'));
    console.log('  Can modify all contacts:', await permissionManager.canModifyAll(salesUser, 'contacts'));
    console.log();

    // Sales Manager permissions
    console.log('Sales Manager (jane.manager):');
    console.log('  Can read contacts:', await permissionManager.canRead(salesManager, 'contacts'));
    console.log('  Can delete contacts:', await permissionManager.canDelete(salesManager, 'contacts'));
    console.log('  Can view all contacts:', await permissionManager.canViewAll(salesManager, 'contacts'));
    console.log('  Can modify all contacts:', await permissionManager.canModifyAll(salesManager, 'contacts'));
    console.log();

    // Admin permissions
    console.log('System Admin (admin):');
    console.log('  Can read contacts:', await permissionManager.canRead(admin, 'contacts'));
    console.log('  Can delete contacts:', await permissionManager.canDelete(admin, 'contacts'));
    console.log('  Can view all contacts:', await permissionManager.canViewAll(admin, 'contacts'));
    console.log('  Can modify all contacts:', await permissionManager.canModifyAll(admin, 'contacts'));
    console.log();

    // Read-only user permissions
    console.log('Read-Only User (viewer):');
    console.log('  Can read contacts:', await permissionManager.canRead(readOnlyUser, 'contacts'));
    console.log('  Can create contacts:', await permissionManager.canCreate(readOnlyUser, 'contacts'));
    console.log('  Can edit contacts:', await permissionManager.canEdit(readOnlyUser, 'contacts'));
    console.log('  Can delete contacts:', await permissionManager.canDelete(readOnlyUser, 'contacts'));
    console.log();

    // 4. Check field-level permissions
    console.log('--- Field-Level Permissions ---\n');

    const contactFields = ['id', 'first_name', 'last_name', 'email', 'phone', 'salary', 'created_date'];

    console.log('Sales User visible fields:');
    const salesUserVisibleFields = await permissionManager.getVisibleFields(
        salesUser,
        'contacts',
        contactFields
    );
    console.log(' ', salesUserVisibleFields.join(', '));
    console.log();

    console.log('Sales User editable fields:');
    const salesUserEditableFields = await permissionManager.getEditableFields(
        salesUser,
        'contacts',
        contactFields
    );
    console.log(' ', salesUserEditableFields.join(', '));
    console.log();

    console.log('Sales Manager visible fields:');
    const managerVisibleFields = await permissionManager.getVisibleFields(
        salesManager,
        'contacts',
        contactFields
    );
    console.log(' ', managerVisibleFields.join(', '));
    console.log();

    console.log('Admin visible fields:');
    const adminVisibleFields = await permissionManager.getVisibleFields(
        admin,
        'contacts',
        contactFields
    );
    console.log(' ', adminVisibleFields.join(', '));
    console.log();

    // 5. Filter record fields based on permissions
    console.log('--- Record Field Filtering ---\n');

    const contactRecord = {
        id: 'contact123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        salary: 100000,
        created_date: '2024-01-15',
        modified_date: '2024-01-20',
    };

    console.log('Original contact record:');
    console.log(JSON.stringify(contactRecord, null, 2));
    console.log();

    console.log('Filtered for Sales User (salary hidden):');
    const filteredForSales = await permissionManager.filterRecordFields(
        salesUser,
        'contacts',
        contactRecord
    );
    console.log(JSON.stringify(filteredForSales, null, 2));
    console.log();

    console.log('Filtered for Sales Manager (salary visible):');
    const filteredForManager = await permissionManager.filterRecordFields(
        salesManager,
        'contacts',
        contactRecord
    );
    console.log(JSON.stringify(filteredForManager, null, 2));
    console.log();

    console.log('Filtered for Read-Only User (salary hidden):');
    const filteredForReadOnly = await permissionManager.filterRecordFields(
        readOnlyUser,
        'contacts',
        contactRecord
    );
    console.log(JSON.stringify(filteredForReadOnly, null, 2));
    console.log();

    // 6. Check specific field permissions
    console.log('--- Specific Field Permission Checks ---\n');

    console.log('Can Sales User read salary field?',
        await permissionManager.canReadField(salesUser, 'contacts', 'salary'));
    console.log('Can Sales Manager read salary field?',
        await permissionManager.canReadField(salesManager, 'contacts', 'salary'));
    console.log('Can Admin read salary field?',
        await permissionManager.canReadField(admin, 'contacts', 'salary'));
    console.log();

    console.log('Can Sales User edit created_date field?',
        await permissionManager.canEditField(salesUser, 'contacts', 'created_date'));
    console.log('Can Admin edit created_date field?',
        await permissionManager.canEditField(admin, 'contacts', 'created_date'));
    console.log();

    console.log('=== Example Complete ===');
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
}

export default main;
