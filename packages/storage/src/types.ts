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

// ─── Plugin Isolation Types ─────────────────────────────────────────────────────

/**
 * Plugin isolation level
 * - shared: runs in the same process (Level 0, default)
 * - worker: runs in a worker_threads Worker (Level 1)
 * - process: runs in a child_process fork (Level 2)
 */
export type PluginIsolationLevel = 'shared' | 'worker' | 'process';

/**
 * Configuration for an isolated plugin host
 */
export interface PluginHostConfig {
  /** Absolute path to the plugin entry module */
  pluginPath: string;
  /** Isolation level */
  isolation: PluginIsolationLevel;
  /** V8 resource limits (worker isolation only) */
  resourceLimits?: {
    maxOldGenerationSizeMb?: number;
    maxYoungGenerationSizeMb?: number;
    codeRangeSizeMb?: number;
    stackSizeMb?: number;
  };
}

/**
 * Runtime status of an isolated plugin host
 */
export interface PluginHostStatus {
  /** Whether the host is currently alive */
  alive: boolean;
  /** Number of times the host has been restarted */
  restarts: number;
  /** ISO-8601 timestamp of the last successful heartbeat */
  lastHeartbeat?: string;
  /** Isolation level of this host */
  isolation: PluginIsolationLevel;
}

/**
 * Configuration for the plugin watchdog
 */
export interface WatchdogConfig {
  /** Maximum number of restart attempts before giving up (default: 5) */
  maxRestarts?: number;
  /** Initial backoff delay in ms between restarts (default: 1000) */
  backoffMs?: number;
  /** Interval in ms between heartbeat pings (default: 10000) */
  heartbeatIntervalMs?: number;
  /** Timeout in ms to wait for a heartbeat response (default: 5000) */
  heartbeatTimeoutMs?: number;
}

/**
 * Common interface for plugin hosts (worker or process)
 */
export interface PluginHost {
  /** Start the isolated host */
  start(): Promise<void>;
  /** Stop the isolated host */
  stop(): Promise<void>;
  /** Call a method on the remote plugin */
  call(method: string, args?: unknown[]): Promise<unknown>;
  /** Check if the host is alive */
  isAlive(): boolean;
  /** Restart the host */
  restart(): Promise<void>;
  /** Get host configuration */
  readonly config: PluginHostConfig;
}

// ─── Schema Migration Types ────────────────────────────────────────────────────

/**
 * Column definition for schema operations
 */
export interface ColumnDef {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'datetime' | 'json';
  nullable?: boolean;
  defaultValue?: unknown;
}

/**
 * Index creation options
 */
export interface IndexOptions {
  unique?: boolean;
  name?: string;
}

/**
 * Schema change operation
 */
export type SchemaChange =
  | { type: 'add_column'; object: string; column: ColumnDef }
  | { type: 'drop_column'; object: string; column: string }
  | { type: 'alter_column'; object: string; column: string; from: ColumnDef; to: ColumnDef }
  | { type: 'add_index'; object: string; columns: string[]; options?: IndexOptions }
  | { type: 'drop_index'; object: string; columns: string[] };

/**
 * Diff result for a single object
 */
export interface SchemaDiff {
  object: string;
  changes: SchemaChange[];
}

/**
 * A versioned schema migration with up/down operations
 */
export interface Migration {
  version: string;
  name: string;
  up: (runner: MigrationRunner) => Promise<void>;
  down: (runner: MigrationRunner) => Promise<void>;
}

/**
 * Persisted record of an applied migration
 */
export interface MigrationRecord {
  id: string;
  version: string;
  name: string;
  appliedAt: string;
  checksum: string;
}

/**
 * Runner interface used inside migration up/down functions
 */
export interface MigrationRunner {
  addColumn(object: string, column: ColumnDef): Promise<void>;
  dropColumn(object: string, columnName: string): Promise<void>;
  addIndex(object: string, columns: string[], options?: IndexOptions): Promise<void>;
  dropIndex(object: string, columns: string[]): Promise<void>;
}
