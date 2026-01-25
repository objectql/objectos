/**
 * Scoped Storage Implementation
 * 
 * Provides plugin-scoped key-value storage that conforms to the
 * @objectstack/spec/kernel ScopedStorage interface.
 */

/**
 * ScopedStorage interface for plugin-specific data storage.
 */
export interface ScopedStorage {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
    delete(key: string): Promise<void>;
}

/**
 * In-memory implementation of ScopedStorage.
 * 
 * This is a simple in-memory store suitable for development and testing.
 * For production, this should be replaced with a persistent store (Redis, Database, etc.).
 */
export class InMemoryScopedStorage implements ScopedStorage {
    private store: Map<string, any> = new Map();
    private pluginId: string;

    constructor(pluginId: string) {
        this.pluginId = pluginId;
    }

    async get(key: string): Promise<any> {
        const fullKey = this.getFullKey(key);
        return this.store.get(fullKey);
    }

    async set(key: string, value: any): Promise<void> {
        const fullKey = this.getFullKey(key);
        this.store.set(fullKey, value);
    }

    async delete(key: string): Promise<void> {
        const fullKey = this.getFullKey(key);
        this.store.delete(fullKey);
    }

    /**
     * Get all keys for this plugin.
     */
    async keys(): Promise<string[]> {
        const prefix = `${this.pluginId}:`;
        return Array.from(this.store.keys())
            .filter(key => key.startsWith(prefix))
            .map(key => key.substring(prefix.length));
    }

    /**
     * Clear all data for this plugin.
     */
    async clear(): Promise<void> {
        const keys = await this.keys();
        for (const key of keys) {
            await this.delete(key);
        }
    }

    private getFullKey(key: string): string {
        return `${this.pluginId}:${key}`;
    }
}

/**
 * Storage Manager
 * 
 * Manages scoped storage instances for all plugins.
 */
export class StorageManager {
    private globalStore: Map<string, any> = new Map();

    /**
     * Create a scoped storage instance for a plugin.
     */
    createScopedStorage(pluginId: string): ScopedStorage {
        return new InMemoryScopedStorage(pluginId);
    }

    /**
     * Get global (non-scoped) storage.
     * Used for system-level configuration and state.
     */
    getGlobalStorage(): Map<string, any> {
        return this.globalStore;
    }
}
