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
import type { ICacheService, CacheStats as SpecCacheStats } from '@objectstack/spec/contracts';
import type {
  CacheBackend,
  CacheConfig,
  CacheStats,
  CacheStrategy,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
import { LruCacheBackend } from './lru-backend.js';
import { RedisCacheBackend } from './redis-backend.js';

/**
 * Scoped Cache for a single plugin
 * Automatically prefixes all keys with the plugin ID
 */
export class ScopedCache implements CacheBackend {
  constructor(
    private backend: CacheBackend,
    private pluginId: string,
  ) {}

  async get(key: string): Promise<any> {
    return this.backend.get(this.scopedKey(key));
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    return this.backend.set(this.scopedKey(key), value, ttl);
  }

  async delete(key: string): Promise<boolean> {
    return this.backend.delete(this.scopedKey(key));
  }

  async has(key: string): Promise<boolean> {
    return this.backend.has(this.scopedKey(key));
  }

  async clear(): Promise<void> {
    // For scoped cache, we can't easily clear only our keys
    // This would require tracking all keys, which defeats the purpose
    // Instead, we document that clear() is not supported for scoped caches
    throw new Error(
      'clear() is not supported for scoped caches. Use delete() for individual keys.',
    );
  }

  getStats?(): CacheStats {
    return (
      this.backend.getStats?.() ?? {
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0,
      }
    );
  }

  private scopedKey(key: string): string {
    return `${this.pluginId}:${key}`;
  }
}

/**
 * Cache Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class CachePlugin implements Plugin, ICacheService {
  name = '@objectos/cache';
  version = '0.1.0';
  dependencies: string[] = [];

  private backend: CacheBackend;
  private context?: PluginContext;
  private scopedInstances: Map<string, ScopedCache> = new Map();
  private enableStats: boolean;
  private startedAt?: number;
  private strategy: CacheStrategy;

  constructor(config: CacheConfig = {}) {
    this.enableStats = config.enableStats ?? true;
    this.strategy = config.strategy ?? 'lru';

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
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();

    if (this.strategy !== 'lru') {
      context.logger.warn(
        `[Cache] Strategy '${this.strategy}' is not yet implemented, falling back to LRU`,
      );
    }

    // Register cache service
    context.registerService('cache', this);

    // For Redis backend, connect
    if (this.backend instanceof RedisCacheBackend) {
      await (this.backend as any).connect();
    }

    context.logger.info('[Cache] Initialized successfully');

    await context.trigger('plugin.initialized', {
      pluginId: this.name,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Start plugin
   */
  async start(context: PluginContext): Promise<void> {
    try {
      const httpServer = context.getService('http.server') as any;
      const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
      if (rawApp) {
        rawApp.get('/api/v1/cache/stats', async (c: any) => {
          try {
            const stats = this.getStats();
            return c.json({ success: true, data: stats ?? {} });
          } catch (error: any) {
            context.logger.error('[Cache API] Get stats error:', error);
            return c.json({ success: false, error: error.message }, 500);
          }
        });
      }
    } catch {
      // http.server not available — skip route registration
    }

    context.logger.info('[Cache] Started successfully');

    await context.trigger('plugin.started', {
      pluginId: this.name,
      timestamp: new Date().toISOString(),
    });
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

  async delete(key: string): Promise<boolean> {
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
   * Get cache statistics (ICacheService contract)
   */
  async stats(): Promise<SpecCacheStats> {
    const internal = this.getStats();
    return {
      hits: internal?.hits ?? 0,
      misses: internal?.misses ?? 0,
      keyCount: internal?.size ?? 0,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<PluginHealthReport> {
    let checkStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Cache backend operational';
    const start = Date.now();
    try {
      await this.backend.set('__health_check__', 'ok', 5);
      const val = await this.backend.get('__health_check__');
      if (val !== 'ok') {
        checkStatus = 'degraded';
        message = 'Cache read/write mismatch';
      }
      await this.backend.delete('__health_check__');
    } catch {
      checkStatus = 'unhealthy';
      message = 'Cache backend unreachable';
    }
    const latency = Date.now() - start;
    return {
      status: checkStatus,
      timestamp: new Date().toISOString(),
      message,
      metrics: {
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        responseTime: latency,
      },
      checks: [
        {
          name: 'cache-backend',
          status:
            checkStatus === 'healthy'
              ? 'passed'
              : checkStatus === 'degraded'
                ? 'warning'
                : 'failed',
          message,
        },
      ],
    };
  }

  /**
   * Capability manifest
   */
  getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
    return {
      capabilities: {
        provides: [
          {
            id: 'com.objectstack.service.cache',
            name: 'cache',
            version: { major: 0, minor: 1, patch: 0 },
            methods: [
              {
                name: 'get',
                description: 'Get a cached value by key',
                returnType: 'Promise<any>',
                async: true,
              },
              { name: 'set', description: 'Set a cached value with optional TTL', async: true },
              { name: 'delete', description: 'Delete a cached value', async: true },
              {
                name: 'has',
                description: 'Check if a key exists',
                returnType: 'Promise<boolean>',
                async: true,
              },
              { name: 'clear', description: 'Clear all cached values', async: true },
              {
                name: 'getStats',
                description: 'Get cache statistics',
                returnType: 'CacheStats',
                async: false,
              },
            ],
            stability: 'stable',
          },
        ],
        requires: [],
      },
      security: {
        pluginId: 'cache',
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
    return {
      plugin: { name: this.name, version: this.version },
      success: !!this.context,
      duration: 0,
    };
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

    if (this.context) {
      await this.context.trigger('plugin.destroyed', {
        pluginId: this.name,
        timestamp: new Date().toISOString(),
      });
    }
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
