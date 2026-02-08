/**
 * Vercel Serverless Function — ObjectOS API
 *
 * Bootstraps the ObjectStack kernel with all ObjectOS plugins
 * and exposes the Hono app as a Vercel Node.js serverless function.
 *
 * The kernel is initialized once on cold-start and reused for
 * subsequent warm invocations.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handle } from '@hono/node-server/vercel';
import type { Plugin, PluginContext } from '@objectstack/runtime';

/* ------------------------------------------------------------------ */
/*  Hono App — created at module level so plugins can register routes */
/* ------------------------------------------------------------------ */
const app = new Hono();

// Global CORS
app.use(
  '/api/v1/*',
  cors({
    origin: (origin) => origin ?? '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Health-check (always available, even before kernel boots)
app.get('/api/v1/health', (c) =>
  c.json({
    status: 'ok',
    version: '0.1.0',
    environment: 'vercel',
    timestamp: new Date().toISOString(),
  }),
);

/* ------------------------------------------------------------------ */
/*  Kernel bootstrap (runs once per cold-start)                        */
/* ------------------------------------------------------------------ */
let bootstrapPromise: Promise<void> | null = null;

/**
 * Minimal plugin that exposes our Hono app as the `http.server` service.
 * ObjectOS plugins call `context.getService('http.server').getRawApp()`
 * to register their HTTP routes.
 */
function createHttpServicePlugin(honoApp: Hono): Plugin {
  return {
    name: 'vercel-http-service',
    version: '1.0.0',
    dependencies: [],
    async init(context: PluginContext) {
      context.registerService('http.server', {
        getRawApp: () => honoApp,
        app: honoApp,
        getPort: () => 0,
        get: () => {},
        post: () => {},
        put: () => {},
        delete: () => {},
        patch: () => {},
        use: () => {},
        listen: async () => {},
        close: async () => {},
        getRoutes: () => new Map(),
        getMiddlewares: () => [],
      });
    },
    async start() {},
    async destroy() {},
  } as unknown as Plugin;
}

async function bootstrapKernel(): Promise<void> {
  try {
    const { ObjectKernel } = await import('@objectstack/runtime');
    const kernel = new ObjectKernel();

    // 1. Register the HTTP service shim first so it is available for
    //    all subsequent plugin init/start phases.
    kernel.use(createHttpServicePlugin(app));

    // 2. Import and register ObjectOS plugins (same order as objectstack.config.ts)
    const [
      { MetricsPlugin },
      { CachePlugin },
      { StoragePlugin },
      { BetterAuthPlugin },
      { PermissionsPlugin },
      { AuditLogPlugin },
      { WorkflowPlugin },
      { AutomationPlugin },
      { JobsPlugin },
      { NotificationPlugin },
      { I18nPlugin },
    ] = await Promise.all([
      import('@objectos/metrics'),
      import('@objectos/cache'),
      import('@objectos/storage'),
      import('@objectos/auth'),
      import('@objectos/permissions'),
      import('@objectos/audit'),
      import('@objectos/workflow'),
      import('@objectos/automation'),
      import('@objectos/jobs'),
      import('@objectos/notification'),
      import('@objectos/i18n'),
    ]);

    // Foundation
    kernel.use(new MetricsPlugin());
    kernel.use(new CachePlugin());
    kernel.use(new StoragePlugin());

    // Core
    kernel.use(new BetterAuthPlugin());
    kernel.use(new PermissionsPlugin());
    kernel.use(new AuditLogPlugin());

    // Logic
    kernel.use(new WorkflowPlugin());
    kernel.use(new AutomationPlugin());
    kernel.use(new JobsPlugin());

    // Services
    kernel.use(new NotificationPlugin());
    kernel.use(new I18nPlugin());

    await kernel.bootstrap();
    console.log('[ObjectOS] Kernel bootstrapped on Vercel');
  } catch (error) {
    console.error('[ObjectOS] Kernel bootstrap failed:', error);

    // Register a catch-all error route so callers get a meaningful response
    app.all('/api/v1/*', (c) =>
      c.json(
        {
          success: false,
          error: 'Kernel bootstrap failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500,
      ),
    );
  }
}

// Middleware: ensure kernel is ready before handling requests
app.use('/api/v1/*', async (_c, next) => {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapKernel();
  }
  await bootstrapPromise;
  await next();
});

/* ------------------------------------------------------------------ */
/*  Export Vercel handler                                               */
/* ------------------------------------------------------------------ */
export default handle(app);
