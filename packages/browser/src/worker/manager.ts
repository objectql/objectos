/**
 * Web Worker Manager for Business Logic Isolation
 * 
 * This module manages a Web Worker that executes business logic
 * in isolation from the main thread, improving performance and security.
 */

import type { WorkerMessage, WorkerMessageType } from '../types/index.js';

/**
 * Web Worker Manager
 * Manages worker lifecycle and message passing
 */
export class WorkerManager {
  private worker: Worker | null = null;
  private messageHandlers: Map<string, (result: any, error?: string) => void> = new Map();
  private messageId = 0;

  /**
   * Initialize the web worker
   */
  async init(scriptPath: string = '/worker.js'): Promise<void> {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers are not supported in this environment');
    }

    try {
      this.worker = new Worker(scriptPath, { type: 'module' });
      
      // Set up message handler
      this.worker.addEventListener('message', (event) => {
        this.handleMessage(event.data);
      });

      // Set up error handler
      this.worker.addEventListener('error', (error) => {
        console.error('[Worker] Error:', error);
      });

      console.log('[Worker] Initialized successfully');
    } catch (error) {
      console.error('[Worker] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Terminate the web worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.messageHandlers.clear();
      console.log('[Worker] Terminated');
    }
  }

  /**
   * Execute a query in the worker
   */
  async executeQuery(sql: string, params?: any[]): Promise<any[]> {
    return this.postMessage('EXECUTE_QUERY', { sql, params });
  }

  /**
   * Execute a mutation in the worker
   */
  async executeMutation(sql: string, params?: any[]): Promise<void> {
    return this.postMessage('EXECUTE_MUTATION', { sql, params });
  }

  /**
   * Load a plugin in the worker
   */
  async loadPlugin(pluginName: string, config?: any): Promise<void> {
    return this.postMessage('LOAD_PLUGIN', { pluginName, config });
  }

  /**
   * Unload a plugin from the worker
   */
  async unloadPlugin(pluginName: string): Promise<void> {
    return this.postMessage('UNLOAD_PLUGIN', { pluginName });
  }

  /**
   * Invoke a hook in the worker
   */
  async invokeHook(hookName: string, context: any): Promise<any> {
    return this.postMessage('INVOKE_HOOK', { hookName, context });
  }

  /**
   * Post message to worker and wait for response
   */
  private async postMessage(type: WorkerMessageType, payload: any): Promise<any> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    const id = String(++this.messageId);
    
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(id);
        reject(new Error('Worker request timeout'));
      }, 30000); // 30 second timeout

      // Set up response handler that can either resolve or reject
      this.messageHandlers.set(id, (result: any, error?: string) => {
        clearTimeout(timeout);
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      });

      // Send message
      const message: WorkerMessage = { type, payload, id };
      this.worker!.postMessage(message);
    });
  }

  /**
   * Handle message from worker
   */
  private handleMessage(data: any): void {
    const { id, result, error } = data;

    const handler = this.messageHandlers.get(id);
    if (handler) {
      this.messageHandlers.delete(id);
      handler(result, error);
    }
  }
}

/**
 * Worker Script Template
 * This should be used to generate the actual worker file
 */
export const WORKER_SCRIPT = `
/**
 * ObjectOS Browser Runtime Web Worker
 * Executes business logic in isolation from main thread
 */

// Import database driver (will be bundled)
// import { SQLiteWASMDriver } from './database/sqlite-wasm-driver.js';

let database = null;
const plugins = new Map();

self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data;

  try {
    let result;

    switch (type) {
      case 'EXECUTE_QUERY':
        result = await executeQuery(payload.sql, payload.params);
        break;

      case 'EXECUTE_MUTATION':
        result = await executeMutation(payload.sql, payload.params);
        break;

      case 'LOAD_PLUGIN':
        result = await loadPlugin(payload.pluginName, payload.config);
        break;

      case 'UNLOAD_PLUGIN':
        result = await unloadPlugin(payload.pluginName);
        break;

      case 'INVOKE_HOOK':
        result = await invokeHook(payload.hookName, payload.context);
        break;

      default:
        throw new Error(\`Unknown message type: \${type}\`);
    }

    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message });
  }
});

async function executeQuery(sql, params) {
  if (!database) {
    throw new Error('Database not initialized');
  }

  // Execute query using database driver
  return database.query(sql, params);
}

async function executeMutation(sql, params) {
  if (!database) {
    throw new Error('Database not initialized');
  }

  // Execute mutation using database driver
  return database.execute(sql, params);
}

async function loadPlugin(pluginName, config) {
  console.log('[Worker] Loading plugin:', pluginName);
  
  // Load and initialize plugin
  // This would import the plugin module and call its init method
  plugins.set(pluginName, { config });
  
  return { success: true };
}

async function unloadPlugin(pluginName) {
  console.log('[Worker] Unloading plugin:', pluginName);
  
  plugins.delete(pluginName);
  
  return { success: true };
}

async function invokeHook(hookName, context) {
  console.log('[Worker] Invoking hook:', hookName);
  
  // Execute registered hooks
  // This would call all plugins that have registered for this hook
  
  return { success: true, context };
}

// Initialize worker
console.log('[Worker] Initialized');
`;
