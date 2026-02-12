/**
 * Body Size Limit Middleware for Hono
 *
 * Rejects requests whose Content-Length exceeds the configured maximum.
 *
 * @module api/middleware/body-limit
 * @see docs/guide/technical-debt-resolution.md — TD-4
 */
import type { MiddlewareHandler } from 'hono';

export interface BodyLimitConfig {
  /** Maximum body size in bytes (default: 1 MB) */
  maxSize?: number;
}

/**
 * Creates a middleware that rejects requests with bodies larger than `maxSize`.
 *
 * Returns 413 Payload Too Large when the Content-Length header exceeds the limit.
 */
export function bodyLimit(config: BodyLimitConfig = {}): MiddlewareHandler {
  const maxSize = config.maxSize ?? 1_048_576; // 1 MB

  return async (c, next) => {
    const contentLength = c.req.header('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return c.json(
        { error: 'Payload too large', maxSize },
        413,
      );
    }
    await next();
  };
}
