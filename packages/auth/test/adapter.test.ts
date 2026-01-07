import { ObjectQL } from '@objectql/core';
import { objectQLAdapter } from '../src/adapter';
import { getAuthSchemas } from '../src/schema';
import { MockDriver } from './mock-driver';

describe('Better Auth Adapter', () => {
    let objectql: ObjectQL;
    let adapter: any;

    beforeEach(async () => {
        const mockDriver = new MockDriver();
        objectql = new ObjectQL({
            datasources: {
                default: mockDriver
            },
            objects: getAuthSchemas()
        });
        await objectql.init();
        
        adapter = objectQLAdapter({ objectql });
    });

    test('should create user', async () => {
        const userData = {
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const user = await adapter.createUser(userData);
        expect(user).toBeDefined();
        expect(user.id).toBeDefined();
        expect(user.email).toBe('test@example.com');
        
        // Check retrieval
        const fetched = await adapter.getUser(user.id);
        expect(fetched).toMatchObject({ email: 'test@example.com' });
    });

    test('should find user by email', async () => {
        const userData = {
            name: 'Unique User',
            email: 'unique@example.com',
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await adapter.createUser(userData);

        const found = await adapter.getUserByEmail('unique@example.com');
        expect(found).toBeDefined();
        expect(found.name).toBe('Unique User');

        const notFound = await adapter.getUserByEmail('nonexistent@example.com');
        expect(notFound).toBeNull();
    });

    test('should manage sessions', async () => {
        const user = await adapter.createUser({
            name: 'Session User',
            email: 'session@example.com',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const sessionData = {
            userId: user.id,
            token: 'session-token-123',
            expiresAt: new Date(Date.now() + 3600000), // 1 hour
            ipAddress: '127.0.0.1',
            userAgent: 'Jest',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const session = await adapter.createSession(sessionData);
        expect(session).toBeDefined();
        expect(session.token).toBe('session-token-123');

        // getSessionAndUser
        const result = await adapter.getSessionAndUser('session-token-123');
        expect(result).not.toBeNull();
        expect(result.user.id).toBe(user.id);
        expect(result.session.token).toBe('session-token-123');

        // updateSession
        const updated = await adapter.updateSession('session-token-123', {
            ipAddress: '192.168.1.1'
        });
        expect(updated.ipAddress).toBe('192.168.1.1');

        // deleteSession
        await adapter.deleteSession('session-token-123');
        const deleted = await adapter.getSessionAndUser('session-token-123');
        expect(deleted).toBeNull();
    });

    test('should manage accounts', async () => {
        const accountData = {
            userId: 'user-1',
            providerId: 'github',
            providerAccountId: 'gh-123',
            accessToken: 'access-token',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await adapter.linkAccount(accountData);

        const found = await adapter.getAccount('github', 'gh-123');
        expect(found).toBeDefined();
        expect(found.accessToken).toBe('access-token');

        const notFound = await adapter.getAccount('google', 'gh-123');
        expect(notFound).toBeNull();
    });

    test('should manage verification tokens', async () => {
        const tokenData = {
            identifier: 'verify@example.com',
            value: 'verify-token-xyz',
            expiresAt: new Date(Date.now() + 3600000),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await adapter.createVerificationToken(tokenData);

        const verified = await adapter.useVerificationToken('verify@example.com', 'verify-token-xyz');
        expect(verified).toBeDefined();
        expect(verified.identifier).toBe('verify@example.com');

        // Should be deleted after use
        const reused = await adapter.useVerificationToken('verify@example.com', 'verify-token-xyz');
        expect(reused).toBeNull();
    });
});
