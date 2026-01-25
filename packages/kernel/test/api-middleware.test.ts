/**
 * Middleware Tests
 */

import {
    createAuthMiddleware,
    createAuthorizationMiddleware,
    createRoleMiddleware,
    createValidationMiddleware,
    createCorsMiddleware,
    createLoggingMiddleware,
    createRateLimitMiddleware,
    ValidationRules,
} from '../src/api/middleware';
import { UnauthorizedError, ValidationError, RateLimitError } from '../src/api/errors';

describe('Middleware', () => {
    describe('Auth Middleware', () => {
        it('should skip authentication for whitelisted paths', async () => {
            const middleware = createAuthMiddleware({
                skipPaths: ['/health', '/public'],
            });

            const req: any = { path: '/health', headers: {} };
            const res = {};
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        it('should throw error when no token provided', async () => {
            const middleware = createAuthMiddleware();

            const req: any = { path: '/api/users', headers: {} };
            const res = {};
            const next = jest.fn();

            await expect(middleware(req, res, next)).rejects.toThrow(UnauthorizedError);
        });

        it('should extract and decode valid token', async () => {
            const middleware = createAuthMiddleware();

            // Create a simple JWT (not signed, just for testing)
            const payload = { userId: '123', email: 'test@example.com' };
            const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;

            const req: any = {
                path: '/api/users',
                headers: { authorization: `Bearer ${token}` },
            };
            const res = {};
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.user).toBeDefined();
            expect(req.user.userId).toBe('123');
            expect(req.user.email).toBe('test@example.com');
        });
    });

    describe('Authorization Middleware', () => {
        it('should allow request with required permissions', async () => {
            const middleware = createAuthorizationMiddleware(['users.read']);

            const req = {
                user: {
                    userId: '123',
                    permissions: ['users.read', 'users.write'],
                },
            };
            const res = {};
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should block request without required permissions', async () => {
            const middleware = createAuthorizationMiddleware(['users.delete']);

            const req = {
                user: {
                    userId: '123',
                    permissions: ['users.read'],
                },
            };
            const res = {};
            const next = jest.fn();

            await expect(middleware(req, res, next)).rejects.toThrow(UnauthorizedError);
        });

        it('should throw error when user not authenticated', async () => {
            const middleware = createAuthorizationMiddleware(['users.read']);

            const req = {};
            const res = {};
            const next = jest.fn();

            await expect(middleware(req, res, next)).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('Role Middleware', () => {
        it('should allow request with required role', async () => {
            const middleware = createRoleMiddleware(['admin']);

            const req = {
                user: {
                    userId: '123',
                    roles: ['admin'],
                },
            };
            const res = {};
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should block request without required role', async () => {
            const middleware = createRoleMiddleware(['admin']);

            const req = {
                user: {
                    userId: '123',
                    roles: ['user'],
                },
            };
            const res = {};
            const next = jest.fn();

            await expect(middleware(req, res, next)).rejects.toThrow(UnauthorizedError);
        });
    });

    describe('Validation Middleware', () => {
        it('should validate request body successfully', async () => {
            const middleware = createValidationMiddleware({
                email: { required: true, ...ValidationRules.email },
                age: { type: 'number', min: 18 },
            });

            const req = {
                body: {
                    email: 'test@example.com',
                    age: 25,
                },
            };
            const res = {};
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should throw validation error for invalid data', async () => {
            const middleware = createValidationMiddleware({
                email: { required: true, type: 'string' },
            });

            const req = {
                body: {
                    // Missing email
                },
            };
            const res = {};
            const next = jest.fn();

            await expect(middleware(req, res, next)).rejects.toThrow(ValidationError);
        });

        it('should validate email format', async () => {
            const middleware = createValidationMiddleware({
                email: ValidationRules.email,
            });

            const req = {
                body: {
                    email: 'invalid-email',
                },
            };
            const res = {};
            const next = jest.fn();

            await expect(middleware(req, res, next)).rejects.toThrow(ValidationError);
        });
    });

    describe('CORS Middleware', () => {
        it('should set CORS headers for allowed origin', async () => {
            const middleware = createCorsMiddleware({
                origin: 'https://example.com',
            });

            const req = {
                headers: { origin: 'https://example.com' },
                method: 'GET',
            };
            const res = {
                setHeader: jest.fn(),
            };
            const next = jest.fn();

            await middleware(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Access-Control-Allow-Origin',
                'https://example.com'
            );
            expect(next).toHaveBeenCalled();
        });

        it('should handle wildcard origin', async () => {
            const middleware = createCorsMiddleware({
                origin: '*',
            });

            const req = {
                headers: { origin: 'https://example.com' },
                method: 'GET',
            };
            const res = {
                setHeader: jest.fn(),
            };
            const next = jest.fn();

            await middleware(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
        });

        it('should handle preflight OPTIONS request', async () => {
            const middleware = createCorsMiddleware({
                origin: '*',
                methods: ['GET', 'POST'],
            });

            const req = {
                headers: { origin: 'https://example.com' },
                method: 'OPTIONS',
            };
            const res = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };
            const next = jest.fn();

            await middleware(req, res, next);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Access-Control-Allow-Methods',
                'GET, POST'
            );
        });
    });

    describe('Logging Middleware', () => {
        it('should log request and response', async () => {
            const logger = {
                info: jest.fn(),
                error: jest.fn(),
            };

            const middleware = createLoggingMiddleware({ logger });

            const req = {
                method: 'GET',
                path: '/api/users',
                query: {},
                headers: {},
            };
            const res = { statusCode: 200 };
            const next = jest.fn();

            await middleware(req, res, next);

            expect(logger.info).toHaveBeenCalledTimes(2);
            expect(logger.info).toHaveBeenCalledWith(
                'HTTP Request',
                expect.objectContaining({
                    method: 'GET',
                    path: '/api/users',
                })
            );
            expect(logger.info).toHaveBeenCalledWith(
                'HTTP Response',
                expect.objectContaining({
                    method: 'GET',
                    path: '/api/users',
                    statusCode: 200,
                })
            );
        });

        it('should skip logging for whitelisted paths', async () => {
            const logger = {
                info: jest.fn(),
                error: jest.fn(),
            };

            const middleware = createLoggingMiddleware({
                logger,
                skipPaths: ['/health'],
            });

            const req = {
                method: 'GET',
                path: '/health',
                headers: {},
            };
            const res = {};
            const next = jest.fn();

            await middleware(req, res, next);

            expect(logger.info).not.toHaveBeenCalled();
        });

        it('should log errors', async () => {
            const logger = {
                info: jest.fn(),
                error: jest.fn(),
            };

            const middleware = createLoggingMiddleware({ logger });

            const req = {
                method: 'GET',
                path: '/api/users',
                query: {},
                headers: {},
            };
            const res = {};
            const next = jest.fn().mockRejectedValue(new Error('Test error'));

            await expect(middleware(req, res, next)).rejects.toThrow('Test error');

            expect(logger.error).toHaveBeenCalledWith(
                'HTTP Error',
                expect.objectContaining({
                    error: 'Test error',
                })
            );
        });
    });

    describe('Rate Limit Middleware', () => {
        it('should allow requests within limit', async () => {
            const middleware = createRateLimitMiddleware({
                maxRequests: 5,
                windowMs: 60000,
            });

            const req = { ip: '127.0.0.1' };
            const res = { setHeader: jest.fn() };
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
            expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
        });

        it('should block requests exceeding limit', async () => {
            const middleware = createRateLimitMiddleware({
                maxRequests: 2,
                windowMs: 60000,
            });

            const req = { ip: '127.0.0.1' };
            const res = { setHeader: jest.fn() };
            const next = jest.fn();

            await middleware(req, res, next);
            await middleware(req, res, next);

            await expect(middleware(req, res, next)).rejects.toThrow(RateLimitError);
        });

        it('should skip rate limiting when condition met', async () => {
            const middleware = createRateLimitMiddleware({
                maxRequests: 1,
                windowMs: 60000,
                skip: (req) => req.path === '/public',
            });

            const req = { ip: '127.0.0.1', path: '/public' };
            const res = { setHeader: jest.fn() };
            const next = jest.fn();

            await middleware(req, res, next);
            await middleware(req, res, next);

            expect(next).toHaveBeenCalledTimes(2);
        });
    });
});
