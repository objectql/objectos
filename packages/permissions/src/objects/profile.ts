/**
 * Profile Object — DEPRECATED
 *
 * In @objectstack/spec, a Profile is a PermissionSet with `isProfile: true`.
 * This object is kept as a **view alias** for backward compatibility, but all
 * new code should use `permission_set` with `is_profile=true`.
 *
 * The `permission_set` object now includes all profile-specific fields:
 *   - login_hours, login_ip_ranges, license_type, application_visibility, tab_visibility
 *
 * @deprecated Use `permission_set` with `is_profile: true` instead.
 * @see https://protocol.objectstack.ai/docs/guides/security#profiles
 */
import { PermissionSetObject } from './permission_set.js';

/**
 * @deprecated Use PermissionSetObject with is_profile=true.
 */
export const ProfileObject = PermissionSetObject;
