import { ObjectSchema, Field } from '../schema-helpers.js';

export const MemberObject = ObjectSchema.create({
  name: 'member',
  description: 'Organization membership',
  fields: {
    organizationId: Field.text({
      label: 'Organization ID',
      description: 'ID of the organization',
      required: true,
    }),
    userId: Field.text({
      label: 'User ID',
      description: 'ID of the user',
      required: true,
    }),
    role: Field.select({
      label: 'Role',
      description: 'Role in the organization (admin, member, owner)',
      options: ['admin', 'member', 'owner'],
      required: true,
    }),
    createdAt: Field.datetime({
      defaultValue: 'now()',
    }),
    updatedAt: Field.datetime({
      defaultValue: 'now()',
    }),
  },
});
