/**
 * Field Permission Object
 *
 * Controls visibility and editability of specific fields,
 * scoped to a permission set (or profile).
 *
 * Aligned with @objectstack/spec Security.FieldPermissionSchema:
 *   readable, editable
 *
 * Permission matrix:
 *   readable=false, editable=false → Hidden
 *   readable=true,  editable=false → Read-Only
 *   readable=true,  editable=true  → Editable
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#field-level-security
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';
import type { ServiceObject } from '@objectstack/spec/data';

export const FieldPermissionObject: ServiceObject = ObjectSchema.create({
  name: 'field_permission',
  label: 'Field Permission',
  pluralLabel: 'Field Permissions',
  icon: 'columns',
  description:
    'Controls visibility and editability of specific fields, scoped to a permission set.',
  isSystem: true,

  fields: {
    // ── Parent context ──────────────────────────────────────────────────────
    permission_set: Field.lookup('permission_set', {
      label: 'Permission Set',
      required: true,
      description: 'The parent permission set (profile or add-on)',
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

    // ── Permission levels (spec: readable / editable) ───────────────────────
    readable: Field.boolean({
      label: 'Readable',
      defaultValue: true,
      description: 'Whether the field is visible',
    }),

    editable: Field.boolean({
      label: 'Editable',
      defaultValue: false,
      description: 'Whether the field is editable (requires readable=true)',
    }),
  },

  indexes: [
    { fields: ['permission_set', 'object_name', 'field_name'], unique: true },
    { fields: ['object_name', 'field_name'], unique: false },
    { fields: ['permission_set'], unique: false },
  ],

  enable: {
    trackHistory: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'] as const,
    trash: false,
  },

  validations: [
    {
      name: 'editable_requires_readable',
      type: 'script',
      severity: 'error',
      message: 'Editable requires Readable to be enabled',
      condition: 'editable === true && readable !== true',
    },
  ],
});
