/**
 * Example: Using the Better-Auth Plugin in ObjectOS
 * 
 * This example demonstrates how to integrate the Better-Auth plugin
 * into an ObjectOS application.
 */

import { ObjectOS } from '@objectos/kernel';
import { BetterAuthPlugin, createBetterAuthPlugin } from '@objectos/plugin-better-auth';

/**
 * Example 1: Using the default plugin
 */
async function example1() {
    const os = new ObjectOS({
        plugins: [BetterAuthPlugin],
    });

    await os.init();
    console.log('ObjectOS initialized with Better-Auth plugin (default config)');
}

/**
 * Example 2: Using custom configuration
 */
async function example2() {
    const customAuthPlugin = createBetterAuthPlugin({
        // Use a specific database
        databaseUrl: process.env.DATABASE_URL || 'sqlite:auth.db',
        
        // Set the base URL for auth endpoints
        baseURL: 'https://myapp.com/api/auth',
        
        // Configure trusted origins for CORS
        trustedOrigins: [
            'https://myapp.com',
            'https://app.myapp.com',
            'http://localhost:3000'
        ]
    });

    const os = new ObjectOS({
        plugins: [customAuthPlugin],
    });

    await os.init();
    console.log('ObjectOS initialized with Better-Auth plugin (custom config)');
}

/**
 * Example 3: Using with other plugins
 */
async function example3() {
    // Import other plugins as needed
    // import { WorkflowPlugin } from '@objectos/plugin-workflow';
    // import { DataPlugin } from '@objectos/plugin-data';

    const os = new ObjectOS({
        plugins: [
            BetterAuthPlugin,
            // WorkflowPlugin,
            // DataPlugin,
        ],
    });

    await os.init();
    console.log('ObjectOS initialized with multiple plugins');
}

/**
 * Example 4: Accessing the auth instance from another plugin or service
 */
async function example4() {
    const { getBetterAuth } = await import('@objectos/plugin-better-auth');
    
    // Get the auth instance (initialized by the plugin)
    const auth = await getBetterAuth();
    
    // You can now use the auth instance directly
    console.log('Auth instance available for direct usage');
}

// Run examples (uncomment to test)
// example1();
// example2();
// example3();
// example4();

export { example1, example2, example3, example4 };
