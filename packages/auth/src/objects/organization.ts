import { ObjectSchema, Field } from '../schema-helpers.js';

export const OrganizationObject = ObjectSchema.create({
  name: 'organization',
  description: 'Organization for multi-tenant apps',
  fields: {
    name: Field.text({
      label: "Name",
      description: "Organization name",
      required: true
    }),
    slug: Field.text({
      label: "Slug",
      description: "Unique url friendly identifier",
      unique: true,
      required: true
    }),
    logo: Field.text({
      label: "Logo",
      description: "Organization logo URL"
    }),
    metadata: Field.json({
      label: "Metadata",
      description: "Additional metadata"
    }),
    createdAt: Field.datetime({
        defaultValue: 'now()'
    }),
    updatedAt: Field.datetime({
        defaultValue: 'now()'
    })
  }
});
