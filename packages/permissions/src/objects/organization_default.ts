/**
 * Organization-Wide Default (OWD) Object
 *
 * Sets baseline record-level access for each object across the organization.
 * Sharing rules can only OPEN UP access beyond the OWD, never restrict it.
 *
 * Access levels:
 *   private             → Owner only (+ role hierarchy)
 *   public_read_only    → All internal users can read
 *   public_read_write   → All internal users can read and edit
 *   controlled_by_parent → Access controlled by parent object's sharing
 *
 * @see https://protocol.objectstack.ai/docs/guides/security#sharing-rules
 */
import { ObjectSchema, Field } from '@objectstack/spec/data';
import type { ServiceObject } from '@objectstack/spec/data';

export const OrganizationDefaultObject: ServiceObject = ObjectSchema.create({
  name: 'organization_default',
  label: 'Organization-Wide Default',
  pluralLabel: 'Organization-Wide Defaults',
  icon: 'globe',
  description: 'Sets baseline record-level access for each object across the organization.',
  isSystem: true,

  fields: {
    object_name: Field.text({
      label: 'Object Name',
      required: true,
      unique: true,
      index: true,
      maxLength: 80,
      description: "The API name of the object, e.g. 'account', 'opportunity'",
    }),

    internal_access: Field.select(
      [
        { label: 'Private', value: 'private', default: true },
        { label: 'Public Read Only', value: 'public_read_only' },
        { label: 'Public Read/Write', value: 'public_read_write' },
        { label: 'Controlled By Parent', value: 'controlled_by_parent' },
      ],
      {
        label: 'Internal Access',
        required: true,
        description: 'Baseline access level for internal users',
      },
    ),

    external_access: Field.select(
      [
        { label: 'Private', value: 'private', default: true },
        { label: 'Public Read Only', value: 'public_read_only' },
        { label: 'Public Read/Write', value: 'public_read_write' },
        { label: 'Controlled By Parent', value: 'controlled_by_parent' },
      ],
      {
        label: 'External Access',
        required: true,
        description: 'Baseline access level for portal/community users',
      },
    ),

    grant_access_using_hierarchy: Field.boolean({
      label: 'Grant Access Using Role Hierarchy',
      defaultValue: true,
      description:
        "When true, users higher in the role hierarchy inherit access to subordinates' records",
    }),
  },

  indexes: [{ fields: ['object_name'], unique: true }],

  enable: {
    trackHistory: true,
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update'] as const,
    trash: false,
  },
});
