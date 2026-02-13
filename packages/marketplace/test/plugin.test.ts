/**
 * Marketplace Plugin Tests
 *
 * Tests for O.2.1 (registry), O.2.2 (manifest validation),
 * O.2.3 (installation), O.2.4 (versioning), and O.2.6 (sandbox).
 */

import { MarketplacePlugin } from '../src/plugin.js';
import { PluginRegistry } from '../src/registry.js';
import { PluginInstaller } from '../src/installer.js';
import { PluginSandbox } from '../src/sandbox.js';
import {
  validateManifest,
  resolveDependencies,
  checkCompatibility,
} from '../src/manifest-validator.js';
import type { PluginManifest } from '../src/types.js';

// ─── Test Fixtures ─────────────────────────────────────────────────

function createValidManifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin for unit testing',
    author: 'ObjectOS Team',
    license: 'MIT',
    keywords: ['test', 'demo'],
    repository: 'https://github.com/objectos/test-plugin',
    engine: { objectos: '>=0.1.0' },
    ...overrides,
  };
}

function createMockContext() {
  const events: Array<{ event: string; payload: any }> = [];
  const services: Record<string, any> = {};

  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    trigger: jest.fn(async (event: string, payload: any) => {
      events.push({ event, payload });
    }),
    registerService: jest.fn((name: string, service: any) => {
      services[name] = service;
    }),
    getService: jest.fn((name: string) => services[name] ?? null),
    broker: {
      call: jest.fn(),
      getService: jest.fn(() => null),
    },
    _events: events,
    _services: services,
  };
}

// ─── O.2.1: Registry API Tests ──────────────────────────────────

describe('O.2.1 — Plugin Registry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  test('registers a valid plugin manifest', () => {
    const manifest = createValidManifest();
    const entry = registry.register(manifest);

    expect(entry.manifest.id).toBe('test-plugin');
    expect(entry.manifest.version).toBe('1.0.0');
    expect(entry.downloads).toBe(0);
    expect(entry.rating).toBe(0);
    expect(entry.verified).toBe(false);
    expect(entry.featured).toBe(false);
    expect(entry.publishedAt).toBeTruthy();
    expect(entry.updatedAt).toBeTruthy();
  });

  test('rejects invalid manifest on register', () => {
    expect(() => registry.register({} as any)).toThrow('Invalid manifest');
  });

  test('rejects duplicate version registration', () => {
    const manifest = createValidManifest();
    registry.register(manifest);

    expect(() => registry.register(manifest)).toThrow('already registered');
  });

  test('allows multiple versions of the same plugin', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    registry.register(createValidManifest({ version: '1.1.0' }));
    registry.register(createValidManifest({ version: '2.0.0' }));

    const versions = registry.getVersions('test-plugin');
    expect(versions).toHaveLength(3);
    expect(versions.map((v) => v.version)).toEqual(['1.0.0', '1.1.0', '2.0.0']);
  });

  test('getPlugin returns the latest version', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    registry.register(createValidManifest({ version: '2.0.0' }));

    const entry = registry.getPlugin('test-plugin');
    expect(entry?.manifest.version).toBe('2.0.0');
  });

  test('getPluginVersion returns a specific version', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    registry.register(createValidManifest({ version: '2.0.0' }));

    const entry = registry.getPluginVersion('test-plugin', '1.0.0');
    expect(entry?.manifest.version).toBe('1.0.0');
  });

  test('getPlugin returns undefined for unknown plugin', () => {
    expect(registry.getPlugin('nonexistent')).toBeUndefined();
  });

  test('search returns all plugins with no query', () => {
    registry.register(createValidManifest({ id: 'plugin-aa', name: 'Plugin A' }));
    registry.register(createValidManifest({ id: 'plugin-bb', name: 'Plugin B' }));

    const result = registry.search();
    expect(result.total).toBe(2);
    expect(result.plugins).toHaveLength(2);
  });

  test('search filters by text query', () => {
    registry.register(
      createValidManifest({ id: 'crm-plugin', name: 'CRM Plugin', description: 'CRM features' }),
    );
    registry.register(
      createValidManifest({ id: 'hrm-plugin', name: 'HRM Plugin', description: 'HRM features' }),
    );

    const result = registry.search('crm');
    expect(result.total).toBe(1);
    expect(result.plugins[0].manifest.id).toBe('crm-plugin');
  });

  test('search filters by keyword', () => {
    registry.register(
      createValidManifest({ id: 'plugin-aa', keywords: ['analytics', 'dashboard'] }),
    );
    registry.register(createValidManifest({ id: 'plugin-bb', keywords: ['crm'] }));

    const result = registry.search(undefined, { keyword: 'analytics' });
    expect(result.total).toBe(1);
    expect(result.plugins[0].manifest.id).toBe('plugin-aa');
  });

  test('search filters by author', () => {
    registry.register(createValidManifest({ id: 'plugin-aa', author: 'Alice' }));
    registry.register(createValidManifest({ id: 'plugin-bb', author: 'Bob' }));

    const result = registry.search(undefined, { author: 'Alice' });
    expect(result.total).toBe(1);
    expect(result.plugins[0].manifest.author).toBe('Alice');
  });

  test('search paginates results', () => {
    for (let i = 1; i <= 5; i++) {
      registry.register(
        createValidManifest({
          id: `plugin-${String(i).padStart(2, '0')}`,
          name: `Plugin ${i}`,
        }),
      );
    }

    const page1 = registry.search(undefined, { page: 1, pageSize: 2 });
    expect(page1.plugins).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page1.hasMore).toBe(true);

    const page3 = registry.search(undefined, { page: 3, pageSize: 2 });
    expect(page3.plugins).toHaveLength(1);
    expect(page3.hasMore).toBe(false);
  });

  test('listFeatured returns only featured plugins', () => {
    registry.register(createValidManifest({ id: 'plugin-aa' }));
    registry.register(createValidManifest({ id: 'plugin-bb' }));
    registry.setFeatured('plugin-aa', true);

    const featured = registry.listFeatured();
    expect(featured).toHaveLength(1);
    expect(featured[0].manifest.id).toBe('plugin-aa');
  });

  test('listByCategory returns plugins matching keyword', () => {
    registry.register(createValidManifest({ id: 'plugin-aa', keywords: ['analytics'] }));
    registry.register(createValidManifest({ id: 'plugin-bb', keywords: ['crm'] }));

    const result = registry.listByCategory('analytics');
    expect(result).toHaveLength(1);
    expect(result[0].manifest.id).toBe('plugin-aa');
  });

  test('getStats returns correct statistics', () => {
    registry.register(createValidManifest({ id: 'plugin-aa', version: '1.0.0' }));
    registry.register(createValidManifest({ id: 'plugin-aa', version: '2.0.0' }));
    registry.register(createValidManifest({ id: 'plugin-bb' }));
    registry.setFeatured('plugin-aa', true);
    registry.setVerified('plugin-bb', true);

    const stats = registry.getStats();
    expect(stats.totalPlugins).toBe(2);
    expect(stats.totalVersions).toBe(3);
    expect(stats.featuredCount).toBe(1);
    expect(stats.verifiedCount).toBe(1);
  });

  test('incrementDownloads increases counter', () => {
    registry.register(createValidManifest());
    registry.incrementDownloads('test-plugin');
    registry.incrementDownloads('test-plugin');

    const entry = registry.getPlugin('test-plugin');
    expect(entry?.downloads).toBe(2);
  });
});

// ─── O.2.2: Manifest Validation Tests ──────────────────────────

describe('O.2.2 — Manifest Validation', () => {
  test('valid manifest passes validation', () => {
    const errors = validateManifest(createValidManifest());
    expect(errors).toHaveLength(0);
  });

  test('rejects missing id', () => {
    const errors = validateManifest(createValidManifest({ id: '' }));
    expect(errors.some((e) => e.includes('"id"'))).toBe(true);
  });

  test('rejects invalid id format', () => {
    const errors = validateManifest(createValidManifest({ id: 'INVALID_ID' }));
    expect(errors.some((e) => e.includes('Invalid plugin ID'))).toBe(true);
  });

  test('rejects missing name', () => {
    const errors = validateManifest(createValidManifest({ name: '' }));
    expect(errors.some((e) => e.includes('"name"'))).toBe(true);
  });

  test('rejects missing version', () => {
    const errors = validateManifest(createValidManifest({ version: '' }));
    expect(errors.some((e) => e.includes('"version"'))).toBe(true);
  });

  test('rejects invalid semver version', () => {
    const errors = validateManifest(createValidManifest({ version: 'not-semver' }));
    expect(errors.some((e) => e.includes('Invalid version'))).toBe(true);
  });

  test('rejects version with only major.minor', () => {
    const errors = validateManifest(createValidManifest({ version: '1.0' }));
    expect(errors.some((e) => e.includes('Invalid version'))).toBe(true);
  });

  test('accepts version with pre-release', () => {
    const errors = validateManifest(createValidManifest({ version: '1.0.0-beta.1' }));
    expect(errors).toHaveLength(0);
  });

  test('rejects missing description', () => {
    const errors = validateManifest(createValidManifest({ description: '' }));
    expect(errors.some((e) => e.includes('"description"'))).toBe(true);
  });

  test('rejects missing author', () => {
    const errors = validateManifest(createValidManifest({ author: '' }));
    expect(errors.some((e) => e.includes('"author"'))).toBe(true);
  });

  test('rejects missing license', () => {
    const errors = validateManifest(createValidManifest({ license: '' }));
    expect(errors.some((e) => e.includes('"license"'))).toBe(true);
  });

  test('validates dependency format', () => {
    const errors = validateManifest(
      createValidManifest({
        dependencies: { 'valid-dep': '^1.0.0', BAD: 'not-valid' },
      }),
    );
    expect(errors.some((e) => e.includes('Invalid dependency ID'))).toBe(true);
    expect(errors.some((e) => e.includes('Invalid version range'))).toBe(true);
  });

  test('accepts valid dependency ranges', () => {
    const errors = validateManifest(
      createValidManifest({
        dependencies: {
          'dep-one': '^1.0.0',
          'dep-two': '~2.1.0',
          'dep-three': '>=3.0.0',
          'dep-four': '1.0.0',
        },
      }),
    );
    expect(errors).toHaveLength(0);
  });

  test('validates keyword array type', () => {
    const errors = validateManifest(createValidManifest({ keywords: 'not-array' as any }));
    expect(errors.some((e) => e.includes('Keywords must be an array'))).toBe(true);
  });

  test('validates engine format', () => {
    const errors = validateManifest(createValidManifest({ engine: { objectos: 'invalid' } }));
    expect(errors.some((e) => e.includes('Invalid engine range'))).toBe(true);
  });

  test('returns multiple errors for completely invalid manifest', () => {
    const errors = validateManifest({});
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe('O.2.2 — Dependency Resolution', () => {
  test('resolves all dependencies when installed', () => {
    const manifest = createValidManifest({
      dependencies: { 'dep-aa': '^1.0.0', 'dep-bb': '~2.0.0' },
    });
    const installed = new Map([
      ['dep-aa', '1.2.0'],
      ['dep-bb', '2.0.3'],
    ]);

    const graph = resolveDependencies(manifest, installed);
    expect(graph.resolved).toEqual({ 'dep-aa': '1.2.0', 'dep-bb': '2.0.3' });
    expect(graph.conflicts).toHaveLength(0);
    expect(graph.missing).toHaveLength(0);
  });

  test('detects missing dependencies', () => {
    const manifest = createValidManifest({
      dependencies: { 'dep-aa': '^1.0.0', 'dep-bb': '~2.0.0' },
    });
    const installed = new Map([['dep-aa', '1.0.0']]);

    const graph = resolveDependencies(manifest, installed);
    expect(graph.missing).toEqual(['dep-bb']);
  });

  test('detects version conflicts', () => {
    const manifest = createValidManifest({
      dependencies: { 'dep-aa': '^2.0.0' },
    });
    const installed = new Map([['dep-aa', '1.5.0']]);

    const graph = resolveDependencies(manifest, installed);
    expect(graph.conflicts).toHaveLength(1);
    expect(graph.conflicts[0]).toContain('dep-aa');
  });

  test('handles manifest with no dependencies', () => {
    const manifest = createValidManifest({ dependencies: undefined });
    const graph = resolveDependencies(manifest, new Map());
    expect(graph.resolved).toEqual({});
    expect(graph.conflicts).toHaveLength(0);
    expect(graph.missing).toHaveLength(0);
  });
});

describe('O.2.2 — Compatibility Check', () => {
  test('passes when engine requirements met', () => {
    const manifest = createValidManifest({ engine: { objectos: '>=0.1.0' } });
    const issues = checkCompatibility(manifest, { objectos: '1.0.0' });
    expect(issues).toHaveLength(0);
  });

  test('fails when engine version is too low', () => {
    const manifest = createValidManifest({ engine: { objectos: '>=2.0.0' } });
    const issues = checkCompatibility(manifest, { objectos: '1.0.0' });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('does not satisfy');
  });

  test('warns about unknown engines', () => {
    const manifest = createValidManifest({ engine: { 'unknown-engine': '>=1.0.0' } });
    const issues = checkCompatibility(manifest, { objectos: '1.0.0' });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('Unknown engine');
  });

  test('passes when no engine constraints', () => {
    const manifest = createValidManifest({ engine: undefined });
    const issues = checkCompatibility(manifest, { objectos: '1.0.0' });
    expect(issues).toHaveLength(0);
  });
});

// ─── O.2.3: Installation Tests ──────────────────────────────────

describe('O.2.3 — Plugin Installation', () => {
  let registry: PluginRegistry;
  let installer: PluginInstaller;

  beforeEach(() => {
    registry = new PluginRegistry();
    installer = new PluginInstaller(registry, { objectos: '1.0.0' });
  });

  test('installs a plugin from the registry', () => {
    registry.register(createValidManifest());

    const result = installer.install('test-plugin');
    expect(result.success).toBe(true);
    expect(result.pluginId).toBe('test-plugin');
    expect(result.version).toBe('1.0.0');
    expect(result.message).toContain('installed successfully');
  });

  test('installs a specific version', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    registry.register(createValidManifest({ version: '2.0.0' }));

    const result = installer.install('test-plugin', '1.0.0');
    expect(result.success).toBe(true);
    expect(result.version).toBe('1.0.0');
  });

  test('rejects installing already-installed plugin', () => {
    registry.register(createValidManifest());
    installer.install('test-plugin');

    const result = installer.install('test-plugin');
    expect(result.success).toBe(false);
    expect(result.message).toContain('already installed');
  });

  test('rejects installing non-existent plugin', () => {
    const result = installer.install('nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  test('rejects when dependencies are missing', () => {
    registry.register(
      createValidManifest({
        dependencies: { 'required-dep': '^1.0.0' },
      }),
    );

    const result = installer.install('test-plugin');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Missing dependencies');
  });

  test('uninstalls a plugin', () => {
    registry.register(createValidManifest());
    installer.install('test-plugin');

    const result = installer.uninstall('test-plugin');
    expect(result.success).toBe(true);
    expect(result.message).toContain('uninstalled successfully');
  });

  test('rejects uninstalling non-installed plugin', () => {
    const result = installer.uninstall('nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not installed');
  });

  test('rejects uninstalling when depended upon', () => {
    // Install dep-aa first
    registry.register(createValidManifest({ id: 'dep-aa', version: '1.0.0' }));
    installer.install('dep-aa');

    // Install plugin that depends on dep-aa
    registry.register(
      createValidManifest({
        id: 'dependent-plugin',
        dependencies: { 'dep-aa': '^1.0.0' },
      }),
    );
    installer.install('dependent-plugin');

    const result = installer.uninstall('dep-aa');
    expect(result.success).toBe(false);
    expect(result.message).toContain('depends on it');
  });

  test('getInstalled returns all installed plugins', () => {
    registry.register(createValidManifest({ id: 'plugin-aa' }));
    registry.register(createValidManifest({ id: 'plugin-bb' }));
    installer.install('plugin-aa');
    installer.install('plugin-bb');

    const installed = installer.getInstalled();
    expect(installed).toHaveLength(2);
    expect(installed.map((p) => p.pluginId)).toContain('plugin-aa');
    expect(installed.map((p) => p.pluginId)).toContain('plugin-bb');
  });

  test('isInstalled returns correct status', () => {
    registry.register(createValidManifest());
    expect(installer.isInstalled('test-plugin')).toBe(false);

    installer.install('test-plugin');
    expect(installer.isInstalled('test-plugin')).toBe(true);
  });

  test('increments download counter on install', () => {
    registry.register(createValidManifest());
    installer.install('test-plugin');

    const entry = registry.getPlugin('test-plugin');
    expect(entry?.downloads).toBe(1);
  });
});

// ─── O.2.4: Versioning Tests ───────────────────────────────────

describe('O.2.4 — Versioning and Upgrades', () => {
  let registry: PluginRegistry;
  let installer: PluginInstaller;

  beforeEach(() => {
    registry = new PluginRegistry();
    installer = new PluginInstaller(registry, { objectos: '1.0.0' });
  });

  test('upgrades a plugin to latest version', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    registry.register(createValidManifest({ version: '2.0.0' }));
    installer.install('test-plugin', '1.0.0');

    const result = installer.upgrade('test-plugin');
    expect(result.success).toBe(true);
    expect(result.version).toBe('2.0.0');
    expect(result.previousVersion).toBe('1.0.0');
    expect(result.message).toContain('upgraded');
  });

  test('upgrades to a specific version', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    registry.register(createValidManifest({ version: '1.1.0' }));
    registry.register(createValidManifest({ version: '2.0.0' }));
    installer.install('test-plugin', '1.0.0');

    const result = installer.upgrade('test-plugin', '1.1.0');
    expect(result.success).toBe(true);
    expect(result.version).toBe('1.1.0');
  });

  test('rejects upgrade when already at target version', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    installer.install('test-plugin');

    const result = installer.upgrade('test-plugin');
    expect(result.success).toBe(false);
    expect(result.message).toContain('already at version');
  });

  test('rejects upgrade for non-installed plugin', () => {
    const result = installer.upgrade('nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not installed');
  });

  test('rolls back to previous version', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    registry.register(createValidManifest({ version: '2.0.0' }));
    installer.install('test-plugin', '1.0.0');
    installer.upgrade('test-plugin');

    const result = installer.rollback('test-plugin');
    expect(result.success).toBe(true);
    expect(result.version).toBe('1.0.0');
    expect(result.previousVersion).toBe('2.0.0');
    expect(result.message).toContain('rolled back');
  });

  test('rejects rollback when no previous version', () => {
    registry.register(createValidManifest());
    installer.install('test-plugin');

    const result = installer.rollback('test-plugin');
    expect(result.success).toBe(false);
    expect(result.message).toContain('no previous version');
  });

  test('rejects rollback for non-installed plugin', () => {
    const result = installer.rollback('nonexistent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not installed');
  });

  test('checkUpgrades detects available updates', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    installer.install('test-plugin');
    registry.register(createValidManifest({ version: '2.0.0' }));

    const upgrades = installer.checkUpgrades();
    expect(upgrades).toHaveLength(1);
    expect(upgrades[0].pluginId).toBe('test-plugin');
    expect(upgrades[0].currentVersion).toBe('1.0.0');
    expect(upgrades[0].latestVersion).toBe('2.0.0');
  });

  test('checkUpgrades returns empty when everything up to date', () => {
    registry.register(createValidManifest({ version: '1.0.0' }));
    installer.install('test-plugin');

    const upgrades = installer.checkUpgrades();
    expect(upgrades).toHaveLength(0);
  });
});

// ─── O.2.6: Sandbox Tests ──────────────────────────────────────

describe('O.2.6 — Plugin Sandbox', () => {
  let sandbox: PluginSandbox;

  beforeEach(() => {
    sandbox = new PluginSandbox();
  });

  test('reviews a safe plugin manifest', () => {
    const manifest = createValidManifest();
    const report = sandbox.review(manifest);

    expect(report.safe).toBe(true);
    expect(report.vulnerabilities).toHaveLength(0);
    expect(report.reviewedAt).toBeTruthy();
  });

  test('warns about missing repository', () => {
    const manifest = createValidManifest({ repository: undefined });
    const report = sandbox.review(manifest);

    expect(report.warnings.some((w) => w.includes('repository'))).toBe(true);
  });

  test('warns about missing engine constraints', () => {
    const manifest = createValidManifest({ engine: undefined });
    const report = sandbox.review(manifest);

    expect(report.warnings.some((w) => w.includes('engine'))).toBe(true);
  });

  test('warns about dangerous permissions', () => {
    const manifest = createValidManifest({
      permissions: ['data.read', 'fs.write', 'process.spawn'],
    });
    const warnings = sandbox.validatePermissions(manifest);

    expect(warnings.some((w) => w.includes('fs.write'))).toBe(true);
    expect(warnings.some((w) => w.includes('process.spawn'))).toBe(true);
  });

  test('warns about excessive permissions', () => {
    const manifest = createValidManifest({
      permissions: Array.from({ length: 15 }, (_, i) => `perm.${i}`),
    });
    const warnings = sandbox.validatePermissions(manifest);

    expect(warnings.some((w) => w.includes('excessive'))).toBe(true);
  });

  test('returns no warnings for safe permissions', () => {
    const manifest = createValidManifest({
      permissions: ['data.read', 'data.list'],
    });
    const warnings = sandbox.validatePermissions(manifest);
    expect(warnings).toHaveLength(0);
  });

  test('detects suspicious dependency names', () => {
    const manifest = createValidManifest({
      dependencies: { 'crypto-miner-dep': '^1.0.0' },
    });
    const issues = sandbox.scanDependencies(manifest);

    expect(issues.some((i) => i.includes('Suspicious'))).toBe(true);
  });

  test('warns about large dependency trees', () => {
    const deps: Record<string, string> = {};
    for (let i = 0; i < 25; i++) {
      deps[`dep-${String(i).padStart(3, '0')}`] = '^1.0.0';
    }
    const manifest = createValidManifest({ dependencies: deps });
    const issues = sandbox.scanDependencies(manifest);

    expect(issues.some((i) => i.includes('Large dependency tree'))).toBe(true);
  });

  test('creates sandbox config with minimal permissions', () => {
    const manifest = createValidManifest({ permissions: [] });
    const config = sandbox.createSandboxConfig(manifest);

    expect(config.pluginId).toBe('test-plugin');
    expect(config.allowedAPIs).toContain('data.read');
    expect(config.allowedAPIs).toContain('logger');
    expect(config.networkAccess).toBe(false);
    expect(config.fsAccess).toBe(false);
    expect(config.maxMemory).toBeGreaterThan(0);
    expect(config.maxCpuTime).toBeGreaterThan(0);
  });

  test('creates sandbox config with elevated permissions', () => {
    const manifest = createValidManifest({
      permissions: ['data.write', 'network.outbound', 'fs.read'],
    });
    const config = sandbox.createSandboxConfig(manifest);

    expect(config.allowedAPIs).toContain('data.write');
    expect(config.allowedAPIs).toContain('network');
    expect(config.allowedAPIs).toContain('fs.read');
    expect(config.networkAccess).toBe(true);
    expect(config.fsAccess).toBe(true);
  });

  test('checkResourceLimits returns not exceeded for new plugin', () => {
    const result = sandbox.checkResourceLimits('new-plugin');
    expect(result.exceeded).toBe(false);
    expect(result.details.memoryUsage).toBe(0);
    expect(result.details.cpuTime).toBe(0);
  });

  test('checkResourceLimits detects exceeded limits', () => {
    sandbox.updateResourceUsage('heavy-plugin', 256 * 1024 * 1024, 60000);
    const result = sandbox.checkResourceLimits('heavy-plugin');

    expect(result.exceeded).toBe(true);
  });

  test('custom resource limits override defaults', () => {
    sandbox.setResourceLimits('custom-plugin', 512 * 1024 * 1024, 60000);
    sandbox.updateResourceUsage('custom-plugin', 200 * 1024 * 1024, 20000);

    const result = sandbox.checkResourceLimits('custom-plugin');
    expect(result.exceeded).toBe(false);
    expect(result.details.maxMemory).toBe(512 * 1024 * 1024);
  });

  test('flags vulnerabilities for suspicious deps', () => {
    const manifest = createValidManifest({
      dependencies: { 'eval-exploit': '^1.0.0' },
    });
    const report = sandbox.review(manifest);

    expect(report.safe).toBe(false);
    expect(report.vulnerabilities.length).toBeGreaterThan(0);
  });
});

// ─── Plugin Lifecycle Tests ─────────────────────────────────────

describe('Marketplace Plugin Lifecycle', () => {
  test('initializes and registers marketplace service', async () => {
    const plugin = new MarketplacePlugin();
    const context = createMockContext();

    await plugin.init(context as any);

    expect(context.registerService).toHaveBeenCalledWith('marketplace', plugin);
    expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining('Initialized'));
    expect(context.trigger).toHaveBeenCalledWith('plugin.initialized', {
      pluginId: '@objectos/marketplace',
    });
  });

  test('starts and logs when no HTTP server available', async () => {
    const plugin = new MarketplacePlugin();
    const context = createMockContext();

    await plugin.init(context as any);
    await plugin.start(context as any);

    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('HTTP server not available'),
    );
    expect(context.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Started successfully'),
    );
  });

  test('stops cleanly', async () => {
    const plugin = new MarketplacePlugin();
    const context = createMockContext();

    await plugin.init(context as any);
    await plugin.stop();

    expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining('Stopped'));
  });

  test('health report returns healthy status', async () => {
    const plugin = new MarketplacePlugin();
    const context = createMockContext();

    await plugin.init(context as any);

    const health = plugin.getHealthReport();
    expect(health.status).toBe('healthy');
    expect(health.message).toContain('Marketplace operational');
    expect(health.details?.registeredPlugins).toBe(0);
    expect(health.details?.installedPlugins).toBe(0);
  });

  test('capability manifest exposes correct services', () => {
    const plugin = new MarketplacePlugin();
    const caps = plugin.getCapabilities();

    expect(caps.id).toBe('@objectos/marketplace');
    expect(caps.provides).toContain('marketplace');
    expect(caps.provides).toContain('marketplace.registry');
    expect(caps.provides).toContain('marketplace.install');
    expect(caps.provides).toContain('marketplace.security');
    expect(caps.consumes).toContain('http.server');
    expect(caps.consumes).toContain('permissions');
  });

  test('security manifest exposes correct permissions', () => {
    const plugin = new MarketplacePlugin();
    const sec = plugin.getSecurityManifest();

    expect(sec.permissions).toContain('marketplace.register');
    expect(sec.permissions).toContain('marketplace.install');
    expect(sec.permissions).toContain('marketplace.uninstall');
    expect(sec.permissions).toContain('marketplace.upgrade');
    expect(sec.dataAccess).toContain('read');
    expect(sec.dataAccess).toContain('create');
    expect(sec.dataAccess).toContain('delete');
  });

  test('startup result returns success', () => {
    const plugin = new MarketplacePlugin();
    const result = plugin.getStartupResult();

    expect(result.success).toBe(true);
    expect(result.message).toContain('Marketplace plugin started');
  });

  test('exposes registry, installer, and sandbox instances', async () => {
    const plugin = new MarketplacePlugin();
    const context = createMockContext();

    await plugin.init(context as any);

    expect(plugin.getRegistry()).toBeInstanceOf(PluginRegistry);
    expect(plugin.getInstaller()).toBeInstanceOf(PluginInstaller);
    expect(plugin.getSandbox()).toBeInstanceOf(PluginSandbox);
  });

  test('registers HTTP routes when HTTP server is available', async () => {
    const plugin = new MarketplacePlugin();
    const routes: Array<{ method: string; path: string }> = [];
    const mockApp = {
      get: jest.fn((path: string) => {
        routes.push({ method: 'GET', path });
      }),
      post: jest.fn((path: string) => {
        routes.push({ method: 'POST', path });
      }),
    };

    const context = createMockContext();
    context.getService = jest.fn((name: string) => {
      if (name === 'http.server') return { getRawApp: () => mockApp };
      return null;
    }) as any;

    await plugin.init(context as any);
    await plugin.start(context as any);

    // Verify all expected routes are registered
    const getRoutes = routes.filter((r) => r.method === 'GET').map((r) => r.path);
    const postRoutes = routes.filter((r) => r.method === 'POST').map((r) => r.path);

    expect(getRoutes).toContain('/api/v1/plugins/registry');
    expect(getRoutes).toContain('/api/v1/plugins/registry/:id');
    expect(getRoutes).toContain('/api/v1/plugins/registry/:id/versions');
    expect(getRoutes).toContain('/api/v1/plugins/installed');
    expect(getRoutes).toContain('/api/v1/plugins/upgrades');

    expect(postRoutes).toContain('/api/v1/plugins/registry');
    expect(postRoutes).toContain('/api/v1/plugins/install');
    expect(postRoutes).toContain('/api/v1/plugins/uninstall');
    expect(postRoutes).toContain('/api/v1/plugins/upgrade');
  });

  test('accepts custom configuration', () => {
    const plugin = new MarketplacePlugin({
      registryUrl: 'https://custom.registry.dev',
      autoUpdate: true,
      sandboxed: false,
      maxPlugins: 10,
      allowedPlugins: ['plugin-aa'],
      blockedPlugins: ['plugin-bb'],
    });

    // Verify config is applied by checking health (plugin should initialize correctly)
    const health = plugin.getHealthReport();
    expect(health.status).toBe('healthy');
  });
});
