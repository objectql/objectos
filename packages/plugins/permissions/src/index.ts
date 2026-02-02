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
