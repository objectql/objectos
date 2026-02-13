/**
 * Permission System Object Definitions
 *
 * System-level objects that manage the ObjectOS security model,
 * aligned with @objectstack/spec Security module.
 *
 * Spec alignment:
 *   Security.PermissionSetSchema   → permission_set (is_profile flag unifies Profile + PermissionSet)
 *   Security.ObjectPermissionSchema → object_permission (child of permission_set)
 *   Security.FieldPermissionSchema  → field_permission (child of permission_set)
 *   Security.RoleSchema             → role (hierarchy)
 *   Security.SharingRuleSchema      → sharing_rule (owner / criteria)
 *
 *   ┌─────────────────────────────────────┐
 *   │   Permission Set (is_profile flag)  │ ← Object + Field permissions
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

export { PermissionSetObject } from './permission_set.js';
export { PermissionSetAssignmentObject } from './permission_set_assignment.js';
export { ObjectPermissionObject } from './object_permission.js';
export { FieldPermissionObject } from './field_permission.js';
export { RoleObject } from './role.js';
export { OrganizationDefaultObject } from './organization_default.js';
export { SharingRuleObject } from './sharing_rule.js';

// ── Convenience aggregate ──────────────────────────────────────────────────────

import type { ServiceObject } from '@objectstack/spec/data';
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
export const PermissionObjects: readonly ServiceObject[] = [
  PermissionSetObject,
  PermissionSetAssignmentObject,
  ObjectPermissionObject,
  FieldPermissionObject,
  RoleObject,
  OrganizationDefaultObject,
  SharingRuleObject,
] as const;
