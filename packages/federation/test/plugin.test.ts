// ---------------------------------------------------------------------------
// @objectos/federation — Tests
// ---------------------------------------------------------------------------

import { FederationHostConfigurator } from '../src/host-config.js';
import { HotReloadManager } from '../src/hot-reload.js';
import { FederationPlugin } from '../src/plugin.js';
import { MockModuleResolver, RemoteLoader } from '../src/remote-loader.js';
import { SharedDependencyManager, isVersionCompatible } from '../src/shared-deps.js';
import type {
  RemoteEntry,
  ResolvedFederationConfig,
  SharedDependency,
} from '../src/types.js';
import { resolveConfig, DEFAULT_FEDERATION_CONFIG } from '../src/types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function createRemoteEntry(overrides?: Partial<RemoteEntry>): RemoteEntry {
  return {
    name: 'test-remote',
    url: 'https://cdn.example.com/remote/entry.js',
    format: 'esm',
    ...overrides,
  };
}

function createSharedDep(overrides?: Partial<SharedDependency>): SharedDependency {
  return {
    name: 'react',
    version: '19.0.0',
    singleton: true,
    eager: false,
    ...overrides,
  };
}

function createConfig(overrides?: Partial<ResolvedFederationConfig>): ResolvedFederationConfig {
  return resolveConfig({
    remotes: [createRemoteEntry()],
    shared: [createSharedDep()],
    ...overrides,
  });
}

function createMockPlugin(): Record<string, unknown> {
  return {
    default: {
      name: 'mock-plugin',
      version: '1.0.0',
      init: async () => {},
      start: async () => {},
      stop: async () => {},
    },
    version: '1.0.0',
  };
}

function createMockContext() {
  return {
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    trigger: jest.fn(async (_event: string, _payload: any) => {}),
    registerService: jest.fn(),
    getService: jest.fn(),
    broker: {
      call: jest.fn(),
      getService: jest.fn(),
      route: jest.fn(),
    },
  };
}

// ===========================================================================
// O.5.1 — Host Configuration
// ===========================================================================

describe('O.5.1 — Host Configuration', () => {
  let configurator: FederationHostConfigurator;
  let config: ResolvedFederationConfig;

  beforeEach(() => {
    config = createConfig();
    configurator = new FederationHostConfigurator(config);
  });

  test('generates Vite config with correct host name', () => {
    const vite = configurator.generateViteConfig();
    expect(vite.name).toBe('objectos-host');
  });

  test('generates Vite config with resolved remotes', () => {
    const vite = configurator.generateViteConfig();
    expect(vite.remotes['test-remote']).toBe('https://cdn.example.com/remote/entry.js');
  });

  test('generates Vite config with resolved shared deps', () => {
    const vite = configurator.generateViteConfig();
    expect(vite.shared['react']).toEqual({
      singleton: true,
      eager: false,
      requiredVersion: '^19.0.0',
    });
  });

  test('generates Webpack config with filename', () => {
    const wp = configurator.generateWebpackConfig();
    expect(wp.name).toBe('objectos-host');
    expect(wp.filename).toBe('remoteEntry.js');
    expect(wp.remotes['test-remote']).toBe('https://cdn.example.com/remote/entry.js');
  });

  test('resolveRemotes uses scope when provided', () => {
    const entries: RemoteEntry[] = [
      createRemoteEntry({ name: 'crm', scope: 'crm-scope', url: 'https://crm.example.com/entry.js' }),
    ];
    const resolved = configurator.resolveRemotes(entries);
    expect(resolved['crm-scope']).toBe('https://crm.example.com/entry.js');
  });

  test('resolveShared uses requiredVersion when provided', () => {
    const deps: SharedDependency[] = [
      createSharedDep({ name: 'vue', version: '3.4.0', requiredVersion: '~3.4.0' }),
    ];
    const resolved = configurator.resolveShared(deps);
    expect(resolved['vue'].requiredVersion).toBe('~3.4.0');
  });

  test('validate detects duplicate remote names', () => {
    const c = createConfig({
      remotes: [
        createRemoteEntry({ name: 'dup' }),
        createRemoteEntry({ name: 'dup', url: 'https://other.example.com/entry.js' }),
      ],
    });
    const errors = configurator.validate(c);
    expect(errors).toContain('Duplicate remote name: dup');
  });

  test('validate detects invalid URLs', () => {
    const c = createConfig({
      remotes: [createRemoteEntry({ name: 'bad', url: 'not-a-url' })],
    });
    const errors = configurator.validate(c);
    expect(errors.some((e) => e.includes('invalid URL'))).toBe(true);
  });

  test('validate detects invalid version format', () => {
    const c = createConfig({
      shared: [createSharedDep({ name: 'broken', version: 'abc' })],
    });
    const errors = configurator.validate(c);
    expect(errors.some((e) => e.includes('invalid version'))).toBe(true);
  });

  test('validate returns empty array for valid config', () => {
    const errors = configurator.validate();
    expect(errors).toEqual([]);
  });

  test('toJSON returns Vite config', () => {
    const json = configurator.toJSON();
    expect(json.name).toBe('objectos-host');
    expect(json.remotes).toBeDefined();
    expect(json.shared).toBeDefined();
  });
});

// ===========================================================================
// O.5.2 — Remote Loader
// ===========================================================================

describe('O.5.2 — Remote Loader', () => {
  let resolver: MockModuleResolver;
  let loader: RemoteLoader;

  beforeEach(() => {
    resolver = new MockModuleResolver();
    loader = new RemoteLoader(resolver, { retryAttempts: 1, retryDelay: 10, timeout: 5000 });
  });

  test('loads a remote module successfully', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, createMockPlugin());

    const result = await loader.load(remote);
    expect(result.success).toBe(true);
    expect(result.module?.name).toBe('test-remote');
    expect(result.module?.version).toBe('1.0.0');
  });

  test('returns cached module on repeated load', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, createMockPlugin());

    await loader.load(remote);
    const result = await loader.load(remote);
    expect(result.success).toBe(true);
    expect(result.loadTime).toBe(0); // cached
  });

  test('unloads a remote module', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, createMockPlugin());

    await loader.load(remote);
    expect(loader.getLoaded().length).toBe(1);

    const removed = loader.unload('test-remote');
    expect(removed).toBe(true);
    expect(loader.getLoaded().length).toBe(0);
  });

  test('unload returns false for unknown module', () => {
    expect(loader.unload('nonexistent')).toBe(false);
  });

  test('reloads a remote module', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, createMockPlugin());

    await loader.load(remote);
    const result = await loader.reload('test-remote');
    expect(result.success).toBe(true);
  });

  test('reload fails for unknown remote', async () => {
    const result = await loader.reload('nonexistent');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('handles load failure with error state', async () => {
    const remote = createRemoteEntry({ url: 'https://fail.example.com/entry.js' });
    resolver.registerFailure(remote.url, new Error('Network error'));

    const result = await loader.load(remote);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Network error');

    const state = loader.getState('test-remote');
    expect(state?.status).toBe('error');
    expect(state?.lastError).toContain('Network error');
  });

  test('rejects modules without default or plugin export', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, { someOtherExport: true });

    const result = await loader.load(remote);
    expect(result.success).toBe(false);
    expect(result.error).toContain('must export');
  });

  test('accepts modules with named plugin export', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, {
      plugin: { name: 'named-plugin', init: async () => {}, start: async () => {}, stop: async () => {} },
    });

    const result = await loader.load(remote);
    expect(result.success).toBe(true);
  });

  test('getLoaded returns all loaded modules', async () => {
    const r1 = createRemoteEntry({ name: 'r1', url: 'https://cdn.example.com/r1.js' });
    const r2 = createRemoteEntry({ name: 'r2', url: 'https://cdn.example.com/r2.js' });
    resolver.register(r1.url, createMockPlugin());
    resolver.register(r2.url, createMockPlugin());

    await loader.load(r1);
    await loader.load(r2);
    expect(loader.getLoaded().length).toBe(2);
  });

  test('getState returns correct state after load', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, createMockPlugin());

    await loader.load(remote);
    const state = loader.getState('test-remote');
    expect(state?.status).toBe('loaded');
    expect(state?.loadedAt).toBeDefined();
  });

  test('retries on failure before giving up', async () => {
    const remote = createRemoteEntry({ url: 'https://flaky.example.com/entry.js' });
    let attempts = 0;
    // Use a custom resolver to count attempts
    const countingResolver = new MockModuleResolver();
    const originalResolve = countingResolver.resolve.bind(countingResolver);
    countingResolver.resolve = async (url: string) => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Flaky error');
      }
      return createMockPlugin();
    };

    const retryLoader = new RemoteLoader(countingResolver, { retryAttempts: 3, retryDelay: 10 });
    const result = await retryLoader.load(remote);
    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
  });
});

// ===========================================================================
// O.5.3 — Shared Dependencies
// ===========================================================================

describe('O.5.3 — Shared Dependencies', () => {
  let manager: SharedDependencyManager;

  beforeEach(() => {
    manager = new SharedDependencyManager();
  });

  test('registers and retrieves a shared dependency', () => {
    const dep = createSharedDep();
    manager.register(dep);
    expect(manager.get('react')).toEqual(dep);
  });

  test('resolve returns compatible for matching version', () => {
    manager.register(createSharedDep({ version: '19.0.0' }));
    const result = manager.resolve('react', '^19.0.0');
    expect(result.compatible).toBe(true);
  });

  test('resolve returns incompatible for wrong major', () => {
    manager.register(createSharedDep({ version: '18.2.0' }));
    const result = manager.resolve('react', '^19.0.0');
    expect(result.compatible).toBe(false);
  });

  test('resolve returns incompatible for unregistered dep', () => {
    const result = manager.resolve('vue');
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('not registered');
  });

  test('resolve without requiredVersion always compatible', () => {
    manager.register(createSharedDep());
    const result = manager.resolve('react');
    expect(result.compatible).toBe(true);
  });

  test('getAll returns all registered deps', () => {
    manager.register(createSharedDep({ name: 'react' }));
    manager.register(createSharedDep({ name: 'react-dom', version: '19.0.0' }));
    expect(manager.getAll().length).toBe(2);
  });

  test('checkConflicts detects version incompatibility', () => {
    manager.register(createSharedDep({ name: 'react', version: '18.0.0', requiredVersion: '^19.0.0' }));
    const conflicts = manager.checkConflicts();
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0]).toContain('does not satisfy');
  });

  test('checkConflicts returns empty for valid deps', () => {
    manager.register(createSharedDep({ name: 'react', version: '19.1.0', requiredVersion: '^19.0.0' }));
    const conflicts = manager.checkConflicts();
    expect(conflicts).toEqual([]);
  });

  test('getSingletons returns only singleton deps', () => {
    manager.register(createSharedDep({ name: 'react', singleton: true }));
    manager.register(createSharedDep({ name: 'lodash', singleton: false }));
    const singletons = manager.getSingletons();
    expect(singletons.length).toBe(1);
    expect(singletons[0].name).toBe('react');
  });

  test('buildSharedScope returns scope object', () => {
    manager.register(createSharedDep({ name: 'react', version: '19.0.0', singleton: true, eager: false }));
    const scope = manager.buildSharedScope();
    expect(scope['react']).toEqual({ version: '19.0.0', singleton: true, eager: false });
  });

  // Version compatibility tests
  describe('isVersionCompatible', () => {
    test('exact match', () => {
      expect(isVersionCompatible('1.2.3', '1.2.3')).toBe(true);
      expect(isVersionCompatible('1.2.3', '1.2.4')).toBe(false);
    });

    test('caret range — same major', () => {
      expect(isVersionCompatible('1.3.0', '^1.2.0')).toBe(true);
      expect(isVersionCompatible('1.2.5', '^1.2.0')).toBe(true);
      expect(isVersionCompatible('2.0.0', '^1.2.0')).toBe(false);
      expect(isVersionCompatible('1.1.0', '^1.2.0')).toBe(false);
    });

    test('tilde range — same major.minor', () => {
      expect(isVersionCompatible('1.2.5', '~1.2.0')).toBe(true);
      expect(isVersionCompatible('1.2.0', '~1.2.0')).toBe(true);
      expect(isVersionCompatible('1.3.0', '~1.2.0')).toBe(false);
    });

    test('caret with zero major', () => {
      expect(isVersionCompatible('0.2.5', '^0.2.0')).toBe(true);
      expect(isVersionCompatible('0.3.0', '^0.2.0')).toBe(false);
    });

    test('invalid version returns false', () => {
      expect(isVersionCompatible('abc', '1.0.0')).toBe(false);
      expect(isVersionCompatible('1.0.0', 'xyz')).toBe(false);
    });
  });
});

// ===========================================================================
// O.5.4 — Hot Reload
// ===========================================================================

describe('O.5.4 — Hot Reload', () => {
  let manager: HotReloadManager;

  beforeEach(() => {
    manager = new HotReloadManager();
  });

  test('starts and stops watching', () => {
    expect(manager.isWatching()).toBe(false);
    manager.start();
    expect(manager.isWatching()).toBe(true);
    manager.stop();
    expect(manager.isWatching()).toBe(false);
  });

  test('start with custom port', () => {
    manager.start(9200);
    expect(manager.isWatching()).toBe(true);
    expect(manager.getPort()).toBe(9200);
  });

  test('notifyChange emits change event', async () => {
    const events: any[] = [];
    manager.onReload((e) => { events.push(e); });

    await manager.notifyChange('crm-plugin');
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('change');
    expect(events[0].remoteName).toBe('crm-plugin');
  });

  test('onReload registers callback', async () => {
    const cb = jest.fn();
    manager.onReload(cb);
    await manager.notifyChange('test');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('multiple callbacks are invoked', async () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    manager.onReload(cb1);
    manager.onReload(cb2);
    await manager.notifyChange('test');
    expect(cb1).toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
  });

  test('getReloadHistory tracks events', async () => {
    await manager.notifyChange('a');
    await manager.notifyChange('b');
    const history = manager.getReloadHistory();
    expect(history.length).toBe(2);
    expect(history[0].remoteName).toBe('a');
    expect(history[1].remoteName).toBe('b');
  });

  test('triggerReload emits add for first time', async () => {
    const events: any[] = [];
    manager.onReload((e) => { events.push(e); });

    const event = await manager.triggerReload('new-plugin');
    expect(event.type).toBe('add');
    expect(events.length).toBe(1);
  });

  test('triggerReload emits change after first load', async () => {
    await manager.notifyChange('existing-plugin');
    const event = await manager.triggerReload('existing-plugin');
    expect(event.type).toBe('change');
  });

  test('callback errors do not crash the manager', async () => {
    manager.onReload(() => { throw new Error('boom'); });
    manager.onReload(jest.fn());
    // Should not throw
    await manager.notifyChange('test');
    expect(manager.getReloadHistory().length).toBe(1);
  });
});

// ===========================================================================
// Plugin Lifecycle
// ===========================================================================

describe('Federation Plugin Lifecycle', () => {
  let plugin: FederationPlugin;
  let mockContext: ReturnType<typeof createMockContext>;
  let resolver: MockModuleResolver;

  beforeEach(() => {
    resolver = new MockModuleResolver();
    plugin = new FederationPlugin(
      {
        remotes: [createRemoteEntry()],
        shared: [createSharedDep()],
        hotReload: true,
        retryAttempts: 0,
        retryDelay: 10,
      },
      resolver,
    );
    mockContext = createMockContext();
  });

  test('init registers federation service', async () => {
    await plugin.init(mockContext as any);
    expect(mockContext.registerService).toHaveBeenCalledWith('federation', plugin);
  });

  test('init triggers plugin.initialized event', async () => {
    await plugin.init(mockContext as any);
    expect(mockContext.trigger).toHaveBeenCalledWith('plugin.initialized', {
      pluginId: '@objectos/federation',
    });
  });

  test('init registers shared dependencies from config', async () => {
    await plugin.init(mockContext as any);
    const deps = plugin.getSharedDeps().getAll();
    expect(deps.length).toBe(1);
    expect(deps[0].name).toBe('react');
  });

  test('start loads configured remotes', async () => {
    const remote = createRemoteEntry();
    resolver.register(remote.url, createMockPlugin());

    await plugin.init(mockContext as any);
    await plugin.start(mockContext as any);

    expect(plugin.getRemoteLoader().getLoaded().length).toBe(1);
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Loaded remote: test-remote'),
    );
  });

  test('start logs error for failed remote loading', async () => {
    // Don't register the URL — it will fail
    await plugin.init(mockContext as any);
    await plugin.start(mockContext as any);

    expect(mockContext.logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load remote: test-remote'),
    );
  });

  test('start enables hot reload when configured', async () => {
    resolver.register(createRemoteEntry().url, createMockPlugin());

    await plugin.init(mockContext as any);
    await plugin.start(mockContext as any);

    expect(plugin.getHotReload().isWatching()).toBe(true);
  });

  test('start registers HTTP routes', async () => {
    resolver.register(createRemoteEntry().url, createMockPlugin());

    await plugin.init(mockContext as any);
    await plugin.start(mockContext as any);

    expect(mockContext.broker.route).toHaveBeenCalled();
    const routeCalls = mockContext.broker.route.mock.calls;
    const methods = routeCalls.map((c: any[]) => `${c[0]} ${c[1]}`);
    expect(methods).toContain('GET /api/v1/federation/remotes');
    expect(methods).toContain('POST /api/v1/federation/remotes');
    expect(methods).toContain('DELETE /api/v1/federation/remotes/:name');
    expect(methods).toContain('POST /api/v1/federation/remotes/:name/reload');
    expect(methods).toContain('GET /api/v1/federation/shared');
    expect(methods).toContain('GET /api/v1/federation/config');
    expect(methods).toContain('GET /api/v1/federation/stats');
  });

  test('stop unloads all remotes and stops hot reload', async () => {
    resolver.register(createRemoteEntry().url, createMockPlugin());

    await plugin.init(mockContext as any);
    await plugin.start(mockContext as any);

    expect(plugin.getRemoteLoader().getLoaded().length).toBe(1);
    expect(plugin.getHotReload().isWatching()).toBe(true);

    await plugin.stop();

    expect(plugin.getRemoteLoader().getLoaded().length).toBe(0);
    expect(plugin.getHotReload().isWatching()).toBe(false);
  });

  test('getHealthReport returns healthy when all remotes loaded', async () => {
    resolver.register(createRemoteEntry().url, createMockPlugin());

    await plugin.init(mockContext as any);
    await plugin.start(mockContext as any);

    const health = plugin.getHealthReport();
    expect(health.status).toBe('healthy');
    expect(health.message).toContain('1/1');
  });

  test('getHealthReport returns degraded when some remotes fail', async () => {
    // Don't register URL — remote will fail
    await plugin.init(mockContext as any);
    await plugin.start(mockContext as any);

    const health = plugin.getHealthReport();
    expect(health.status).toBe('unhealthy');
  });

  test('getCapabilities returns federation capabilities', () => {
    const caps = plugin.getCapabilities();
    expect(caps.length).toBe(4);
    expect(caps.map((c) => c.name)).toContain('remote-loading');
    expect(caps.map((c) => c.name)).toContain('shared-dependencies');
    expect(caps.map((c) => c.name)).toContain('hot-reload');
    expect(caps.map((c) => c.name)).toContain('host-config');
  });

  test('getSecurityManifest returns permissions and scopes', () => {
    const manifest = plugin.getSecurityManifest();
    expect(manifest.permissions).toContain('federation.read');
    expect(manifest.permissions).toContain('federation.write');
    expect(manifest.scopes).toContain('federation');
  });
});

// ===========================================================================
// Config Resolution
// ===========================================================================

describe('Config Resolution', () => {
  test('resolveConfig applies defaults', () => {
    const config = resolveConfig({});
    expect(config.remotes).toEqual([]);
    expect(config.shared).toEqual([]);
    expect(config.hotReload).toBe(false);
    expect(config.hotReloadPort).toBe(9100);
    expect(config.timeout).toBe(30_000);
    expect(config.retryAttempts).toBe(3);
    expect(config.retryDelay).toBe(1_000);
  });

  test('resolveConfig preserves provided values', () => {
    const config = resolveConfig({
      hotReload: true,
      hotReloadPort: 9200,
      timeout: 5000,
    });
    expect(config.hotReload).toBe(true);
    expect(config.hotReloadPort).toBe(9200);
    expect(config.timeout).toBe(5000);
  });

  test('DEFAULT_FEDERATION_CONFIG is immutable reference', () => {
    expect(DEFAULT_FEDERATION_CONFIG.retryAttempts).toBe(3);
    expect(DEFAULT_FEDERATION_CONFIG.cacheDir).toBe('.federation-cache');
  });
});
