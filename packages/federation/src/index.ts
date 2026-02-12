// ---------------------------------------------------------------------------
// @objectos/federation — Public API
// ---------------------------------------------------------------------------

export { FederationPlugin } from './plugin.js';
export { FederationHostConfigurator } from './host-config.js';
export { RemoteLoader, DynamicImportResolver, MockModuleResolver } from './remote-loader.js';
export { SharedDependencyManager, isVersionCompatible } from './shared-deps.js';
export { HotReloadManager } from './hot-reload.js';
export type {
  FederationConfig,
  ResolvedFederationConfig,
  RemoteEntry,
  SharedDependency,
  RemoteModule,
  ModuleLoadResult,
  FederationHostConfig,
  SharedHostEntry,
  RemotePluginState,
  HotReloadEvent,
  ModuleResolver,
  PluginHealthReport,
  PluginCapability,
  PluginSecurityManifest,
} from './types.js';
export { resolveConfig, DEFAULT_FEDERATION_CONFIG } from './types.js';
