/**
 * Profile Object
 *
 * Profiles define a user's baseline permissions.
 * Each user is assigned exactly one profile.
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#profiles
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const ProfileObject = ObjectSchema.create({
  name: 'profile',
  label: 'Profile',
  pluralLabel: 'Profiles',
  icon: 'shield',
  description: 'Profiles define a user\'s baseline permissions. Each user is assigned exactly one profile.',
  isSystem: true,

  fields: {
    name: Field.text({
      label: 'Profile Name',
      required: true,
      unique: true,
      searchable: true,
      maxLength: 80,
      description: "Machine name (snake_case), e.g. 'sales_rep', 'system_admin'",
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
      label: 'System Profile',
      defaultValue: false,
      description: 'System profiles cannot be deleted (e.g. system_admin, standard_user)',
    }),

    is_active: Field.boolean({
      label: 'Active',
      defaultValue: true,
    }),

    license_type: Field.select(
      [
        { label: 'Full', value: 'full', default: true },
        { label: 'Read Only', value: 'read_only' },
        { label: 'Guest', value: 'guest' },
        { label: 'Platform', value: 'platform' },
      ],
      { label: 'License Type' },
    ),

    application_visibility: {
      type: 'json' as const,
      label: 'Application Visibility',
      description: "Map of app_name -> boolean",
    },

    tab_visibility: {
      type: 'json' as const,
      label: 'Tab Visibility',
      description: "Map of tab_name -> 'default' | 'available' | 'hidden'",
    },

    system_permissions: {
      type: 'json' as const,
      label: 'System Permissions',
      description: 'e.g. { manage_users: true, view_setup: true, modify_all_data: false }',
    },

    login_hours: {
      type: 'json' as const,
      label: 'Login Hour Restrictions',
      description: 'Restrict login by day/time window',
    },

    login_ip_ranges: {
      type: 'json' as const,
      label: 'Login IP Ranges',
      description: 'Array of { start_ip, end_ip } allowed ranges',
    },
  },

  indexes: [
    { fields: ['name'], unique: true },
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
      message: 'Profile name must be snake_case (lowercase letters, numbers, underscores)',
      condition: '!/^[a-z][a-z0-9_]*$/.test(name)',
    },
  ],
});
