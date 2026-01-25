/**
 * Endpoint Registry
 * 
 * Manages declarative API endpoint configuration and lifecycle
 */

import { Router, RouteMetadata } from './router';
import { TransformConfig } from './mapping';

/**
 * Endpoint type enum
 */
export enum EndpointType {
    FLOW = 'flow',
    SCRIPT = 'script',
    OBJECT_OPERATION = 'object_operation',
    PROXY = 'proxy',
}

/**
 * Endpoint configuration
 */
export interface EndpointConfig {
    /** Unique endpoint ID */
    id: string;
    /** Endpoint type */
    type: EndpointType;
    /** HTTP method */
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    /** Path pattern */
    path: string;
    /** Endpoint summary */
    summary?: string;
    /** Endpoint description */
    description?: string;
    /** Tags for categorization */
    tags?: string[];
    /** Enable/disable endpoint */
    enabled?: boolean;
    /** Input transformation */
    inputTransform?: TransformConfig;
    /** Output transformation */
    outputTransform?: TransformConfig;
    /** Type-specific configuration */
    config: any;
}

/**
 * Endpoint handler interface
 */
export interface EndpointHandler {
    /** Execute the endpoint */
    execute(req: any, res: any, config: any): Promise<void>;
}

/**
 * Endpoint registry
 */
export class EndpointRegistry {
    private endpoints: Map<string, EndpointConfig> = new Map();
    private handlers: Map<EndpointType, EndpointHandler> = new Map();
    private router: Router;

    constructor(router: Router) {
        this.router = router;
    }

    /**
     * Register an endpoint handler
     */
    registerHandler(type: EndpointType, handler: EndpointHandler): void {
        this.handlers.set(type, handler);
    }

    /**
     * Register an endpoint
     */
    registerEndpoint(config: EndpointConfig): void {
        // Validate endpoint
        this.validateEndpoint(config);

        // Check for conflicts
        if (this.endpoints.has(config.id)) {
            throw new Error(`Endpoint with id '${config.id}' already registered`);
        }

        // Get handler for this endpoint type
        const handler = this.handlers.get(config.type);
        if (!handler) {
            throw new Error(`No handler registered for endpoint type '${config.type}'`);
        }

        // Register route in router
        const routeHandler = async (req: any, res: any) => {
            // Apply input transformation if configured
            if (config.inputTransform) {
                // Transform request body
                // Note: Implementation depends on integration with router
            }

            // Execute endpoint handler
            await handler.execute(req, res, config.config);

            // Apply output transformation if configured
            if (config.outputTransform) {
                // Transform response
            }
        };

        this.router.addRoute(config.method, config.path, routeHandler, {
            summary: config.summary,
            description: config.description,
            tags: config.tags,
            category: 'api',
        });

        // Store endpoint config
        this.endpoints.set(config.id, config);
    }

    /**
     * Unregister an endpoint
     */
    unregisterEndpoint(id: string): boolean {
        const config = this.endpoints.get(id);
        if (!config) {
            return false;
        }

        // Remove route from router
        this.router.removeRoute(config.method, config.path);

        // Remove from registry
        this.endpoints.delete(id);

        return true;
    }

    /**
     * Get endpoint by ID
     */
    getEndpoint(id: string): EndpointConfig | undefined {
        return this.endpoints.get(id);
    }

    /**
     * List all endpoints
     */
    listEndpoints(): EndpointConfig[] {
        return Array.from(this.endpoints.values());
    }

    /**
     * List endpoints by type
     */
    listEndpointsByType(type: EndpointType): EndpointConfig[] {
        return this.listEndpoints().filter(e => e.type === type);
    }

    /**
     * Enable an endpoint
     */
    enableEndpoint(id: string): void {
        const endpoint = this.endpoints.get(id);
        if (endpoint) {
            endpoint.enabled = true;
        }
    }

    /**
     * Disable an endpoint
     */
    disableEndpoint(id: string): void {
        const endpoint = this.endpoints.get(id);
        if (endpoint) {
            endpoint.enabled = false;
        }
    }

    /**
     * Load endpoints from configuration
     */
    async loadFromConfig(configs: EndpointConfig[]): Promise<void> {
        for (const config of configs) {
            try {
                this.registerEndpoint(config);
            } catch (error) {
                console.error(`Failed to load endpoint ${config.id}:`, error);
            }
        }
    }

    /**
     * Validate endpoint configuration
     */
    private validateEndpoint(config: EndpointConfig): void {
        if (!config.id) {
            throw new Error('Endpoint id is required');
        }

        if (!config.type) {
            throw new Error('Endpoint type is required');
        }

        if (!config.method) {
            throw new Error('Endpoint method is required');
        }

        if (!config.path) {
            throw new Error('Endpoint path is required');
        }

        if (!config.path.startsWith('/')) {
            throw new Error('Endpoint path must start with /');
        }

        // Validate endpoint type
        if (!Object.values(EndpointType).includes(config.type)) {
            throw new Error(`Invalid endpoint type: ${config.type}`);
        }
    }

    /**
     * Check for path conflicts
     */
    hasConflict(method: string, path: string): boolean {
        const route = this.router.findRoute(method as any, path);
        return route !== undefined;
    }

    /**
     * Clear all endpoints
     */
    clear(): void {
        // Remove all routes
        for (const config of this.endpoints.values()) {
            this.router.removeRoute(config.method, config.path);
        }

        // Clear registry
        this.endpoints.clear();
    }
}

/**
 * Create endpoint registry
 */
export function createEndpointRegistry(router: Router): EndpointRegistry {
    return new EndpointRegistry(router);
}
