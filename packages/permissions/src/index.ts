/**
 * @objectos/plugin-permissions
 * 
 * Permission and authorization plugin for ObjectOS
 * 
 * Features:
 * - Object-level permissions (CRUD)
 * - Field-level security
 * - Record-level security (RLS)
 * - Profile-based permissions
 * - Declarative YAML configuration
 * 
 * @example
 * ```typescript
 * import { createPermissionsPlugin } from '@objectos/plugin-permissions';
 * 
 * const permissionsPlugin = createPermissionsPlugin({
 *   enabled: true,
 *   defaultDeny: true,
 *   permissionsDir: './permissions',
 * });
 * ```
 */

// Export types
export type {
    PermissionAction,
    ActionPermission,
    ObjectPermissions,
    FieldPermission,
    PermissionSet,
    PermissionContext,
    PermissionCheckResult,
    PermissionPluginConfig,
} from './types';

// Export plugin
export {
    PermissionsPlugin,
    createPermissionsPlugin,
    getPermissionsAPI,
} from './plugin';

// Export engine
export {
    PermissionEngine,
} from './engine';
export type {
    PermissionEngineConfig,
} from './engine';

// Export storage
export {
    InMemoryPermissionStorage,
} from './storage';
export type {
    PermissionStorage,
} from './storage';

// Export loader
export {
    loadPermissionSetsFromDirectory,
    loadPermissionSetFromFile,
    loadPermissionSetFromYAML,
} from './loader';
