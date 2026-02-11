/**
 * Cache Plugin Types
 * 
 * Defines the cache protocol interface for high-performance caching.
 */

/**
 * Cache Backend Interface
 * All cache backends must implement this interface
 */
export interface CacheBackend {
    /**
     * Get a value by key
     */
    get(key: string): Promise<any>;
    
    /**
     * Set a value with optional TTL
     */
    set(key: string, value: any, ttl?: number): Promise<void>;
    
    /**
     * Delete a value by key
     */
    delete(key: string): Promise<void>;
    
    /**
     * Check if a key exists
     */
    has(key: string): Promise<boolean>;
    
    /**
     * Clear all cached data
     */
    clear(): Promise<void>;
    
    /**
     * Get cache statistics
     */
    getStats?(): CacheStats;
    
    /**
     * Close the cache connection
     */
    close?(): Promise<void>;
}

/**
 * Cache eviction strategy
 */
export type CacheStrategy = 'lru' | 'lfu' | 'fifo';

/**
 * Cache Plugin Configuration
 */
export interface CacheConfig {
    /**
     * Cache backend type
     */
    backend?: 'lru' | 'redis';
    
    /**
     * Backend-specific options
     */
    options?: LruCacheOptions | RedisCacheOptions;
    
    /**
     * Custom backend instance
     */
    customBackend?: CacheBackend;
    
    /**
     * Enable statistics tracking
     */
    enableStats?: boolean;

    /**
     * Cache eviction strategy (default: 'lru')
     */
    strategy?: CacheStrategy;
}

/**
 * LRU Cache Options
 */
export interface LruCacheOptions {
    /**
     * Maximum number of items to store
     */
    maxSize?: number;
    
    /**
     * Default TTL for entries (seconds)
     */
    defaultTtl?: number;
    
    /**
     * Enable TTL expiration checking interval (ms)
     */
    ttlCheckInterval?: number;
}

/**
 * Redis Cache Options
 */
export interface RedisCacheOptions {
    /**
     * Redis host
     */
    host?: string;
    
    /**
     * Redis port
     */
    port?: number;
    
    /**
     * Redis password
     */
    password?: string;
    
    /**
     * Redis database number
     */
    db?: number;
    
    /**
     * Key prefix for namespace isolation
     */
    keyPrefix?: string;
    
    /**
     * Default TTL for entries (seconds)
     */
    defaultTtl?: number;
}

/**
 * Cache Entry with metadata
 */
export interface CacheEntry {
    key: string;
    value: any;
    expiresAt?: number;
    createdAt: number;
    accessedAt: number;
    accessCount: number;
}

/**
 * Cache Statistics
 */
export interface CacheStats {
    /**
     * Total number of cache hits
     */
    hits: number;
    
    /**
     * Total number of cache misses
     */
    misses: number;
    
    /**
     * Current number of items in cache
     */
    size: number;
    
    /**
     * Number of evictions (LRU only)
     */
    evictions?: number;
    
    /**
     * Hit rate (hits / (hits + misses))
     */
    hitRate: number;
}

// ─── Kernel Compliance Types (from @objectstack/spec) ──────────────────────────

import type {
  PluginHealthStatus,
  PluginHealthReport as SpecPluginHealthReport,
  PluginCapabilityManifest as SpecPluginCapabilityManifest,
  PluginSecurityManifest as SpecPluginSecurityManifest,
  PluginStartupResult as SpecPluginStartupResult,
  EventBusConfig as SpecEventBusConfig,
} from '@objectstack/spec/kernel';

/** Plugin health status — from @objectstack/spec */
export type HealthStatus = PluginHealthStatus;

/** Aggregate health report — from @objectstack/spec */
export type PluginHealthReport = SpecPluginHealthReport;

/** Plugin capability manifest — from @objectstack/spec */
export type PluginCapabilityManifest = SpecPluginCapabilityManifest;

/** Plugin security manifest — from @objectstack/spec */
export type PluginSecurityManifest = SpecPluginSecurityManifest;

/** Plugin startup result — from @objectstack/spec */
export type PluginStartupResult = SpecPluginStartupResult;

/** Event bus configuration — from @objectstack/spec */
export type EventBusConfig = SpecEventBusConfig;
