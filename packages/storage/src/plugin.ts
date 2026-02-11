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
import type { StorageBackend, StorageConfig, PluginHealthReport, PluginCapabilityManifest, PluginSecurityManifest, PluginStartupResult, BucketInfo } from './types.js';
import { MemoryStorageBackend } from './memory-backend.js';
import { SqliteStorageBackend } from './sqlite-backend.js';
import { RedisStorageBackend } from './redis-backend.js';

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
    name = '@objectos/storage';
    version = '0.1.0';
    dependencies: string[] = [];

    private backend: StorageBackend;
    private context?: PluginContext;
    private scopedInstances: Map<string, ScopedStorage> = new Map();
    private startedAt?: number;
    private buckets: Map<string, { createdAt: string }> = new Map();

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
    init = async (context: PluginContext): Promise<void> => {
        this.context = context;
        this.startedAt = Date.now();

        // Register storage service
        context.registerService('file-storage', this);

        // For Redis backend, connect
        if (this.backend instanceof RedisStorageBackend) {
            await (this.backend as any).connect();
        }

        context.logger.info('[Storage] Initialized successfully');

        await context.trigger('plugin.initialized', { plugin: this.name });
    }

    /**
     * Start plugin
     */
    async start(context: PluginContext): Promise<void> {
        // Register HTTP routes for Storage API
        try {
            const httpServer = context.getService('http.server') as any;
            const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
            if (rawApp) {
                // GET /api/v1/storage/buckets - List buckets
                rawApp.get('/api/v1/storage/buckets', async (c: any) => {
                    try {
                        const buckets = await this.listBuckets();
                        return c.json({ success: true, data: buckets });
                    } catch (error: any) {
                        context.logger.error('[Storage API] List buckets error:', error);
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // POST /api/v1/storage/buckets - Create bucket
                rawApp.post('/api/v1/storage/buckets', async (c: any) => {
                    try {
                        const body = await c.req.json();
                        await this.createBucket(body.name);
                        return c.json({ success: true });
                    } catch (error: any) {
                        const status = error.message.includes('already exists') ? 409 : 500;
                        return c.json({ success: false, error: error.message }, status);
                    }
                });

                // DELETE /api/v1/storage/buckets/:name - Delete bucket
                rawApp.delete('/api/v1/storage/buckets/:name', async (c: any) => {
                    try {
                        const name = c.req.param('name');
                        await this.deleteBucket(name);
                        return c.json({ success: true });
                    } catch (error: any) {
                        const status = error.message.includes('not found') ? 404 : 500;
                        return c.json({ success: false, error: error.message }, status);
                    }
                });

                // GET /api/v1/storage/buckets/:bucket/objects - List objects
                rawApp.get('/api/v1/storage/buckets/:bucket/objects', async (c: any) => {
                    try {
                        const bucket = c.req.param('bucket');
                        const objects = await this.listObjects(bucket);
                        return c.json({ success: true, data: objects });
                    } catch (error: any) {
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                // PUT /api/v1/storage/buckets/:bucket/objects/:key - Put object
                rawApp.put('/api/v1/storage/buckets/:bucket/objects/:key', async (c: any) => {
                    try {
                        const bucket = c.req.param('bucket');
                        const key = c.req.param('key');
                        const body = await c.req.json();
                        await this.putObject(bucket, key, body.value);
                        return c.json({ success: true });
                    } catch (error: any) {
                        const status = error.message.includes('not found') ? 404 : 500;
                        return c.json({ success: false, error: error.message }, status);
                    }
                });

                // GET /api/v1/storage/buckets/:bucket/objects/:key - Get object
                rawApp.get('/api/v1/storage/buckets/:bucket/objects/:key', async (c: any) => {
                    try {
                        const bucket = c.req.param('bucket');
                        const key = c.req.param('key');
                        const value = await this.getObject(bucket, key);
                        if (value === undefined) {
                            return c.json({ success: false, error: 'Object not found' }, 404);
                        }
                        return c.json({ success: true, data: value });
                    } catch (error: any) {
                        const status = error.message.includes('not found') ? 404 : 500;
                        return c.json({ success: false, error: error.message }, status);
                    }
                });

                // DELETE /api/v1/storage/buckets/:bucket/objects/:key - Delete object
                rawApp.delete('/api/v1/storage/buckets/:bucket/objects/:key', async (c: any) => {
                    try {
                        const bucket = c.req.param('bucket');
                        const key = c.req.param('key');
                        await this.deleteObject(bucket, key);
                        return c.json({ success: true });
                    } catch (error: any) {
                        return c.json({ success: false, error: error.message }, 500);
                    }
                });

                context.logger.info('[Storage] HTTP routes registered');
            }
        } catch (e: any) {
            context.logger.warn(`[Storage] Could not register HTTP routes: ${e?.message}`);
        }

        context.logger.info('[Storage] Started successfully');

        await context.trigger('plugin.started', { plugin: this.name });
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
     * Health check
     */
    async healthCheck(): Promise<PluginHealthReport> {
        let checkStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        let message = 'Storage backend operational';
        let latencyMs = 0;
        try {
            const start = Date.now();
            await this.backend.set('__health_check__', 'ok', 5);
            const val = await this.backend.get('__health_check__');
            if (val !== 'ok') { checkStatus = 'degraded'; message = 'Storage read/write mismatch'; }
            await this.backend.delete('__health_check__');
            latencyMs = Date.now() - start;
        } catch {
            checkStatus = 'unhealthy';
            message = 'Storage backend unreachable';
        }
        return {
            status: checkStatus,
            timestamp: new Date().toISOString(),
            message,
            metrics: {
                uptime: this.startedAt ? Date.now() - this.startedAt : 0,
                responseTime: latencyMs,
            },
            checks: [{ name: 'storage-backend', status: checkStatus === 'healthy' ? 'passed' : checkStatus === 'degraded' ? 'warning' : 'failed', message }],
        };
    }

    /**
     * Capability manifest
     */
    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
        return {
            capabilities: {
                provides: [{
                    id: 'com.objectstack.service.file-storage',
                    name: 'file-storage',
                    version: { major: 0, minor: 1, patch: 0 },
                    methods: [
                        { name: 'get', description: 'Get a value by key', returnType: 'Promise<any>', async: true },
                        { name: 'set', description: 'Set a value with optional TTL', async: true },
                        { name: 'delete', description: 'Delete a value by key', async: true },
                        { name: 'keys', description: 'List keys matching a pattern', returnType: 'Promise<string[]>', async: true },
                        { name: 'clear', description: 'Clear all stored data', async: true },
                        { name: 'listBuckets', description: 'List storage buckets', returnType: 'Promise<BucketInfo[]>', async: true },
                        { name: 'createBucket', description: 'Create a storage bucket', async: true },
                        { name: 'deleteBucket', description: 'Delete a storage bucket', async: true },
                    ],
                    stability: 'stable',
                }],
                requires: [],
            },
            security: {
                pluginId: 'storage',
                trustLevel: 'trusted',
                permissions: { permissions: [], defaultGrant: 'deny' },
                sandbox: { enabled: false, level: 'none' },
            },
        };
    }

    /**
     * Startup result
     */
    getStartupResult(): PluginStartupResult {
        return { plugin: { name: this.name, version: this.version }, success: !!this.context, duration: 0 };
    }

    /**
     * Cleanup and shutdown
     */
    async destroy(): Promise<void> {
        if (this.backend.close) {
            await this.backend.close();
        }
        this.scopedInstances.clear();
        this.buckets.clear();

        if (this.context) {
            await this.context.trigger('plugin.destroyed', { plugin: this.name });
        }

        this.context?.logger.info('[Storage] Destroyed');
    }

    /**
     * List all storage buckets
     */
    async listBuckets(): Promise<BucketInfo[]> {
        const result: BucketInfo[] = [];
        for (const [name, meta] of this.buckets) {
            const keys = await this.backend.keys(`bucket:${name}:*`);
            result.push({ name, createdAt: meta.createdAt, itemCount: keys.length });
        }
        return result;
    }

    /**
     * Create a storage bucket
     */
    async createBucket(name: string): Promise<void> {
        if (this.buckets.has(name)) {
            throw new Error(`Bucket '${name}' already exists`);
        }
        this.buckets.set(name, { createdAt: new Date().toISOString() });
    }

    /**
     * Delete a storage bucket and all its objects
     */
    async deleteBucket(name: string): Promise<void> {
        if (!this.buckets.has(name)) {
            throw new Error(`Bucket '${name}' not found`);
        }
        const keys = await this.backend.keys(`bucket:${name}:*`);
        for (const key of keys) {
            await this.backend.delete(key);
        }
        this.buckets.delete(name);
    }

    /**
     * Put an object into a bucket
     */
    async putObject(bucket: string, key: string, value: any): Promise<void> {
        if (!this.buckets.has(bucket)) {
            throw new Error(`Bucket '${bucket}' not found`);
        }
        await this.backend.set(`bucket:${bucket}:${key}`, value);
    }

    /**
     * Get an object from a bucket
     */
    async getObject(bucket: string, key: string): Promise<any> {
        if (!this.buckets.has(bucket)) {
            throw new Error(`Bucket '${bucket}' not found`);
        }
        return this.backend.get(`bucket:${bucket}:${key}`);
    }

    /**
     * Delete an object from a bucket
     */
    async deleteObject(bucket: string, key: string): Promise<void> {
        if (!this.buckets.has(bucket)) {
            throw new Error(`Bucket '${bucket}' not found`);
        }
        await this.backend.delete(`bucket:${bucket}:${key}`);
    }

    /**
     * List all objects in a bucket
     */
    async listObjects(bucket: string): Promise<string[]> {
        if (!this.buckets.has(bucket)) {
            throw new Error(`Bucket '${bucket}' not found`);
        }
        const prefix = `bucket:${bucket}:`;
        const keys = await this.backend.keys(`bucket:${bucket}:*`);
        return keys.map(k => k.slice(prefix.length));
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
        return kernel.getService('file-storage');
    } catch {
        return null;
    }
}
