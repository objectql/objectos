/**
 * DataLoader for N+1 Query Prevention (O.1.5)
 *
 * Batches and caches individual record lookups within a single request.
 * Each GraphQL request gets its own DataLoader context (no cross-request caching).
 */

export interface DataLoaderOptions {
  /** Maximum batch size (default: 100) */
  maxBatchSize?: number;
  /** Enable per-request caching (default: true) */
  cache?: boolean;
}

export class DataLoader<K = string, V = any> {
  private batch: { key: K; resolve: (v: V | null) => void; reject: (e: Error) => void }[] = [];
  private cache: Map<string, V> = new Map();
  private batchScheduled = false;
  private maxBatchSize: number;
  private cacheEnabled: boolean;
  private batchFn: (keys: K[]) => Promise<(V | null)[]>;

  constructor(batchFn: (keys: K[]) => Promise<(V | null)[]>, options: DataLoaderOptions = {}) {
    this.batchFn = batchFn;
    this.maxBatchSize = options.maxBatchSize ?? 100;
    this.cacheEnabled = options.cache ?? true;
  }

  async load(key: K): Promise<V | null> {
    const cacheKey = String(key);
    if (this.cacheEnabled && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) ?? null;
    }

    return new Promise((resolve, reject) => {
      this.batch.push({ key, resolve, reject });
      if (!this.batchScheduled) {
        this.batchScheduled = true;
        queueMicrotask(() => this.dispatchBatch());
      }
    });
  }

  async loadMany(keys: K[]): Promise<(V | null)[]> {
    return Promise.all(keys.map(key => this.load(key)));
  }

  private async dispatchBatch(): Promise<void> {
    this.batchScheduled = false;
    const batch = this.batch.splice(0, this.maxBatchSize);
    if (batch.length === 0) return;

    const keys = batch.map(item => item.key);
    try {
      const results = await this.batchFn(keys);
      for (let i = 0; i < batch.length; i++) {
        const value = results[i] ?? null;
        if (this.cacheEnabled && value !== null) {
          this.cache.set(String(keys[i]), value);
        }
        batch[i].resolve(value);
      }
    } catch (error) {
      for (const item of batch) {
        item.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // If there are remaining items, dispatch another batch
    if (this.batch.length > 0) {
      queueMicrotask(() => this.dispatchBatch());
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  prime(key: K, value: V): void {
    if (this.cacheEnabled) {
      this.cache.set(String(key), value);
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

/**
 * Create a DataLoader factory for ObjectStack data operations.
 * Creates per-object DataLoaders that batch findOne calls.
 */
export function createDataLoaderFactory(broker: any) {
  const loaders = new Map<string, DataLoader<string, any>>();

  return {
    getLoader(objectName: string): DataLoader<string, any> {
      if (!loaders.has(objectName)) {
        const loader = new DataLoader<string, any>(async (ids: string[]) => {
          try {
            const records = await broker.call('data.find', {
              objectName,
              filters: { _id: { $in: ids } },
              options: { limit: ids.length },
            });
            const recordMap = new Map<string, any>();
            for (const r of (Array.isArray(records) ? records : [])) {
              if (r?._id) recordMap.set(r._id, r);
            }
            return ids.map(id => recordMap.get(id) ?? null);
          } catch {
            return ids.map(() => null);
          }
        });
        loaders.set(objectName, loader);
      }
      return loaders.get(objectName)!;
    },

    clearAll(): void {
      for (const loader of loaders.values()) {
        loader.clearCache();
      }
      loaders.clear();
    },
  };
}
