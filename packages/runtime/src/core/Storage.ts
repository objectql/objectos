/**
 * Plugin Storage Implementation
 * 
 * Provides isolated key-value storage for each plugin.
 */

import { PluginStorage } from '../types';

/**
 * In-memory storage implementation
 */
export class MemoryStorage implements PluginStorage {
  private data = new Map<string, any>();

  async get<T = any>(key: string): Promise<T | undefined> {
    return this.data.get(key);
  }

  async set<T = any>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.data.has(key);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async clear(): Promise<void> {
    this.data.clear();
  }
}

/**
 * Storage factory
 */
export class StorageFactory {
  /**
   * Create a scoped storage for a plugin
   */
  static createScoped(
    pluginId: string,
    backend: PluginStorage
  ): PluginStorage {
    const prefix = `plugin:${pluginId}:`;

    return {
      async get<T = any>(key: string): Promise<T | undefined> {
        return backend.get(prefix + key);
      },

      async set<T = any>(key: string, value: T): Promise<void> {
        return backend.set(prefix + key, value);
      },

      async delete(key: string): Promise<void> {
        return backend.delete(prefix + key);
      },

      async has(key: string): Promise<boolean> {
        return backend.has(prefix + key);
      },

      async keys(): Promise<string[]> {
        const allKeys = await backend.keys();
        return allKeys
          .filter(k => k.startsWith(prefix))
          .map(k => k.substring(prefix.length));
      },

      async clear(): Promise<void> {
        const keys = await this.keys();
        for (const key of keys) {
          await backend.delete(prefix + key);
        }
      }
    };
  }
}
