/**
 * Rate Limiting System
 * 
 * Implements token bucket algorithm for request throttling
 */

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Message to return when rate limit is exceeded */
    message?: string;
    /** Skip failed requests in counting */
    skipFailedRequests?: boolean;
    /** Skip successful requests in counting */
    skipSuccessfulRequests?: boolean;
}

/**
 * Rate limit info for a key
 */
export interface RateLimitInfo {
    /** Current number of requests in window */
    current: number;
    /** Maximum requests allowed */
    limit: number;
    /** Remaining requests in current window */
    remaining: number;
    /** Time when the window resets (Unix timestamp in ms) */
    resetTime: number;
}

/**
 * Rate limit store interface
 */
export interface RateLimitStore {
    /** Increment counter for a key */
    increment(key: string): Promise<RateLimitInfo>;
    /** Reset counter for a key */
    reset(key: string): Promise<void>;
    /** Get info for a key */
    get(key: string): Promise<RateLimitInfo | null>;
}

/**
 * In-memory rate limit store
 */
export class MemoryRateLimitStore implements RateLimitStore {
    private store: Map<string, { count: number; resetTime: number }> = new Map();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
        
        // Clean up expired entries periodically
        setInterval(() => this.cleanup(), Math.min(this.config.windowMs, 60000));
    }

    async increment(key: string): Promise<RateLimitInfo> {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || entry.resetTime <= now) {
            // Create new window
            const resetTime = now + this.config.windowMs;
            this.store.set(key, { count: 1, resetTime });

            return {
                current: 1,
                limit: this.config.maxRequests,
                remaining: this.config.maxRequests - 1,
                resetTime,
            };
        }

        // Increment existing window
        entry.count++;
        this.store.set(key, entry);

        return {
            current: entry.count,
            limit: this.config.maxRequests,
            remaining: Math.max(0, this.config.maxRequests - entry.count),
            resetTime: entry.resetTime,
        };
    }

    async reset(key: string): Promise<void> {
        this.store.delete(key);
    }

    async get(key: string): Promise<RateLimitInfo | null> {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || entry.resetTime <= now) {
            return null;
        }

        return {
            current: entry.count,
            limit: this.config.maxRequests,
            remaining: Math.max(0, this.config.maxRequests - entry.count),
            resetTime: entry.resetTime,
        };
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetTime <= now) {
                this.store.delete(key);
            }
        }
    }
}

/**
 * Rate limiter class
 */
export class RateLimiter {
    private store: RateLimitStore;
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig, store?: RateLimitStore) {
        this.config = {
            message: 'Too many requests, please try again later.',
            skipFailedRequests: false,
            skipSuccessfulRequests: false,
            ...config,
        };
        this.store = store || new MemoryRateLimitStore(this.config);
    }

    /**
     * Check if a request should be rate limited
     */
    async checkLimit(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
        const info = await this.store.increment(key);
        const allowed = info.current <= info.limit;

        return { allowed, info };
    }

    /**
     * Reset rate limit for a key
     */
    async reset(key: string): Promise<void> {
        await this.store.reset(key);
    }

    /**
     * Get rate limit info for a key
     */
    async getInfo(key: string): Promise<RateLimitInfo | null> {
        return await this.store.get(key);
    }

    /**
     * Get configuration
     */
    getConfig(): RateLimitConfig {
        return { ...this.config };
    }
}

/**
 * Create a rate limiter instance
 */
export function createRateLimiter(config: RateLimitConfig, store?: RateLimitStore): RateLimiter {
    return new RateLimiter(config, store);
}

/**
 * Default rate limit configurations
 */
export const RateLimitPresets = {
    /** Strict rate limit: 10 requests per minute */
    strict: {
        maxRequests: 10,
        windowMs: 60 * 1000,
    },
    /** Moderate rate limit: 100 requests per minute */
    moderate: {
        maxRequests: 100,
        windowMs: 60 * 1000,
    },
    /** Lenient rate limit: 1000 requests per minute */
    lenient: {
        maxRequests: 1000,
        windowMs: 60 * 1000,
    },
    /** API rate limit: 60 requests per minute */
    api: {
        maxRequests: 60,
        windowMs: 60 * 1000,
    },
    /** Authentication rate limit: 5 requests per minute */
    auth: {
        maxRequests: 5,
        windowMs: 60 * 1000,
    },
} as const;
