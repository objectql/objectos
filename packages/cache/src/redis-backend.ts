/**
 * Redis Cache Backend
 * 
 * A Redis-based cache implementation for distributed caching.
 * Optimized for cache patterns with TTL support.
 */

import type { CacheBackend, RedisCacheOptions, CacheStats } from './types.js';

export class RedisCacheBackend implements CacheBackend {
    private client?: any; // Redis client (ioredis)
    private keyPrefix: string;
    private defaultTtl?: number;
    
    // Statistics (local tracking)
    private hits: number = 0;
    private misses: number = 0;

    constructor(private options: RedisCacheOptions = {}) {
        this.keyPrefix = options.keyPrefix || 'cache:';
        this.defaultTtl = options.defaultTtl;
    }

    /**
     * Connect to Redis (lazy initialization)
     */
    async connect(): Promise<void> {
        if (this.client) {
            return; // Already connected
        }

        try {
            // Dynamic import of ioredis
            const Redis: any = (await import('ioredis')).default;
            
            this.client = new Redis({
                host: this.options.host || 'localhost',
                port: this.options.port || 6379,
                password: this.options.password,
                db: this.options.db || 0,
                keyPrefix: this.keyPrefix,
                lazyConnect: false,
            });

            // Wait for connection
            await this.client.ping();
        } catch (error: any) {
            throw new Error(`Failed to connect to Redis: ${error.message}`);
        }
    }

    async get(key: string): Promise<any> {
        this.ensureConnected();
        
        const value = await this.client.get(key);
        
        if (value === null) {
            this.misses++;
            return undefined;
        }
        
        this.hits++;
        
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        this.ensureConnected();
        
        const effectiveTtl = ttl ?? this.defaultTtl;
        const serialized = JSON.stringify(value);
        
        if (effectiveTtl) {
            // Set with expiration
            await this.client.setex(key, effectiveTtl, serialized);
        } else {
            // Set without expiration
            await this.client.set(key, serialized);
        }
    }

    async delete(key: string): Promise<void> {
        this.ensureConnected();
        await this.client.del(key);
    }

    async has(key: string): Promise<boolean> {
        this.ensureConnected();
        const exists = await this.client.exists(key);
        return exists === 1;
    }

    async clear(): Promise<void> {
        this.ensureConnected();
        
        // Get all keys with our prefix and delete them
        const keys = await this.client.keys('*');
        
        if (keys.length > 0) {
            // Remove prefix from keys for deletion
            const pipeline = this.client.pipeline();
            for (const key of keys) {
                pipeline.del(key.replace(this.keyPrefix, ''));
            }
            await pipeline.exec();
        }
        
        // Reset stats
        this.hits = 0;
        this.misses = 0;
    }

    getStats(): CacheStats {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            size: -1, // Redis doesn't track size efficiently
            hitRate: total > 0 ? this.hits / total : 0,
        };
    }

    async close(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = undefined;
        }
    }

    /**
     * Ensure Redis is connected
     */
    private ensureConnected(): void {
        if (!this.client) {
            throw new Error('Redis client not connected. Call connect() first.');
        }
    }
}
