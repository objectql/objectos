import { ObjectSchema, Field } from '../schema-helpers.js';

export const UserObject = ObjectSchema.create({
  name: 'user',
  description: 'System user for authentication',
  fields: {
    name: Field.text({
      label: "Display Name",
      description: "User's display name"
    }),
    email: Field.text({
      label: "Email",
      description: "User's email address",
      unique: true
    }),
    emailVerified: Field.boolean({
      label: "Email Verified",
      description: "Whether the email is verified",
      defaultValue: false
    }),
    image: Field.avatar({
      label: "Avatar",
      description: "URL to user's avatar"
    }),
    createdAt: Field.datetime({
        defaultValue: 'now()'
    }),
    updatedAt: Field.datetime({
        defaultValue: 'now()'
    }),
    // Better Auth Specifics
    password: Field.password({
      label: "Password",
      description: "Hashed password",
      hidden: true
    }),
    role: Field.select({
      label: "Role",
      description: "User role (admin, user, etc)",
      options: ['admin', 'user'],
      defaultValue: 'user'
    }),
    banned: Field.boolean({
      label: "Banned",
      description: "Whether the user is banned",
      defaultValue: false
    }),
    banReason: Field.text({
      label: "Ban Reason",
      description: "Reason for ban"
    }),
    banExpires: Field.datetime({
      label: "Ban Expires",
      description: "When the ban expires"
    })
  }
});
