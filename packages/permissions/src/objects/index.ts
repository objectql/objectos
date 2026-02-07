/**
 * Permission System Object Definitions
 *
 * System-level objects that manage the ObjectOS security model:
 *
 *   ┌─────────────────────────────────────┐
 *   │   Profile / Permission Set          │ ← Object + Field permissions
 *   ├─────────────────────────────────────┤
 *   │   Role Hierarchy                    │ ← Record-level access (vertical)
 *   ├─────────────────────────────────────┤
 *   │   Organization-Wide Defaults        │ ← Baseline record access
 *   ├─────────────────────────────────────┤
 *   │   Sharing Rules                     │ ← Record-level access (horizontal)
 *   └─────────────────────────────────────┘
 *
 * @see https://protocol.objectstack.ai/docs/guides/security
 */

export { ProfileObject } from './profile.js';
export { PermissionSetObject } from './permission_set.js';
export { PermissionSetAssignmentObject } from './permission_set_assignment.js';
export { ObjectPermissionObject } from './object_permission.js';
export { FieldPermissionObject } from './field_permission.js';
export { RoleObject } from './role.js';
export { OrganizationDefaultObject } from './organization_default.js';
export { SharingRuleObject } from './sharing_rule.js';

// ── Convenience aggregate ──────────────────────────────────────────────────────

import { ProfileObject } from './profile.js';
import { PermissionSetObject } from './permission_set.js';
import { PermissionSetAssignmentObject } from './permission_set_assignment.js';
import { ObjectPermissionObject } from './object_permission.js';
import { FieldPermissionObject } from './field_permission.js';
import { RoleObject } from './role.js';
import { OrganizationDefaultObject } from './organization_default.js';
import { SharingRuleObject } from './sharing_rule.js';

/**
 * All permission-related system objects, ready for plugin registration.
 *
 * @example
 * ```ts
 * import { PermissionObjects } from '@objectos/permissions';
 * // Register with the kernel:
 * config.objects = PermissionObjects;
 * ```
 */
export const PermissionObjects = [
  ProfileObject,
  PermissionSetObject,
  PermissionSetAssignmentObject,
  ObjectPermissionObject,
  FieldPermissionObject,
  RoleObject,
  OrganizationDefaultObject,
  SharingRuleObject,
] as const;
