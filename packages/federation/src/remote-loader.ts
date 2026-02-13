// ---------------------------------------------------------------------------
// @objectos/federation — O.5.2 Remote Plugin Loading at Runtime
// ---------------------------------------------------------------------------

import type {
  ModuleLoadResult,
  ModuleResolver,
  RemoteEntry,
  RemoteModule,
  RemotePluginState,
} from './types.js';

// ---------------------------------------------------------------------------
// Module Resolvers
// ---------------------------------------------------------------------------

/**
 * Default resolver — uses dynamic `import()` for ESM modules.
 */
export class DynamicImportResolver implements ModuleResolver {
  async resolve(url: string): Promise<Record<string, unknown>> {
    return await import(/* webpackIgnore: true */ url);
  }
}

/**
 * Mock resolver for testing — returns pre-configured modules.
 */
export class MockModuleResolver implements ModuleResolver {
  private modules = new Map<string, Record<string, unknown>>();
  private failures = new Map<string, Error>();

  register(url: string, mod: Record<string, unknown>): void {
    this.modules.set(url, mod);
  }

  registerFailure(url: string, error: Error): void {
    this.failures.set(url, error);
  }

  async resolve(url: string): Promise<Record<string, unknown>> {
    const failure = this.failures.get(url);
    if (failure) {
      throw failure;
    }
    const mod = this.modules.get(url);
    if (!mod) {
      throw new Error(`Module not found: ${url}`);
    }
    return mod;
  }
}

// ---------------------------------------------------------------------------
// Remote Loader
// ---------------------------------------------------------------------------

export class RemoteLoader {
  private cache = new Map<string, RemoteModule>();
  private states = new Map<string, RemotePluginState>();
  private remotes = new Map<string, RemoteEntry>();
  private resolver: ModuleResolver;
  private retryAttempts: number;
  private retryDelay: number;
  private timeout: number;

  constructor(
    resolver?: ModuleResolver,
    options?: { retryAttempts?: number; retryDelay?: number; timeout?: number },
  ) {
    this.resolver = resolver ?? new DynamicImportResolver();
    this.retryAttempts = options?.retryAttempts ?? 3;
    this.retryDelay = options?.retryDelay ?? 1_000;
    this.timeout = options?.timeout ?? 30_000;
  }

  /**
   * Load a remote module.
   */
  async load(remote: RemoteEntry): Promise<ModuleLoadResult> {
    // Return cached if already loaded
    const cached = this.cache.get(remote.name);
    if (cached) {
      return { success: true, module: cached, loadTime: 0 };
    }

    this.remotes.set(remote.name, remote);
    this.setState(remote.name, 'loading');

    const start = Date.now();
    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        // Validate URL
        if (!remote.url) {
          throw new Error(`Remote "${remote.name}" has no URL`);
        }

        // Dynamic import with timeout
        const exports = await this.resolveWithTimeout(remote.url);

        // Validate exported interface
        if (!exports.default && !exports.plugin) {
          throw new Error(`Remote "${remote.name}" must export a default Plugin or named "plugin"`);
        }

        const mod: RemoteModule = {
          name: remote.name,
          exports,
          remote,
          loadedAt: Date.now(),
          version: (exports.version as string) ?? undefined,
        };

        this.cache.set(remote.name, mod);
        this.setState(remote.name, 'loaded', undefined, mod);

        return {
          success: true,
          module: mod,
          loadTime: Date.now() - start,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);

        // Exponential backoff before retry
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    this.setState(remote.name, 'error', lastError);
    return {
      success: false,
      error: lastError,
      loadTime: Date.now() - start,
    };
  }

  /**
   * Unload a remote module.
   */
  unload(name: string): boolean {
    const existed = this.cache.delete(name);
    if (existed) {
      this.setState(name, 'unloaded');
    }
    return existed;
  }

  /**
   * Reload a remote module (unload + load).
   */
  async reload(name: string): Promise<ModuleLoadResult> {
    const remote = this.remotes.get(name);
    if (!remote) {
      return { success: false, error: `Remote "${name}" not found`, loadTime: 0 };
    }
    this.cache.delete(name);
    return this.load(remote);
  }

  /**
   * Get all loaded modules.
   */
  getLoaded(): RemoteModule[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get the state of a remote plugin.
   */
  getState(name: string): RemotePluginState | undefined {
    return this.states.get(name);
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private async resolveWithTimeout(url: string): Promise<Record<string, unknown>> {
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout loading module from ${url}`)),
        this.timeout,
      );
      this.resolver
        .resolve(url)
        .then((m) => {
          clearTimeout(timer);
          resolve(m);
        })
        .catch((e) => {
          clearTimeout(timer);
          reject(e);
        });
    });
  }

  private setState(
    name: string,
    status: RemotePluginState['status'],
    lastError?: string,
    mod?: RemoteModule,
  ): void {
    this.states.set(name, {
      name,
      status,
      lastError,
      loadedAt: mod?.loadedAt,
      module: mod,
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
