/**
 * Browser Runtime Plugin for ObjectOS
 * 
 * This plugin enables running ObjectOS backend entirely in the browser using:
 * - SQLite WASM for database operations
 * - OPFS for file storage
 * - Service Worker for API interception
 * - Web Worker for business logic isolation
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { BrowserRuntimeConfig } from './types';
import { SQLiteWASMDriver } from './database/sqlite-wasm-driver';
import { OPFSStorageBackend } from './storage/opfs-storage';
import { ServiceWorkerManager, SERVICE_WORKER_SCRIPT } from './service-worker/manager';
import { WorkerManager, WORKER_SCRIPT } from './worker/manager';

/**
 * Browser Runtime Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class BrowserRuntimePlugin implements Plugin {
  name = '@objectos/browser';
  version = '0.1.0';
  dependencies: string[] = [];

  private context?: PluginContext;
  private config: BrowserRuntimeConfig;
  private database?: SQLiteWASMDriver;
  private storage?: OPFSStorageBackend;
  private serviceWorker?: ServiceWorkerManager;
  private worker?: WorkerManager;

  constructor(config: BrowserRuntimeConfig = {}) {
    this.config = {
      database: {
        name: 'objectos.db',
        useOPFS: true,
        ...config.database
      },
      storage: {
        rootDir: 'objectos-files',
        maxQuota: 100 * 1024 * 1024, // 100MB
        ...config.storage
      },
      serviceWorker: {
        enabled: true,
        scriptPath: '/sw.js',
        apiBasePath: '/api',
        ...config.serviceWorker
      },
      worker: {
        enabled: false, // Disabled by default for simplicity
        scriptPath: '/worker.js',
        ...config.worker
      }
    };
  }

  /**
   * Initialize plugin
   */
  async init(context: PluginContext): Promise<void> {
    this.context = context;

    try {
      // Check browser compatibility
      this.checkBrowserCompatibility();

      // Initialize database
      await this.initDatabase();

      // Initialize file storage
      await this.initStorage();

      // Initialize service worker
      if (this.config.serviceWorker?.enabled) {
        await this.initServiceWorker();
      }

      // Initialize web worker (optional)
      if (this.config.worker?.enabled) {
        await this.initWorker();
      }

      // Register services
      context.registerService('browser-database', this.database);
      context.registerService('browser-storage', this.storage);
      context.registerService('browser-service-worker', this.serviceWorker);
      context.registerService('browser-worker', this.worker);

      context.logger.info('[BrowserRuntime] Initialized successfully');
    } catch (error: any) {
      context.logger.error('[BrowserRuntime] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Start plugin
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[BrowserRuntime] Started successfully');
    
    // Set up API handlers
    this.setupAPIHandlers();
  }

  /**
   * Stop plugin
   */
  async stop(): Promise<void> {
    if (this.worker) {
      this.worker.terminate();
    }

    if (this.serviceWorker) {
      await this.serviceWorker.unregister();
    }

    if (this.database) {
      await this.database.disconnect();
    }

    this.context?.logger.info('[BrowserRuntime] Stopped');
  }

  /**
   * Cleanup and destroy plugin
   */
  async destroy(): Promise<void> {
    await this.stop();
    this.context?.logger.info('[BrowserRuntime] Destroyed');
  }

  /**
   * Get database driver
   */
  getDatabase(): SQLiteWASMDriver | undefined {
    return this.database;
  }

  /**
   * Get storage backend
   */
  getStorage(): OPFSStorageBackend | undefined {
    return this.storage;
  }

  /**
   * Get service worker manager
   */
  getServiceWorker(): ServiceWorkerManager | undefined {
    return this.serviceWorker;
  }

  /**
   * Get worker manager
   */
  getWorker(): WorkerManager | undefined {
    return this.worker;
  }

  /**
   * Check browser compatibility
   */
  private checkBrowserCompatibility(): void {
    const missing: string[] = [];

    if (typeof navigator === 'undefined') {
      missing.push('navigator');
    }

    if (typeof Worker === 'undefined') {
      this.context?.logger.warn('[BrowserRuntime] Web Workers not supported - some features will be limited');
    }

    if (!('storage' in navigator)) {
      missing.push('Storage API');
    }

    if (!('serviceWorker' in navigator)) {
      if (this.config.serviceWorker?.enabled) {
        missing.push('Service Worker API');
      }
    }

    if (missing.length > 0) {
      throw new Error(`Browser compatibility check failed. Missing: ${missing.join(', ')}`);
    }
  }

  /**
   * Initialize database
   */
  private async initDatabase(): Promise<void> {
    this.database = new SQLiteWASMDriver({
      name: this.config.database?.name,
      useOPFS: this.config.database?.useOPFS,
      initScripts: this.config.database?.initScripts
    });

    await this.database.connect();
    this.context?.logger.info('[BrowserRuntime] Database initialized');
  }

  /**
   * Initialize storage
   */
  private async initStorage(): Promise<void> {
    this.storage = new OPFSStorageBackend({
      rootDir: this.config.storage?.rootDir,
      maxQuota: this.config.storage?.maxQuota
    });

    await this.storage.init();
    this.context?.logger.info('[BrowserRuntime] Storage initialized');
  }

  /**
   * Initialize service worker
   */
  private async initServiceWorker(): Promise<void> {
    if (!this.config.serviceWorker?.enabled) {
      return;
    }

    this.serviceWorker = new ServiceWorkerManager(
      this.config.serviceWorker.apiBasePath
    );

    // Create service worker script if needed
    await this.createServiceWorkerScript();

    await this.serviceWorker.register(this.config.serviceWorker.scriptPath);
    this.context?.logger.info('[BrowserRuntime] Service Worker initialized');
  }

  /**
   * Initialize web worker
   */
  private async initWorker(): Promise<void> {
    if (!this.config.worker?.enabled) {
      return;
    }

    this.worker = new WorkerManager();
    
    // Create worker script if needed
    await this.createWorkerScript();

    await this.worker.init(this.config.worker.scriptPath);
    this.context?.logger.info('[BrowserRuntime] Web Worker initialized');
  }

  /**
   * Create service worker script dynamically
   */
  private async createServiceWorkerScript(): Promise<void> {
    // In a real implementation, you would generate or copy the service worker
    // script to the public directory. For now, we'll just log a warning.
    this.context?.logger.warn(
      '[BrowserRuntime] Service Worker script should be available at ' +
      this.config.serviceWorker?.scriptPath
    );
  }

  /**
   * Create worker script dynamically
   */
  private async createWorkerScript(): Promise<void> {
    // In a real implementation, you would generate or copy the worker
    // script to the public directory. For now, we'll just log a warning.
    this.context?.logger.warn(
      '[BrowserRuntime] Worker script should be available at ' +
      this.config.worker?.scriptPath
    );
  }

  /**
   * Set up API handlers for common endpoints
   */
  private setupAPIHandlers(): void {
    if (!this.serviceWorker) {
      return;
    }

    // GraphQL endpoint handler
    this.serviceWorker.registerHandler('/api/graphql', async (request) => {
      try {
        const body = await request.json();
        const { query, variables } = body;

        // TODO: Implement GraphQL execution
        // This would parse the query and execute it against the database

        return new Response(
          JSON.stringify({
            data: { message: 'GraphQL handler not implemented yet' }
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: String(error) }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    });

    // REST endpoint handler
    this.serviceWorker.registerHandler('/api/data/*', async (request) => {
      try {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/').filter(p => p);
        
        // Extract object name and ID from path
        // e.g., /api/data/contacts/123
        const objectName = pathParts[2]; // 'contacts'
        const recordId = pathParts[3]; // '123' or undefined

        // TODO: Implement CRUD operations
        // This would execute SQL queries against the database

        return new Response(
          JSON.stringify({
            message: `REST handler for ${objectName} not implemented yet`
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: String(error) }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    });

    this.context?.logger.info('[BrowserRuntime] API handlers registered');
  }
}

/**
 * Export service worker and worker scripts for external use
 */
export { SERVICE_WORKER_SCRIPT, WORKER_SCRIPT };
