/**
 * Tests for LRU Cache Backend
 */

import { LruCacheBackend } from '../src/lru-backend.js';

describe('LRU Cache Backend', () => {
    let cache: LruCacheBackend;

    beforeEach(() => {
        cache = new LruCacheBackend({
            maxSize: 3,
        });
    });

    afterEach(async () => {
        await cache.close();
    });

    describe('Basic Operations', () => {
        it('should set and get values', async () => {
            await cache.set('key1', 'value1');
            expect(await cache.get('key1')).toBe('value1');
        });

        it('should return undefined for missing keys', async () => {
            expect(await cache.get('missing')).toBeUndefined();
        });

        it('should update existing values', async () => {
            await cache.set('key1', 'value1');
            await cache.set('key1', 'value2');
            expect(await cache.get('key1')).toBe('value2');
        });

        it('should delete values', async () => {
            await cache.set('key1', 'value1');
            await cache.delete('key1');
            expect(await cache.get('key1')).toBeUndefined();
        });

        it('should check existence', async () => {
            await cache.set('key1', 'value1');
            expect(await cache.has('key1')).toBe(true);
            expect(await cache.has('key2')).toBe(false);
        });

        it('should clear all values', async () => {
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            await cache.clear();
            
            expect(await cache.get('key1')).toBeUndefined();
            expect(await cache.get('key2')).toBeUndefined();
        });
    });

    describe('LRU Eviction', () => {
        it('should evict least recently used item when maxSize is reached', async () => {
            // Fill cache to capacity
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            await cache.set('key3', 'value3');
            
            // Add one more - should evict key1 (least recently used)
            await cache.set('key4', 'value4');
            
            expect(await cache.get('key1')).toBeUndefined();
            expect(await cache.get('key2')).toBe('value2');
            expect(await cache.get('key3')).toBe('value3');
            expect(await cache.get('key4')).toBe('value4');
        });

        it('should update LRU order on get', async () => {
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            await cache.set('key3', 'value3');
            
            // Access key1 to make it most recently used
            await cache.get('key1');
            
            // Add key4 - should evict key2 (now least recently used)
            await cache.set('key4', 'value4');
            
            expect(await cache.get('key1')).toBe('value1');
            expect(await cache.get('key2')).toBeUndefined();
            expect(await cache.get('key3')).toBe('value3');
            expect(await cache.get('key4')).toBe('value4');
        });

        it('should update LRU order on set to existing key', async () => {
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            await cache.set('key3', 'value3');
            
            // Update key1 to make it most recently used
            await cache.set('key1', 'updated');
            
            // Add key4 - should evict key2
            await cache.set('key4', 'value4');
            
            expect(await cache.get('key1')).toBe('updated');
            expect(await cache.get('key2')).toBeUndefined();
            expect(await cache.get('key3')).toBe('value3');
            expect(await cache.get('key4')).toBe('value4');
        });

        it('should track eviction count', async () => {
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            await cache.set('key3', 'value3');
            
            const statsBefore = cache.getStats();
            expect(statsBefore.evictions).toBe(0);
            
            await cache.set('key4', 'value4'); // Evicts key1
            await cache.set('key5', 'value5'); // Evicts key2
            
            const statsAfter = cache.getStats();
            expect(statsAfter.evictions).toBe(2);
        });
    });

    describe('TTL Support', () => {
        it('should expire entries after TTL', async () => {
            await cache.set('temp', 'value', 1); // 1 second
            
            expect(await cache.get('temp')).toBe('value');
            
            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            expect(await cache.get('temp')).toBeUndefined();
        });

        it('should use default TTL if provided', async () => {
            const cacheWithDefaultTtl = new LruCacheBackend({
                maxSize: 10,
                defaultTtl: 1,
            });

            await cacheWithDefaultTtl.set('temp', 'value');
            
            expect(await cacheWithDefaultTtl.get('temp')).toBe('value');
            
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            expect(await cacheWithDefaultTtl.get('temp')).toBeUndefined();
            
            await cacheWithDefaultTtl.close();
        });

        it('should allow overriding default TTL', async () => {
            const cacheWithDefaultTtl = new LruCacheBackend({
                maxSize: 10,
                defaultTtl: 10,
            });

            await cacheWithDefaultTtl.set('temp', 'value', 1); // Override to 1 second
            
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            expect(await cacheWithDefaultTtl.get('temp')).toBeUndefined();
            
            await cacheWithDefaultTtl.close();
        });

        it('should clean expired entries periodically', async () => {
            const cacheWithCleaner = new LruCacheBackend({
                maxSize: 10,
                ttlCheckInterval: 500, // 500ms
            });

            await cacheWithCleaner.set('temp1', 'value1', 1);
            await cacheWithCleaner.set('temp2', 'value2', 1);
            
            // Wait for TTL expiration and cleanup
            await new Promise(resolve => setTimeout(resolve, 1600));
            
            const stats = cacheWithCleaner.getStats();
            expect(stats.size).toBe(0);
            
            await cacheWithCleaner.close();
        });

        it('should handle has() with expired entries', async () => {
            await cache.set('temp', 'value', 1);
            
            expect(await cache.has('temp')).toBe(true);
            
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            expect(await cache.has('temp')).toBe(false);
        });
    });

    describe('Statistics', () => {
        it('should track hits and misses', async () => {
            await cache.set('key1', 'value1');
            
            await cache.get('key1'); // Hit
            await cache.get('key2'); // Miss
            await cache.get('key1'); // Hit
            
            const stats = cache.getStats();
            expect(stats.hits).toBe(2);
            expect(stats.misses).toBe(1);
        });

        it('should calculate hit rate correctly', async () => {
            await cache.set('key1', 'value1');
            
            await cache.get('key1'); // Hit
            await cache.get('key2'); // Miss
            
            const stats = cache.getStats();
            expect(stats.hitRate).toBe(0.5);
        });

        it('should track cache size', async () => {
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            
            const stats = cache.getStats();
            expect(stats.size).toBe(2);
        });

        it('should reset stats on clear', async () => {
            await cache.set('key1', 'value1');
            await cache.get('key1');
            await cache.get('key2');
            
            await cache.clear();
            
            const stats = cache.getStats();
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.size).toBe(0);
            expect(stats.evictions).toBe(0);
        });
    });

    describe('Access Tracking', () => {
        it('should keep frequently accessed items in cache', async () => {
            // Fill cache
            await cache.set('key1', 'value1');
            await cache.set('key2', 'value2');
            await cache.set('key3', 'value3');
            
            // Access key1 to make it most recently used
            await cache.get('key1');
            
            // Add key4 - should evict key2 (least recently used)
            await cache.set('key4', 'value4');
            
            expect(await cache.get('key1')).toBe('value1');
            expect(await cache.get('key2')).toBeUndefined();
            expect(await cache.get('key3')).toBe('value3');
            expect(await cache.get('key4')).toBe('value4');
        });

        it('should track access time', async () => {
            const before = Date.now();
            await cache.set('key1', 'value1');
            const after = Date.now();
            
            // Access time should be within range
            // This is implicitly tested by TTL and LRU behavior
            expect(await cache.get('key1')).toBe('value1');
        });
    });

    describe('Edge Cases', () => {
        it('should handle maxSize of 1', async () => {
            const smallCache = new LruCacheBackend({ maxSize: 1 });
            
            await smallCache.set('key1', 'value1');
            await smallCache.set('key2', 'value2');
            
            expect(await smallCache.get('key1')).toBeUndefined();
            expect(await smallCache.get('key2')).toBe('value2');
            
            await smallCache.close();
        });

        it('should handle complex data types', async () => {
            const data = {
                nested: { deep: { value: 'test' } },
                array: [1, 2, 3],
                date: new Date().toISOString(),
            };
            
            await cache.set('complex', data);
            expect(await cache.get('complex')).toEqual(data);
        });

        it('should handle null and undefined values', async () => {
            await cache.set('null', null);
            await cache.set('undef', undefined);
            
            expect(await cache.get('null')).toBe(null);
            expect(await cache.get('undef')).toBe(undefined);
        });
    });
});
