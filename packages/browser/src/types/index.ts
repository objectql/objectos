/**
 * Type definitions for Browser Runtime Plugin
 */

/**
 * Browser runtime configuration
 */
export interface BrowserRuntimeConfig {
  /**
   * Database configuration
   */
  database?: {
    /**
     * Name of the database
     */
    name?: string;

    /**
     * Use OPFS for persistent storage (recommended for production)
     */
    useOPFS?: boolean;

    /**
     * Initial SQL scripts to run on database creation
     */
    initScripts?: string[];
  };

  /**
   * File storage configuration
   */
  storage?: {
    /**
     * Root directory name in OPFS
     */
    rootDir?: string;

    /**
     * Maximum storage quota in bytes
     */
    maxQuota?: number;
  };

  /**
   * Service Worker configuration
   */
  serviceWorker?: {
    /**
     * Enable service worker for API interception
     */
    enabled?: boolean;

    /**
     * Service worker script path
     */
    scriptPath?: string;

    /**
     * API base path to intercept
     */
    apiBasePath?: string;
  };

  /**
   * Web Worker configuration for business logic
   */
  worker?: {
    /**
     * Enable web worker for business logic isolation
     */
    enabled?: boolean;

    /**
     * Worker script path
     */
    scriptPath?: string;
  };
}

/**
 * SQLite WASM Database interface
 */
export interface SQLiteDatabase {
  /**
   * Execute a SQL query
   */
  exec(sql: string, params?: any[]): SQLiteResult[];

  /**
   * Run a SQL statement
   */
  run(sql: string, params?: any[]): void;

  /**
   * Prepare a SQL statement
   */
  prepare(sql: string): SQLiteStatement;

  /**
   * Close the database
   */
  close(): void;

  /**
   * Export database to Uint8Array
   */
  export(): Uint8Array;
}

/**
 * SQLite query result
 */
export interface SQLiteResult {
  columns: string[];
  values: any[][];
}

/**
 * SQLite prepared statement
 */
export interface SQLiteStatement {
  bind(params: any[]): void;
  step(): boolean;
  get(): any[];
  getAsObject(): Record<string, any>;
  reset(): void;
  free(): void;
}

/**
 * OPFS File Storage interface
 */
export interface OPFSStorage {
  /**
   * Write file to OPFS
   */
  writeFile(path: string, data: Uint8Array | Blob): Promise<void>;

  /**
   * Read file from OPFS
   */
  readFile(path: string): Promise<Uint8Array>;

  /**
   * Delete file from OPFS
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Check if file exists
   */
  exists(path: string): Promise<boolean>;

  /**
   * List files in directory
   */
  listFiles(path: string): Promise<string[]>;

  /**
   * Get file metadata
   */
  getMetadata(path: string): Promise<FileMetadata>;

  /**
   * Get storage usage
   */
  getStorageUsage(): Promise<StorageUsage>;
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
}

/**
 * Storage usage information
 */
export interface StorageUsage {
  used: number;
  quota: number;
  available: number;
}

/**
 * Service Worker message types
 */
export type ServiceWorkerMessageType =
  | 'API_REQUEST'
  | 'API_RESPONSE'
  | 'REGISTER_HANDLER'
  | 'UNREGISTER_HANDLER';

/**
 * Service Worker message
 */
export interface ServiceWorkerMessage {
  type: ServiceWorkerMessageType;
  payload: any;
  id?: string;
}

/**
 * API Request handler
 */
export type APIRequestHandler = (request: Request) => Promise<Response> | Response;

/**
 * Web Worker message types
 */
export type WorkerMessageType =
  | 'EXECUTE_QUERY'
  | 'EXECUTE_MUTATION'
  | 'LOAD_PLUGIN'
  | 'UNLOAD_PLUGIN'
  | 'INVOKE_HOOK';

/**
 * Web Worker message
 */
export interface WorkerMessage {
  type: WorkerMessageType;
  payload: any;
  id: string;
}

/**
 * Database driver interface for browser
 */
export interface BrowserDatabaseDriver {
  /**
   * Connect to database
   */
  connect(): Promise<void>;

  /**
   * Disconnect from database
   */
  disconnect(): Promise<void>;

  /**
   * Execute query
   */
  query(sql: string, params?: any[]): Promise<any[]>;

  /**
   * Execute mutation
   */
  execute(sql: string, params?: any[]): Promise<void>;

  /**
   * Begin transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback transaction
   */
  rollback(): Promise<void>;
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
