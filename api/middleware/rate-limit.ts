/**
 * Rate Limiting Middleware for Hono
 *
 * Implements a sliding-window counter per key (IP or user).
 * Adds standard X-RateLimit-* headers and returns 429 when exceeded.
 *
 * @module api/middleware/rate-limit
 * @see docs/guide/technical-debt-resolution.md — TD-3
 */
import type { MiddlewareHandler, Context } from 'hono';

export interface RateLimitConfig {
  /** Time window in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
  /** Maximum requests per window (default: 100) */
  maxRequests?: number;
  /** Custom key generator — defaults to IP address */
  keyGenerator?: (c: Context) => string;
  /** Skip counting requests that returned a successful (2xx) status */
  skipSuccessfulRequests?: boolean;
  /** Skip counting requests that returned a failed (non-2xx) status */
  skipFailedRequests?: boolean;
  /** Custom handler for 429 responses */
  handler?: MiddlewareHandler;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

/**
 * Creates a Hono rate-limiting middleware using a sliding-window counter.
 *
 * Expired entries are garbage-collected periodically to prevent memory leaks.
 */
export function rateLimit(config: RateLimitConfig = {}): MiddlewareHandler {
  const windowMs = config.windowMs ?? 60_000;
  const maxRequests = config.maxRequests ?? 100;
  const keyGenerator =
    config.keyGenerator ??
    ((c: Context) =>
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown');

  const store = new Map<string, WindowEntry>();

  // Periodic cleanup of expired entries (every 60 s)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  }, 60_000);

  // Allow the timer to be garbage-collected when the process exits
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    (cleanupInterval as NodeJS.Timeout).unref();
  }

  return async (c, next) => {
    const key = keyGenerator(c);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + windowMs };
      store.set(key, entry);
    } else if (entry.count >= maxRequests) {
      // Rate limit exceeded
      c.header('X-RateLimit-Limit', String(maxRequests));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));

      if (config.handler) {
        return config.handler(c, next);
      }
      return c.json({ error: 'Too many requests' }, 429);
    } else {
      entry.count++;
    }

    // Set rate-limit headers on successful pass-through
    c.header('X-RateLimit-Limit', String(maxRequests));
    c.header('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
    c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    await next();
  };
}
