/**
 * Basic Usage Example for Browser Runtime Plugin
 *
 * This example demonstrates how to set up and use the browser runtime plugin
 * to run ObjectOS entirely in the browser.
 */

import { BrowserRuntimePlugin } from '@objectos/plugin-browser';

// Mock PluginContext for example purposes
class MockPluginContext {
  private services: Map<string, any> = new Map();

  logger = {
    info: (...args: any[]) => console.log('[INFO]', ...args),
    warn: (...args: any[]) => console.warn('[WARN]', ...args),
    error: (...args: any[]) => console.error('[ERROR]', ...args),
  };

  registerService(name: string, service: any): void {
    this.services.set(name, service);
  }

  getService(name: string): any {
    return this.services.get(name);
  }
}

async function main() {
  console.log('🚀 Starting Browser Runtime Plugin Example\n');

  // 1. Create plugin instance with configuration
  const plugin = new BrowserRuntimePlugin({
    database: {
      name: 'example-app.db',
      useOPFS: true, // Enable persistence
      initScripts: [
        // Create a simple tasks table
        `CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      ],
    },
    storage: {
      rootDir: 'example-files',
      maxQuota: 50 * 1024 * 1024, // 50MB
    },
    serviceWorker: {
      enabled: false, // Disabled for this example
      scriptPath: '/sw.js',
      apiBasePath: '/api',
    },
    worker: {
      enabled: false, // Disabled for this example
    },
  });

  // 2. Initialize plugin
  const context = new MockPluginContext();

  try {
    console.log('📦 Initializing plugin...');
    await plugin.init(context as any);

    console.log('▶️  Starting plugin...');
    await plugin.start(context as any);

    console.log('✅ Plugin initialized successfully!\n');

    // 3. Use the database
    const db = plugin.getDatabase();
    if (!db) {
      throw new Error('Database not initialized');
    }

    console.log('💾 Database Operations:');

    // Insert some tasks
    console.log('  - Inserting tasks...');
    await db.execute('INSERT INTO tasks (title, description) VALUES (?, ?)', [
      'Learn ObjectOS',
      'Understand the plugin architecture',
    ]);
    await db.execute('INSERT INTO tasks (title, description) VALUES (?, ?)', [
      'Build an app',
      'Create a simple CRM application',
    ]);
    await db.execute('INSERT INTO tasks (title, description) VALUES (?, ?)', [
      'Deploy to browser',
      'Test the browser runtime plugin',
    ]);

    // Query tasks
    console.log('  - Querying tasks...');
    const tasks = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
    console.log(`  - Found ${tasks.length} tasks:`);
    tasks.forEach((task: any, index: number) => {
      console.log(`    ${index + 1}. [${task.completed ? '✓' : ' '}] ${task.title}`);
      console.log(`       ${task.description}`);
    });

    // Update a task
    console.log('\n  - Marking first task as completed...');
    await db.execute('UPDATE tasks SET completed = 1 WHERE id = ?', [tasks[0].id]);

    // 4. Use the file storage
    const storage = plugin.getStorage();
    if (!storage) {
      throw new Error('Storage not initialized');
    }

    console.log('\n📁 File Storage Operations:');

    // Write a file
    console.log('  - Writing file...');
    const fileContent = new TextEncoder().encode('Hello from ObjectOS Browser Runtime!');
    await storage.writeFile('welcome.txt', fileContent);

    // Read the file
    console.log('  - Reading file...');
    const readContent = await storage.readFile('welcome.txt');
    const text = new TextDecoder().decode(readContent);
    console.log(`  - File content: "${text}"`);

    // Get file metadata
    const metadata = await storage.getMetadata('welcome.txt');
    console.log(`  - File size: ${metadata.size} bytes`);
    console.log(`  - Last modified: ${metadata.lastModified}`);

    // Check storage usage
    const usage = await storage.getStorageUsage();
    const usedMB = (usage.used / 1024 / 1024).toFixed(2);
    const quotaMB = (usage.quota / 1024 / 1024).toFixed(2);
    console.log(`  - Storage used: ${usedMB} MB / ${quotaMB} MB`);

    // 5. List files
    console.log('\n  - Listing files...');
    const files = await storage.listFiles();
    console.log(`  - Files in storage: ${files.join(', ')}`);

    console.log('\n✨ Example completed successfully!');

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await plugin.stop();
    console.log('✅ Plugin stopped');
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Run the example
if (typeof window !== 'undefined') {
  // Browser environment
  window.addEventListener('DOMContentLoaded', () => {
    main().catch(console.error);
  });
} else {
  // Node environment (for testing)
  console.log('⚠️  This example requires a browser environment');
  console.log('   Please run this in a browser with:');
  console.log('   - WebAssembly support');
  console.log('   - Origin Private File System (OPFS) support');
  console.log('   - Modern JavaScript support');
}
