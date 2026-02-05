import { ObjectSchema, Field } from '../schema-helpers.js';

export const InvitationObject = ObjectSchema.create({
  name: 'invitation',
  description: 'Organization invitation',
  fields: {
    organizationId: Field.text({
      label: "Organization ID",
      description: "ID of the organization",
      required: true
    }),
    email: Field.text({
      label: "Email",
      description: "Email of the invitee",
      required: true
    }),
    teamId: Field.text({
      label: "Team ID",
      description: "ID of the team"
    }),
    role: Field.text({
      label: "Role",
      description: "Role to be assigned",
      required: true
    }),
    status: Field.select({
      label: "Status",
      description: "Status of the invitation (pending, accepted, rejected)",
      options: ['pending', 'accepted', 'rejected'],
      defaultValue: 'pending'
    }),
    expiresAt: Field.datetime({
      label: "Expires At",
      description: "Expiration time",
      required: true
    }),
    inviterId: Field.text({
      label: "Inviter ID",
      description: "User ID of the inviter",
      required: true
    }),
    createdAt: Field.datetime({
        defaultValue: 'now()'
    }),
    updatedAt: Field.datetime({
        defaultValue: 'now()'
    })
  }
});
