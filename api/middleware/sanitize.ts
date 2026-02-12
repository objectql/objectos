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

const SCRIPT_RE = /<script[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_RE = /\bon\w+\s*=\s*["'][^"']*["']/gi;
const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/gi;

/** Recursively sanitize a value (string → strip tags, object → recurse). */
export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(SCRIPT_RE, '')
      .replace(EVENT_HANDLER_RE, '')
      .replace(HTML_TAG_RE, '');
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
