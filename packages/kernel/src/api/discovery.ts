/**
 * API Discovery Service
 * 
 * Provides dynamic API documentation and metadata
 */

import { Router, RouteMetadata } from './router';
import { EndpointRegistry } from './endpoint-registry';

/**
 * System capabilities
 */
export interface SystemCapabilities {
    /** GraphQL endpoint available */
    graphql?: boolean;
    /** WebSocket support */
    websocket?: boolean;
    /** File upload support */
    fileUpload?: boolean;
    /** Batch operations support */
    batch?: boolean;
    /** Real-time subscriptions */
    realtime?: boolean;
}

/**
 * API version info
 */
export interface ApiVersionInfo {
    version: string;
    releaseDate?: string;
    deprecated?: boolean;
    sunsetDate?: string;
}

/**
 * Discovery response
 */
export interface DiscoveryResponse {
    /** API name */
    name: string;
    /** API version */
    version: ApiVersionInfo;
    /** API description */
    description?: string;
    /** Base URL */
    baseUrl?: string;
    /** System capabilities */
    capabilities: SystemCapabilities;
    /** Available routes */
    routes: RouteMetadata[];
    /** API endpoints (from endpoint registry) */
    endpoints?: any[];
    /** Environment info */
    environment?: {
        name: string;
        region?: string;
        [key: string]: any;
    };
    /** Contact info */
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
    /** Links to documentation */
    links?: {
        documentation?: string;
        openapi?: string;
        support?: string;
    };
}

/**
 * Discovery configuration
 */
export interface DiscoveryConfig {
    name: string;
    version: string;
    description?: string;
    baseUrl?: string;
    capabilities?: SystemCapabilities;
    environment?: {
        name: string;
        region?: string;
        [key: string]: any;
    };
    contact?: {
        name?: string;
        email?: string;
        url?: string;
    };
}

/**
 * API Discovery Service
 */
export class DiscoveryService {
    private router: Router;
    private endpointRegistry?: EndpointRegistry;
    private config: DiscoveryConfig;

    constructor(
        router: Router,
        config: DiscoveryConfig,
        endpointRegistry?: EndpointRegistry
    ) {
        this.router = router;
        this.config = config;
        this.endpointRegistry = endpointRegistry;
    }

    /**
     * Get discovery information
     */
    getDiscovery(): DiscoveryResponse {
        const routes = this.router.getRoutes();
        const endpoints = this.endpointRegistry?.listEndpoints();

        const discovery: DiscoveryResponse = {
            name: this.config.name,
            version: {
                version: this.config.version,
            },
            description: this.config.description,
            baseUrl: this.config.baseUrl,
            capabilities: this.config.capabilities || {},
            routes: this.filterSystemRoutes(routes),
            environment: this.config.environment,
            contact: this.config.contact,
            links: {
                documentation: `${this.config.baseUrl || ''}/docs`,
                openapi: `${this.config.baseUrl || ''}/api/openapi`,
            },
        };

        if (endpoints) {
            discovery.endpoints = endpoints;
        }

        return discovery;
    }

    /**
     * Get routes by category
     */
    getRoutesByCategory(category: string): RouteMetadata[] {
        return this.router.getRoutesByCategory(category as any);
    }

    /**
     * Get routes by tag
     */
    getRoutesByTag(tag: string): RouteMetadata[] {
        return this.router.getRoutesByTag(tag);
    }

    /**
     * Get route statistics
     */
    getRouteStats(): any {
        const routes = this.router.getRoutes();

        const stats = {
            total: routes.length,
            byMethod: {} as Record<string, number>,
            byCategory: {} as Record<string, number>,
            withRateLimit: 0,
            deprecated: 0,
        };

        for (const route of routes) {
            // Count by method
            stats.byMethod[route.method] = (stats.byMethod[route.method] || 0) + 1;

            // Count by category
            stats.byCategory[route.category] = (stats.byCategory[route.category] || 0) + 1;

            // Count rate limited routes
            if (route.rateLimit) {
                stats.withRateLimit++;
            }

            // Count deprecated routes
            if (route.deprecated) {
                stats.deprecated++;
            }
        }

        return stats;
    }

    /**
     * Filter out system routes from discovery
     */
    private filterSystemRoutes(routes: RouteMetadata[]): RouteMetadata[] {
        // Include all routes but optionally filter some internal ones
        // For now, keep all routes including system ones
        return routes;
    }

    /**
     * Update configuration
     */
    updateConfig(updates: Partial<DiscoveryConfig>): void {
        this.config = { ...this.config, ...updates };
    }
}

/**
 * Create discovery service
 */
export function createDiscoveryService(
    router: Router,
    config: DiscoveryConfig,
    endpointRegistry?: EndpointRegistry
): DiscoveryService {
    return new DiscoveryService(router, config, endpointRegistry);
}

/**
 * Register discovery endpoint on router
 */
export function registerDiscoveryEndpoint(
    router: Router,
    discovery: DiscoveryService
): void {
    router.get('/api/discovery', async (req: any, res: any) => {
        const discoveryInfo = discovery.getDiscovery();
        
        if (res.json) {
            res.json(discoveryInfo);
        }
    }, {
        category: 'system',
        summary: 'API Discovery',
        description: 'Get information about available API endpoints',
        tags: ['system', 'discovery'],
    });

    router.get('/api/discovery/stats', async (req: any, res: any) => {
        const stats = discovery.getRouteStats();
        
        if (res.json) {
            res.json(stats);
        }
    }, {
        category: 'system',
        summary: 'API Statistics',
        description: 'Get statistics about API routes',
        tags: ['system', 'discovery'],
    });
}
