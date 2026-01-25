/**
 * OpenAPI Generator Tests
 */

import {
    OpenAPIGenerator,
    createOpenAPIGenerator,
    registerOpenAPIEndpoint,
} from '../src/api/openapi';
import { createRouter } from '../src/api/router';

describe('OpenAPIGenerator', () => {
    let generator: OpenAPIGenerator;
    let router: any;

    beforeEach(() => {
        router = createRouter();

        // Register sample routes
        router.get('/api/users', jest.fn(), {
            summary: 'List users',
            description: 'Get all users',
            tags: ['users'],
            category: 'api',
        });

        router.post('/api/users', jest.fn(), {
            summary: 'Create user',
            tags: ['users'],
            category: 'api',
        });

        router.get('/api/users/:id', jest.fn(), {
            summary: 'Get user',
            tags: ['users'],
            category: 'api',
        });

        generator = createOpenAPIGenerator(router, {
            title: 'Test API',
            version: '1.0.0',
            description: 'Test API description',
            servers: [
                { url: 'http://localhost:3000', description: 'Development' },
            ],
            license: {
                name: 'MIT',
            },
        });
    });

    describe('generate', () => {
        it('should generate OpenAPI spec', () => {
            const spec = generator.generate();

            expect(spec.openapi).toBe('3.0.0');
            expect(spec.info.title).toBe('Test API');
            expect(spec.info.version).toBe('1.0.0');
            expect(spec.info.description).toBe('Test API description');
        });

        it('should include servers', () => {
            const spec = generator.generate();

            expect(spec.servers).toHaveLength(1);
            expect(spec.servers?.[0].url).toBe('http://localhost:3000');
        });

        it('should include license', () => {
            const spec = generator.generate();

            expect(spec.info.license).toBeDefined();
            expect(spec.info.license?.name).toBe('MIT');
        });

        it('should generate paths', () => {
            const spec = generator.generate();

            expect(spec.paths).toBeDefined();
            expect(spec.paths['/api/users']).toBeDefined();
            expect(spec.paths['/api/users/{id}']).toBeDefined();
        });

        it('should convert path parameters to OpenAPI format', () => {
            const spec = generator.generate();

            expect(spec.paths['/api/users/{id}']).toBeDefined();
        });

        it('should include operations for each method', () => {
            const spec = generator.generate();

            expect(spec.paths['/api/users'].get).toBeDefined();
            expect(spec.paths['/api/users'].post).toBeDefined();
        });
    });

    describe('Operation Generation', () => {
        it('should include summary and description', () => {
            const spec = generator.generate();

            const getOperation = spec.paths['/api/users'].get;
            expect(getOperation.summary).toBe('List users');
            expect(getOperation.description).toBe('Get all users');
        });

        it('should include tags', () => {
            const spec = generator.generate();

            const getOperation = spec.paths['/api/users'].get;
            expect(getOperation.tags).toContain('users');
        });

        it('should generate operation ID', () => {
            const spec = generator.generate();

            const getOperation = spec.paths['/api/users'].get;
            expect(getOperation.operationId).toBeDefined();
            expect(getOperation.operationId).toMatch(/^get_/);
        });

        it('should extract path parameters', () => {
            const spec = generator.generate();

            const getOperation = spec.paths['/api/users/{id}'].get;
            expect(getOperation.parameters).toHaveLength(1);
            expect(getOperation.parameters?.[0].name).toBe('id');
            expect(getOperation.parameters?.[0].in).toBe('path');
            expect(getOperation.parameters?.[0].required).toBe(true);
        });

        it('should add request body for POST/PUT/PATCH', () => {
            const spec = generator.generate();

            const postOperation = spec.paths['/api/users'].post;
            expect(postOperation.requestBody).toBeDefined();
            expect(postOperation.requestBody?.required).toBe(true);
            expect(postOperation.requestBody?.content['application/json']).toBeDefined();
        });

        it('should not add request body for GET/DELETE', () => {
            const spec = generator.generate();

            const getOperation = spec.paths['/api/users'].get;
            expect(getOperation.requestBody).toBeUndefined();
        });

        it('should include standard responses', () => {
            const spec = generator.generate();

            const getOperation = spec.paths['/api/users'].get;
            expect(getOperation.responses['200']).toBeDefined();
            expect(getOperation.responses['400']).toBeDefined();
            expect(getOperation.responses['401']).toBeDefined();
            expect(getOperation.responses['404']).toBeDefined();
            expect(getOperation.responses['500']).toBeDefined();
        });

        it('should mark deprecated routes', () => {
            router.get('/api/old-endpoint', jest.fn(), {
                deprecated: true,
                category: 'api',
            });

            const spec = generator.generate();
            const operation = spec.paths['/api/old-endpoint'].get;
            expect(operation.deprecated).toBe(true);
        });
    });

    describe('Components', () => {
        it('should include component schemas', () => {
            const spec = generator.generate();

            expect(spec.components).toBeDefined();
            expect(spec.components?.schemas).toBeDefined();
            expect(spec.components?.schemas?.ApiResponse).toBeDefined();
        });

        it('should include security schemes', () => {
            const spec = generator.generate();

            expect(spec.components?.securitySchemes).toBeDefined();
            expect(spec.components?.securitySchemes?.bearerAuth).toBeDefined();
        });
    });

    describe('Tags', () => {
        it('should generate tags from routes', () => {
            const spec = generator.generate();

            expect(spec.tags).toBeDefined();
            expect(spec.tags?.length).toBeGreaterThan(0);
            
            const usersTag = spec.tags?.find(t => t.name === 'users');
            expect(usersTag).toBeDefined();
        });

        it('should include categories as tags', () => {
            const spec = generator.generate();

            const apiTag = spec.tags?.find(t => t.name === 'api');
            expect(apiTag).toBeDefined();
        });
    });

    describe('registerOpenAPIEndpoint', () => {
        it('should register OpenAPI endpoint', () => {
            registerOpenAPIEndpoint(router, generator);

            const route = router.findRoute('GET', '/api/openapi');
            expect(route).toBeDefined();
            expect(route?.summary).toBe('OpenAPI Specification');
        });
    });
});
