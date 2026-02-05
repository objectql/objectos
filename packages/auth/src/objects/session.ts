import { ObjectSchema, Field } from '@objectstack/spec';

export const SessionObject = ObjectSchema.create({
  name: 'session',
  description: 'User authentication session',
  fields: {
    userId: Field.text({
      label: "User ID",
      description: "ID of the user",
      required: true
    }),
    token: Field.text({
      label: "Token",
      description: "Session token",
      unique: true,
      required: true
    }),
    expiresAt: Field.datetime({
      label: "Expires At",
      description: "When the session expires",
      required: true
    }),
    ipAddress: Field.text({
      label: "IP Address",
      description: "IP Address of the client"
    }),
    userAgent: Field.text({
      label: "User Agent",
      description: "User Agent of the client"
    }),
    activeOrganizationId: Field.text({
      label: "Active Organization ID",
      description: "ID of the active organization"
    }),
    activeTeamId: Field.text({
      label: "Active Team ID",
      description: "ID of the active team"
    }),
    createdAt: Field.datetime({
        defaultValue: 'now()'
    }),
    updatedAt: Field.datetime({
        defaultValue: 'now()'
    })
  }
});
