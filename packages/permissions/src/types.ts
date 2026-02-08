/**
 * Permission System Types
 * 
 * Type definitions aligned with @objectstack/spec security model.
 * See: https://protocol.objectstack.ai/docs/guides/security
 */

// ─── Action Types ──────────────────────────────────────────────────────────────

/**
 * CRUD permission actions
 */
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

/**
 * Extended permission actions (viewAll / modifyAll)
 */
export type ExtendedPermissionAction = PermissionAction | 'viewAll' | 'modifyAll';

// ─── Profile ───────────────────────────────────────────────────────────────────

/**
 * Profile — the baseline permission unit assigned to every user.
 * Maps to the `profile` system object.
 */
export interface Profile {
    /** Machine name (snake_case) */
    name: string;
    /** Display name */
    label: string;
    /** Description */
    description?: string;
    /** System profile — cannot be deleted */
    isSystem?: boolean;
    /** Active status */
    isActive?: boolean;
    /** License type */
    licenseType?: 'full' | 'read_only' | 'guest' | 'platform';
    /** Object-level permissions keyed by object name */
    objectPermissions?: Record<string, ObjectPermission>;
    /** Field-level permissions keyed by "objectName.fieldName" */
    fieldPermissions?: Record<string, FieldPermission>;
    /** Tab visibility — objectName -> visibility */
    tabVisibility?: Record<string, 'default' | 'available' | 'hidden'>;
    /** Application visibility — appName -> boolean */
    applicationVisibility?: Record<string, boolean>;
    /** System-level permissions */
    systemPermissions?: Record<string, boolean>;
    /** Login hour restrictions */
    loginHours?: LoginHourRestriction;
    /** Login IP ranges */
    loginIpRanges?: IpRange[];
}

/**
 * Login hour restriction
 */
export interface LoginHourRestriction {
    /** Timezone for the restriction */
    timezone?: string;
    /** Allowed windows keyed by day of week (0=Sunday..6=Saturday) */
    windows?: Record<number, { start: string; end: string }>;
}

/**
 * IP range for login restrictions
 */
export interface IpRange {
    startIp: string;
    endIp: string;
    description?: string;
}

// ─── Role (Hierarchy) ──────────────────────────────────────────────────────────

/**
 * Role — defines a node in the role hierarchy.
 * Users higher in the hierarchy can see records owned by subordinates.
 * Maps to the `role` system object.
 */
export interface Role {
    /** Machine name (snake_case) */
    name: string;
    /** Display name */
    label: string;
    /** Description */
    description?: string;
    /** Parent role name (null = top-level) */
    parentRole: string | null;
    /** Auto-computed materialized path */
    hierarchyPath?: string;
    /** Depth level (0 = root) */
    hierarchyLevel?: number;
    /** Active status */
    isActive?: boolean;
    /** Portal type */
    portalType?: 'none' | 'customer_portal' | 'partner_portal';
}

// ─── Permission Set ────────────────────────────────────────────────────────────

/**
 * PermissionSet — extends profile permissions.
 * A user can have zero or more permission sets.
 * Maps to the `permission_set` system object.
 */
export interface PermissionSet {
    /** Machine name (snake_case) */
    name: string;
    /** Display name */
    label?: string;
    /** Description */
    description?: string;
    /** System permission set — cannot be deleted */
    isSystem?: boolean;
    /** Active status */
    isActive?: boolean;
    /** Scoped to a specific profile (optional) */
    profileName?: string;
    /** Object-level permissions keyed by object name */
    objectPermissions?: Record<string, ObjectPermission>;
    /** Field-level permissions keyed by "objectName.fieldName" */
    fieldPermissions?: Record<string, FieldPermission>;
    /** System permissions */
    systemPermissions?: Record<string, boolean>;
    /** Application visibility overrides */
    applicationVisibility?: Record<string, boolean>;
    /** Tab visibility overrides */
    tabVisibility?: Record<string, 'default' | 'available' | 'hidden'>;
}

/**
 * Permission set assignment — links a PermissionSet to a User or Group.
 * Maps to the `permission_set_assignment` system object.
 */
export interface PermissionSetAssignment {
    /** Permission set name */
    permissionSetName: string;
    /** Assignee ID (user or group) */
    assigneeId: string;
    /** Assignee type */
    assigneeType: 'user' | 'group';
    /** Active status */
    isActive?: boolean;
    /** Assigned by (user ID) */
    assignedBy?: string;
    /** Assigned timestamp */
    assignedAt?: Date;
    /** Optional expiration */
    expiresAt?: Date | null;
}

// ─── Object Permission ─────────────────────────────────────────────────────────

/**
 * ObjectPermission — CRUD + viewAll/modifyAll on a single object.
 * Maps to the `object_permission` system object.
 */
export interface ObjectPermission {
    /** The API name of the object */
    objectName?: string;
    /** Create permission */
    create: boolean;
    /** Read permission */
    read: boolean;
    /** Update permission */
    update: boolean;
    /** Delete permission */
    delete: boolean;
    /** View ALL records regardless of ownership */
    viewAll?: boolean;
    /** Modify ALL records regardless of ownership */
    modifyAll?: boolean;
}

// ─── Field Permission ──────────────────────────────────────────────────────────

/**
 * FieldPermission — read/update on a single field.
 * Maps to the `field_permission` system object.
 * 
 *  read=false, update=false → Hidden
 *  read=true,  update=false → Read-Only
 *  read=true,  update=true  → Editable
 */
export interface FieldPermission {
    /** Object name */
    objectName?: string;
    /** Field name */
    fieldName?: string;
    /** Whether the field is visible */
    read: boolean;
    /** Whether the field is editable (requires read=true) */
    update: boolean;
}

// ─── Organization-Wide Defaults ────────────────────────────────────────────────

/**
 * Access level for organization-wide defaults
 */
export type OrgAccessLevel = 'private' | 'public_read_only' | 'public_read_write' | 'controlled_by_parent';

/**
 * OrganizationDefault — baseline record-level access for an object.
 * Maps to the `organization_default` system object.
 */
export interface OrganizationDefault {
    /** Object API name */
    objectName: string;
    /** Internal user access level */
    internalAccess: OrgAccessLevel;
    /** External (portal) user access level */
    externalAccess: OrgAccessLevel;
    /** Whether role hierarchy grants upward access */
    grantAccessUsingHierarchy?: boolean;
}

// ─── Sharing Rule ──────────────────────────────────────────────────────────────

/**
 * Sharing rule type
 */
export type SharingRuleType = 'owner_based' | 'criteria_based' | 'territory_based';

/**
 * Sharing rule access level
 */
export type SharingAccessLevel = 'read_only' | 'read_write';

/**
 * Sharing target type
 */
export type SharingTargetType = 'role' | 'role_and_subordinates' | 'group' | 'territory';

/**
 * SharingRule — extends access beyond the role hierarchy.
 * Maps to the `sharing_rule` system object.
 */
export interface SharingRule {
    /** Machine name */
    name: string;
    /** Display name */
    label: string;
    /** Description */
    description?: string;
    /** Object this rule applies to */
    objectName: string;
    /** Active status */
    isActive?: boolean;
    /** Rule type */
    type: SharingRuleType;
    /** Priority (lower = higher priority) */
    priority?: number;

    // Owner-based
    /** For owner-based rules: the type of owner group */
    ownedByType?: SharingTargetType;
    /** Owner values (role names / group IDs) */
    ownedByValues?: string[];

    // Criteria-based
    /** Filter criteria for criteria-based rules */
    criteria?: Record<string, any>;

    // Shared with
    /** Type of the target group */
    sharedWithType: SharingTargetType;
    /** Target values */
    sharedWithValues: string[];

    /** Access level granted */
    accessLevel: SharingAccessLevel;

    /** Cascade sharing to related objects */
    includeRelatedObjects?: Array<{
        objectName: string;
        accessLevel: SharingAccessLevel;
    }>;
}

// ─── RLS Configuration ─────────────────────────────────────────────────────────

/**
 * RLSConfig — record-level security configuration for a single object.
 * Combines Organization-Wide Defaults with Sharing Rules to determine
 * the effective record access for each user.
 */
export interface RLSConfig {
    /** Object API name */
    objectName: string;
    /** Organization-wide defaults for this object */
    orgDefault: OrganizationDefault;
    /** Sharing rules that extend access beyond the defaults */
    sharingRules: SharingRule[];
}

/**
 * RLS evaluation result — the outcome of evaluating all RLS layers for a user + object
 */
export interface RLSEvaluationResult {
    /** Whether the user has any record-level access */
    hasAccess: boolean;
    /** Effective access level */
    accessLevel: 'none' | 'owner_only' | 'read_only' | 'read_write' | 'full';
    /** Record-level filters to inject into queries */
    filters: Record<string, any>;
    /** Sharing rules that contributed to access */
    appliedRules: string[];
}

// ─── Permission Context (runtime) ──────────────────────────────────────────────

/**
 * User permission context — assembled at runtime for permission checks.
 */
export interface PermissionContext {
    /** User ID */
    userId: string;
    /** User's profile name */
    profileName: string;
    /** User's role name */
    roleName?: string;
    /** Names of all assigned permission sets */
    permissionSetNames?: string[];
    /** Additional metadata (e.g., team, department, territory) */
    metadata?: Record<string, any>;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
    /** Whether permission is granted */
    allowed: boolean;
    /** Reason if denied */
    reason?: string;
    /** Applied record-level filters */
    filters?: Record<string, any>;
}

// ─── Plugin Configuration ──────────────────────────────────────────────────────

/**
 * Permission plugin configuration
 */
export interface PermissionPluginConfig {
    /** Whether permission checking is enabled */
    enabled?: boolean;
    /** Default deny if no permission found */
    defaultDeny?: boolean;
    /** Permission definitions directory (YAML files) */
    permissionsDir?: string;
    /** Cache permission sets */
    cachePermissions?: boolean;
}

// ─── Kernel Compliance Types ───────────────────────────────────────────────────

/** Plugin health status */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/** Health check result for a single check */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  latency?: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/** Aggregate health report for a plugin */
export interface PluginHealthReport {
  pluginName: string;
  pluginVersion: string;
  status: HealthStatus;
  uptime: number;
  checks: HealthCheckResult[];
  timestamp: string;
}

/** Plugin capability declaration */
export interface PluginCapabilityManifest {
  services?: string[];
  emits?: string[];
  listens?: string[];
  routes?: string[];
  objects?: string[];
}

/** Plugin security manifest */
export interface PluginSecurityManifest {
  requiredPermissions?: string[];
  handlesSensitiveData?: boolean;
  makesExternalCalls?: boolean;
  allowedDomains?: string[];
  executesUserScripts?: boolean;
  sandboxConfig?: {
    timeout?: number;
    maxMemory?: number;
    allowedModules?: string[];
  };
}

/** Plugin startup result */
export interface PluginStartupResult {
  pluginName: string;
  success: boolean;
  duration: number;
  servicesRegistered: string[];
  warnings?: string[];
  errors?: string[];
}

/** Event bus configuration */
export interface EventBusConfig {
  persistence?: {
    enabled: boolean;
    storage?: 'memory' | 'redis' | 'sqlite';
    maxEvents?: number;
    ttl?: number;
  };
  retry?: {
    enabled: boolean;
    maxRetries?: number;
    backoffMs?: number;
    backoffMultiplier?: number;
  };
  deadLetterQueue?: {
    enabled: boolean;
    maxSize?: number;
    storage?: 'memory' | 'redis' | 'sqlite';
  };
  webhooks?: {
    enabled: boolean;
    endpoints?: Array<{
      url: string;
      events: string[];
      secret?: string;
      timeout?: number;
    }>;
  };
}
