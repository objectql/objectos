/**
 * Cache Plugin for ObjectOS
 * 
 * Provides high-performance caching with multiple backend support:
 * - LRU (in-memory with automatic eviction)
 * - Redis (distributed caching)
 * 
 * Features:
 * - Plugin namespace isolation
 * - TTL support
 * - LRU eviction strategy
 * - Cache statistics (hits, misses, hit rate)
 * - Multiple backend strategies
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { CacheBackend, CacheConfig, CacheStats } from './types.js';
import { LruCacheBackend } from './lru-backend.js';
import { RedisCacheBackend } from './redis-backend.js';

/**
 * Scoped Cache for a single plugin
 * Automatically prefixes all keys with the plugin ID
 */
export class ScopedCache implements CacheBackend {
    constructor(
        private backend: CacheBackend,
        private pluginId: string
    ) {}

    async get(key: string): Promise<any> {
        return this.backend.get(this.scopedKey(key));
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        return this.backend.set(this.scopedKey(key), value, ttl);
    }

    async delete(key: string): Promise<void> {
        return this.backend.delete(this.scopedKey(key));
    }

    async has(key: string): Promise<boolean> {
        return this.backend.has(this.scopedKey(key));
    }

    async clear(): Promise<void> {
        // For scoped cache, we can't easily clear only our keys
        // This would require tracking all keys, which defeats the purpose
        // Instead, we document that clear() is not supported for scoped caches
        throw new Error('clear() is not supported for scoped caches. Use delete() for individual keys.');
    }

    getStats?(): CacheStats {
        return this.backend.getStats?.() ?? {
            hits: 0,
            misses: 0,
            size: 0,
            hitRate: 0,
        };
    }

    private scopedKey(key: string): string {
        return `${this.pluginId}:${key}`;
    }
}

/**
 * Cache Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class CachePlugin implements Plugin {
    name = '@objectos/cache';
    version = '0.1.0';
    dependencies: string[] = [];

    private backend: CacheBackend;
    private context?: PluginContext;
    private scopedInstances: Map<string, ScopedCache> = new Map();
    private enableStats: boolean;

    constructor(config: CacheConfig = {}) {
        this.enableStats = config.enableStats ?? true;

        // Initialize backend
        if (config.customBackend) {
            this.backend = config.customBackend;
        } else {
            const backendType = config.backend || 'lru';
            this.backend = this.createBackend(backendType, config.options);
        }
    }

    /**
     * Initialize plugin
     */
    async init(context: PluginContext): Promise<void> {
        this.context = context;

        // Register cache service
        context.registerService('cache', this);

        // For Redis backend, connect
        if (this.backend instanceof RedisCacheBackend) {
            await (this.backend as any).connect();
        }

        context.logger.info('[Cache] Initialized successfully');
    }

    /**
     * Start plugin
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Cache] Started successfully');
    }

    /**
     * Get scoped cache for a plugin
     */
    getScopedCache(pluginId: string): ScopedCache {
        if (!this.scopedInstances.has(pluginId)) {
            this.scopedInstances.set(pluginId, new ScopedCache(this.backend, pluginId));
        }
        return this.scopedInstances.get(pluginId)!;
    }

    /**
     * Direct access to backend (for system use only)
     */
    getBackend(): CacheBackend {
        return this.backend;
    }

    /**
     * Public API methods for service access
     */
    async get(key: string): Promise<any> {
        return this.backend.get(key);
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        return this.backend.set(key, value, ttl);
    }

    async delete(key: string): Promise<void> {
        return this.backend.delete(key);
    }

    async has(key: string): Promise<boolean> {
        return this.backend.has(key);
    }

    async clear(): Promise<void> {
        return this.backend.clear();
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats | undefined {
        if (!this.enableStats) {
            return undefined;
        }
        return this.backend.getStats?.();
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        if (this.backend.close) {
            await this.backend.close();
        }
        this.scopedInstances.clear();
        this.context?.logger.info('[Cache] Destroyed');
    }

    /**
     * Create backend instance based on type
     */
    private createBackend(type: string, options: any): CacheBackend {
        switch (type) {
            case 'lru':
                return new LruCacheBackend(options);
            
            case 'redis':
                return new RedisCacheBackend(options);
            
            default:
                throw new Error(`Unknown cache backend: ${type}`);
        }
    }
}

/**
 * Helper function to access the cache API from kernel
 */
export function getCacheAPI(kernel: any): CachePlugin | null {
    try {
        return kernel.getService('cache');
    } catch {
        return null;
    }
}
