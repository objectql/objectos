/**
 * LRU Cache Backend
 * 
 * A Least Recently Used (LRU) cache implementation with TTL support.
 * Evicts the least recently accessed items when the cache reaches maxSize.
 */

import type { CacheBackend, LruCacheOptions, CacheEntry, CacheStats } from './types.js';

/**
 * Internal node for doubly linked list (for LRU tracking)
 */
class LruNode {
    constructor(
        public key: string,
        public prev: LruNode | null = null,
        public next: LruNode | null = null
    ) {}
}

export class LruCacheBackend implements CacheBackend {
    private store: Map<string, CacheEntry> = new Map();
    private accessOrder: Map<string, LruNode> = new Map();
    private head: LruNode | null = null; // Most recently used
    private tail: LruNode | null = null; // Least recently used
    
    private maxSize: number;
    private defaultTtl?: number;
    private ttlCheckInterval?: NodeJS.Timeout;
    
    // Statistics
    private hits: number = 0;
    private misses: number = 0;
    private evictions: number = 0;

    constructor(options: LruCacheOptions = {}) {
        this.maxSize = options.maxSize || 1000;
        this.defaultTtl = options.defaultTtl;
        
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
            this.misses++;
            return undefined;
        }
        
        // Check if expired
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            this.removeFromAccessOrder(key);
            this.misses++;
            return undefined;
        }
        
        // Update access metadata
        entry.accessedAt = Date.now();
        entry.accessCount++;
        
        // Move to front of LRU list
        this.moveToFront(key);
        
        this.hits++;
        return entry.value;
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const now = Date.now();
        const effectiveTtl = ttl ?? this.defaultTtl;
        
        // If key exists, update it
        if (this.store.has(key)) {
            const entry = this.store.get(key)!;
            entry.value = value;
            entry.accessedAt = now;
            entry.accessCount++;
            entry.expiresAt = effectiveTtl ? now + effectiveTtl * 1000 : undefined;
            
            this.moveToFront(key);
            return;
        }
        
        // Check if we need to evict
        if (this.store.size >= this.maxSize) {
            this.evictLru();
        }
        
        // Create new entry
        const entry: CacheEntry = {
            key,
            value,
            expiresAt: effectiveTtl ? now + effectiveTtl * 1000 : undefined,
            createdAt: now,
            accessedAt: now,
            accessCount: 1,
        };
        
        this.store.set(key, entry);
        this.addToFront(key);
    }

    async delete(key: string): Promise<boolean> {
        const existed = this.store.delete(key);
        this.removeFromAccessOrder(key);
        return existed;
    }

    async has(key: string): Promise<boolean> {
        const entry = this.store.get(key);
        
        if (!entry) {
            return false;
        }
        
        // Check if expired
        if (entry.expiresAt && entry.expiresAt < Date.now()) {
            this.store.delete(key);
            this.removeFromAccessOrder(key);
            return false;
        }
        
        return true;
    }

    async clear(): Promise<void> {
        this.store.clear();
        this.accessOrder.clear();
        this.head = null;
        this.tail = null;
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
    }

    getStats(): CacheStats {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            size: this.store.size,
            evictions: this.evictions,
            hitRate: total > 0 ? this.hits / total : 0,
        };
    }

    async close(): Promise<void> {
        if (this.ttlCheckInterval) {
            clearInterval(this.ttlCheckInterval);
        }
        await this.clear();
    }

    /**
     * Evict the least recently used item
     */
    private evictLru(): void {
        if (!this.tail) {
            return;
        }
        
        const key = this.tail.key;
        this.store.delete(key);
        this.removeFromAccessOrder(key);
        this.evictions++;
    }

    /**
     * Add key to front of LRU list (most recently used)
     */
    private addToFront(key: string): void {
        const node = new LruNode(key);
        this.accessOrder.set(key, node);
        
        if (!this.head) {
            // First node
            this.head = node;
            this.tail = node;
        } else {
            // Insert at head
            node.next = this.head;
            this.head.prev = node;
            this.head = node;
        }
    }

    /**
     * Move existing key to front of LRU list
     */
    private moveToFront(key: string): void {
        const node = this.accessOrder.get(key);
        if (!node || node === this.head) {
            return; // Already at front or doesn't exist
        }
        
        // Remove from current position
        if (node.prev) {
            node.prev.next = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        if (node === this.tail) {
            this.tail = node.prev;
        }
        
        // Move to front
        node.prev = null;
        node.next = this.head;
        if (this.head) {
            this.head.prev = node;
        }
        this.head = node;
    }

    /**
     * Remove key from LRU list
     */
    private removeFromAccessOrder(key: string): void {
        const node = this.accessOrder.get(key);
        if (!node) {
            return;
        }
        
        // Update links
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            // This was the head
            this.head = node.next;
        }
        
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            // This was the tail
            this.tail = node.prev;
        }
        
        this.accessOrder.delete(key);
    }

    /**
     * Clean expired entries
     */
    private cleanExpired(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];
        
        for (const [key, entry] of this.store.entries()) {
            if (entry.expiresAt && entry.expiresAt < now) {
                keysToDelete.push(key);
            }
        }
        
        for (const key of keysToDelete) {
            this.store.delete(key);
            this.removeFromAccessOrder(key);
        }
    }
}
