/**
 * Object Permission Object
 *
 * Defines CRUD + viewAll/modifyAll permissions for an object,
 * scoped to a specific profile or permission set.
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#profiles
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const ObjectPermissionObject = ObjectSchema.create({
  name: 'object_permission',
  label: 'Object Permission',
  pluralLabel: 'Object Permissions',
  icon: 'lock',
  description: 'Defines CRUD + viewAll/modifyAll permissions for an object, scoped to a profile or permission set.',
  isSystem: true,

  fields: {
    // ── Parent context ──────────────────────────────────────────────────────
    parent_type: Field.select(
      [
        { label: 'Profile', value: 'profile' },
        { label: 'Permission Set', value: 'permission_set' },
      ],
      {
        label: 'Parent Type',
        required: true,
        description: 'Whether this permission belongs to a Profile or Permission Set',
      },
    ),

    parent_id: Field.text({
      label: 'Parent ID',
      required: true,
      index: true,
      description: 'ID of the parent Profile or Permission Set',
    }),

    // ── Target object ───────────────────────────────────────────────────────
    object_name: Field.text({
      label: 'Object Name',
      required: true,
      index: true,
      maxLength: 80,
      description: "The API name of the object, e.g. 'account', 'opportunity'",
    }),

    // ── CRUD permissions ────────────────────────────────────────────────────
    allow_create: Field.boolean({
      label: 'Create',
      defaultValue: false,
    }),

    allow_read: Field.boolean({
      label: 'Read',
      defaultValue: false,
    }),

    allow_update: Field.boolean({
      label: 'Update',
      defaultValue: false,
    }),

    allow_delete: Field.boolean({
      label: 'Delete',
      defaultValue: false,
    }),

    // ── Extended permissions ────────────────────────────────────────────────
    view_all: Field.boolean({
      label: 'View All Records',
      defaultValue: false,
      description: 'See all records regardless of ownership or sharing rules',
    }),

    modify_all: Field.boolean({
      label: 'Modify All Records',
      defaultValue: false,
      description: 'Edit/delete all records regardless of ownership or sharing rules',
    }),
  },

  indexes: [
    { fields: ['parent_type', 'parent_id', 'object_name'], unique: true },
    { fields: ['object_name'], unique: false },
    { fields: ['parent_id'], unique: false },
  ],

  enable: {
    trackHistory: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'] as const,
    trash: false,
  },

  validations: [
    {
      name: 'modify_all_requires_view_all',
      type: 'script',
      severity: 'error',
      message: 'Modify All requires View All to be enabled',
      condition: 'modify_all === true && view_all !== true',
    },
    {
      name: 'view_all_requires_read',
      type: 'script',
      severity: 'error',
      message: 'View All requires Read permission to be enabled',
      condition: 'view_all === true && allow_read !== true',
    },
    {
      name: 'modify_all_requires_update',
      type: 'script',
      severity: 'error',
      message: 'Modify All requires Update permission to be enabled',
      condition: 'modify_all === true && allow_update !== true',
    },
  ],
});
