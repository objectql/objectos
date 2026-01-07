import { ObjectConfig } from '@objectql/core';

export const userSchema: ObjectConfig = {
    name: 'user',
    fields: {
        name: { type: 'text' },
        email: { type: 'text' }, // check unique
        emailVerified: { type: 'boolean' },
        image: { type: 'text' },
        createdAt: { type: 'datetime' },
        updatedAt: { type: 'datetime' }
    }
};

export const sessionSchema: ObjectConfig = {
    name: 'session',
    fields: {
        userId: { type: 'text' },
        token: { type: 'text' },
        expiresAt: { type: 'datetime' },
        ipAddress: { type: 'text' },
        userAgent: { type: 'text' },
        createdAt: { type: 'datetime' },
        updatedAt: { type: 'datetime' }
    }
};

export const accountSchema: ObjectConfig = {
    name: 'account',
    fields: {
        userId: { type: 'text' },
        accountId: { type: 'text' },
        providerId: { type: 'text' },
        accessToken: { type: 'text' },
        refreshToken: { type: 'text' },
        accessTokenExpiresAt: { type: 'datetime' },
        refreshTokenExpiresAt: { type: 'datetime' },
        scope: { type: 'text' },
        password: { type: 'text' },
        createdAt: { type: 'datetime' },
        updatedAt: { type: 'datetime' }
    }
};

export const verificationSchema: ObjectConfig = {
    name: 'verification',
    fields: {
        identifier: { type: 'text' },
        value: { type: 'text' },
        expiresAt: { type: 'datetime' },
        createdAt: { type: 'datetime' },
        updatedAt: { type: 'datetime' }
    }
};

export function getAuthSchemas(): Record<string, ObjectConfig> {
    return {
        user: userSchema,
        session: sessionSchema,
        account: accountSchema,
        verification: verificationSchema
    };
}
