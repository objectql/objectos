/**
 * Example demonstrating metadata protection feature
 * 
 * This example shows how the customizable flag protects system objects
 * and fields from modification, similar to Salesforce and other low-code platforms.
 */

import { MetadataRegistry } from '@objectql/metadata';
import { ObjectConfig } from '@objectql/metadata';

// Create a registry
const registry = new MetadataRegistry();

console.log('=== Metadata Protection Demo ===\n');

// 1. Register a system object (non-customizable)
console.log('1. Registering a system object (user)...');
const userObject: ObjectConfig = {
    name: 'user',
    customizable: false,  // System object - cannot be modified
    fields: {
        email: {
            type: 'email',
            required: true,
            customizable: false  // System field - cannot be modified
        },
        name: {
            type: 'text',
            customizable: true   // Allow modification of this field
        },
        createdAt: {
            type: 'datetime',
            customizable: false  // Audit field - protected
        },
        updatedAt: {
            type: 'datetime',
            customizable: false  // Audit field - protected
        }
    }
};

registry.register('object', {
    type: 'object',
    id: 'user',
    package: 'better-auth',
    content: userObject
});
console.log('✓ System object registered\n');

// 2. Try to validate modification (should fail)
console.log('2. Attempting to modify system object...');
try {
    registry.validateObjectCustomizable('user');
    console.log('✗ Should have thrown an error!');
} catch (error) {
    console.log(`✓ Protected: ${(error as Error).message}\n`);
}

// 3. Try to validate field modification
console.log('3. Attempting to modify system fields...');
try {
    registry.validateFieldCustomizable('user', 'email');
    console.log('✗ Should have thrown an error!');
} catch (error) {
    console.log(`✓ Protected: ${(error as Error).message}`);
}

try {
    registry.validateFieldCustomizable('user', 'createdAt');
    console.log('✗ Should have thrown an error!');
} catch (error) {
    console.log(`✓ Protected: ${(error as Error).message}\n`);
}

// 4. Validate customizable field (should succeed)
console.log('4. Attempting to modify customizable field...');
try {
    const result = registry.validateFieldCustomizable('user', 'name');
    console.log(`✓ Allowed: Field 'name' can be modified (customizable: true)\n`);
} catch (error) {
    console.log(`✗ Unexpected error: ${(error as Error).message}\n`);
}

// 5. Try to delete system object (should fail)
console.log('5. Attempting to delete system object...');
try {
    registry.unregister('object', 'user');
    console.log('✗ Should have thrown an error!');
} catch (error) {
    console.log(`✓ Protected: ${(error as Error).message}\n`);
}

// 6. Try to unregister package with system object (should fail)
console.log('6. Attempting to unregister package with system object...');
try {
    registry.unregisterPackage('better-auth');
    console.log('✗ Should have thrown an error!');
} catch (error) {
    console.log(`✓ Protected: ${(error as Error).message}\n`);
}

// 7. Register a customizable object
console.log('7. Registering a customizable object (project)...');
const projectObject: ObjectConfig = {
    name: 'project',
    customizable: true,  // Custom object - can be modified
    fields: {
        title: {
            type: 'text',
            required: true
        },
        description: {
            type: 'textarea'
        },
        createdAt: {
            type: 'datetime',
            customizable: false  // Even in custom objects, some fields can be protected
        }
    }
};

registry.register('object', {
    type: 'object',
    id: 'project',
    content: projectObject
});
console.log('✓ Custom object registered\n');

// 8. Validate modification of customizable object (should succeed)
console.log('8. Attempting to modify customizable object...');
try {
    const result = registry.validateObjectCustomizable('project');
    console.log(`✓ Allowed: Object 'project' can be modified (customizable: true)\n`);
} catch (error) {
    console.log(`✗ Unexpected error: ${(error as Error).message}\n`);
}

// 9. Delete customizable object (should succeed)
console.log('9. Attempting to delete customizable object...');
try {
    registry.unregister('object', 'project');
    console.log('✓ Allowed: Object successfully deleted\n');
} catch (error) {
    console.log(`✗ Unexpected error: ${(error as Error).message}\n`);
}

console.log('=== Demo Complete ===');
console.log('\nKey Takeaways:');
console.log('- System objects (customizable: false) cannot be modified or deleted');
console.log('- System fields (customizable: false) cannot be modified');
console.log('- Custom objects and fields can be freely modified');
console.log('- Packages with system objects cannot be unregistered');
console.log('- This protects critical infrastructure like authentication systems');
