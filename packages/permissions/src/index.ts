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
    // Actions
    PermissionAction,
    ExtendedPermissionAction,
    // Profile
    Profile,
    LoginHourRestriction,
    IpRange,
    // Role
    Role,
    // Permission Set
    PermissionSet,
    PermissionSetAssignment,
    // Object & Field Permissions
    ObjectPermission,
    FieldPermission,
    // Organization-Wide Defaults
    OrgAccessLevel,
    OrganizationDefault,
    // Sharing Rules
    SharingRuleType,
    SharingAccessLevel,
    SharingTargetType,
    SharingRule,
    // RLS
    RLSConfig,
    RLSEvaluationResult,
    // Runtime
    PermissionContext,
    PermissionCheckResult,
    // Multi-tenancy
    TenantContext,
    // Plugin Config
    PermissionPluginConfig,
} from './types.js';

// Export plugin
export {
    PermissionsPlugin,
    createPermissionsPlugin,
    getPermissionsAPI,
} from './plugin.js';

// Export engine
export {
    PermissionEngine,
} from './engine.js';
export type {
    PermissionEngineConfig,
} from './engine.js';

// Export sharing rules engine
export {
    SharingRuleEngine,
} from './sharing-rules.js';
export type {
    SharingRuleResult,
} from './sharing-rules.js';

// Export RLS evaluator
export {
    RLSEvaluator,
} from './rls-evaluator.js';

// Export storage
export {
    InMemoryPermissionStorage,
    ObjectQLPermissionStorage,
} from './storage.js';
export type {
    PermissionStorage,
} from './storage.js';

// Export loader
export {
    loadPermissionSetsFromDirectory,
    loadPermissionSetFromFile,
    loadPermissionSetFromYAML,
} from './loader.js';

// Export system object definitions
export {
    PermissionSetObject,
    PermissionSetAssignmentObject,
    ObjectPermissionObject,
    FieldPermissionObject,
    RoleObject,
    OrganizationDefaultObject,
    SharingRuleObject,
    PermissionObjects,
} from './objects/index.js';
