// Main exports
export * from './objectos';
export { ObjectOSPlugin } from './plugins/objectql';

// Kernel components
export { KernelContextManager, createKernelContext } from './kernel-context';
export { StorageManager, InMemoryScopedStorage } from './scoped-storage';
export type { ScopedStorage } from './scoped-storage';
export { PluginManager } from './plugin-manager';
export type { PluginEntry, PluginLifecycleHook } from './plugin-manager';
export { PluginContextBuilder } from './plugin-context';
export { ConsoleLogger, createLogger } from './logger';
export type { Logger, LogLevel, LogEntry } from './logger';

// Dependency & Validation
export { DependencyResolver, DependencyError } from './dependency-resolver';
export type { DependencyResolutionResult } from './dependency-resolver';
export { ManifestValidator, validateManifest } from './manifest-validator';
export type { ValidationResult, ValidationError } from './manifest-validator';

// Hot Reload & Versioning
export { HotReloadManager } from './hot-reload';
export type { HotReloadOptions, HotReloadResult } from './hot-reload';
export { VersionManager, compareVersions, satisfiesVersion, areVersionsCompatible } from './version-manager';
export type { VersionInfo, VersionConstraint, VersionComparison, MigrationFunction } from './version-manager';
export { ErrorHandler, StructuredError, ErrorSeverity, ErrorCategory, RecoveryStrategy } from './error-handler';
export type { ErrorInfo, ErrorHandlerOptions } from './error-handler';

// Performance & Observability
export { MetricsManager, PerformanceTimer, MetricType } from './metrics';
export type { MetricDataPoint, MetricSummary, PluginMetrics } from './metrics';
export { OptimizedRegistry } from './optimized-registry';
export type { ServiceMetadata, ServiceQueryOptions } from './optimized-registry';

// API Protocol components
export * from './api';

// Permission System
export { PermissionManager, PermissionManagerConfig } from './permissions';
export { PermissionSetLoader, PermissionSetLoaderConfig } from './permissions/permission-set-loader';
export { ObjectPermissionChecker } from './permissions/object-permissions';
export { FieldPermissionChecker, FieldFilter } from './permissions/field-permissions';
export { PermissionAwareCRUD, ForbiddenError, createPermissionAwareCRUD } from './permissions/permission-aware-crud';
export type { 
    User, 
    PermissionContext, 
    PermissionCheckResult,
    PermissionSet,
    ObjectPermission,
    FieldPermission 
} from './permissions/types';

// Re-export specific types to avoid conflicts
export { 
    AppConfig, 
    AppMenuSection, 
    AppMenuItem, 
    isAppMenuSection,
    ChartConfig,
    PageConfig,
    PageComponent
} from './types';


