/**
 * Sharing Rule Object
 *
 * Sharing rules extend access beyond the role hierarchy.
 * They can share records based on ownership, field criteria, or geographic territory.
 *
 * Rule types:
 *   owner_based     → Share based on record owner's role/group
 *   criteria_based  → Share records matching field criteria
 *   territory_based → Share based on geographic territory
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#sharing-rules
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const SharingRuleObject = ObjectSchema.create({
  name: 'sharing_rule',
  label: 'Sharing Rule',
  pluralLabel: 'Sharing Rules',
  icon: 'share-2',
  description: 'Sharing rules extend access beyond the role hierarchy based on ownership, criteria, or territory.',
  isSystem: true,

  titleFormat: '{label}',
  compactLayout: ['name', 'object_name', 'type', 'access_level'],

  fields: {
    name: Field.text({
      label: 'Rule Name',
      required: true,
      unique: true,
      searchable: true,
      maxLength: 80,
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

    object_name: Field.text({
      label: 'Object Name',
      required: true,
      index: true,
      maxLength: 80,
      description: 'The API name of the object this rule applies to',
    }),

    is_active: Field.boolean({
      label: 'Active',
      defaultValue: true,
    }),

    // ── Rule type ───────────────────────────────────────────────────────────
    type: Field.select(
      [
        { label: 'Owner-Based', value: 'owner_based' },
        { label: 'Criteria-Based', value: 'criteria_based' },
        { label: 'Territory-Based', value: 'territory_based' },
      ],
      {
        label: 'Rule Type',
        required: true,
      },
    ),

    // ── Owner-Based fields ──────────────────────────────────────────────────
    owned_by_type: Field.select(
      [
        { label: 'Role', value: 'role' },
        { label: 'Role and Subordinates', value: 'role_and_subordinates' },
        { label: 'Group', value: 'group' },
      ],
      {
        label: 'Owned By Type',
        description: 'For owner-based rules: the type of owner group',
      },
    ),

    owned_by_values: {
      type: 'json' as const,
      label: 'Owned By Values',
      description: "Array of role names or group IDs, e.g. ['sales_rep']",
    },

    // ── Criteria-Based fields ───────────────────────────────────────────────
    criteria: {
      type: 'json' as const,
      label: 'Criteria',
      description: "Filter criteria for criteria-based rules, e.g. { type: { $eq: 'customer' }, is_active: { $eq: true } }",
    },

    // ── Shared With ─────────────────────────────────────────────────────────
    shared_with_type: Field.select(
      [
        { label: 'Role', value: 'role' },
        { label: 'Role and Subordinates', value: 'role_and_subordinates' },
        { label: 'Group', value: 'group' },
        { label: 'Territory', value: 'territory' },
      ],
      {
        label: 'Shared With Type',
        required: true,
      },
    ),

    shared_with_values: {
      type: 'json' as const,
      label: 'Shared With Values',
      description: 'Array of role names, group IDs, or territory names',
    },

    // ── Access level ────────────────────────────────────────────────────────
    access_level: Field.select(
      [
        { label: 'Read Only', value: 'read_only', default: true },
        { label: 'Read/Write', value: 'read_write' },
      ],
      {
        label: 'Access Level',
        required: true,
      },
    ),

    // ── Cascade sharing ─────────────────────────────────────────────────────
    include_related_objects: {
      type: 'json' as const,
      label: 'Include Related Objects',
      description: 'Array of { object_name, access_level } to cascade sharing to child objects',
    },

    priority: Field.number({
      label: 'Priority',
      defaultValue: 0,
      description: 'Lower number = higher priority',
    }),
  },

  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['object_name'], unique: false },
    { fields: ['type'], unique: false },
    { fields: ['is_active'], unique: false },
    { fields: ['object_name', 'is_active'], unique: false },
  ],

  enable: {
    trackHistory: true,
    searchable: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'] as const,
    trash: true,
  },
});
