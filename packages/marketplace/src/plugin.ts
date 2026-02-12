/**
 * Marketplace Plugin for ObjectOS
 *
 * Provides a full plugin marketplace with:
 *
 * - O.2.1: Plugin registry API (discovery, search, listing)
 * - O.2.2: Plugin manifest validation and dependency resolution
 * - O.2.3: Dynamic plugin installation
 * - O.2.4: Versioning, upgrades, and rollback
 * - O.2.6: Plugin sandboxing and security review
 *
 * The plugin registers HTTP routes under /api/v1/plugins/ and provides
 * a 'marketplace' service for programmatic access.
 *
 * @example
 * ```typescript
 * import { MarketplacePlugin } from '@objectos/marketplace';
 *
 * new MarketplacePlugin({ sandboxed: true });
 * ```
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  MarketplaceConfig,
  ResolvedMarketplaceConfig,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
import { PluginRegistry } from './registry.js';
import { PluginInstaller } from './installer.js';
import { PluginSandbox } from './sandbox.js';

/**
 * Resolve user configuration with defaults
 */
function resolveConfig(config: MarketplaceConfig = {}): ResolvedMarketplaceConfig {
  return {
    registryUrl: config.registryUrl ?? 'https://registry.objectos.dev',
    autoUpdate: config.autoUpdate ?? false,
    sandboxed: config.sandboxed ?? true,
    allowedPlugins: config.allowedPlugins ?? [],
    blockedPlugins: config.blockedPlugins ?? [],
    maxPlugins: config.maxPlugins ?? 50,
  };
}

/**
 * Marketplace Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class MarketplacePlugin implements Plugin {
  name = '@objectos/marketplace';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: ResolvedMarketplaceConfig;
  private context?: PluginContext;
  private startedAt?: number;
  private requestCount = 0;
  private errorCount = 0;

  /** Plugin registry — in-memory store */
  private registry: PluginRegistry;
  /** Plugin installer — manages install/uninstall/upgrade */
  private installer: PluginInstaller;
  /** Plugin sandbox — security review and isolation */
  private sandbox: PluginSandbox;

  constructor(config: MarketplaceConfig = {}) {
    this.config = resolveConfig(config);
    this.registry = new PluginRegistry();
    this.installer = new PluginInstaller(this.registry, { objectos: '0.1.0' });
    this.sandbox = new PluginSandbox();
  }

  /**
   * Initialize plugin — register 'marketplace' service
   */
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();

    // Re-initialize installer with runtime version from context if available
    const runtimeVersion = (context as any).broker?.version ?? this.version;
    this.installer = new PluginInstaller(this.registry, { objectos: runtimeVersion });

    // Register marketplace service
    context.registerService('marketplace', this);

    context.logger.info('[Marketplace] Initialized successfully');
    await context.trigger('plugin.initialized', { pluginId: this.name });
  };

  /**
   * Start plugin — register HTTP routes for marketplace API
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[Marketplace] Starting...');

    // Register HTTP routes
    const httpServer = context.getService('http.server') as any;
    const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;

    if (rawApp) {
      this.registerRoutes(rawApp, context);
      context.logger.info('[Marketplace] Routes registered at /api/v1/plugins');
    } else {
      context.logger.warn('[Marketplace] HTTP server not available — routes not registered');
    }

    context.logger.info('[Marketplace] Started successfully');
    await context.trigger('plugin.started', { pluginId: this.name });
  }

  /**
   * Stop plugin — cleanup
   */
  async stop(): Promise<void> {
    this.context?.logger.info('[Marketplace] Stopped');
  }

  // ─── HTTP Route Registration ────────────────────────────────────

  private registerRoutes(app: any, context: PluginContext): void {
    const basePath = '/api/v1/plugins';

    // GET /api/v1/plugins/registry — list/search plugins
    app.get(`${basePath}/registry`, async (c: any) => {
      this.requestCount++;
      try {
        const url = new URL(c.req.url, 'http://localhost');
        const query = url.searchParams.get('q') ?? undefined;
        const keyword = url.searchParams.get('keyword') ?? undefined;
        const author = url.searchParams.get('author') ?? undefined;
        const page = parseInt(url.searchParams.get('page') ?? '1', 10);
        const pageSize = parseInt(url.searchParams.get('pageSize') ?? '20', 10);

        const result = this.registry.search(query, { keyword, author, page, pageSize });
        return c.json(result);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/plugins/registry/:id — get plugin details
    app.get(`${basePath}/registry/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const entry = this.registry.getPlugin(id);
        if (!entry) {
          return c.json({ error: `Plugin "${id}" not found` }, 404);
        }

        // Include security review
        const security = this.sandbox.review(entry.manifest);
        return c.json({ ...entry, security });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/plugins/registry/:id/versions — list versions
    app.get(`${basePath}/registry/:id/versions`, async (c: any) => {
      this.requestCount++;
      try {
        const id = c.req.param('id');
        const versions = this.registry.getVersions(id);
        return c.json({ pluginId: id, versions });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // POST /api/v1/plugins/registry — register a plugin (admin only)
    app.post(`${basePath}/registry`, async (c: any) => {
      this.requestCount++;
      try {
        // Check admin permission
        const user = c.get?.('user');
        const broker = (context as any).broker;

        if (broker) {
          const permService = broker.getService?.('permissions');
          if (permService) {
            const allowed = await permService.check?.(user?.id, 'marketplace.register');
            if (allowed === false) {
              return c.json({ error: 'Forbidden: admin access required' }, 403);
            }
          }
        }

        const body = await c.req.json();
        const entry = this.registry.register(body);

        context.logger.info(`[Marketplace] Plugin registered: ${body.id} v${body.version}`);
        await context.trigger('marketplace.plugin.registered', { pluginId: body.id });

        return c.json(entry, 201);
      } catch (error: any) {
        this.errorCount++;
        const status = error.message.includes('Invalid manifest') ? 400 : 500;
        return c.json({ error: error.message }, status);
      }
    });

    // POST /api/v1/plugins/install — install a plugin
    app.post(`${basePath}/install`, async (c: any) => {
      this.requestCount++;
      try {
        const body = await c.req.json();
        const { pluginId, version } = body;

        if (!pluginId) {
          return c.json({ error: 'pluginId is required' }, 400);
        }

        // Check allow/block lists
        if (this.config.blockedPlugins.includes(pluginId)) {
          return c.json({ error: `Plugin "${pluginId}" is blocked` }, 403);
        }
        if (this.config.allowedPlugins.length > 0 && !this.config.allowedPlugins.includes(pluginId)) {
          return c.json({ error: `Plugin "${pluginId}" is not in the allow list` }, 403);
        }

        // Check max plugins limit
        if (this.installer.getInstalled().length >= this.config.maxPlugins) {
          return c.json({ error: `Maximum plugin limit (${this.config.maxPlugins}) reached` }, 400);
        }

        // Security review before install
        if (this.config.sandboxed) {
          const entry = version
            ? this.registry.getPluginVersion(pluginId, version)
            : this.registry.getPlugin(pluginId);
          if (entry) {
            const report = this.sandbox.review(entry.manifest);
            if (!report.safe) {
              return c.json({
                error: 'Plugin failed security review',
                vulnerabilities: report.vulnerabilities,
              }, 403);
            }
          }
        }

        const result = this.installer.install(pluginId, version);

        if (result.success) {
          context.logger.info(`[Marketplace] Plugin installed: ${pluginId} v${result.version}`);
          await context.trigger('marketplace.plugin.installed', { pluginId, version: result.version });
        }

        return c.json(result, result.success ? 200 : 400);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // POST /api/v1/plugins/uninstall — uninstall a plugin
    app.post(`${basePath}/uninstall`, async (c: any) => {
      this.requestCount++;
      try {
        const body = await c.req.json();
        const { pluginId } = body;

        if (!pluginId) {
          return c.json({ error: 'pluginId is required' }, 400);
        }

        const result = this.installer.uninstall(pluginId);

        if (result.success) {
          context.logger.info(`[Marketplace] Plugin uninstalled: ${pluginId}`);
          await context.trigger('marketplace.plugin.uninstalled', { pluginId });
        }

        return c.json(result, result.success ? 200 : 400);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // POST /api/v1/plugins/upgrade — upgrade a plugin
    app.post(`${basePath}/upgrade`, async (c: any) => {
      this.requestCount++;
      try {
        const body = await c.req.json();
        const { pluginId, version } = body;

        if (!pluginId) {
          return c.json({ error: 'pluginId is required' }, 400);
        }

        const result = this.installer.upgrade(pluginId, version);

        if (result.success) {
          context.logger.info(`[Marketplace] Plugin upgraded: ${pluginId} → v${result.version}`);
          await context.trigger('marketplace.plugin.upgraded', {
            pluginId,
            version: result.version,
            previousVersion: result.previousVersion,
          });
        }

        return c.json(result, result.success ? 200 : 400);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/plugins/installed — list installed plugins
    app.get(`${basePath}/installed`, async (c: any) => {
      this.requestCount++;
      try {
        const installed = this.installer.getInstalled();
        return c.json({ plugins: installed, total: installed.length });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/plugins/upgrades — check for upgrades
    app.get(`${basePath}/upgrades`, async (c: any) => {
      this.requestCount++;
      try {
        const upgrades = this.installer.checkUpgrades();
        return c.json({ upgrades, total: upgrades.length });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });
  }

  // ─── Service API ────────────────────────────────────────────────

  /** Get the plugin registry instance */
  getRegistry(): PluginRegistry {
    return this.registry;
  }

  /** Get the plugin installer instance */
  getInstaller(): PluginInstaller {
    return this.installer;
  }

  /** Get the plugin sandbox instance */
  getSandbox(): PluginSandbox {
    return this.sandbox;
  }

  // ─── Lifecycle Inspection ───────────────────────────────────────

  /**
   * Health check
   */
  getHealthReport(): PluginHealthReport {
    const stats = this.registry.getStats();
    const installed = this.installer.getInstalled();

    return {
      status: 'healthy',
      message: `Marketplace operational (${stats.totalPlugins} registered, ${installed.length} installed, ${this.requestCount} requests)`,
      details: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        registeredPlugins: stats.totalPlugins,
        installedPlugins: installed.length,
        registryStats: stats,
      },
    };
  }

  /**
   * Capability manifest
   */
  getCapabilities(): PluginCapabilityManifest {
    return {
      id: this.name,
      provides: [
        'marketplace',
        'marketplace.registry',
        'marketplace.install',
        'marketplace.security',
      ],
      consumes: ['http.server', 'permissions'],
    };
  }

  /**
   * Security manifest
   */
  getSecurityManifest(): PluginSecurityManifest {
    return {
      permissions: [
        'marketplace.register',
        'marketplace.install',
        'marketplace.uninstall',
        'marketplace.upgrade',
      ],
      dataAccess: ['read', 'create', 'delete'],
    };
  }

  /**
   * Startup result
   */
  getStartupResult(): PluginStartupResult {
    return {
      success: true,
      message: 'Marketplace plugin started',
    };
  }
}
