/**
 * XSS Sanitization Middleware for Hono
 *
 * Strips dangerous HTML / script content from JSON request bodies on
 * mutation methods (POST, PUT, PATCH).  The sanitized body is stored on
 * the Hono context variable `sanitizedBody` so downstream handlers can
 * retrieve it via `c.get('sanitizedBody')`.
 *
 * @module api/middleware/sanitize
 * @see docs/guide/technical-debt-resolution.md — TD-4
 */
import type { MiddlewareHandler } from 'hono';

/** Recursively sanitize a value (string → strip tags, object → recurse). */
export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // Multi-pass approach for robust HTML/script removal:
    // 1. Remove script tags (including variations with whitespace)
    // 2. Remove event handler attributes
    // 3. Strip remaining HTML tags
    // 4. Re-run HTML strip to catch tags reconstructed from fragments
    let result = value;
    // Loop until stable — handles nested/reconstructed patterns
    let previous: string;
    do {
      previous = result;
      result = result
        .replace(/<\s*script[\s\S]*?<\s*\/\s*script\s*>/gi, '')
        .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
        .replace(/<\/?[a-z][\s\S]*?>/gi, '');
    } while (result !== previous);
    return result;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }
  return value;
}

/** Sanitize every value in an object (shallow copy). */
export function sanitizeObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = sanitizeValue(val);
  }
  return result;
}

/**
 * Creates a Hono middleware that sanitizes JSON bodies on mutation requests.
 */
export function sanitize(): MiddlewareHandler {
  return async (c, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      const contentType = c.req.header('content-type') ?? '';
      if (contentType.includes('application/json')) {
        try {
          const body = await c.req.json();
          const sanitized = sanitizeObject(body);
          c.set('sanitizedBody', sanitized);
        } catch {
          // Body parsing failed — let downstream handle it
        }
      }
    }
    await next();
  };
}
