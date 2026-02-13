/**
 * Redis Storage Backend
 *
 * Production-ready distributed storage using Redis.
 * Supports clustering, persistence, and high availability.
 */

import type { StorageBackend, RedisStorageOptions } from './types.js';

export class RedisStorageBackend implements StorageBackend {
  private client: any;
  private keyPrefix: string;

  constructor(options: RedisStorageOptions = {}) {
    try {
      // Dynamic import to make it optional
      const Redis = require('ioredis');

      this.keyPrefix = options.keyPrefix || 'objectos:storage:';

      this.client = new Redis({
        host: options.host || '127.0.0.1',
        port: options.port || 6379,
        password: options.password,
        db: options.db || 0,
        keyPrefix: this.keyPrefix,
        lazyConnect: true,
      });
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Redis storage: ${error.message}. ` +
          'Make sure ioredis is installed: npm install ioredis',
      );
    }
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);

    if (value === null) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern?: string): Promise<string[]> {
    const searchPattern = pattern || '*';
    const keys = await this.client.keys(searchPattern);

    // Remove key prefix from results
    return keys.map((key: string) => {
      if (key.startsWith(this.keyPrefix)) {
        return key.slice(this.keyPrefix.length);
      }
      return key;
    });
  }

  async clear(): Promise<void> {
    const keys = await this.client.keys('*');
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
