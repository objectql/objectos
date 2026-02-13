# @objectos/plugin-browser

Browser Runtime Plugin for ObjectOS - enables running the entire ObjectOS backend in a web browser.

## Overview

This plugin provides a complete browser-based runtime environment for ObjectOS, allowing applications to run fully offline without requiring a server backend. It implements browser equivalents for all server-side components:

| Server Component              | Browser Replacement | Implementation                                     |
| ----------------------------- | ------------------- | -------------------------------------------------- |
| Database (PostgreSQL/MongoDB) | SQLite WASM + OPFS  | sql.js with Origin Private File System persistence |
| File Storage (S3/MinIO)       | OPFS                | Origin Private File System API                     |
| API Service (Express/Koa)     | Service Worker      | MSW-like request interception                      |
| Business Logic (Node.js)      | Web Worker          | Isolated execution context                         |

## Features

- ✅ **SQLite WASM Database**: Full SQL database running in WebAssembly
- ✅ **OPFS Persistence**: Persistent storage using Origin Private File System
- ✅ **Service Worker API**: Intercept and handle API requests in the browser
- ✅ **Web Worker Isolation**: Execute business logic in a separate thread
- ✅ **Offline-First**: Works completely offline once loaded
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Plugin Architecture**: Follows ObjectOS plugin standards

## Installation

```bash
npm install @objectos/plugin-browser
# or
pnpm add @objectos/plugin-browser
```

## Quick Start

### 1. Register the Plugin

```typescript
import { BrowserRuntimePlugin } from '@objectos/plugin-browser';
import { ObjectOS } from '@objectstack/runtime';

const kernel = new ObjectOS();

// Register browser runtime plugin
const browserPlugin = new BrowserRuntimePlugin({
  database: {
    name: 'my-app.db',
    useOPFS: true,
    initScripts: [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )`,
    ],
  },
  storage: {
    rootDir: 'my-app-files',
    maxQuota: 100 * 1024 * 1024, // 100MB
  },
  serviceWorker: {
    enabled: true,
    scriptPath: '/sw.js',
    apiBasePath: '/api',
  },
});

await kernel.registerPlugin(browserPlugin);
await kernel.start();
```

### 2. Create Service Worker Script

Create a file `public/sw.js` with the following content:

```javascript
import { SERVICE_WORKER_SCRIPT } from '@objectos/plugin-browser';

// Inject the service worker script
eval(SERVICE_WORKER_SCRIPT);
```

Or copy the service worker template from the package.

### 3. Use the Database

```typescript
// Get database instance
const database = browserPlugin.getDatabase();

// Execute queries
const users = await database.query('SELECT * FROM users');

// Execute mutations
await database.execute('INSERT INTO users (name, email) VALUES (?, ?)', [
  'John Doe',
  'john@example.com',
]);
```

### 4. Use File Storage

```typescript
// Get storage instance
const storage = browserPlugin.getStorage();

// Write a file
const fileData = new TextEncoder().encode('Hello, World!');
await storage.writeFile('documents/hello.txt', fileData);

// Read a file
const data = await storage.readFile('documents/hello.txt');
console.log(new TextDecoder().decode(data));

// List files
const files = await storage.listFiles('documents');

// Get storage usage
const usage = await storage.getStorageUsage();
console.log(`Used: ${usage.used} / ${usage.quota} bytes`);
```

## Architecture

### Database Layer

The SQLite WASM driver uses [sql.js](https://github.com/sql-js/sql.js) to provide a full SQL database in the browser:

```typescript
const driver = new SQLiteWASMDriver({
  name: 'mydb.db',
  useOPFS: true, // Persist to disk
  initScripts: ['CREATE TABLE ...'],
});

await driver.connect();
const results = await driver.query('SELECT * FROM users');
```

**Persistence**: When `useOPFS` is enabled, the database is automatically saved to OPFS:

- Auto-saves every 5 seconds
- Saves on page unload
- Loads existing database on connect

### Storage Layer

The OPFS storage backend provides file system operations:

```typescript
const storage = new OPFSStorageBackend({
  rootDir: 'app-files',
  maxQuota: 100 * 1024 * 1024,
});

await storage.init();
await storage.writeFile('path/to/file.txt', data);
```

**File Operations**:

- `writeFile(path, data)`: Write file
- `readFile(path)`: Read file
- `deleteFile(path)`: Delete file
- `exists(path)`: Check existence
- `listFiles(path)`: List directory
- `getMetadata(path)`: Get file info
- `getStorageUsage()`: Check quota

### Service Worker Layer

The service worker intercepts API requests and routes them to browser-based handlers:

```typescript
const sw = new ServiceWorkerManager('/api');
await sw.register('/sw.js');

// Register a handler
sw.registerHandler('/api/users', async (request) => {
  const users = await database.query('SELECT * FROM users');
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Request Flow**:

1. Frontend makes `fetch('/api/users')`
2. Service Worker intercepts the request
3. Routes to registered handler
4. Handler executes database query
5. Returns response to frontend

### Web Worker Layer

The web worker provides isolated execution for business logic:

```typescript
const worker = new WorkerManager();
await worker.init('/worker.js');

// Execute query in worker
const results = await worker.executeQuery('SELECT * FROM users');

// Execute mutation
await worker.executeMutation('INSERT INTO users ...');
```

## Configuration

### BrowserRuntimeConfig

```typescript
interface BrowserRuntimeConfig {
  database?: {
    name?: string; // Database file name
    useOPFS?: boolean; // Enable persistence
    initScripts?: string[]; // Initial SQL
  };

  storage?: {
    rootDir?: string; // OPFS root directory
    maxQuota?: number; // Max storage in bytes
  };

  serviceWorker?: {
    enabled?: boolean; // Enable SW
    scriptPath?: string; // SW script path
    apiBasePath?: string; // API base path
  };

  worker?: {
    enabled?: boolean; // Enable Web Worker
    scriptPath?: string; // Worker script path
  };
}
```

## Browser Compatibility

Requires modern browsers with support for:

- ✅ WebAssembly
- ✅ Origin Private File System (OPFS)
- ✅ Service Workers
- ✅ Web Workers
- ✅ IndexedDB (for metadata)

**Supported Browsers**:

- Chrome/Edge 102+
- Firefox 111+
- Safari 15.2+

## Examples

### Complete CRM Example

```typescript
import { BrowserRuntimePlugin } from '@objectos/plugin-browser';

// Initialize plugin
const plugin = new BrowserRuntimePlugin({
  database: {
    name: 'crm.db',
    useOPFS: true,
    initScripts: [
      `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        industry TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
    ],
  },
});

// Register with kernel
await kernel.registerPlugin(plugin);

const db = plugin.getDatabase();

// Create contact
await db.execute('INSERT INTO contacts (first_name, last_name, email) VALUES (?, ?, ?)', [
  'John',
  'Doe',
  'john@example.com',
]);

// Query contacts
const contacts = await db.query('SELECT * FROM contacts');

// Join query
const contactsWithCompanies = await db.query(`
  SELECT c.*, co.name as company_name
  FROM contacts c
  LEFT JOIN companies co ON c.company_id = co.id
`);
```

### File Upload Example

```typescript
const storage = plugin.getStorage();

// Handle file upload
async function handleFileUpload(file: File) {
  const buffer = await file.arrayBuffer();
  const path = `uploads/${Date.now()}-${file.name}`;

  await storage.writeFile(path, new Uint8Array(buffer));

  // Store metadata in database
  await db.execute('INSERT INTO files (path, name, size, type) VALUES (?, ?, ?, ?)', [
    path,
    file.name,
    file.size,
    file.type,
  ]);
}

// Retrieve file
async function getFile(path: string): Promise<Blob> {
  const data = await storage.readFile(path);
  const metadata = await storage.getMetadata(path);
  return new Blob([data], { type: metadata.type });
}
```

## Migration from Server to Browser

### 1. Database Migration

**Server (PostgreSQL)**:

```typescript
import { PostgresDriver } from '@objectql/driver-sql';
const driver = new PostgresDriver({
  /* config */
});
```

**Browser (SQLite WASM)**:

```typescript
import { SQLiteWASMDriver } from '@objectos/plugin-browser';
const driver = new SQLiteWASMDriver({
  name: 'app.db',
  useOPFS: true,
});
```

### 2. File Storage Migration

**Server (S3)**:

```typescript
import { S3Storage } from '@objectos/plugin-storage';
const storage = new S3Storage({
  /* config */
});
```

**Browser (OPFS)**:

```typescript
import { OPFSStorageBackend } from '@objectos/plugin-browser';
const storage = new OPFSStorageBackend({
  rootDir: 'app-files',
});
```

### 3. API Migration

**Server (Express)**:

```typescript
app.get('/api/users', async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
});
```

**Browser (Service Worker)**:

```typescript
serviceWorker.registerHandler('/api/users', async (request) => {
  const users = await db.query('SELECT * FROM users');
  return new Response(JSON.stringify(users), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Limitations

- **Database Size**: SQLite databases stored in OPFS are limited by browser storage quotas (typically 10-100GB)
- **File Size**: Individual files are limited by browser memory (recommended max: 100MB)
- **SQL Features**: Some PostgreSQL-specific features may not be available in SQLite
- **Performance**: Database operations are slower than native server-side databases
- **Persistence**: Data can be cleared if user clears browser data

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Development mode
pnpm dev
```

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage
```

## License

AGPL-3.0

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## Support

- Documentation: https://docs.objectos.dev
- Issues: https://github.com/objectstack-ai/objectos/issues
- Discussions: https://github.com/objectstack-ai/objectos/discussions
