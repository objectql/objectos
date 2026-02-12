// ---------------------------------------------------------------------------
// @objectos/federation — Main Federation Plugin
// ---------------------------------------------------------------------------

import type { Plugin, PluginContext } from '@objectstack/runtime';
import { FederationHostConfigurator } from './host-config.js';
import { HotReloadManager } from './hot-reload.js';
import { RemoteLoader } from './remote-loader.js';
import { SharedDependencyManager } from './shared-deps.js';
import type {
  FederationConfig,
  ModuleResolver,
  PluginCapability,
  PluginHealthReport,
  PluginSecurityManifest,
  RemoteEntry,
  ResolvedFederationConfig,
} from './types.js';
import { resolveConfig } from './types.js';

export class FederationPlugin implements Plugin {
  name = '@objectos/federation';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: ResolvedFederationConfig;
  private context?: PluginContext;
  private hostConfigurator: FederationHostConfigurator;
  private remoteLoader: RemoteLoader;
  private sharedDeps: SharedDependencyManager;
  private hotReload: HotReloadManager;

  constructor(config?: FederationConfig, resolver?: ModuleResolver) {
    this.config = resolveConfig(config ?? {});
    this.hostConfigurator = new FederationHostConfigurator(this.config);
    this.remoteLoader = new RemoteLoader(resolver, {
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      timeout: this.config.timeout,
    });
    this.sharedDeps = new SharedDependencyManager();
    this.hotReload = new HotReloadManager(this.config.hotReloadPort);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    context.registerService('federation', this);

    // Register shared dependencies from config
    for (const dep of this.config.shared) {
      this.sharedDeps.register(dep);
    }

    await context.trigger('plugin.initialized', { pluginId: this.name });
  };

  async start(context: PluginContext): Promise<void> {
    this.context = context;
    const broker = (context as any).broker;

    context.logger.info('[Federation] Starting...');

    // Load configured remotes
    for (const remote of this.config.remotes) {
      const result = await this.remoteLoader.load(remote);
      if (result.success) {
        context.logger.info(`[Federation] Loaded remote: ${remote.name}`);
      } else {
        context.logger.error(`[Federation] Failed to load remote: ${remote.name} — ${result.error}`);
      }
    }

    // Start hot reload if enabled
    if (this.config.hotReload) {
      this.hotReload.start(this.config.hotReloadPort);
      this.hotReload.onReload(async (event) => {
        context.logger.info(`[Federation] Hot-reload: ${event.type} ${event.remoteName}`);
        if (event.type === 'change') {
          await this.remoteLoader.reload(event.remoteName);
        }
      });
      context.logger.info(`[Federation] Hot-reload enabled on port ${this.config.hotReloadPort}`);
    }

    // Register HTTP routes
    this.registerRoutes(broker);

    context.logger.info('[Federation] Started');
  }

  async stop(): Promise<void> {
    // Unload all remotes
    for (const mod of this.remoteLoader.getLoaded()) {
      this.remoteLoader.unload(mod.name);
    }

    // Stop hot reload
    this.hotReload.stop();

    this.context?.logger.info('[Federation] Stopped');
  }

  // -------------------------------------------------------------------------
  // Manifests
  // -------------------------------------------------------------------------

  getHealthReport(): PluginHealthReport {
    const loaded = this.remoteLoader.getLoaded();
    const total = this.config.remotes.length;
    const status = loaded.length === total ? 'healthy' : loaded.length > 0 ? 'degraded' : 'unhealthy';
    return {
      status,
      message: `${loaded.length}/${total} remotes loaded`,
      details: {
        loadedRemotes: loaded.map((m) => m.name),
        hotReload: this.hotReload.isWatching(),
        sharedDeps: this.sharedDeps.getAll().length,
      },
    };
  }

  getCapabilities(): PluginCapability[] {
    return [
      { name: 'remote-loading', description: 'Load plugins from remote URLs at runtime' },
      { name: 'shared-dependencies', description: 'Manage shared dependencies across host and remotes' },
      { name: 'hot-reload', description: 'Hot-reload remote plugins during development' },
      { name: 'host-config', description: 'Generate Module Federation config for Vite/Webpack' },
    ];
  }

  getSecurityManifest(): PluginSecurityManifest {
    return {
      permissions: ['federation.read', 'federation.write', 'federation.admin'],
      scopes: ['federation'],
      dataAccess: ['remote-registry', 'shared-dependency-registry'],
    };
  }

  // -------------------------------------------------------------------------
  // Public accessors (used by routes and tests)
  // -------------------------------------------------------------------------

  getHostConfigurator(): FederationHostConfigurator {
    return this.hostConfigurator;
  }

  getRemoteLoader(): RemoteLoader {
    return this.remoteLoader;
  }

  getSharedDeps(): SharedDependencyManager {
    return this.sharedDeps;
  }

  getHotReload(): HotReloadManager {
    return this.hotReload;
  }

  getConfig(): ResolvedFederationConfig {
    return this.config;
  }

  // -------------------------------------------------------------------------
  // HTTP Routes
  // -------------------------------------------------------------------------

  private registerRoutes(broker: any): void {
    if (!broker?.route) return;

    // GET /api/v1/federation/remotes
    broker.route('GET', '/api/v1/federation/remotes', () => {
      const loaded = this.remoteLoader.getLoaded();
      return {
        remotes: loaded.map((m) => ({
          name: m.name,
          url: m.remote.url,
          format: m.remote.format,
          loadedAt: m.loadedAt,
          version: m.version,
        })),
      };
    });

    // POST /api/v1/federation/remotes
    broker.route('POST', '/api/v1/federation/remotes', async (ctx: any) => {
      const body: RemoteEntry = ctx.body;
      const result = await this.remoteLoader.load(body);
      return result;
    });

    // DELETE /api/v1/federation/remotes/:name
    broker.route('DELETE', '/api/v1/federation/remotes/:name', (ctx: any) => {
      const name = ctx.params.name;
      const removed = this.remoteLoader.unload(name);
      return { removed };
    });

    // POST /api/v1/federation/remotes/:name/reload
    broker.route('POST', '/api/v1/federation/remotes/:name/reload', async (ctx: any) => {
      const name = ctx.params.name;
      const result = await this.remoteLoader.reload(name);
      return result;
    });

    // GET /api/v1/federation/shared
    broker.route('GET', '/api/v1/federation/shared', () => {
      return { shared: this.sharedDeps.getAll() };
    });

    // GET /api/v1/federation/config
    broker.route('GET', '/api/v1/federation/config', () => {
      return this.hostConfigurator.toJSON();
    });

    // GET /api/v1/federation/stats
    broker.route('GET', '/api/v1/federation/stats', () => {
      const loaded = this.remoteLoader.getLoaded();
      return {
        totalRemotes: this.config.remotes.length,
        loadedRemotes: loaded.length,
        sharedDependencies: this.sharedDeps.getAll().length,
        hotReloadActive: this.hotReload.isWatching(),
        reloadHistory: this.hotReload.getReloadHistory().length,
      };
    });
  }
}
