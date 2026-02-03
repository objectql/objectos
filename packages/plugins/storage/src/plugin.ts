/**
 * Storage Plugin for ObjectOS
 * 
 * Provides plugin-isolated KV storage with multiple backend support:
 * - Memory (development)
 * - SQLite (file-based)
 * - Redis (production)
 * 
 * Features:
 * - Plugin namespace isolation
 * - TTL support
 * - Pattern-based key queries
 * - Multiple backend strategies
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { StorageBackend, StorageConfig } from './types';
import { MemoryStorageBackend } from './memory-backend';
import { SqliteStorageBackend } from './sqlite-backend';
import { RedisStorageBackend } from './redis-backend';

/**
 * Scoped Storage for a single plugin
 * Automatically prefixes all keys with the plugin ID
 */
export class ScopedStorage implements StorageBackend {
    constructor(
        private backend: StorageBackend,
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

    async keys(pattern?: string): Promise<string[]> {
        const scopedPattern = pattern ? this.scopedKey(pattern) : this.scopedKey('*');
        const scopedKeys = await this.backend.keys(scopedPattern);
        
        // Remove plugin prefix from results
        const prefix = this.scopedKey('');
        return scopedKeys.map(key => key.slice(prefix.length));
    }

    async clear(): Promise<void> {
        // Only clear keys belonging to this plugin
        const keys = await this.keys('*');
        for (const key of keys) {
            await this.delete(key);
        }
    }

    private scopedKey(key: string): string {
        return `${this.pluginId}:${key}`;
    }
}

/**
 * Storage Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class StoragePlugin implements Plugin {
    name = 'com.objectos.storage';
    version = '0.1.0';
    dependencies: string[] = [];

    private backend: StorageBackend;
    private context?: PluginContext;
    private scopedInstances: Map<string, ScopedStorage> = new Map();

    constructor(config: StorageConfig = {}) {
        // Initialize backend
        if (config.customBackend) {
            this.backend = config.customBackend;
        } else {
            const backendType = config.backend || 'memory';
            this.backend = this.createBackend(backendType, config.options);
        }
    }

    /**
     * Initialize plugin
     */
    async init(context: PluginContext): Promise<void> {
        this.context = context;

        // Register storage service
        context.registerService('storage', this);

        // For Redis backend, connect
        if (this.backend instanceof RedisStorageBackend) {
            await (this.backend as any).connect();
        }

        context.logger.info('[Storage] Initialized successfully');
    }

    /**
     * Start plugin
     */
    async start(context: PluginContext): Promise<void> {
        context.logger.info('[Storage] Started successfully');
    }

    /**
     * Get scoped storage for a plugin
     */
    getScopedStorage(pluginId: string): ScopedStorage {
        if (!this.scopedInstances.has(pluginId)) {
            this.scopedInstances.set(pluginId, new ScopedStorage(this.backend, pluginId));
        }
        return this.scopedInstances.get(pluginId)!;
    }

    /**
     * Direct access to backend (for system use only)
     */
    getBackend(): StorageBackend {
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

    async keys(pattern?: string): Promise<string[]> {
        return this.backend.keys(pattern);
    }

    async clear(): Promise<void> {
        return this.backend.clear();
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        if (this.backend.close) {
            await this.backend.close();
        }
        this.scopedInstances.clear();
        this.context?.logger.info('[Storage] Destroyed');
    }

    /**
     * Create backend instance based on type
     */
    private createBackend(type: string, options: any): StorageBackend {
        switch (type) {
            case 'memory':
                return new MemoryStorageBackend(options);
            
            case 'sqlite':
                if (!options || !options.path) {
                    throw new Error('SQLite backend requires a path option');
                }
                return new SqliteStorageBackend(options);
            
            case 'redis':
                return new RedisStorageBackend(options);
            
            default:
                throw new Error(`Unknown storage backend: ${type}`);
        }
    }
}

/**
 * Helper function to access the storage API from kernel
 */
export function getStorageAPI(kernel: any): StoragePlugin | null {
    try {
        return kernel.getService('storage');
    } catch {
        return null;
    }
}
