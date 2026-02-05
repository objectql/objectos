/**
 * SQLite Storage Backend
 * 
 * Persistent file-based storage using better-sqlite3.
 * Provides ACID guarantees and good performance for local development and small-scale production.
 */

import type { StorageBackend, SqliteStorageOptions, StorageEntry } from './types.js';

export class SqliteStorageBackend implements StorageBackend {
    private db: any;
    private getStmt: any;
    private setStmt: any;
    private deleteStmt: any;
    private keysStmt: any;

    constructor(options: SqliteStorageOptions) {
        try {
            // Dynamic import to make it optional
            const Database = require('better-sqlite3');
            
            this.db = new Database(options.path);
            
            // Enable WAL mode for better concurrency
            if (options.wal !== false) {
                this.db.pragma('journal_mode = WAL');
            }
            
            // Create table
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS storage (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    expires_at INTEGER
                )
            `);
            
            // Create index for TTL queries
            this.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_expires_at 
                ON storage(expires_at)
            `);
            
            // Prepare statements for better performance
            this.getStmt = this.db.prepare('SELECT value, expires_at FROM storage WHERE key = ?');
            this.setStmt = this.db.prepare(
                'INSERT OR REPLACE INTO storage (key, value, expires_at) VALUES (?, ?, ?)'
            );
            this.deleteStmt = this.db.prepare('DELETE FROM storage WHERE key = ?');
            this.keysStmt = this.db.prepare('SELECT key FROM storage');
            
        } catch (error: any) {
            throw new Error(
                `Failed to initialize SQLite storage: ${error.message}. ` +
                'Make sure better-sqlite3 is installed: npm install better-sqlite3'
            );
        }
    }

    async get(key: string): Promise<any> {
        const row = this.getStmt.get(key);
        
        if (!row) {
            return undefined;
        }
        
        // Check if expired
        if (row.expires_at && row.expires_at < Date.now()) {
            this.deleteStmt.run(key);
            return undefined;
        }
        
        return JSON.parse(row.value);
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const expiresAt = ttl ? Date.now() + ttl * 1000 : null;
        this.setStmt.run(key, JSON.stringify(value), expiresAt);
    }

    async delete(key: string): Promise<void> {
        this.deleteStmt.run(key);
    }

    async keys(pattern?: string): Promise<string[]> {
        const rows = this.keysStmt.all();
        const allKeys = rows.map((row: any) => row.key);
        
        if (!pattern) {
            return allKeys;
        }
        
        // Convert glob pattern to regex
        const regex = this.patternToRegex(pattern);
        return allKeys.filter((key: string) => regex.test(key));
    }

    async clear(): Promise<void> {
        this.db.exec('DELETE FROM storage');
    }

    async close(): Promise<void> {
        if (this.db) {
            this.db.close();
        }
    }

    /**
     * Clean expired entries
     */
    async cleanExpired(): Promise<void> {
        this.db.prepare('DELETE FROM storage WHERE expires_at < ?').run(Date.now());
    }

    /**
     * Convert glob pattern to regex
     */
    private patternToRegex(pattern: string): RegExp {
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        return new RegExp(`^${escaped}$`);
    }
}
