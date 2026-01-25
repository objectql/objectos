/**
 * Advanced Router Tests
 */

import { Router, createRouter } from '../src/api/router';

describe('Router', () => {
    let router: Router;

    beforeEach(() => {
        router = createRouter();
    });

    describe('Route Registration', () => {
        it('should register a GET route', () => {
            const handler = jest.fn();
            router.get('/users', handler);

            const routes = router.getRoutes();
            expect(routes).toHaveLength(1);
            expect(routes[0].method).toBe('GET');
            expect(routes[0].path).toBe('/users');
            expect(routes[0].handler).toBe(handler);
        });

        it('should register multiple routes with different methods', () => {
            router.get('/users', jest.fn());
            router.post('/users', jest.fn());
            router.put('/users/:id', jest.fn());
            router.delete('/users/:id', jest.fn());

            const routes = router.getRoutes();
            expect(routes).toHaveLength(4);
        });

        it('should throw error for duplicate routes', () => {
            router.get('/users', jest.fn());
            expect(() => router.get('/users', jest.fn())).toThrow('Route already registered');
        });

        it('should throw error for path not starting with /', () => {
            expect(() => router.get('users', jest.fn())).toThrow("Route path must start with '/'");
        });

        it('should register route with metadata', () => {
            router.get('/users', jest.fn(), {
                summary: 'List users',
                description: 'Get all users',
                tags: ['users'],
                category: 'api',
            });

            const routes = router.getRoutes();
            expect(routes[0].summary).toBe('List users');
            expect(routes[0].description).toBe('Get all users');
            expect(routes[0].tags).toContain('users');
            expect(routes[0].category).toBe('api');
        });

        it('should register route with rate limit config', () => {
            router.post('/auth/login', jest.fn(), {
                rateLimit: {
                    maxRequests: 5,
                    windowMs: 60000,
                },
            });

            const routes = router.getRoutes();
            expect(routes[0].rateLimit).toEqual({
                maxRequests: 5,
                windowMs: 60000,
            });
        });
    });

    describe('Global Middleware', () => {
        it('should register global middleware', () => {
            const middleware = jest.fn();
            router.use(middleware);

            const globalMiddleware = router.getGlobalMiddleware();
            expect(globalMiddleware).toHaveLength(1);
            expect(globalMiddleware[0]).toBe(middleware);
        });

        it('should register multiple global middleware', () => {
            router.use(jest.fn());
            router.use(jest.fn());
            router.use(jest.fn());

            expect(router.getGlobalMiddleware()).toHaveLength(3);
        });
    });

    describe('Route Finding', () => {
        beforeEach(() => {
            router.get('/users', jest.fn());
            router.get('/users/:id', jest.fn());
            router.post('/users', jest.fn());
            router.get('/posts/:postId/comments/:commentId', jest.fn());
        });

        it('should find exact match route', () => {
            const route = router.findRoute('GET', '/users');
            expect(route).toBeDefined();
            expect(route?.path).toBe('/users');
        });

        it('should find route with single parameter', () => {
            const route = router.findRoute('GET', '/users/123');
            expect(route).toBeDefined();
            expect(route?.path).toBe('/users/:id');
        });

        it('should find route with multiple parameters', () => {
            const route = router.findRoute('GET', '/posts/1/comments/2');
            expect(route).toBeDefined();
            expect(route?.path).toBe('/posts/:postId/comments/:commentId');
        });

        it('should return undefined for non-existent route', () => {
            const route = router.findRoute('GET', '/nonexistent');
            expect(route).toBeUndefined();
        });

        it('should differentiate between methods', () => {
            const getRoute = router.findRoute('GET', '/users');
            const postRoute = router.findRoute('POST', '/users');

            expect(getRoute?.method).toBe('GET');
            expect(postRoute?.method).toBe('POST');
        });
    });

    describe('Parameter Extraction', () => {
        it('should extract single parameter', () => {
            const params = router.extractParams('/users/:id', '/users/123');
            expect(params).toEqual({ id: '123' });
        });

        it('should extract multiple parameters', () => {
            const params = router.extractParams(
                '/posts/:postId/comments/:commentId',
                '/posts/1/comments/2'
            );
            expect(params).toEqual({ postId: '1', commentId: '2' });
        });

        it('should decode URI components', () => {
            const params = router.extractParams('/users/:name', '/users/John%20Doe');
            expect(params).toEqual({ name: 'John Doe' });
        });

        it('should return empty object for non-matching paths', () => {
            const params = router.extractParams('/users/:id', '/posts/123');
            expect(params).toEqual({});
        });
    });

    describe('Route Filtering', () => {
        beforeEach(() => {
            router.get('/api/users', jest.fn(), { category: 'api', tags: ['users'] });
            router.get('/system/health', jest.fn(), { category: 'system' });
            router.post('/auth/login', jest.fn(), { category: 'auth', tags: ['auth'] });
            router.post('/webhooks/stripe', jest.fn(), { category: 'webhook' });
        });

        it('should get routes by category', () => {
            const apiRoutes = router.getRoutesByCategory('api');
            expect(apiRoutes).toHaveLength(1);
            expect(apiRoutes[0].path).toBe('/api/users');

            const systemRoutes = router.getRoutesByCategory('system');
            expect(systemRoutes).toHaveLength(1);
            expect(systemRoutes[0].path).toBe('/system/health');
        });

        it('should get routes by tag', () => {
            const userRoutes = router.getRoutesByTag('users');
            expect(userRoutes).toHaveLength(1);
            expect(userRoutes[0].path).toBe('/api/users');

            const authRoutes = router.getRoutesByTag('auth');
            expect(authRoutes).toHaveLength(1);
        });
    });

    describe('Middleware Execution', () => {
        it('should execute global middleware before route middleware', async () => {
            const executionOrder: string[] = [];

            const globalMiddleware = jest.fn(async (req, res, next) => {
                executionOrder.push('global');
                await next();
            });

            const routeMiddleware = jest.fn(async (req, res, next) => {
                executionOrder.push('route');
                await next();
            });

            const handler = jest.fn(async (req, res) => {
                executionOrder.push('handler');
            });

            router.use(globalMiddleware);
            router.get('/test', handler, { middleware: [routeMiddleware] });

            const route = router.findRoute('GET', '/test')!;
            await router.executeMiddleware(route, {}, {});

            expect(executionOrder).toEqual(['global', 'route', 'handler']);
        });

        it('should execute multiple middleware in order', async () => {
            const executionOrder: number[] = [];

            const middleware1 = jest.fn(async (req, res, next) => {
                executionOrder.push(1);
                await next();
            });

            const middleware2 = jest.fn(async (req, res, next) => {
                executionOrder.push(2);
                await next();
            });

            const middleware3 = jest.fn(async (req, res, next) => {
                executionOrder.push(3);
                await next();
            });

            const handler = jest.fn(async (req, res) => {
                executionOrder.push(4);
            });

            router.get('/test', handler, { middleware: [middleware1, middleware2, middleware3] });

            const route = router.findRoute('GET', '/test')!;
            await router.executeMiddleware(route, {}, {});

            expect(executionOrder).toEqual([1, 2, 3, 4]);
        });

        it('should stop execution if middleware does not call next', async () => {
            const handler = jest.fn();

            const blockingMiddleware = jest.fn(async (req, res, next) => {
                // Don't call next
            });

            router.get('/test', handler, { middleware: [blockingMiddleware] });

            const route = router.findRoute('GET', '/test')!;
            await router.executeMiddleware(route, {}, {});

            expect(blockingMiddleware).toHaveBeenCalled();
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('Route Removal', () => {
        it('should remove a route', () => {
            router.get('/users', jest.fn());
            expect(router.getRoutes()).toHaveLength(1);

            const removed = router.removeRoute('GET', '/users');
            expect(removed).toBe(true);
            expect(router.getRoutes()).toHaveLength(0);
        });

        it('should return false when removing non-existent route', () => {
            const removed = router.removeRoute('GET', '/nonexistent');
            expect(removed).toBe(false);
        });

        it('should clear all routes', () => {
            router.get('/users', jest.fn());
            router.post('/users', jest.fn());
            router.delete('/users/:id', jest.fn());

            router.clearRoutes();
            expect(router.getRoutes()).toHaveLength(0);
        });
    });
});
