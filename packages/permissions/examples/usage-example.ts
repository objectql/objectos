/**
 * Permissions Plugin Usage Example
 * 
 * This example demonstrates how to use the Permissions Plugin
 * in an ObjectOS application.
 */

import { PermissionsPlugin, createPermissionsPlugin } from '../src.js';

// Example 1: Create a plugin instance
console.log('=== Example 1: Creating Permissions Plugin ===');
const permissionsPlugin = createPermissionsPlugin({
    enabled: true,
    defaultDeny: true,
    permissionsDir: './examples',
    cachePermissions: true,
});

console.log('Plugin created:', permissionsPlugin.name, 'v' + permissionsPlugin.version);
console.log('Dependencies:', permissionsPlugin.dependencies);

// Example 2: Load permission sets programmatically
console.log('\n=== Example 2: Loading Permission Sets ===');
const storage = permissionsPlugin.getStorage();
const engine = permissionsPlugin.getEngine();

async function loadExamplePermissions() {
    // Load a permission set
    await storage.storePermissionSet({
        name: 'example-permissions',
        objectName: 'tasks',
        label: 'Task Permissions',
        profiles: {
            admin: {
                objectName: 'tasks',
                allowRead: true,
                allowCreate: true,
                allowEdit: true,
                allowDelete: true,
            },
            user: {
                objectName: 'tasks',
                allowRead: true,
                allowCreate: true,
                allowEdit: true,
                allowDelete: false,
                viewFilters: {
                    assignee: '{{ userId }}',
                },
            },
        },
        fieldPermissions: {
            budget: {
                fieldName: 'budget',
                visibleTo: ['admin', 'manager'],
                editableBy: ['admin'],
            },
        },
    });

    console.log('Permission set loaded successfully');
}

// Example 3: Check permissions
async function checkPermissionExamples() {
    console.log('\n=== Example 3: Checking Permissions ===');

    // Admin user
    const adminContext = {
        userId: 'admin-001',
        profiles: ['admin'],
    };

    const adminCanDelete = await engine.checkPermission(adminContext, 'tasks', 'delete');
    console.log('Admin can delete tasks:', adminCanDelete.allowed);

    // Regular user
    const userContext = {
        userId: 'user-001',
        profiles: ['user'],
    };

    const userCanDelete = await engine.checkPermission(userContext, 'tasks', 'delete');
    console.log('User can delete tasks:', userCanDelete.allowed);

    const userCanCreate = await engine.checkPermission(userContext, 'tasks', 'create');
    console.log('User can create tasks:', userCanCreate.allowed);

    // Field permissions
    const adminCanViewBudget = await engine.checkFieldPermission(
        adminContext,
        'tasks',
        'budget',
        'read'
    );
    console.log('Admin can view budget field:', adminCanViewBudget);

    const userCanViewBudget = await engine.checkFieldPermission(
        userContext,
        'tasks',
        'budget',
        'read'
    );
    console.log('User can view budget field:', userCanViewBudget);
}

// Example 4: Record-level security
async function recordLevelSecurityExample() {
    console.log('\n=== Example 4: Record-Level Security ===');

    const userContext = {
        userId: 'user-001',
        profiles: ['user'],
    };

    const filters = await engine.getRecordFilters(userContext, 'tasks');
    console.log('Record filters for user:', JSON.stringify(filters, null, 2));
    console.log('User will only see tasks where assignee = user-001');
}

// Example 5: Field filtering
async function fieldFilteringExample() {
    console.log('\n=== Example 5: Field Filtering ===');

    const allFields = ['name', 'description', 'status', 'budget', 'assignee'];

    const userContext = {
        userId: 'user-001',
        profiles: ['user'],
    };

    const readableFields = await engine.filterFields(
        userContext,
        'tasks',
        allFields,
        'read'
    );

    console.log('All fields:', allFields);
    console.log('Readable fields for user:', readableFields);
    console.log('Hidden fields:', allFields.filter(f => !readableFields.includes(f)));
}

// Run all examples
async function runExamples() {
    try {
        await loadExamplePermissions();
        await checkPermissionExamples();
        await recordLevelSecurityExample();
        await fieldFilteringExample();

        console.log('\n=== All Examples Completed Successfully! ===');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}

export { runExamples };
