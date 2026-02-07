/**
 * Permission Set Object
 *
 * The unified permission container for ObjectOS.
 *
 * Aligned with @objectstack/spec Security.PermissionSetSchema:
 *   name, label, isProfile, objects (→ child object_permission), fields (→ child field_permission),
 *   systemPermissions, rowLevelSecurity
 *
 * In the spec, Profiles and Permission Sets are the same entity differentiated
 * by the `is_profile` flag:
 *   - Profile (is_profile=true): The ONE primary permission set per user.
 *   - Permission Set (is_profile=false): Add-on capabilities assigned to users.
 *
 * Object-level and field-level permissions are stored as child records in
 * `object_permission` and `field_permission` respectively.
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#permission-sets
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const PermissionSetObject = ObjectSchema.create({
  name: 'permission_set',
  label: 'Permission Set',
  pluralLabel: 'Permission Sets',
  icon: 'key',
  description: 'Unified permission container. Profiles (is_profile=true) and add-on sets (is_profile=false).',
  isSystem: true,

  fields: {
    // ── Identity (spec: name / label) ───────────────────────────────────────
    name: Field.text({
      label: 'Permission Set Name',
      required: true,
      unique: true,
      searchable: true,
      maxLength: 80,
      description: "Machine name (snake_case), e.g. 'sales_rep', 'advanced_reporting'",
    }),

    label: Field.text({
      label: 'Display Name',
      required: true,
      maxLength: 255,
    }),

    description: Field.textarea({
      label: 'Description',
      maxLength: 1000,
    }),

    // ── Profile flag (spec: isProfile) ──────────────────────────────────────
    is_profile: Field.boolean({
      label: 'Is Profile',
      defaultValue: false,
      description: 'When true, this permission set acts as a Profile (one per user)',
    }),

    is_system: Field.boolean({
      label: 'System',
      defaultValue: false,
      description: 'System permission sets cannot be deleted',
    }),

    is_active: Field.boolean({
      label: 'Active',
      defaultValue: true,
    }),

    // ── System permissions (spec: systemPermissions: string[]) ──────────────
    system_permissions: {
      type: 'json' as const,
      label: 'System Permissions',
      description: 'Array of system permission keys, e.g. ["manage_users", "export_reports", "bulk_api_enabled"]',
    },

    // ── Row-Level Security (spec: rowLevelSecurity) ─────────────────────────
    row_level_security: {
      type: 'json' as const,
      label: 'Row-Level Security',
      description: 'Array of RLS policies: [{ name, object, operation, using, check, roles, enabled, priority }]',
    },

    // ── ObjectOS extensions (not in spec) ───────────────────────────────────
    application_visibility: {
      type: 'json' as const,
      label: 'Application Visibility',
      description: 'Map of app_name -> boolean',
    },

    tab_visibility: {
      type: 'json' as const,
      label: 'Tab Visibility',
      description: "Map of tab_name -> 'default' | 'available' | 'hidden'",
    },

    license_type: Field.select(
      [
        { label: 'Full', value: 'full', default: true },
        { label: 'Read Only', value: 'read_only' },
        { label: 'Guest', value: 'guest' },
        { label: 'Platform', value: 'platform' },
      ],
      { label: 'License Type' },
    ),

    login_hours: {
      type: 'json' as const,
      label: 'Login Hour Restrictions',
      description: 'Restrict login by day/time window (profile-only)',
    },

    login_ip_ranges: {
      type: 'json' as const,
      label: 'Login IP Ranges',
      description: 'Array of { start_ip, end_ip } allowed ranges (profile-only)',
    },
  },

  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['is_profile'], unique: false },
    { fields: ['is_active'], unique: false },
  ],

  enable: {
    trackHistory: true,
    searchable: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'] as const,
    trash: true,
  },

  validations: [
    {
      name: 'name_snake_case',
      type: 'script',
      severity: 'error',
      message: 'Name must be snake_case (lowercase letters, numbers, underscores)',
      condition: '!/^[a-z][a-z0-9_]*$/.test(name)',
    },
  ],
});
