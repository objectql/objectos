/**
 * Role Object
 *
 * Roles control record-level access through a hierarchy.
 * Users higher in the hierarchy can see records owned by their subordinates.
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#role-hierarchy
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';

export const RoleObject = ObjectSchema.create({
  name: 'role',
  label: 'Role',
  pluralLabel: 'Roles',
  icon: 'sitemap',
  description: 'Roles control record-level access through a hierarchy. Users higher in the hierarchy can see records owned by subordinates.',
  isSystem: true,

  titleFormat: '{label}',
  compactLayout: ['name', 'label', 'parent_role'],

  fields: {
    name: Field.text({
      label: 'Role Name',
      required: true,
      unique: true,
      searchable: true,
      maxLength: 80,
      description: "Machine name (snake_case), e.g. 'sales_manager', 'executive'",
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

    parent_role: Field.lookup('role', {
      label: 'Parent Role',
      description: 'Parent role in the hierarchy. Null for top-level roles.',
    }),

    hierarchy_path: Field.text({
      label: 'Hierarchy Path',
      readonly: true,
      description: "Auto-computed materialized path, e.g. '/executive/sales_director/sales_manager'",
    }),

    hierarchy_level: Field.number({
      label: 'Hierarchy Level',
      readonly: true,
      defaultValue: 0,
      description: 'Depth in the hierarchy tree (0 = root)',
    }),

    is_active: Field.boolean({
      label: 'Active',
      defaultValue: true,
    }),

    may_forecast_manager: Field.boolean({
      label: 'May Forecast Manager',
      defaultValue: false,
      description: 'Allow this role to manage forecasts for subordinates',
    }),

    portal_type: Field.select(
      [
        { label: 'None', value: 'none', default: true },
        { label: 'Customer Portal', value: 'customer_portal' },
        { label: 'Partner Portal', value: 'partner_portal' },
      ],
      { label: 'Portal Type' },
    ),
  },

  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['parent_role'], unique: false },
    { fields: ['hierarchy_path'], unique: false },
    { fields: ['is_active'], unique: false },
  ],

  enable: {
    trackHistory: true,
    searchable: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'] as const,
    trash: true,
  },
});
