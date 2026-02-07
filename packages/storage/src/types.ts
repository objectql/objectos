/**
 * Storage Plugin Types
 * 
 * Defines the storage protocol interface for plugin-isolated KV storage.
 */

/**
 * Storage Backend Interface
 * All storage backends must implement this interface
 */
export interface StorageBackend {
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
     * Get all keys matching a pattern
     */
    keys(pattern?: string): Promise<string[]>;
    
    /**
     * Clear all data
     */
    clear(): Promise<void>;
    
    /**
     * Close the storage connection
     */
    close?(): Promise<void>;
}

/**
 * Storage Plugin Configuration
 */
export interface StorageConfig {
    /**
     * Storage backend type
     */
    backend?: 'memory' | 'sqlite' | 'redis';
    
    /**
     * Backend-specific options
     */
    options?: MemoryStorageOptions | SqliteStorageOptions | RedisStorageOptions;
    
    /**
     * Custom backend instance
     */
    customBackend?: StorageBackend;
}

/**
 * Memory Storage Options
 */
export interface MemoryStorageOptions {
    /**
     * Maximum number of keys to store
     */
    maxKeys?: number;
    
    /**
     * Enable TTL expiration checking interval (ms)
     */
    ttlCheckInterval?: number;
}

/**
 * SQLite Storage Options
 */
export interface SqliteStorageOptions {
    /**
     * Database file path
     */
    path: string;
    
    /**
     * Enable WAL mode for better concurrency
     */
    wal?: boolean;
}

/**
 * Redis Storage Options
 */
export interface RedisStorageOptions {
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
}

/**
 * Storage Entry with metadata
 */
export interface StorageEntry {
    key: string;
    value: any;
    expiresAt?: number;
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
