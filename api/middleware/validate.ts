/**
 * Zod Schema Validation Middleware for Hono
 *
 * Validates JSON request bodies against a Zod schema on mutation methods.
 * The validated (and potentially transformed) body is stored on the Hono
 * context as `validatedBody`.
 *
 * @module api/middleware/validate
 * @see docs/guide/technical-debt-resolution.md — TD-4
 */
import type { MiddlewareHandler } from 'hono';
import type { ZodSchema } from 'zod';

/**
 * Creates a middleware that validates the JSON body of POST/PUT/PATCH
 * requests against the supplied Zod schema.
 *
 * Returns 400 with structured `{ error, details }` when validation fails.
 */
export function validate(schema: ZodSchema): MiddlewareHandler {
  return async (c, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
      try {
        const body = await c.req.json();
        const result = schema.safeParse(body);
        if (!result.success) {
          return c.json(
            {
              error: 'Validation failed',
              details: result.error.issues.map((i) => ({
                path: i.path.join('.'),
                message: i.message,
              })),
            },
            400,
          );
        }
        c.set('validatedBody', result.data);
      } catch {
        return c.json({ error: 'Invalid JSON body' }, 400);
      }
    }
    await next();
  };
}
