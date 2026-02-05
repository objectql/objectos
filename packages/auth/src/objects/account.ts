import { ObjectSchema, Field } from '../schema-helpers.js';

export const AccountObject = ObjectSchema.create({
  name: 'account',
  description: 'External authentication account (OAuth etc)',
  fields: {
    userId: Field.text({
      label: "User ID",
      description: "ID of the user",
      required: true
    }),
    accountId: Field.text({
      label: "Account ID",
      description: "Account ID from provider",
      required: true
    }),
    providerId: Field.text({
      label: "Provider ID",
      description: "Provider ID (google, github, etc)",
      required: true
    }),
    accessToken: Field.text({
      label: "Access Token",
      description: "Access Token"
    }),
    refreshToken: Field.text({
      label: "Refresh Token",
      description: "Refresh Token"
    }),
    accessTokenExpiresAt: Field.datetime({
      label: "Access Token Expires At"
    }),
    refreshTokenExpiresAt: Field.datetime({
      label: "Refresh Token Expires At"
    }),
    scope: Field.text({
      label: "Scope"
    }),
    password: Field.password({
      label: "Password",
      description: "Password if applicable",
      hidden: true
    }),
    createdAt: Field.datetime({
        defaultValue: 'now()'
    }),
    updatedAt: Field.datetime({
        defaultValue: 'now()'
    })
  }
});
