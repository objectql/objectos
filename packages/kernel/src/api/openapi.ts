/**
 * OpenAPI 3.0 Specification Generator
 * 
 * Generates OpenAPI spec from routes and endpoints
 */

import { Router, RouteMetadata } from './router';
import { EndpointRegistry } from './endpoint-registry';

/**
 * OpenAPI 3.0 specification
 */
export interface OpenAPISpec {
    openapi: string;
    info: OpenAPIInfo;
    servers?: OpenAPIServer[];
    paths: OpenAPIPaths;
    components?: OpenAPIComponents;
    tags?: OpenAPITag[];
}

export interface OpenAPIInfo {
    title: string;
    version: string;
    description?: string;
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
    license?: {
        name: string;
        url?: string;
    };
}

export interface OpenAPIServer {
    url: string;
    description?: string;
}

export interface OpenAPIPaths {
    [path: string]: OpenAPIPathItem;
}

export interface OpenAPIPathItem {
    [method: string]: OpenAPIOperation;
}

export interface OpenAPIOperation {
    summary?: string;
    description?: string;
    operationId?: string;
    tags?: string[];
    parameters?: OpenAPIParameter[];
    requestBody?: OpenAPIRequestBody;
    responses: OpenAPIResponses;
    deprecated?: boolean;
}

export interface OpenAPIParameter {
    name: string;
    in: 'query' | 'header' | 'path' | 'cookie';
    description?: string;
    required?: boolean;
    schema: any;
}

export interface OpenAPIRequestBody {
    description?: string;
    required?: boolean;
    content: {
        [mediaType: string]: {
            schema: any;
        };
    };
}

export interface OpenAPIResponses {
    [statusCode: string]: OpenAPIResponse;
}

export interface OpenAPIResponse {
    description: string;
    content?: {
        [mediaType: string]: {
            schema: any;
        };
    };
}

export interface OpenAPIComponents {
    schemas?: {
        [name: string]: any;
    };
    securitySchemes?: {
        [name: string]: any;
    };
}

export interface OpenAPITag {
    name: string;
    description?: string;
}

/**
 * OpenAPI generator configuration
 */
export interface OpenAPIConfig {
    title: string;
    version: string;
    description?: string;
    servers?: OpenAPIServer[];
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
    license?: {
        name: string;
        url?: string;
    };
}

/**
 * OpenAPI Spec Generator
 */
export class OpenAPIGenerator {
    private router: Router;
    private endpointRegistry?: EndpointRegistry;
    private config: OpenAPIConfig;

    constructor(
        router: Router,
        config: OpenAPIConfig,
        endpointRegistry?: EndpointRegistry
    ) {
        this.router = router;
        this.config = config;
        this.endpointRegistry = endpointRegistry;
    }

    /**
     * Generate OpenAPI specification
     */
    generate(): OpenAPISpec {
        const routes = this.router.getRoutes();

        const spec: OpenAPISpec = {
            openapi: '3.0.0',
            info: {
                title: this.config.title,
                version: this.config.version,
                description: this.config.description,
                contact: this.config.contact,
                license: this.config.license,
            },
            servers: this.config.servers,
            paths: this.generatePaths(routes),
            components: this.generateComponents(),
            tags: this.generateTags(routes),
        };

        return spec;
    }

    /**
     * Generate paths from routes
     */
    private generatePaths(routes: RouteMetadata[]): OpenAPIPaths {
        const paths: OpenAPIPaths = {};

        for (const route of routes) {
            // Skip system routes
            if (route.category === 'system' && route.path !== '/api/discovery') {
                continue;
            }

            const pathKey = this.convertPathToOpenAPI(route.path);
            
            if (!paths[pathKey]) {
                paths[pathKey] = {};
            }

            const method = route.method.toLowerCase();
            paths[pathKey][method] = this.generateOperation(route);
        }

        return paths;
    }

    /**
     * Generate operation from route
     */
    private generateOperation(route: RouteMetadata): OpenAPIOperation {
        const operation: OpenAPIOperation = {
            summary: route.summary,
            description: route.description,
            operationId: this.generateOperationId(route),
            tags: route.tags && route.tags.length > 0 ? route.tags : [route.category],
            parameters: this.extractParameters(route.path),
            responses: this.generateResponses(route),
            deprecated: route.deprecated,
        };

        // Add request body for POST, PUT, PATCH
        if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
            operation.requestBody = {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                        },
                    },
                },
            };
        }

        return operation;
    }

    /**
     * Generate operation ID
     */
    private generateOperationId(route: RouteMetadata): string {
        // Convert path to camelCase operation name
        const method = route.method.toLowerCase();
        const path = route.path
            .replace(/^\/api\//, '')
            .replace(/\//g, '_')
            .replace(/[{}:]/g, '')
            .replace(/_+/g, '_');
        
        return `${method}_${path}`;
    }

    /**
     * Extract parameters from path
     */
    private extractParameters(path: string): OpenAPIParameter[] {
        const parameters: OpenAPIParameter[] = [];
        const pathParts = path.split('/');

        for (const part of pathParts) {
            if (part.startsWith(':')) {
                const paramName = part.substring(1);
                parameters.push({
                    name: paramName,
                    in: 'path',
                    required: true,
                    schema: {
                        type: 'string',
                    },
                });
            }
        }

        return parameters;
    }

    /**
     * Generate responses
     */
    private generateResponses(route: RouteMetadata): OpenAPIResponses {
        return {
            '200': {
                description: 'Successful response',
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                success: { type: 'boolean' },
                                data: { type: 'object' },
                                meta: {
                                    type: 'object',
                                    properties: {
                                        timestamp: { type: 'string', format: 'date-time' },
                                        duration: { type: 'number' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '400': {
                description: 'Bad request',
            },
            '401': {
                description: 'Unauthorized',
            },
            '404': {
                description: 'Not found',
            },
            '500': {
                description: 'Internal server error',
            },
        };
    }

    /**
     * Generate components
     */
    private generateComponents(): OpenAPIComponents {
        return {
            schemas: {
                ApiResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: { type: 'object' },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string' },
                                message: { type: 'string' },
                                details: { type: 'object' },
                            },
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'string', format: 'date-time' },
                                duration: { type: 'number' },
                                requestId: { type: 'string' },
                                traceId: { type: 'string' },
                            },
                        },
                    },
                },
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        };
    }

    /**
     * Generate tags
     */
    private generateTags(routes: RouteMetadata[]): OpenAPITag[] {
        const tagsSet = new Set<string>();

        for (const route of routes) {
            if (route.tags) {
                route.tags.forEach(tag => tagsSet.add(tag));
            }
            tagsSet.add(route.category);
        }

        return Array.from(tagsSet).map(tag => ({
            name: tag,
            description: `${tag} endpoints`,
        }));
    }

    /**
     * Convert path to OpenAPI format
     * Converts :param to {param}
     */
    private convertPathToOpenAPI(path: string): string {
        return path.replace(/:([^/]+)/g, '{$1}');
    }
}

/**
 * Create OpenAPI generator
 */
export function createOpenAPIGenerator(
    router: Router,
    config: OpenAPIConfig,
    endpointRegistry?: EndpointRegistry
): OpenAPIGenerator {
    return new OpenAPIGenerator(router, config, endpointRegistry);
}

/**
 * Register OpenAPI endpoint on router
 */
export function registerOpenAPIEndpoint(
    router: Router,
    generator: OpenAPIGenerator
): void {
    router.get('/api/openapi', async (req: any, res: any) => {
        const spec = generator.generate();
        
        if (res.json) {
            res.json(spec);
        }
    }, {
        category: 'system',
        summary: 'OpenAPI Specification',
        description: 'Get OpenAPI 3.0 specification for this API',
        tags: ['system', 'documentation'],
    });
}
