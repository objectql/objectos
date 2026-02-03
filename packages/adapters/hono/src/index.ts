import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { type ObjectKernel } from '@objectstack/runtime';

export interface ObjectStackHonoOptions {
  kernel: ObjectKernel;
  prefix?: string;
}

/**
 * Creates a Hono application tailored for ObjectStack
 * Fully compliant with @objectstack/spec
 */
export function createHonoApp(options: ObjectStackHonoOptions) {
  const app = new Hono();
  const { prefix = '/api' } = options;
  const kernel = options.kernel as any;

  app.use('*', cors());

  // --- Helper for Success Response ---
  const success = (data: any, meta?: any) => ({
    success: true,
    data,
    meta,
  });

  // --- Helper for Error Response ---
  const errorHandler = async (c: any, fn: () => Promise<any>) => {
    try {
      return await fn();
    } catch (err: any) {
      return c.json({
        success: false,
        error: {
          code: err.statusCode || 500,
          message: err.message || 'Internal Server Error',
          details: err.details,
        },
      }, err.statusCode || 500);
    }
  };

  // --- 0. Discovery Endpoint ---
  app.get(prefix, (c) => {
    return c.json({
      name: 'ObjectOS',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      routes: {
        data: `${prefix}/data`,
        metadata: `${prefix}/metadata`,
        auth: `${prefix}/auth`,
        graphql: `${prefix}/graphql`,
      },
      features: {
        graphql: true,
        search: false,
        websockets: false,
        files: false,
      },
    });
  });

  // --- 1. Auth (Generic Auth Handler) ---
  app.all(`${prefix}/auth/*`, async (c) => {
    // 1. Try to use generic Auth Service if available
    const authService = (kernel as any).getService?.('auth') || (kernel as any).services?.['auth'];
    if (authService && authService.handler) {
      return authService.handler(c.req.raw);
    }

    // 2. Fallback to Legacy Auth Spec (only for login)
    if (c.req.path.endsWith('/login') && c.req.method === 'POST') {
      return errorHandler(c, async () => {
        const body = await c.req.json();
        const data = await kernel.broker.call('auth.login', body, { request: c.req.raw });
        return c.json(data);
      });
    }

    return c.json({ success: false, error: { message: 'Auth provider not configured', code: 404 } }, 404);
  });

  // --- 2. GraphQL ---
  app.post(`${prefix}/graphql`, async (c) => {
    return errorHandler(c, async () => {
      const { query, variables } = await c.req.json();
      const result = await kernel.graphql(query, variables, {
        request: c.req.raw,
      });
      return c.json(result);
    });
  });

  // --- 2. Metadata Endpoints ---

  // List All Objects
  app.get(`${prefix}/metadata`, async (c) => {
    return errorHandler(c, async () => {
      const data = await kernel.broker.call('metadata.objects', {}, { request: c.req.raw });
      return c.json(success(data));
    });
  });

  // Get Object Metadata
  app.get(`${prefix}/metadata/:objectName`, async (c) => {
    return errorHandler(c, async () => {
      const { objectName } = c.req.param();
      const data = await kernel.broker.call('metadata.getObject', { objectName }, { request: c.req.raw });
      return c.json(success(data));
    });
  });

  // --- 3. Data Endpoints ---

  // Query Records
  app.post(`${prefix}/data/:objectName/query`, async (c) => {
    return errorHandler(c, async () => {
      const { objectName } = c.req.param();
      const body = await c.req.json();
      const result = await kernel.broker.call('data.query', { object: objectName, ...body }, { request: c.req.raw });
      return c.json(success(result.data, { count: result.count, limit: body.limit, skip: body.skip }));
    });
  });

  // Get Single Record
  app.get(`${prefix}/data/:objectName/:id`, async (c) => {
    return errorHandler(c, async () => {
      const { objectName, id } = c.req.param();
      const query = c.req.query(); 
      const data = await kernel.broker.call('data.get', { object: objectName, id, ...query }, { request: c.req.raw });
      return c.json(success(data));
    });
  });

  // Create Record
  app.post(`${prefix}/data/:objectName`, async (c) => {
    return errorHandler(c, async () => {
      const { objectName } = c.req.param();
      const body = await c.req.json();
      const data = await kernel.broker.call('data.create', { object: objectName, data: body }, { request: c.req.raw });
      return c.json(success(data), 201);
    });
  });

  // Update Record
  app.patch(`${prefix}/data/:objectName/:id`, async (c) => {
    return errorHandler(c, async () => {
      const { objectName, id } = c.req.param();
      const body = await c.req.json();
      const data = await kernel.broker.call('data.update', { object: objectName, id, data: body }, { request: c.req.raw });
      return c.json(success(data));
    });
  });

  // Delete Record
  app.delete(`${prefix}/data/:objectName/:id`, async (c) => {
    return errorHandler(c, async () => {
      const { objectName, id } = c.req.param();
      await kernel.broker.call('data.delete', { object: objectName, id }, { request: c.req.raw });
      return c.json(success({ id, deleted: true }));
    });
  });

  // Batch Operations
  app.post(`${prefix}/data/:objectName/batch`, async (c) => {
    return errorHandler(c, async () => {
        const { objectName } = c.req.param();
        const { operations } = await c.req.json();
        const data = await kernel.broker.call('data.batch', { object: objectName, operations }, { request: c.req.raw });
        return c.json(success(data));
    });
  });

  return app;
}

/**
 * Middleware mode for existing Hono apps
 */
export function objectStackMiddleware(kernel: ObjectKernel) {
  return async (c: any, next: any) => {
    c.set('objectStack', kernel);
    await next();
  };
}
