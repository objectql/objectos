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
    LruCacheOptions,
    RedisCacheOptions,
} from './types';

// Backends
export { LruCacheBackend } from './lru-backend';
export { RedisCacheBackend } from './redis-backend';

// Plugin
export { CachePlugin, ScopedCache, getCacheAPI } from './plugin';
