/**
 * Vercel Serverless Function — ObjectOS API
 *
 * Mirrors the bootstrap sequence of `objectstack serve` (from @objectstack/cli)
 * so that all platform-level base plugins are loaded alongside the user plugins
 * defined in objectstack.config.ts.
 *
 * The kernel is initialized once on cold-start and reused for warm invocations.
 */
import { handle } from '@hono/node-server/vercel';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

/* ------------------------------------------------------------------ */
/*  Bootstrap (runs once per cold-start)                               */
/* ------------------------------------------------------------------ */
let bootstrapPromise: Promise<void> | null = null;
let honoApp: import('hono').Hono | null = null;

async function bootstrapKernel(): Promise<void> {
  try {
    // ── 1. Runtime & HonoHttpServer ────────────────────────────
    const { Runtime, AppPlugin, DriverPlugin } = await import('@objectstack/runtime');
    const { HonoHttpServer } = await import('@objectstack/plugin-hono-server');

    // Create a HonoHttpServer (port 0 = never listen) and pass it
    // as the `server` option so Runtime registers it as 'http.server'.
    const httpServer = new HonoHttpServer(0);
    honoApp = httpServer.getRawApp();

    // Global CORS on API routes
    honoApp.use(
      '/api/v1/*',
      cors({
        origin: (origin) => origin ?? '*',
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
      }),
    );

    // OWASP-compliant security headers (A05:2021 – Security Misconfiguration)
    honoApp.use(
      '/api/v1/*',
      secureHeaders({
        contentSecurityPolicy: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
        // crossOriginEmbedderPolicy is disabled because API responses may be
        // consumed by cross-origin SPAs (Admin Console, ObjectUI) that load
        // resources from CDNs.  COEP: require-corp would break those requests.
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: 'same-origin',
        referrerPolicy: 'strict-origin-when-cross-origin',
        xContentTypeOptions: 'nosniff',
        xFrameOptions: 'DENY',
      }),
    );

    // Health-check (always available)
    honoApp.get('/api/v1/health', (c) =>
      c.json({
        status: 'ok',
        version: '0.1.0',
        environment: 'vercel',
        timestamp: new Date().toISOString(),
      }),
    );

    const runtime = new Runtime({
      server: httpServer,
      kernel: { logger: { level: 'info' } },
    });
    const kernel = runtime.getKernel();

    // ── 2. Load objectstack.config.ts ──────────────────────────
    // Import the config directly (bundled by Vercel alongside this file).
    const configModule = await import('../objectstack.config.js');
    const config = configModule.default || configModule;

    // ── 3. Platform plugins (same order as @objectstack/cli serve) ──

    // ObjectQL — register if config.objects is defined
    const plugins = config.plugins || [];
    const hasObjectQL = plugins.some(
      (p: any) => p.name?.includes('objectql') || p.constructor?.name?.includes('ObjectQL'),
    );
    if (config.objects && !hasObjectQL) {
      try {
        const { ObjectQLPlugin } = await import('@objectstack/objectql');
        await kernel.use(new ObjectQLPlugin());
      } catch (_e) {
        console.debug('[ObjectOS] ObjectQLPlugin not available, skipping');
      }
    }

    // InMemoryDriver — for demo / serverless where no external DB is configured
    const hasDriver = plugins.some(
      (p: any) => p.name?.includes('driver') || p.constructor?.name?.includes('Driver'),
    );
    if (!hasDriver && config.objects) {
      try {
        const { InMemoryDriver } = await import('@objectstack/driver-memory');
        await kernel.use(new DriverPlugin(new InMemoryDriver()));
      } catch (_e) {
        console.debug('[ObjectOS] InMemoryDriver not available, skipping');
      }
    }

    // AppPlugin — if objects / manifest / apps are declared
    if (config.objects || config.manifest || config.apps) {
      try {
        await kernel.use(new AppPlugin(config));
      } catch (_e) {
        console.debug('[ObjectOS] AppPlugin not available, skipping');
      }
    }

    // ── 4. User plugins from config.plugins ────────────────────
    for (const plugin of plugins) {
      try {
        await kernel.use(plugin);
      } catch (e: any) {
        console.warn(`[ObjectOS] Failed to load plugin: ${e?.message}`);
      }
    }

    // NOTE: We intentionally do NOT register HonoServerPlugin here.
    // The HonoHttpServer was already provided to Runtime via the
    // `server` option and will NOT call listen() in serverless mode.

    // ── 5. Start ───────────────────────────────────────────────
    await runtime.start();
    console.log('[ObjectOS] Kernel bootstrapped on Vercel');
  } catch (error) {
    console.error('[ObjectOS] Kernel bootstrap failed:', error);

    // Lazy-import Hono only for the error fallback if not yet created
    if (!honoApp) {
      const { Hono } = await import('hono');
      honoApp = new Hono();
    }

    honoApp.all('/api/v1/*', (c) =>
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

/* ------------------------------------------------------------------ */
/*  Export Vercel handler                                               */
/* ------------------------------------------------------------------ */
export default async function handler(
  req: import('http').IncomingMessage,
  res: import('http').ServerResponse,
) {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapKernel();
  }
  await bootstrapPromise;

  if (!honoApp) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Server not initialized' }));
    return;
  }

  // Delegate to the Hono app via @hono/node-server/vercel adapter
  return handle(honoApp)(req, res);
}
