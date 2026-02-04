/**
 * SQLite WASM Database Driver for Browser
 * 
 * This driver uses sql.js (SQLite compiled to WebAssembly) to provide
 * a browser-based SQL database compatible with ObjectQL.
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import type { BrowserDatabaseDriver, SQLiteResult } from '../types';

/**
 * Configuration for SQLite WASM driver
 */
export interface SQLiteWASMConfig {
  /**
   * Database name
   */
  name?: string;
  
  /**
   * Use OPFS for persistence
   */
  useOPFS?: boolean;
  
  /**
   * Initial SQL scripts
   */
  initScripts?: string[];
  
  /**
   * Path to sql-wasm.wasm file
   */
  wasmPath?: string;
}

/**
 * SQLite WASM Driver
 * Implements browser-compatible database operations using sql.js
 */
export class SQLiteWASMDriver implements BrowserDatabaseDriver {
  private SQL: SqlJsStatic | null = null;
  private db: Database | null = null;
  private config: SQLiteWASMConfig;
  private dbName: string;
  private inTransaction = false;

  constructor(config: SQLiteWASMConfig = {}) {
    this.config = config;
    this.dbName = config.name || 'objectos.db';
  }

  /**
   * Connect to database and initialize sql.js
   */
  async connect(): Promise<void> {
    try {
      // Initialize sql.js
      this.SQL = await initSqlJs({
        locateFile: (file: string) => {
          if (this.config.wasmPath) {
            return this.config.wasmPath;
          }
          // Default CDN path
          return `https://sql.js.org/dist/${file}`;
        }
      });

      // Try to load existing database from OPFS
      let existingData: Uint8Array | undefined;
      
      if (this.config.useOPFS && typeof navigator !== 'undefined' && 'storage' in navigator) {
        try {
          existingData = await this.loadFromOPFS();
        } catch (error) {
          console.warn('[SQLiteWASM] Failed to load from OPFS, creating new database:', error);
        }
      }

      // Create or load database
      this.db = new this.SQL.Database(existingData);

      // Run initialization scripts
      if (this.config.initScripts && this.config.initScripts.length > 0) {
        for (const script of this.config.initScripts) {
          this.db.run(script);
        }
      }

      // Set up auto-save if using OPFS
      if (this.config.useOPFS) {
        this.setupAutoSave();
      }

      console.log('[SQLiteWASM] Connected successfully');
    } catch (error) {
      console.error('[SQLiteWASM] Failed to connect:', error);
      throw new Error(`Failed to connect to SQLite WASM: ${error}`);
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.db) {
      // Save to OPFS before closing
      if (this.config.useOPFS) {
        await this.saveToOPFS();
      }
      
      this.db.close();
      this.db = null;
    }
    
    this.SQL = null;
    console.log('[SQLiteWASM] Disconnected');
  }

  /**
   * Execute a SELECT query
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      const results = this.db.exec(sql, params);
      
      if (results.length === 0) {
        return [];
      }

      const { columns, values } = results[0];
      
      // Convert array results to objects
      return values.map((row: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj;
      });
    } catch (error) {
      console.error('[SQLiteWASM] Query failed:', error);
      throw error;
    }
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE statement
   */
  async execute(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    try {
      this.db.run(sql, params);
      
      // Auto-save after mutations if using OPFS
      if (this.config.useOPFS && !this.inTransaction) {
        await this.saveToOPFS();
      }
    } catch (error) {
      console.error('[SQLiteWASM] Execute failed:', error);
      throw error;
    }
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    this.db.run('BEGIN TRANSACTION');
    this.inTransaction = true;
  }

  /**
   * Commit a transaction
   */
  async commit(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    this.db.run('COMMIT');
    this.inTransaction = false;

    // Save after commit
    if (this.config.useOPFS) {
      await this.saveToOPFS();
    }
  }

  /**
   * Rollback a transaction
   */
  async rollback(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    this.db.run('ROLLBACK');
    this.inTransaction = false;
  }

  /**
   * Get raw database instance for advanced operations
   */
  getRawDatabase(): Database | null {
    return this.db;
  }

  /**
   * Export database to Uint8Array
   */
  export(): Uint8Array | null {
    if (!this.db) {
      return null;
    }
    
    return this.db.export();
  }

  /**
   * Load database from OPFS
   */
  private async loadFromOPFS(): Promise<Uint8Array | undefined> {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
      return undefined;
    }

    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(this.dbName, { create: false });
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      
      console.log(`[SQLiteWASM] Loaded database from OPFS (${buffer.byteLength} bytes)`);
      return new Uint8Array(buffer);
    } catch (error) {
      // File doesn't exist yet
      return undefined;
    }
  }

  /**
   * Save database to OPFS
   */
  private async saveToOPFS(): Promise<void> {
    if (!this.db || typeof navigator === 'undefined' || !('storage' in navigator)) {
      return;
    }

    try {
      const data = this.db.export();
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(this.dbName, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Convert to Blob for writable stream
      await writable.write(new Blob([data.buffer as ArrayBuffer]));
      await writable.close();
      
      console.log(`[SQLiteWASM] Saved database to OPFS (${data.byteLength} bytes)`);
    } catch (error) {
      console.error('[SQLiteWASM] Failed to save to OPFS:', error);
    }
  }

  /**
   * Set up auto-save mechanism
   */
  private setupAutoSave(): void {
    // Save every 5 seconds if there are changes
    if (typeof window !== 'undefined') {
      setInterval(() => {
        if (!this.inTransaction) {
          this.saveToOPFS().catch(err => {
            console.error('[SQLiteWASM] Auto-save failed:', err);
          });
        }
      }, 5000);
    }

    // Save on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.db && this.config.useOPFS) {
          const data = this.db.export();
          // Use sendBeacon for reliable save on unload
          const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' });
          // Note: This is a best-effort approach
          this.saveToOPFS();
        }
      });
    }
  }
}
