/**
 * Permission Set Object
 *
 * Permission sets extend profile permissions without changing the profile.
 * A user can have multiple permission sets assigned.
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#permission-sets
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const PermissionSetObject = ObjectSchema.create({
  name: 'permission_set',
  label: 'Permission Set',
  pluralLabel: 'Permission Sets',
  icon: 'key',
  description: 'Permission sets extend profile permissions without changing the profile. A user can have multiple permission sets assigned.',
  isSystem: true,

  fields: {
    name: Field.text({
      label: 'Permission Set Name',
      required: true,
      unique: true,
      searchable: true,
      maxLength: 80,
      description: "Machine name (snake_case), e.g. 'advanced_reporting'",
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

    is_system: Field.boolean({
      label: 'System Permission Set',
      defaultValue: false,
      description: 'System permission sets cannot be deleted',
    }),

    is_active: Field.boolean({
      label: 'Active',
      defaultValue: true,
    }),

    profile: Field.lookup('profile', {
      label: 'Profile',
      description: 'If set, this permission set is only available for users with this profile',
    }),

    system_permissions: {
      type: 'json' as const,
      label: 'System Permissions',
      description: 'e.g. { run_reports: true, export_reports: true, bulk_api_enabled: true }',
    },

    application_visibility: {
      type: 'json' as const,
      label: 'Application Visibility',
    },

    tab_visibility: {
      type: 'json' as const,
      label: 'Tab Visibility',
    },

    license_type: Field.select(
      [
        { label: 'Full', value: 'full', default: true },
        { label: 'Read Only', value: 'read_only' },
        { label: 'Platform', value: 'platform' },
      ],
      { label: 'Required License' },
    ),
  },

  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['is_active'], unique: false },
    { fields: ['profile'], unique: false },
  ],

  enable: {
    trackHistory: true,
    searchable: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'] as const,
    trash: true,
  },
});
