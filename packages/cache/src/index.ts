/**
 * Cache Plugin - Public API
 * 
 * Export all public interfaces and classes
 */

// Types
export type {
    CacheBackend,
    CacheConfig,
    CacheEntry,
    CacheStats,
    CacheStrategy,
    LruCacheOptions,
    RedisCacheOptions,
} from './types.js';

// Backends
export { LruCacheBackend } from './lru-backend.js';
export { RedisCacheBackend } from './redis-backend.js';

// Plugin
export { CachePlugin, ScopedCache, getCacheAPI } from './plugin.js';
