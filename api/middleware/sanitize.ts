/**
 * XSS Sanitization Middleware for Hono
 *
 * Encodes dangerous HTML characters in JSON request body strings on
 * mutation methods (POST, PUT, PATCH).  Uses HTML entity encoding
 * (`<` → `&lt;`, `>` → `&gt;`) which is safe for both storage and
 * HTML rendering contexts.
 *
 * The sanitized body is stored on the Hono context variable
 * `sanitizedBody` so downstream handlers can retrieve it via
 * `c.get('sanitizedBody')`.
 *
 * @module api/middleware/sanitize
 * @see docs/guide/technical-debt-resolution.md — TD-4
 */
import type { MiddlewareHandler } from 'hono';

/**
 * HTML entity encoding map.
 * Covers the minimal set of characters required to prevent XSS
 * in both HTML element and attribute contexts.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

const ENTITY_RE = /[&<>"']/g;

/** Encode HTML-significant characters to their entity equivalents. */
function encodeEntities(str: string): string {
  return str.replace(ENTITY_RE, (ch) => HTML_ENTITIES[ch] ?? ch);
}

/** Recursively sanitize a value (string → entity-encode, object → recurse). */
export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return encodeEntities(value);
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
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
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
