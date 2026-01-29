/**
 * CRUD Integration Example
 * 
 * Demonstrates how to integrate permission checking with CRUD operations.
 */

import { ObjectOS } from '../src/objectos';
import { User } from '../src/permissions/types';
import { createPermissionAwareCRUD, ForbiddenError } from '../src/permissions/permission-aware-crud';
import * as path from 'path';

async function main() {
    console.log('=== Permission-Aware CRUD Integration Example ===\n');

    // 1. Initialize ObjectOS with permissions
    const objectos = new ObjectOS({
        permissions: {
            permissionSetsPath: path.join(__dirname, 'permissions'),
            enableCache: true,
            enabled: true,
        },
    });

    await objectos.init();

    // 2. Create permission-aware CRUD helper
    const crud = createPermissionAwareCRUD(objectos);

    // 3. Define test users
    const salesUser: User = {
        id: 'sales001',
        username: 'john.sales',
        profile: 'sales_user',
    };

    const readOnlyUser: User = {
        id: 'viewer001',
        username: 'viewer',
        profile: 'read_only',
    };

    const admin: User = {
        id: 'admin001',
        username: 'admin',
        profile: 'system_admin',
    };

    console.log('--- Example 1: Insert with Permission Checking ---\n');

    try {
        console.log('Sales User attempting to create contact...');
        const newContact = {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1234567890',
            salary: 85000,
            created_date: new Date().toISOString(), // System field - should be filtered
        };

        const insertedContact = await crud.insert(salesUser, 'contacts', newContact);
        console.log('✓ Contact created successfully');
        console.log('  Inserted data:', JSON.stringify(insertedContact, null, 2));
        console.log('  Note: salary field was included, created_date was filtered (read-only)\n');
    } catch (error) {
        if (error instanceof ForbiddenError) {
            console.log('✗ Permission denied:', error.message);
        }
    }

    try {
        console.log('Read-Only User attempting to create contact...');
        const newContact = {
            first_name: 'Bob',
            last_name: 'Johnson',
            email: 'bob@example.com',
        };

        await crud.insert(readOnlyUser, 'contacts', newContact);
        console.log('✓ Contact created');
    } catch (error) {
        if (error instanceof ForbiddenError) {
            console.log('✗ Permission denied:', error.message);
            console.log('  Expected: Read-only users cannot create records\n');
        }
    }

    console.log('--- Example 2: Update with Permission Checking ---\n');

    try {
        console.log('Sales User attempting to update contact...');
        const updateData = {
            phone: '+9876543210',
            salary: 90000, // Sales users cannot edit salary
            created_date: new Date().toISOString(), // System field - read-only
        };

        const updatedContact = await crud.update(salesUser, 'contacts', 'contact123', updateData);
        console.log('✓ Contact updated successfully');
        console.log('  Updated data:', JSON.stringify(updatedContact, null, 2));
        console.log('  Note: Only phone was updated, salary and created_date were filtered\n');
    } catch (error) {
        if (error instanceof ForbiddenError) {
            console.log('✗ Permission denied:', error.message);
        }
    }

    try {
        console.log('Admin attempting to update contact...');
        const updateData = {
            phone: '+1111111111',
            salary: 95000,
            created_date: new Date().toISOString(),
        };

        const updatedContact = await crud.update(admin, 'contacts', 'contact123', updateData);
        console.log('✓ Contact updated successfully');
        console.log('  Updated data:', JSON.stringify(updatedContact, null, 2));
        console.log('  Note: Admin can update all fields including salary\n');
    } catch (error) {
        if (error instanceof ForbiddenError) {
            console.log('✗ Permission denied:', error.message);
        }
    }

    console.log('--- Example 3: Delete with Permission Checking ---\n');

    try {
        console.log('Sales User attempting to delete contact...');
        await crud.delete(salesUser, 'contacts', 'contact456');
        console.log('✓ Contact deleted');
    } catch (error) {
        if (error instanceof ForbiddenError) {
            console.log('✗ Permission denied:', error.message);
            console.log('  Expected: Sales users cannot delete contacts\n');
        }
    }

    try {
        console.log('Admin attempting to delete contact...');
        await crud.delete(admin, 'contacts', 'contact456');
        console.log('✓ Contact deleted successfully');
        console.log('  Note: Admin has delete permission\n');
    } catch (error) {
        if (error instanceof ForbiddenError) {
            console.log('✗ Permission denied:', error.message);
        }
    }

    console.log('--- Example 4: Find with Field Filtering ---\n');

    // Note: In a real implementation, this would query the database
    console.log('Sales User querying contacts...');
    const salesUserRecords = await crud.find(salesUser, 'contacts', {});
    console.log('  Retrieved records with visible fields only');
    console.log('  (salary field would be filtered out)\n');

    console.log('Admin querying contacts...');
    const adminRecords = await crud.find(admin, 'contacts', {});
    console.log('  Retrieved records with all fields');
    console.log('  (no field filtering for admin)\n');

    console.log('--- Example 5: Permission Denial Scenarios ---\n');

    const scenarios = [
        {
            user: readOnlyUser,
            operation: 'create',
            description: 'Read-only user creating record',
        },
        {
            user: readOnlyUser,
            operation: 'update',
            description: 'Read-only user updating record',
        },
        {
            user: readOnlyUser,
            operation: 'delete',
            description: 'Read-only user deleting record',
        },
        {
            user: salesUser,
            operation: 'delete',
            description: 'Sales user deleting record',
        },
    ];

    for (const scenario of scenarios) {
        try {
            console.log(`Attempting: ${scenario.description}`);
            
            switch (scenario.operation) {
                case 'create':
                    await crud.insert(scenario.user, 'contacts', { first_name: 'Test' });
                    break;
                case 'update':
                    await crud.update(scenario.user, 'contacts', 'contact123', { first_name: 'Test' });
                    break;
                case 'delete':
                    await crud.delete(scenario.user, 'contacts', 'contact123');
                    break;
            }
            
            console.log('  ✓ Operation allowed (unexpected)');
        } catch (error) {
            if (error instanceof ForbiddenError) {
                console.log(`  ✗ Denied: ${error.message} (expected)`);
            }
        }
    }

    console.log('\n=== Integration Example Complete ===');
    console.log('\nKey Takeaways:');
    console.log('1. Permission checks are enforced before CRUD operations');
    console.log('2. Field-level permissions filter visible and editable fields');
    console.log('3. System fields (created_date, modified_date) are automatically managed');
    console.log('4. Audit fields (created_by, modified_by) are automatically added');
    console.log('5. Users with different permission sets have different access levels');
}

// Run the example
if (require.main === module) {
    main().catch(console.error);
}

export default main;
