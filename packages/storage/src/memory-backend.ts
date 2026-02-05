/**
 * In-Memory Storage Backend
 * 
 * A simple in-memory storage implementation suitable for development and testing.
 * Supports TTL expiration.
 */

import type { StorageBackend, MemoryStorageOptions, StorageEntry } from './types.js';

export class MemoryStorageBackend implements StorageBackend {
    private store: Map<string, StorageEntry> = new Map();
    private maxKeys: number;
    private ttlCheckInterval?: NodeJS.Timeout;

    constructor(options: MemoryStorageOptions = {}) {
        this.maxKeys = options.maxKeys || 10000;
        
        // Start TTL expiration checker if configured
        if (options.ttlCheckInterval && options.ttlCheckInterval > 0) {
            this.ttlCheckInterval = setInterval(() => {
                this.cleanExpired();
            }, options.ttlCheckInterval);
        }
    }

    async get(key: string): Promise<any> {
        const entry = this.store.get(key);
        
        if (!entry) {
            return undefined;
        }
        
        // Check if expired
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            return undefined;
        }
        
        return entry.value;
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        // Check max keys limit
        if (!this.store.has(key) && this.store.size >= this.maxKeys) {
            throw new Error(`Storage limit reached: ${this.maxKeys} keys`);
        }
        
        const entry: StorageEntry = {
            key,
            value,
            expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
        };
        
        this.store.set(key, entry);
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async keys(pattern?: string): Promise<string[]> {
        const allKeys = Array.from(this.store.keys());
        
        if (!pattern) {
            return allKeys;
        }
        
        // Convert glob pattern to regex
        const regex = this.patternToRegex(pattern);
        return allKeys.filter(key => regex.test(key));
    }

    async clear(): Promise<void> {
        this.store.clear();
    }

    async close(): Promise<void> {
        if (this.ttlCheckInterval) {
            clearInterval(this.ttlCheckInterval);
            this.ttlCheckInterval = undefined;
        }
        this.store.clear();
    }

    /**
     * Clean expired entries
     */
    private cleanExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.expiresAt && entry.expiresAt < now) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Convert glob pattern to regex
     */
    private patternToRegex(pattern: string): RegExp {
        const escaped = pattern
            .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
            .replace(/\*/g, '.*') // * matches anything
            .replace(/\?/g, '.'); // ? matches single char
        return new RegExp(`^${escaped}$`);
    }
}
