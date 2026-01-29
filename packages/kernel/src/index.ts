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

// API Protocol components
export * from './api';

// Permission System
export { PermissionManager, PermissionManagerConfig } from './permissions';
export { PermissionSetLoader, PermissionSetLoaderConfig } from './permissions/permission-set-loader';
export { ObjectPermissionChecker } from './permissions/object-permissions';
export { FieldPermissionChecker } from './permissions/field-permissions';
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


