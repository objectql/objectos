/**
 * Rate Limiting Tests
 */

import {
    RateLimiter,
    createRateLimiter,
    MemoryRateLimitStore,
    RateLimitPresets,
} from '../src/api/rate-limit';

describe('RateLimiter', () => {
    describe('MemoryRateLimitStore', () => {
        it('should increment counter for new key', async () => {
            const config = { maxRequests: 10, windowMs: 60000 };
            const store = new MemoryRateLimitStore(config);

            const info = await store.increment('user1');
            
            expect(info.current).toBe(1);
            expect(info.limit).toBe(10);
            expect(info.remaining).toBe(9);
            expect(info.resetTime).toBeGreaterThan(Date.now());
        });

        it('should increment counter for existing key', async () => {
            const config = { maxRequests: 10, windowMs: 60000 };
            const store = new MemoryRateLimitStore(config);

            await store.increment('user1');
            await store.increment('user1');
            const info = await store.increment('user1');
            
            expect(info.current).toBe(3);
            expect(info.remaining).toBe(7);
        });

        it('should reset counter after window expires', async () => {
            const config = { maxRequests: 10, windowMs: 100 }; // 100ms window
            const store = new MemoryRateLimitStore(config);

            await store.increment('user1');
            await store.increment('user1');

            // Wait for window to expire
            await new Promise(resolve => setTimeout(resolve, 150));

            const info = await store.increment('user1');
            expect(info.current).toBe(1); // Should reset
        });

        it('should reset counter manually', async () => {
            const config = { maxRequests: 10, windowMs: 60000 };
            const store = new MemoryRateLimitStore(config);

            await store.increment('user1');
            await store.increment('user1');

            await store.reset('user1');

            const info = await store.increment('user1');
            expect(info.current).toBe(1);
        });

        it('should get info for existing key', async () => {
            const config = { maxRequests: 10, windowMs: 60000 };
            const store = new MemoryRateLimitStore(config);

            await store.increment('user1');
            await store.increment('user1');

            const info = await store.get('user1');
            expect(info).not.toBeNull();
            expect(info!.current).toBe(2);
        });

        it('should return null for non-existent key', async () => {
            const config = { maxRequests: 10, windowMs: 60000 };
            const store = new MemoryRateLimitStore(config);

            const info = await store.get('nonexistent');
            expect(info).toBeNull();
        });
    });

    describe('RateLimiter', () => {
        it('should allow requests within limit', async () => {
            const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 });

            const result1 = await limiter.checkLimit('user1');
            expect(result1.allowed).toBe(true);
            expect(result1.info.current).toBe(1);

            const result2 = await limiter.checkLimit('user1');
            expect(result2.allowed).toBe(true);
            expect(result2.info.current).toBe(2);
        });

        it('should block requests exceeding limit', async () => {
            const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60000 });

            await limiter.checkLimit('user1');
            await limiter.checkLimit('user1');
            await limiter.checkLimit('user1');

            const result = await limiter.checkLimit('user1');
            expect(result.allowed).toBe(false);
            expect(result.info.current).toBe(4);
            expect(result.info.remaining).toBe(0);
        });

        it('should track different keys separately', async () => {
            const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60000 });

            await limiter.checkLimit('user1');
            await limiter.checkLimit('user1');

            const result1 = await limiter.checkLimit('user1');
            expect(result1.allowed).toBe(false);

            const result2 = await limiter.checkLimit('user2');
            expect(result2.allowed).toBe(true);
        });

        it('should reset limit for a key', async () => {
            const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60000 });

            await limiter.checkLimit('user1');
            await limiter.checkLimit('user1');

            await limiter.reset('user1');

            const result = await limiter.checkLimit('user1');
            expect(result.allowed).toBe(true);
            expect(result.info.current).toBe(1);
        });

        it('should get info for a key', async () => {
            const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 });

            await limiter.checkLimit('user1');
            await limiter.checkLimit('user1');

            const info = await limiter.getInfo('user1');
            expect(info).not.toBeNull();
            expect(info!.current).toBe(2);
        });

        it('should return config', () => {
            const config = { maxRequests: 10, windowMs: 60000 };
            const limiter = createRateLimiter(config);

            const returnedConfig = limiter.getConfig();
            expect(returnedConfig.maxRequests).toBe(10);
            expect(returnedConfig.windowMs).toBe(60000);
        });
    });

    describe('RateLimitPresets', () => {
        it('should have strict preset', () => {
            expect(RateLimitPresets.strict).toEqual({
                maxRequests: 10,
                windowMs: 60 * 1000,
            });
        });

        it('should have moderate preset', () => {
            expect(RateLimitPresets.moderate).toEqual({
                maxRequests: 100,
                windowMs: 60 * 1000,
            });
        });

        it('should have lenient preset', () => {
            expect(RateLimitPresets.lenient).toEqual({
                maxRequests: 1000,
                windowMs: 60 * 1000,
            });
        });

        it('should have api preset', () => {
            expect(RateLimitPresets.api).toEqual({
                maxRequests: 60,
                windowMs: 60 * 1000,
            });
        });

        it('should have auth preset', () => {
            expect(RateLimitPresets.auth).toEqual({
                maxRequests: 5,
                windowMs: 60 * 1000,
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid concurrent requests', async () => {
            const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60000 });

            const promises = Array(5).fill(null).map(() => limiter.checkLimit('user1'));
            const results = await Promise.all(promises);

            expect(results.every(r => r.allowed)).toBe(true);
            expect(results[results.length - 1].info.current).toBe(5);
        });

        it('should handle zero remaining correctly', async () => {
            const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60000 });

            const result1 = await limiter.checkLimit('user1');
            expect(result1.info.remaining).toBe(0);

            const result2 = await limiter.checkLimit('user1');
            expect(result2.allowed).toBe(false);
            expect(result2.info.remaining).toBe(0);
        });
    });
});
