/**
 * Object Permission Object
 *
 * Defines CRUD + lifecycle + viewAll/modifyAll permissions for an object,
 * scoped to a permission set (or profile, which is a permission set with is_profile=true).
 *
 * Aligned with @objectstack/spec Security.ObjectPermissionSchema:
 *   allowCreate, allowRead, allowEdit, allowDelete,
 *   allowTransfer, allowRestore, allowPurge,
 *   viewAllRecords, modifyAllRecords
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#profiles
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const ObjectPermissionObject = ObjectSchema.create({
  name: 'object_permission',
  label: 'Object Permission',
  pluralLabel: 'Object Permissions',
  icon: 'lock',
  description: 'Defines CRUD + lifecycle + viewAll/modifyAll permissions for an object, scoped to a permission set.',
  isSystem: true,

  fields: {
    // ── Parent context ──────────────────────────────────────────────────────
    permission_set: Field.lookup('permission_set', {
      label: 'Permission Set',
      required: true,
      description: 'The parent permission set (profile or add-on)',
    }),

    // ── Target object ───────────────────────────────────────────────────────
    object_name: Field.text({
      label: 'Object Name',
      required: true,
      index: true,
      maxLength: 80,
      description: "The API name of the object, e.g. 'account', 'opportunity'",
    }),

    // ── CRUD permissions (spec: allowCreate / allowRead / allowEdit / allowDelete)
    allow_create: Field.boolean({
      label: 'Create',
      defaultValue: false,
    }),

    allow_read: Field.boolean({
      label: 'Read',
      defaultValue: false,
    }),

    allow_edit: Field.boolean({
      label: 'Edit',
      defaultValue: false,
      description: 'Edit owned records or shared records',
    }),

    allow_delete: Field.boolean({
      label: 'Delete',
      defaultValue: false,
    }),

    // ── Lifecycle permissions (spec: allowTransfer / allowRestore / allowPurge)
    allow_transfer: Field.boolean({
      label: 'Transfer',
      defaultValue: false,
      description: 'Transfer record ownership to another user',
    }),

    allow_restore: Field.boolean({
      label: 'Restore',
      defaultValue: false,
      description: 'Restore soft-deleted records from trash',
    }),

    allow_purge: Field.boolean({
      label: 'Purge',
      defaultValue: false,
      description: 'Permanently delete records (hard delete)',
    }),

    // ── Extended permissions (spec: viewAllRecords / modifyAllRecords) ──────
    view_all_records: Field.boolean({
      label: 'View All Records',
      defaultValue: false,
      description: 'Super-user read access. Bypasses sharing rules and ownership checks.',
    }),

    modify_all_records: Field.boolean({
      label: 'Modify All Records',
      defaultValue: false,
      description: 'Super-user write access. Bypasses sharing rules and ownership checks.',
    }),
  },

  indexes: [
    { fields: ['permission_set', 'object_name'], unique: true },
    { fields: ['object_name'], unique: false },
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
      name: 'modify_all_requires_view_all',
      type: 'script',
      severity: 'error',
      message: 'Modify All Records requires View All Records to be enabled',
      condition: 'modify_all_records === true && view_all_records !== true',
    },
    {
      name: 'view_all_requires_read',
      type: 'script',
      severity: 'error',
      message: 'View All Records requires Read permission to be enabled',
      condition: 'view_all_records === true && allow_read !== true',
    },
    {
      name: 'modify_all_requires_edit',
      type: 'script',
      severity: 'error',
      message: 'Modify All Records requires Edit permission to be enabled',
      condition: 'modify_all_records === true && allow_edit !== true',
    },
  ],
});
