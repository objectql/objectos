import { getAuthSchemas, userSchema, sessionSchema } from '../src/schema';

describe('Auth Schemas', () => {
    test('getAuthSchemas should return all schemes', () => {
        const schemas = getAuthSchemas();
        expect(schemas).toHaveProperty('user');
        expect(schemas).toHaveProperty('session');
        expect(schemas).toHaveProperty('account');
        expect(schemas).toHaveProperty('verification');
    });

    test('userSchema should have required fields', () => {
        const fields = userSchema.fields;
        expect(fields).toHaveProperty('email');
        expect(fields).toHaveProperty('name');
    });

    test('sessionSchema should have required fields', () => {
        const fields = sessionSchema.fields;
        expect(fields).toHaveProperty('userId');
        expect(fields).toHaveProperty('token');
    });
});
