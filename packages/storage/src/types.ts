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

/**
 * Bucket metadata
 */
export interface BucketInfo {
    name: string;
    createdAt: string;
    itemCount: number;
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
