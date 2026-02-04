/**
 * @objectos/plugin-browser
 * 
 * Browser Runtime Plugin for ObjectOS
 * 
 * This plugin enables running ObjectOS backend entirely in the browser using:
 * - SQLite WASM for database operations (replacing PostgreSQL/MongoDB)
 * - OPFS for file storage (replacing S3/MinIO)
 * - Service Worker for API interception (replacing Express/Koa)
 * - Web Worker for business logic isolation (replacing Node.js vm)
 * 
 * @module @objectos/plugin-browser
 */

export { BrowserRuntimePlugin } from './plugin';

// Database exports
export { SQLiteWASMDriver } from './database/sqlite-wasm-driver';
export type { SQLiteWASMConfig } from './database/sqlite-wasm-driver';

// Storage exports
export { OPFSStorageBackend } from './storage/opfs-storage';
export type { OPFSStorageConfig } from './storage/opfs-storage';

// Service Worker exports
export { ServiceWorkerManager, SERVICE_WORKER_SCRIPT } from './service-worker/manager';

// Worker exports
export { WorkerManager, WORKER_SCRIPT } from './worker/manager';

// Type exports
export type {
  BrowserRuntimeConfig,
  SQLiteDatabase,
  SQLiteResult,
  SQLiteStatement,
  OPFSStorage,
  FileMetadata,
  StorageUsage,
  ServiceWorkerMessage,
  ServiceWorkerMessageType,
  APIRequestHandler,
  WorkerMessage,
  WorkerMessageType,
  BrowserDatabaseDriver
} from './types';

/**
 * Default export is the plugin class
 */
import { BrowserRuntimePlugin } from './plugin';
export default BrowserRuntimePlugin;
