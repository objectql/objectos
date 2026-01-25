/**
 * Discovery Service Tests
 */

import {
    DiscoveryService,
    createDiscoveryService,
    registerDiscoveryEndpoint,
} from '../src/api/discovery';
import { createRouter } from '../src/api/router';

describe('DiscoveryService', () => {
    let discovery: DiscoveryService;
    let router: any;

    beforeEach(() => {
        router = createRouter();

        // Register some sample routes
        router.get('/api/users', jest.fn(), {
            summary: 'List users',
            description: 'Get all users',
            tags: ['users'],
            category: 'api',
        });

        router.post('/api/users', jest.fn(), {
            summary: 'Create user',
            description: 'Create a new user',
            tags: ['users'],
            category: 'api',
        });

        router.get('/system/health', jest.fn(), {
            summary: 'Health check',
            category: 'system',
        });

        discovery = createDiscoveryService(router, {
            name: 'Test API',
            version: '1.0.0',
            description: 'Test API description',
            baseUrl: 'http://localhost:3000',
            capabilities: {
                graphql: true,
                websocket: false,
            },
        });
    });

    describe('getDiscovery', () => {
        it('should return discovery information', () => {
            const info = discovery.getDiscovery();

            expect(info.name).toBe('Test API');
            expect(info.version.version).toBe('1.0.0');
            expect(info.description).toBe('Test API description');
            expect(info.baseUrl).toBe('http://localhost:3000');
        });

        it('should include capabilities', () => {
            const info = discovery.getDiscovery();

            expect(info.capabilities).toBeDefined();
            expect(info.capabilities.graphql).toBe(true);
            expect(info.capabilities.websocket).toBe(false);
        });

        it('should include routes', () => {
            const info = discovery.getDiscovery();

            expect(info.routes).toBeDefined();
            expect(info.routes.length).toBeGreaterThan(0);
        });

        it('should include system routes', () => {
            const info = discovery.getDiscovery();

            const systemRoutes = info.routes.filter(r => r.category === 'system');
            expect(systemRoutes.length).toBe(1);
            expect(systemRoutes[0].path).toBe('/system/health');
        });

        it('should include links', () => {
            const info = discovery.getDiscovery();

            expect(info.links).toBeDefined();
            expect(info.links?.documentation).toBe('http://localhost:3000/docs');
            expect(info.links?.openapi).toBe('http://localhost:3000/api/openapi');
        });
    });

    describe('getRoutesByCategory', () => {
        it('should return routes by category', () => {
            const apiRoutes = discovery.getRoutesByCategory('api');

            expect(apiRoutes).toHaveLength(2);
            expect(apiRoutes.every(r => r.category === 'api')).toBe(true);
        });
    });

    describe('getRoutesByTag', () => {
        it('should return routes by tag', () => {
            const userRoutes = discovery.getRoutesByTag('users');

            expect(userRoutes).toHaveLength(2);
            expect(userRoutes.every(r => r.tags?.includes('users'))).toBe(true);
        });
    });

    describe('getRouteStats', () => {
        it('should return route statistics', () => {
            const stats = discovery.getRouteStats();

            expect(stats.total).toBe(3);
            expect(stats.byMethod).toBeDefined();
            expect(stats.byMethod.GET).toBe(2);
            expect(stats.byMethod.POST).toBe(1);
            expect(stats.byCategory).toBeDefined();
            expect(stats.byCategory.api).toBe(2);
            expect(stats.byCategory.system).toBe(1);
        });

        it('should count rate limited routes', () => {
            router.post('/api/auth/login', jest.fn(), {
                rateLimit: { maxRequests: 5, windowMs: 60000 },
            });

            const stats = discovery.getRouteStats();
            expect(stats.withRateLimit).toBe(1);
        });

        it('should count deprecated routes', () => {
            router.get('/api/old-endpoint', jest.fn(), {
                deprecated: true,
            });

            const stats = discovery.getRouteStats();
            expect(stats.deprecated).toBe(1);
        });
    });

    describe('updateConfig', () => {
        it('should update configuration', () => {
            discovery.updateConfig({
                description: 'Updated description',
            });

            const info = discovery.getDiscovery();
            expect(info.description).toBe('Updated description');
        });
    });

    describe('registerDiscoveryEndpoint', () => {
        it('should register discovery endpoint', () => {
            registerDiscoveryEndpoint(router, discovery);

            const route = router.findRoute('GET', '/api/discovery');
            expect(route).toBeDefined();
            expect(route?.summary).toBe('API Discovery');
        });

        it('should register stats endpoint', () => {
            registerDiscoveryEndpoint(router, discovery);

            const route = router.findRoute('GET', '/api/discovery/stats');
            expect(route).toBeDefined();
            expect(route?.summary).toBe('API Statistics');
        });
    });
});
