/**
 * Rate Limiting Middleware
 * 
 * Applies rate limiting to HTTP requests
 */

import { RateLimitError } from '../errors';
import { RateLimiter, RateLimitConfig } from '../rate-limit';

/**
 * Rate limit middleware configuration
 */
export interface RateLimitMiddlewareConfig extends RateLimitConfig {
    /** Function to extract rate limit key from request */
    keyGenerator?: (req: any) => string;
    /** Handler for rate limit exceeded */
    onLimitExceeded?: (req: any, res: any, info: any) => void;
    /** Skip rate limiting for certain conditions */
    skip?: (req: any) => boolean;
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(req: any): string {
    return req.ip || req.connection?.remoteAddress || 'unknown';
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(config: RateLimitMiddlewareConfig) {
    const {
        keyGenerator = defaultKeyGenerator,
        skip,
        onLimitExceeded,
        ...rateLimitConfig
    } = config;

    const limiter = new RateLimiter(rateLimitConfig);

    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        // Skip if condition is met
        if (skip && skip(req)) {
            return next();
        }

        // Generate key for this request
        const key = keyGenerator(req);

        // Check rate limit
        const { allowed, info } = await limiter.checkLimit(key);

        // Set rate limit headers
        if (res.setHeader) {
            res.setHeader('X-RateLimit-Limit', info.limit);
            res.setHeader('X-RateLimit-Remaining', info.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000));
        }

        if (!allowed) {
            // Rate limit exceeded
            if (onLimitExceeded) {
                onLimitExceeded(req, res, info);
            }
            
            throw new RateLimitError(
                limiter.getConfig().message || 'Too many requests',
                {
                    limit: info.limit,
                    current: info.current,
                    resetTime: info.resetTime,
                }
            );
        }

        // Continue to next middleware
        await next();
    };
}

/**
 * Create endpoint-specific rate limiter
 */
export function createEndpointRateLimiter(endpointLimits: Map<string, RateLimitConfig>) {
    const limiters = new Map<string, RateLimiter>();

    // Create limiter for each endpoint
    for (const [endpoint, config] of endpointLimits.entries()) {
        limiters.set(endpoint, new RateLimiter(config));
    }

    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        const endpoint = `${req.method}:${req.path}`;
        const limiter = limiters.get(endpoint);

        if (!limiter) {
            // No rate limit for this endpoint
            return next();
        }

        // Use IP as key
        const key = req.ip || req.connection?.remoteAddress || 'unknown';

        // Check rate limit
        const { allowed, info } = await limiter.checkLimit(key);

        // Set rate limit headers
        if (res.setHeader) {
            res.setHeader('X-RateLimit-Limit', info.limit);
            res.setHeader('X-RateLimit-Remaining', info.remaining);
            res.setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime / 1000));
        }

        if (!allowed) {
            throw new RateLimitError(
                limiter.getConfig().message || 'Too many requests',
                {
                    limit: info.limit,
                    current: info.current,
                    resetTime: info.resetTime,
                }
            );
        }

        await next();
    };
}
