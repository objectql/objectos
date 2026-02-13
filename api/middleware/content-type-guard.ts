/**
 * Content-Type Guard Middleware for Hono
 *
 * Rejects mutation requests (POST/PUT/PATCH) that do not carry an accepted
 * Content-Type header.  File-upload endpoints can be excluded via the
 * `excludePaths` option.
 *
 * @module api/middleware/content-type-guard
 * @see docs/guide/technical-debt-resolution.md — TD-4
 */
import type { MiddlewareHandler } from 'hono';

export interface ContentTypeGuardConfig {
  /** Accepted content types (default: `['application/json']`) */
  allowedTypes?: string[];
  /** Path prefixes to exclude (e.g., file upload endpoints) */
  excludePaths?: string[];
}

/**
 * Creates a middleware that rejects mutation requests without an allowed
 * Content-Type header.
 */
export function contentTypeGuard(config: ContentTypeGuardConfig = {}): MiddlewareHandler {
  const allowedTypes = config.allowedTypes ?? ['application/json'];
  const excludePaths = config.excludePaths ?? [];

  return async (c, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      const path = c.req.path;

      // Skip excluded paths (e.g., file uploads)
      if (excludePaths.some((prefix) => path.startsWith(prefix))) {
        return next();
      }

      const contentType = c.req.header('content-type') ?? '';
      const isAllowed = allowedTypes.some((t) => contentType.includes(t));

      if (!isAllowed) {
        return c.json(
          {
            error: 'Unsupported Media Type',
            message: `Content-Type must be one of: ${allowedTypes.join(', ')}`,
          },
          415,
        );
      }
    }
    await next();
  };
}
