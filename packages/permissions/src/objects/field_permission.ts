/**
 * Field Permission Object
 *
 * Controls visibility and editability of specific fields,
 * scoped to a specific profile or permission set.
 *
 * Permission matrix:
 *   read=false, update=false → Hidden
 *   read=true,  update=false → Read-Only
 *   read=true,  update=true  → Editable
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#field-level-security
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const FieldPermissionObject = ObjectSchema.create({
  name: 'field_permission',
  label: 'Field Permission',
  pluralLabel: 'Field Permissions',
  icon: 'columns',
  description: 'Controls visibility and editability of specific fields, scoped to a profile or permission set.',
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
      },
    ),

    parent_id: Field.text({
      label: 'Parent ID',
      required: true,
      index: true,
      description: 'ID of the parent Profile or Permission Set',
    }),

    // ── Target field ────────────────────────────────────────────────────────
    object_name: Field.text({
      label: 'Object Name',
      required: true,
      index: true,
      maxLength: 80,
    }),

    field_name: Field.text({
      label: 'Field Name',
      required: true,
      maxLength: 80,
      description: "The API name of the field, e.g. 'annual_revenue'",
    }),

    // ── Permission levels ───────────────────────────────────────────────────
    readable: Field.boolean({
      label: 'Readable',
      defaultValue: true,
      description: 'Whether the field is visible',
    }),

    updatable: Field.boolean({
      label: 'Updatable',
      defaultValue: false,
      description: 'Whether the field is editable (requires readable=true)',
    }),
  },

  indexes: [
    { fields: ['parent_type', 'parent_id', 'object_name', 'field_name'], unique: true },
    { fields: ['object_name', 'field_name'], unique: false },
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
      name: 'updatable_requires_readable',
      type: 'script',
      severity: 'error',
      message: 'Updatable requires Readable to be enabled',
      condition: 'updatable === true && readable !== true',
    },
  ],
});
