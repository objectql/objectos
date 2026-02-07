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

// ─── Kernel Compliance Types ───────────────────────────────────────────────────

/** Plugin health status */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/** Health check result for a single check */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  latency?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Aggregate health report for a plugin */
export interface PluginHealthReport {
  pluginName: string;
  pluginVersion: string;
  status: HealthStatus;
  uptime: number;
  checks: HealthCheckResult[];
  timestamp: string;
}

/** Plugin capability declaration */
export interface PluginCapabilityManifest {
  services?: string[];
  emits?: string[];
  listens?: string[];
  routes?: string[];
  objects?: string[];
}

/** Plugin security manifest */
export interface PluginSecurityManifest {
  requiredPermissions?: string[];
  handlesSensitiveData?: boolean;
  makesExternalCalls?: boolean;
  allowedDomains?: string[];
  executesUserScripts?: boolean;
  sandboxConfig?: {
    timeout?: number;
    maxMemory?: number;
    allowedModules?: string[];
  };
}

/** Plugin startup result */
export interface PluginStartupResult {
  pluginName: string;
  success: boolean;
  duration: number;
  servicesRegistered: string[];
  warnings?: string[];
  errors?: string[];
}

/** Event bus configuration */
export interface EventBusConfig {
  persistence?: {
    enabled: boolean;
    storage?: 'memory' | 'redis' | 'sqlite';
    maxEvents?: number;
    ttl?: number;
  };
  retry?: {
    enabled: boolean;
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
  };
  deadLetterQueue?: {
    enabled: boolean;
    maxSize?: number;
    storage?: 'memory' | 'redis' | 'sqlite';
  };
  webhooks?: {
    enabled: boolean;
    endpoints?: Array<{
      url: string;
      events: string[];
      secret?: string;
      timeout?: number;
    }>;
  };
}
