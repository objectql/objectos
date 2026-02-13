# Browser Runtime Plugin - Integration Guide

## Introduction

This guide explains how to integrate the Browser Runtime Plugin into your ObjectOS application, enabling your entire backend to run in the browser without a server.

## Prerequisites

- Node.js 18+ or modern browser with:
  - WebAssembly support
  - Origin Private File System (OPFS)
  - Service Worker API
  - Web Worker API

## Installation

### 1. Install the Plugin

```bash
npm install @objectos/plugin-browser
# or
pnpm add @objectos/plugin-browser
```

### 2. Install Peer Dependencies

The plugin requires ObjectStack runtime:

```bash
npm install @objectstack/runtime @objectstack/spec
```

## Basic Setup

### Step 1: Initialize the Plugin

Create a new file `src/browser-runtime.ts`:

```typescript
import { BrowserRuntimePlugin } from '@objectos/plugin-browser';
import { ObjectOS } from '@objectstack/runtime';

// Create ObjectOS kernel
const kernel = new ObjectOS();

// Create and configure browser plugin
const browserPlugin = new BrowserRuntimePlugin({
  database: {
    name: 'myapp.db',
    useOPFS: true,
    initScripts: [
      // Your initial schema
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ],
  },
  storage: {
    rootDir: 'myapp-files',
    maxQuota: 100 * 1024 * 1024, // 100MB
  },
  serviceWorker: {
    enabled: true,
    scriptPath: '/sw.js',
    apiBasePath: '/api',
  },
});

// Register plugin
async function initializeRuntime() {
  await kernel.registerPlugin(browserPlugin);
  await kernel.start();

  console.log('Browser runtime initialized!');
  return { kernel, browserPlugin };
}

export { initializeRuntime, browserPlugin };
```

### Step 2: Create Service Worker Script

Create `public/sw.js`:

```javascript
// ObjectOS Browser Runtime Service Worker
const API_BASE_PATH = '/api';
const registeredPatterns = new Set();
const pendingRequests = new Map();

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only intercept API requests
  if (!url.pathname.startsWith(API_BASE_PATH)) {
    return;
  }

  event.respondWith(handleAPIRequest(event.request));
});

self.addEventListener('message', (event) => {
  const { type, payload, id } = event.data;

  if (type === 'REGISTER_HANDLER') {
    registeredPatterns.add(payload.pattern);
    console.log('[SW] Registered handler:', payload.pattern);
  }

  if (type === 'UNREGISTER_HANDLER') {
    registeredPatterns.delete(payload.pattern);
    console.log('[SW] Unregistered handler:', payload.pattern);
  }

  if (type === 'API_RESPONSE') {
    const resolver = pendingRequests.get(id);
    if (resolver) {
      resolver(payload);
      pendingRequests.delete(id);
    }
  }
});

async function handleAPIRequest(request) {
  const requestId = crypto.randomUUID();

  const clients = await self.clients.matchAll();
  if (clients.length === 0) {
    return new Response(JSON.stringify({ error: 'No client available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const client = clients[0];

  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let body = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      body = await request.json();
    } catch {
      // Not JSON
    }
  }

  const responsePromise = new Promise((resolve) => {
    pendingRequests.set(requestId, resolve);
  });

  client.postMessage({
    type: 'API_REQUEST',
    id: requestId,
    payload: {
      url: request.url,
      method: request.method,
      headers,
      body,
    },
  });

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => {
      pendingRequests.delete(requestId);
      resolve({
        status: 504,
        statusText: 'Gateway Timeout',
        body: JSON.stringify({ error: 'Request timeout' }),
      });
    }, 30000);
  });

  const response = await Promise.race([responsePromise, timeoutPromise]);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers || { 'Content-Type': 'application/json' }),
  });
}
```

### Step 3: Initialize in Your App

In your main application file (e.g., `src/main.ts` or `src/index.tsx`):

```typescript
import { initializeRuntime } from './browser-runtime';

async function main() {
  // Initialize browser runtime
  const { kernel, browserPlugin } = await initializeRuntime();

  // Get database instance
  const db = browserPlugin.getDatabase();

  // Now you can use the database
  const users = await db.query('SELECT * FROM users');
  console.log('Users:', users);

  // Your app code here...
}

main().catch(console.error);
```

## Advanced Usage

### Custom API Handlers

Register custom handlers for your API endpoints:

```typescript
import { initializeRuntime } from './browser-runtime';

async function setupAPIHandlers() {
  const { browserPlugin } = await initializeRuntime();
  const sw = browserPlugin.getServiceWorker();
  const db = browserPlugin.getDatabase();

  if (!sw || !db) return;

  // Handler for GET /api/users
  sw.registerHandler('/api/users', async (request) => {
    if (request.method === 'GET') {
      const users = await db.query('SELECT * FROM users');
      return new Response(JSON.stringify(users), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      await db.execute('INSERT INTO users (name, email) VALUES (?, ?)', [body.name, body.email]);
      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  });

  // Handler for GET /api/users/:id
  sw.registerHandler('/api/users/*', async (request) => {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (request.method === 'GET') {
      const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      return new Response(JSON.stringify(user[0] || null), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      await db.execute('UPDATE users SET name = ?, email = ? WHERE id = ?', [
        body.name,
        body.email,
        id,
      ]);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'DELETE') {
      await db.execute('DELETE FROM users WHERE id = ?', [id]);
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Method not allowed', { status: 405 });
  });
}
```

### File Upload and Storage

Handle file uploads using OPFS:

```typescript
async function handleFileUpload(file: File) {
  const { browserPlugin } = await initializeRuntime();
  const storage = browserPlugin.getStorage();
  const db = browserPlugin.getDatabase();

  if (!storage || !db) return;

  // Read file as ArrayBuffer
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  // Generate unique filename
  const timestamp = Date.now();
  const filename = `${timestamp}-${file.name}`;
  const path = `uploads/${filename}`;

  // Save to OPFS
  await storage.writeFile(path, data);

  // Save metadata to database
  await db.execute(
    `INSERT INTO files (path, name, size, type, uploaded_at) 
     VALUES (?, ?, ?, ?, ?)`,
    [path, file.name, file.size, file.type, new Date().toISOString()],
  );

  console.log('File uploaded:', filename);
  return { path, filename };
}

async function downloadFile(path: string) {
  const { browserPlugin } = await initializeRuntime();
  const storage = browserPlugin.getStorage();

  if (!storage) return;

  // Read file from OPFS
  const data = await storage.readFile(path);
  const metadata = await storage.getMetadata(path);

  // Create blob and download
  const blob = new Blob([data], { type: metadata.type });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = metadata.name;
  a.click();

  URL.revokeObjectURL(url);
}
```

### Transaction Support

Use transactions for atomic operations:

```typescript
async function transferFunds(fromId: number, toId: number, amount: number) {
  const { browserPlugin } = await initializeRuntime();
  const db = browserPlugin.getDatabase();

  if (!db) throw new Error('Database not initialized');

  try {
    await db.beginTransaction();

    // Deduct from sender
    await db.execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, fromId]);

    // Add to receiver
    await db.execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toId]);

    await db.commit();
    console.log('Transfer completed');
  } catch (error) {
    await db.rollback();
    console.error('Transfer failed:', error);
    throw error;
  }
}
```

## React Integration

### Create a Custom Hook

```typescript
// src/hooks/useBrowserRuntime.ts
import { useState, useEffect } from 'react';
import { BrowserRuntimePlugin } from '@objectos/plugin-browser';

export function useBrowserRuntime() {
  const [plugin, setPlugin] = useState<BrowserRuntimePlugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const { browserPlugin } = await initializeRuntime();
        setPlugin(browserPlugin);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  return { plugin, loading, error };
}
```

### Use in Components

```typescript
// src/components/UserList.tsx
import { useBrowserRuntime } from '../hooks/useBrowserRuntime';
import { useState, useEffect } from 'react';

export function UserList() {
  const { plugin, loading, error } = useBrowserRuntime();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      if (!plugin) return;

      const db = plugin.getDatabase();
      if (!db) return;

      const result = await db.query('SELECT * FROM users');
      setUsers(result);
    }

    loadUsers();
  }, [plugin]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users.map((user: any) => (
        <li key={user.id}>{user.name} ({user.email})</li>
      ))}
    </ul>
  );
}
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  await db.execute(sql, params);
} catch (error) {
  console.error('Database error:', error);
  // Show user-friendly message
  alert('An error occurred. Please try again.');
}
```

### 2. Storage Quota Management

Monitor storage usage:

```typescript
async function checkStorageQuota() {
  const storage = browserPlugin.getStorage();
  if (!storage) return;

  const usage = await storage.getStorageUsage();
  const percentUsed = (usage.used / usage.quota) * 100;

  if (percentUsed > 80) {
    console.warn('Storage quota almost full:', percentUsed.toFixed(2) + '%');
    // Consider cleanup or notify user
  }
}
```

### 3. Database Migrations

Handle schema migrations:

```typescript
async function migrateDatabase(db: any) {
  // Check current version
  const result = await db.query("SELECT value FROM settings WHERE key = 'schema_version'");
  const currentVersion = result.length > 0 ? parseInt(result[0].value) : 0;

  // Apply migrations
  if (currentVersion < 1) {
    await db.execute('ALTER TABLE users ADD COLUMN phone TEXT');
    await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', '1')");
  }

  if (currentVersion < 2) {
    await db.execute('CREATE INDEX idx_users_email ON users(email)');
    await db.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('schema_version', '2')");
  }
}
```

## Troubleshooting

### Service Worker Not Working

1. Ensure HTTPS or localhost
2. Check browser console for errors
3. Verify sw.js is accessible
4. Clear browser cache and reload

### OPFS Not Available

1. Check browser compatibility
2. Ensure secure context (HTTPS)
3. Try in a recent browser version

### Database Size Limits

1. Monitor storage usage
2. Implement data cleanup
3. Consider compression
4. Archive old data

## Next Steps

- Explore [Advanced Features](./ADVANCED_FEATURES.md)
- See [API Reference](./API_REFERENCE.md)
- Check [Examples](../examples/)
- Read [Migration Guide](../README.md#migration-from-server-to-browser)
