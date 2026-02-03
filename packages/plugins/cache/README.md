# @objectos/plugin-cache

High-performance cache abstraction layer plugin for ObjectOS with LRU and Redis support.

## Features

- **Multiple Backend Support**
  - **LRU (Least Recently Used)**: In-memory cache with automatic eviction
  - **Redis**: Distributed caching for production environments

- **Smart Caching**
  - Automatic LRU eviction strategy
  - Configurable TTL (Time To Live) support
  - Plugin namespace isolation
  - Cache statistics tracking (hits, misses, hit rate)

- **Production Ready**
  - TypeScript strict mode
  - Comprehensive test coverage
  - Zero-dependency core (optional dependencies for backends)
  - Follows ObjectOS Plugin Protocol

## Installation

```bash
npm install @objectos/plugin-cache
```

### Optional Dependencies

For Redis support:
```bash
npm install ioredis
```

## Quick Start

### LRU Cache (In-Memory)

```typescript
import { CachePlugin } from '@objectos/plugin-cache';

const cache = new CachePlugin({
  backend: 'lru',
  options: {
    maxSize: 1000,        // Maximum items in cache
    defaultTtl: 3600,     // Default TTL in seconds
  }
});

// Initialize
await cache.init(context);
await cache.start(context);

// Use cache
await cache.set('user:123', { name: 'John', email: 'john@example.com' });
const user = await cache.get('user:123');

// With custom TTL
await cache.set('session:abc', sessionData, 1800); // 30 minutes

// Check existence
if (await cache.has('user:123')) {
  console.log('User found in cache');
}

// Delete
await cache.delete('user:123');

// Get statistics
const stats = cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
```

### Redis Cache (Distributed)

```typescript
import { CachePlugin } from '@objectos/plugin-cache';

const cache = new CachePlugin({
  backend: 'redis',
  options: {
    host: 'localhost',
    port: 6379,
    password: 'your-password',
    db: 0,
    keyPrefix: 'app:',
    defaultTtl: 3600,
  }
});

await cache.init(context);
await cache.start(context);
```

## API Reference

### CachePlugin

The main plugin class implementing the ObjectOS Plugin interface.

#### Constructor

```typescript
new CachePlugin(config?: CacheConfig)
```

**Config Options:**
- `backend`: `'lru'` | `'redis'` - Backend type (default: 'lru')
- `options`: Backend-specific options
- `customBackend`: Custom backend implementation
- `enableStats`: Enable statistics tracking (default: true)

#### Methods

##### `async get(key: string): Promise<any>`
Retrieve a value from cache. Returns `undefined` if not found or expired.

##### `async set(key: string, value: any, ttl?: number): Promise<void>`
Store a value in cache with optional TTL (in seconds).

##### `async delete(key: string): Promise<void>`
Remove a value from cache.

##### `async has(key: string): Promise<boolean>`
Check if a key exists in cache.

##### `async clear(): Promise<void>`
Clear all cached data.

##### `getStats(): CacheStats | undefined`
Get cache statistics (if enabled).

**Returns:**
```typescript
{
  hits: number;        // Total cache hits
  misses: number;      // Total cache misses
  size: number;        // Current cache size
  evictions?: number;  // LRU evictions count
  hitRate: number;     // Hit rate (0-1)
}
```

##### `getScopedCache(pluginId: string): ScopedCache`
Get a namespaced cache instance for a plugin.

### Backend Options

#### LruCacheOptions

```typescript
{
  maxSize?: number;           // Max items (default: 1000)
  defaultTtl?: number;        // Default TTL in seconds
  ttlCheckInterval?: number;  // Cleanup interval in ms
}
```

#### RedisCacheOptions

```typescript
{
  host?: string;        // Redis host (default: 'localhost')
  port?: number;        // Redis port (default: 6379)
  password?: string;    // Redis password
  db?: number;          // Database number (default: 0)
  keyPrefix?: string;   // Key prefix (default: 'cache:')
  defaultTtl?: number;  // Default TTL in seconds
}
```

## Advanced Usage

### Scoped Cache (Plugin Isolation)

Each plugin can have its own isolated cache namespace:

```typescript
// In your plugin
const myCache = cachePlugin.getScopedCache('my-plugin-id');

// All keys are automatically prefixed
await myCache.set('user', userData);  // Stored as "my-plugin-id:user"
await myCache.get('user');
```

### Custom Backend

Implement your own cache backend:

```typescript
import { CacheBackend } from '@objectos/plugin-cache';

class MyCustomBackend implements CacheBackend {
  async get(key: string): Promise<any> { /* ... */ }
  async set(key: string, value: any, ttl?: number): Promise<void> { /* ... */ }
  async delete(key: string): Promise<void> { /* ... */ }
  async has(key: string): Promise<boolean> { /* ... */ }
  async clear(): Promise<void> { /* ... */ }
}

const cache = new CachePlugin({
  customBackend: new MyCustomBackend()
});
```

### Cache Patterns

#### Cache-Aside Pattern

```typescript
async function getUser(userId: string) {
  // Try cache first
  let user = await cache.get(`user:${userId}`);
  
  if (!user) {
    // Cache miss - fetch from database
    user = await db.users.findById(userId);
    
    // Store in cache for 1 hour
    await cache.set(`user:${userId}`, user, 3600);
  }
  
  return user;
}
```

#### Write-Through Cache

```typescript
async function updateUser(userId: string, data: any) {
  // Update database
  const user = await db.users.update(userId, data);
  
  // Update cache
  await cache.set(`user:${userId}`, user, 3600);
  
  return user;
}
```

#### Cache Invalidation

```typescript
async function deleteUser(userId: string) {
  // Delete from database
  await db.users.delete(userId);
  
  // Invalidate cache
  await cache.delete(`user:${userId}`);
}
```

## LRU vs Redis Comparison

| Feature | LRU (In-Memory) | Redis |
|---------|-----------------|-------|
| **Performance** | Fastest (no network) | Fast (network overhead) |
| **Persistence** | No | Optional |
| **Scalability** | Single process | Distributed |
| **Memory** | Limited by process | Limited by Redis server |
| **Eviction** | Automatic LRU | TTL + Redis policies |
| **Best For** | Development, single server | Production, multiple servers |

### When to Use LRU
- Development and testing
- Single server deployments
- Low-latency requirements
- Simple caching needs

### When to Use Redis
- Production environments
- Multi-server deployments
- Cache sharing across services
- Persistence requirements

## Best Practices

### 1. Choose Appropriate TTL

```typescript
// Short-lived data
await cache.set('session:token', token, 900); // 15 minutes

// Medium-lived data
await cache.set('user:profile', profile, 3600); // 1 hour

// Long-lived data
await cache.set('config:global', config, 86400); // 24 hours
```

### 2. Handle Cache Failures Gracefully

```typescript
async function getData(key: string) {
  try {
    return await cache.get(key) ?? await fetchFromSource(key);
  } catch (error) {
    logger.warn('Cache error, falling back to source', error);
    return await fetchFromSource(key);
  }
}
```

### 3. Monitor Cache Performance

```typescript
setInterval(() => {
  const stats = cache.getStats();
  
  if (stats && stats.hitRate < 0.5) {
    logger.warn('Low cache hit rate:', stats);
  }
  
  logger.info('Cache stats:', {
    hits: stats?.hits,
    misses: stats?.misses,
    hitRate: `${(stats?.hitRate ?? 0 * 100).toFixed(2)}%`,
    size: stats?.size,
  });
}, 60000); // Every minute
```

### 4. Use Scoped Caches

```typescript
// Each plugin gets isolated namespace
const authCache = cache.getScopedCache('auth');
const dataCache = cache.getScopedCache('data');

// No key collision
await authCache.set('token', authToken);
await dataCache.set('token', dataToken);
```

### 5. Set Reasonable Cache Sizes

```typescript
// LRU cache sizing guidelines
const cache = new CachePlugin({
  backend: 'lru',
  options: {
    // Small cache: 100-500 items
    maxSize: 500,
    
    // Medium cache: 1000-5000 items
    maxSize: 5000,
    
    // Large cache: 10000+ items (monitor memory!)
    maxSize: 10000,
  }
});
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## TypeScript Support

Full TypeScript support with strict typing:

```typescript
import type { 
  CachePlugin, 
  CacheConfig, 
  CacheStats,
  LruCacheOptions,
  RedisCacheOptions 
} from '@objectos/plugin-cache';
```

## License

AGPL-3.0

## Contributing

This plugin is part of the ObjectOS ecosystem. See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## Related Plugins

- `@objectos/plugin-storage` - Persistent key-value storage
- `@objectos/plugin-metrics` - Performance metrics and monitoring
- `@objectos/kernel` - ObjectOS Kernel for plugin orchestration
