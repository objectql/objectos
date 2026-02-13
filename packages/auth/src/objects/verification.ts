import { ObjectSchema, Field } from '../schema-helpers.js';

export const VerificationObject = ObjectSchema.create({
  name: 'verification',
  description: 'Verification tokens for email etc',
  fields: {
    identifier: Field.text({
      label: 'Identifier',
      description: 'Email or phone number',
      required: true,
    }),
    value: Field.text({
      label: 'Value',
      description: 'Verification token',
      required: true,
    }),
    expiresAt: Field.datetime({
      label: 'Expires At',
      description: 'Expiration time',
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
