/**
 * Sharing Rule Object
 *
 * Sharing rules extend access beyond the role hierarchy.
 *
 * Aligned with @objectstack/spec Security.SharingRuleSchema:
 *   Discriminated union: OwnerSharingRuleSchema | CriteriaSharingRuleSchema
 *   - type: 'owner' | 'criteria'
 *   - SharingLevel: 'read' | 'edit' | 'full'
 *   - ShareRecipientType: 'user' | 'group' | 'role' | 'role_and_subordinates' | 'guest'
 *
 * Rule types:
 *   owner    → Share based on record owner's role/group
 *   criteria → Share records matching a condition expression
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#sharing-rules
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const SharingRuleObject = ObjectSchema.create({
  name: 'sharing_rule',
  label: 'Sharing Rule',
  pluralLabel: 'Sharing Rules',
  icon: 'share-2',
  description: 'Sharing rules extend access beyond the role hierarchy based on ownership or criteria.',
  isSystem: true,

  titleFormat: '{label}',
  compactLayout: ['name', 'object', 'type', 'access_level'],

  fields: {
    // ── Identity (spec: name / label / description) ─────────────────────────
    name: Field.text({
      label: 'Rule Name',
      required: true,
      unique: true,
      searchable: true,
      maxLength: 80,
    }),

    label: Field.text({
      label: 'Display Name',
      maxLength: 255,
    }),

    description: Field.textarea({
      label: 'Description',
      maxLength: 1000,
    }),

    // ── Target object (spec: object) ────────────────────────────────────────
    object: Field.text({
      label: 'Object',
      required: true,
      index: true,
      maxLength: 80,
      description: 'The API name of the object this rule applies to',
    }),

    // ── Active flag (spec: active) ──────────────────────────────────────────
    active: Field.boolean({
      label: 'Active',
      defaultValue: true,
    }),

    // ── Rule type (spec: type: 'owner' | 'criteria') ────────────────────────
    type: Field.select(
      [
        { label: 'Owner', value: 'owner' },
        { label: 'Criteria', value: 'criteria' },
      ],
      {
        label: 'Rule Type',
        required: true,
      },
    ),

    // ── Owner-Based: who owns the records (spec: ownedBy: { type, value }) ──
    owned_by_type: Field.select(
      [
        { label: 'User', value: 'user' },
        { label: 'Group', value: 'group' },
        { label: 'Role', value: 'role' },
        { label: 'Role and Subordinates', value: 'role_and_subordinates' },
        { label: 'Guest', value: 'guest' },
      ],
      {
        label: 'Owned By Type',
        description: 'For owner-based rules: the recipient type of the record owner',
      },
    ),

    owned_by_value: Field.text({
      label: 'Owned By Value',
      description: 'The role name, group ID, or user ID of the owner group',
    }),

    // ── Criteria-Based: condition expression (spec: condition) ───────────────
    condition: Field.text({
      label: 'Condition',
      description: "Expression for criteria-based rules, e.g. \"type = 'customer' AND is_active = true\"",
    }),

    // ── Shared With (spec: sharedWith: { type, value }) ─────────────────────
    shared_with_type: Field.select(
      [
        { label: 'User', value: 'user' },
        { label: 'Group', value: 'group' },
        { label: 'Role', value: 'role' },
        { label: 'Role and Subordinates', value: 'role_and_subordinates' },
        { label: 'Guest', value: 'guest' },
      ],
      {
        label: 'Shared With Type',
        required: true,
      },
    ),

    shared_with_value: Field.text({
      label: 'Shared With Value',
      required: true,
      description: 'The role name, group ID, or user ID to share with',
    }),

    // ── Access level (spec: accessLevel: 'read' | 'edit' | 'full') ──────────
    access_level: Field.select(
      [
        { label: 'Read', value: 'read', default: true },
        { label: 'Edit', value: 'edit' },
        { label: 'Full', value: 'full' },
      ],
      {
        label: 'Access Level',
        required: true,
      },
    ),

    // ── ObjectOS extensions (not in spec) ───────────────────────────────────
    include_related_objects: {
      type: 'json' as const,
      label: 'Include Related Objects',
      description: 'Array of { object, access_level } to cascade sharing to child objects',
    },

    priority: Field.number({
      label: 'Priority',
      defaultValue: 0,
      description: 'Lower number = higher priority',
    }),
  },

  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['object'], unique: false },
    { fields: ['type'], unique: false },
    { fields: ['active'], unique: false },
    { fields: ['object', 'active'], unique: false },
  ],

  enable: {
    trackHistory: true,
    searchable: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'] as const,
    trash: true,
  },
});
