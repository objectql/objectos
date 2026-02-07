/**
 * Permission Set Assignment Object
 *
 * Links permission sets to users. A user can have multiple permission sets.
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#permission-sets
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const PermissionSetAssignmentObject = ObjectSchema.create({
  name: 'permission_set_assignment',
  label: 'Permission Set Assignment',
  pluralLabel: 'Permission Set Assignments',
  icon: 'user-check',
  description: 'Links permission sets to users or groups. A user can have multiple permission sets.',
  isSystem: true,

  fields: {
    permission_set: Field.lookup('permission_set', {
      label: 'Permission Set',
      required: true,
      description: 'The permission set being assigned',
    }),

    assignee_id: Field.text({
      label: 'Assignee ID',
      required: true,
      index: true,
      description: 'User ID of the assignee',
    }),

    assignee_type: Field.select(
      [
        { label: 'User', value: 'user', default: true },
        { label: 'Group', value: 'group' },
      ],
      {
        label: 'Assignee Type',
        required: true,
      },
    ),

    is_active: Field.boolean({
      label: 'Active',
      defaultValue: true,
    }),

    assigned_by: Field.text({
      label: 'Assigned By',
      description: 'User ID of the admin who assigned this',
    }),

    assigned_at: Field.datetime({
      label: 'Assigned At',
    }),

    expires_at: Field.datetime({
      label: 'Expires At',
      description: 'Optional expiration date. Null means no expiration.',
    }),
  },

  indexes: [
    { fields: ['permission_set', 'assignee_id'], unique: true },
    { fields: ['assignee_id'], unique: false },
    { fields: ['permission_set'], unique: false },
    { fields: ['is_active'], unique: false },
  ],

  enable: {
    trackHistory: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'delete'] as const,
    trash: false,
  },

  validations: [
    {
      name: 'no_duplicate_assignment',
      type: 'unique',
      severity: 'error',
      message: 'This permission set is already assigned to this user',
      fields: ['permission_set', 'assignee_id'],
    },
  ],
});
