/**
 * Advanced Router Implementation
 * 
 * Implements production-grade HTTP router with middleware support
 * according to @objectstack/spec/api
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export type RouteCategory = 'system' | 'api' | 'auth' | 'webhook' | 'plugin';

/**
 * Middleware function type
 */
export type MiddlewareFunction = (req: any, res: any, next: () => void | Promise<void>) => void | Promise<void>;

/**
 * Route handler function type
 */
export type RouteHandler = (req: any, res: any) => void | Promise<void>;

/**
 * Route metadata
 */
export interface RouteMetadata {
    path: string;
    method: HttpMethod;
    handler: RouteHandler;
    middleware: MiddlewareFunction[];
    category: RouteCategory;
    summary?: string;
    description?: string;
    tags?: string[];
    deprecated?: boolean;
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
}

/**
 * Route parameters extracted from path
 */
export interface RouteParams {
    [key: string]: string;
}

/**
 * Advanced Router class
 */
export class Router {
    private routes: Map<string, RouteMetadata> = new Map();
    private globalMiddleware: MiddlewareFunction[] = [];

    /**
     * Register global middleware
     */
    use(middleware: MiddlewareFunction): this {
        this.globalMiddleware.push(middleware);
        return this;
    }

    /**
     * Register a GET route
     */
    get(path: string, handler: RouteHandler, options?: Partial<RouteMetadata>): this {
        return this.addRoute('GET', path, handler, options);
    }

    /**
     * Register a POST route
     */
    post(path: string, handler: RouteHandler, options?: Partial<RouteMetadata>): this {
        return this.addRoute('POST', path, handler, options);
    }

    /**
     * Register a PUT route
     */
    put(path: string, handler: RouteHandler, options?: Partial<RouteMetadata>): this {
        return this.addRoute('PUT', path, handler, options);
    }

    /**
     * Register a PATCH route
     */
    patch(path: string, handler: RouteHandler, options?: Partial<RouteMetadata>): this {
        return this.addRoute('PATCH', path, handler, options);
    }

    /**
     * Register a DELETE route
     */
    delete(path: string, handler: RouteHandler, options?: Partial<RouteMetadata>): this {
        return this.addRoute('DELETE', path, handler, options);
    }

    /**
     * Register a route with custom method
     */
    addRoute(
        method: HttpMethod,
        path: string,
        handler: RouteHandler,
        options?: Partial<RouteMetadata>
    ): this {
        const routeKey = `${method}:${path}`;

        // Validate path format
        if (!path.startsWith('/')) {
            throw new Error(`Route path must start with '/': ${path}`);
        }

        // Check for duplicate routes
        if (this.routes.has(routeKey)) {
            throw new Error(`Route already registered: ${method} ${path}`);
        }

        const route: RouteMetadata = {
            path,
            method,
            handler,
            middleware: options?.middleware || [],
            category: options?.category || 'api',
            summary: options?.summary,
            description: options?.description,
            tags: options?.tags || [],
            deprecated: options?.deprecated || false,
            rateLimit: options?.rateLimit,
        };

        this.routes.set(routeKey, route);
        return this;
    }

    /**
     * Get all registered routes
     */
    getRoutes(): RouteMetadata[] {
        return Array.from(this.routes.values());
    }

    /**
     * Get routes by category
     */
    getRoutesByCategory(category: RouteCategory): RouteMetadata[] {
        return this.getRoutes().filter(route => route.category === category);
    }

    /**
     * Get routes by tag
     */
    getRoutesByTag(tag: string): RouteMetadata[] {
        return this.getRoutes().filter(route => route.tags?.includes(tag));
    }

    /**
     * Find a route by method and path
     */
    findRoute(method: HttpMethod, path: string): RouteMetadata | undefined {
        // First try exact match
        const exactMatch = this.routes.get(`${method}:${path}`);
        if (exactMatch) {
            return exactMatch;
        }

        // Try pattern matching for routes with parameters
        for (const route of this.routes.values()) {
            if (route.method === method && this.matchPath(route.path, path)) {
                return route;
            }
        }

        return undefined;
    }

    /**
     * Extract route parameters from path
     */
    extractParams(routePath: string, requestPath: string): RouteParams {
        const params: RouteParams = {};
        const routeParts = routePath.split('/');
        const requestParts = requestPath.split('/');

        if (routeParts.length !== requestParts.length) {
            return params;
        }

        // Check if paths match before extracting params
        if (!this.matchPath(routePath, requestPath)) {
            return params;
        }

        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            if (routePart.startsWith(':')) {
                const paramName = routePart.substring(1);
                params[paramName] = decodeURIComponent(requestParts[i]);
            }
        }

        return params;
    }

    /**
     * Execute middleware chain for a route
     */
    async executeMiddleware(
        route: RouteMetadata,
        req: any,
        res: any
    ): Promise<void> {
        // Combine global and route-specific middleware
        const middleware = [...this.globalMiddleware, ...route.middleware];

        let index = 0;

        const next = async (): Promise<void> => {
            if (index >= middleware.length) {
                // All middleware executed, call the handler
                await route.handler(req, res);
                return;
            }

            const currentMiddleware = middleware[index];
            index++;

            await currentMiddleware(req, res, next);
        };

        await next();
    }

    /**
     * Match a route path pattern against a request path
     */
    private matchPath(routePath: string, requestPath: string): boolean {
        const routeParts = routePath.split('/');
        const requestParts = requestPath.split('/');

        if (routeParts.length !== requestParts.length) {
            return false;
        }

        for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const requestPart = requestParts[i];

            // Parameter part (starts with :)
            if (routePart.startsWith(':')) {
                continue;
            }

            // Exact match required for non-parameter parts
            if (routePart !== requestPart) {
                return false;
            }
        }

        return true;
    }

    /**
     * Remove a route
     */
    removeRoute(method: HttpMethod, path: string): boolean {
        return this.routes.delete(`${method}:${path}`);
    }

    /**
     * Clear all routes
     */
    clearRoutes(): void {
        this.routes.clear();
    }

    /**
     * Get global middleware
     */
    getGlobalMiddleware(): MiddlewareFunction[] {
        return [...this.globalMiddleware];
    }
}

/**
 * Create a new router instance
 */
export function createRouter(): Router {
    return new Router();
}
