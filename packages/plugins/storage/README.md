# @objectos/plugin-storage

Plugin-isolated KV storage for ObjectOS with multiple backend support.

## Features

- **Multiple Backends**: Memory (development), SQLite (file-based), Redis (production)
- **Plugin Isolation**: Each plugin gets its own namespace to prevent data conflicts
- **TTL Support**: Automatic expiration of keys after a specified time
- **Pattern Matching**: Query keys using glob patterns (`user:*`, `config:?:name`)
- **High Performance**: Optimized for both read and write operations

## Installation

```bash
pnpm add @objectos/plugin-storage
```

### Optional Dependencies

For SQLite backend:
```bash
pnpm add better-sqlite3
```

For Redis backend:
```bash
pnpm add ioredis
```

## Usage

### Basic Setup

```typescript
import { StoragePlugin } from '@objectos/plugin-storage';
import { ObjectOS } from '@objectstack/runtime';

const storage = new StoragePlugin({
  backend: 'memory' // or 'sqlite' or 'redis'
});

const os = new ObjectOS();
await os.registerPlugin(storage);
await os.start();
```

### Backend Configuration

#### Memory Backend (Development)

```typescript
const storage = new StoragePlugin({
  backend: 'memory',
  options: {
    maxKeys: 10000,
    ttlCheckInterval: 60000 // Clean expired keys every minute
  }
});
```

#### SQLite Backend (File-based)

```typescript
const storage = new StoragePlugin({
  backend: 'sqlite',
  options: {
    path: './data/storage.db',
    wal: true // Enable WAL mode for better concurrency
  }
});
```

#### Redis Backend (Production)

```typescript
const storage = new StoragePlugin({
  backend: 'redis',
  options: {
    host: '127.0.0.1',
    port: 6379,
    password: 'your-password',
    db: 0,
    keyPrefix: 'objectos:storage:'
  }
});
```

### Using Storage in Plugins

```typescript
import type { Plugin, PluginContext } from '@objectstack/runtime';

class MyPlugin implements Plugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  async init(context: PluginContext) {
    const storage = context.getService('storage');
    const scopedStorage = storage.getScopedStorage('my-plugin');
    
    // Store data
    await scopedStorage.set('config', { theme: 'dark' });
    
    // Retrieve data
    const config = await scopedStorage.get('config');
    
    // Set with TTL (expires in 60 seconds)
    await scopedStorage.set('session', { user: 'john' }, 60);
    
    // List keys
    const keys = await scopedStorage.keys('config:*');
    
    // Delete data
    await scopedStorage.delete('config');
    
    // Clear all plugin data
    await scopedStorage.clear();
  }
}
```

## API Reference

### StoragePlugin

#### Methods

- `get(key: string): Promise<any>` - Get a value by key
- `set(key: string, value: any, ttl?: number): Promise<void>` - Set a value with optional TTL (seconds)
- `delete(key: string): Promise<void>` - Delete a value
- `keys(pattern?: string): Promise<string[]>` - Get all keys matching pattern
- `clear(): Promise<void>` - Clear all data
- `getScopedStorage(pluginId: string): ScopedStorage` - Get plugin-scoped storage

### ScopedStorage

Same API as StoragePlugin but all keys are automatically prefixed with the plugin ID.

### Pattern Matching

Supports glob-style patterns:
- `*` - Matches any characters
- `?` - Matches a single character

Examples:
- `user:*` - Matches `user:1`, `user:2:name`, etc.
- `config:?` - Matches `config:1`, `config:a`, but not `config:10`
- `*:name` - Matches `user:name`, `admin:name`, etc.

## Best Practices

1. **Use Scoped Storage**: Always use `getScopedStorage()` in plugins to ensure data isolation
2. **Choose the Right Backend**:
   - Memory: Fast but data is lost on restart
   - SQLite: Good for single-server deployments
   - Redis: Required for multi-server deployments
3. **Set Appropriate TTLs**: Use TTL for temporary data like sessions and caches
4. **Use Patterns Wisely**: Prefix keys with namespaces for easier management

## Performance

### Memory Backend
- **Read**: O(1)
- **Write**: O(1)
- **Pattern Match**: O(n) where n is total keys

### SQLite Backend
- **Read**: O(1) with index
- **Write**: O(1) 
- **Pattern Match**: O(n) where n is total keys

### Redis Backend
- **Read**: O(1)
- **Write**: O(1)
- **Pattern Match**: O(n) where n is matching keys

## License

AGPL-3.0
