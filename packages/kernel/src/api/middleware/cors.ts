/**
 * CORS Middleware
 * 
 * Handles Cross-Origin Resource Sharing
 */

/**
 * CORS configuration
 */
export interface CorsConfig {
    /** Allowed origins (string, array, or function) */
    origin?: string | string[] | ((origin: string) => boolean);
    /** Allowed HTTP methods */
    methods?: string[];
    /** Allowed headers */
    allowedHeaders?: string[];
    /** Exposed headers */
    exposedHeaders?: string[];
    /** Allow credentials */
    credentials?: boolean;
    /** Max age for preflight cache */
    maxAge?: number;
    /** Preflight continue */
    preflightContinue?: boolean;
}

/**
 * Default CORS configuration
 */
const defaultConfig: CorsConfig = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: [],
    credentials: false,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigin: string | string[] | ((origin: string) => boolean)): boolean {
    if (allowedOrigin === '*') {
        return true;
    }

    if (typeof allowedOrigin === 'function') {
        return allowedOrigin(origin);
    }

    if (Array.isArray(allowedOrigin)) {
        return allowedOrigin.includes(origin);
    }

    return origin === allowedOrigin;
}

/**
 * Create CORS middleware
 */
export function createCorsMiddleware(config: CorsConfig = {}) {
    const fullConfig = { ...defaultConfig, ...config };

    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        const origin = req.headers?.origin || req.headers?.Origin;

        // Check if origin is allowed
        if (origin && fullConfig.origin) {
            const allowed = isOriginAllowed(origin, fullConfig.origin);
            
            if (allowed) {
                // Set CORS headers
                if (res.setHeader) {
                    // Allow origin
                    if (fullConfig.origin === '*') {
                        res.setHeader('Access-Control-Allow-Origin', '*');
                    } else {
                        res.setHeader('Access-Control-Allow-Origin', origin);
                    }

                    // Allow credentials
                    if (fullConfig.credentials) {
                        res.setHeader('Access-Control-Allow-Credentials', 'true');
                    }

                    // Expose headers
                    if (fullConfig.exposedHeaders && fullConfig.exposedHeaders.length > 0) {
                        res.setHeader('Access-Control-Expose-Headers', fullConfig.exposedHeaders.join(', '));
                    }
                }
            }
        }

        // Handle preflight requests (OPTIONS)
        if (req.method === 'OPTIONS') {
            if (res.setHeader) {
                // Allow methods
                if (fullConfig.methods && fullConfig.methods.length > 0) {
                    res.setHeader('Access-Control-Allow-Methods', fullConfig.methods.join(', '));
                }

                // Allow headers
                const requestHeaders = req.headers?.['access-control-request-headers'];
                if (requestHeaders) {
                    res.setHeader('Access-Control-Allow-Headers', requestHeaders);
                } else if (fullConfig.allowedHeaders && fullConfig.allowedHeaders.length > 0) {
                    res.setHeader('Access-Control-Allow-Headers', fullConfig.allowedHeaders.join(', '));
                }

                // Max age
                if (fullConfig.maxAge) {
                    res.setHeader('Access-Control-Max-Age', String(fullConfig.maxAge));
                }
            }

            if (!fullConfig.preflightContinue) {
                // End preflight request
                if (res.status && res.send) {
                    res.status(204).send();
                }
                return;
            }
        }

        await next();
    };
}

/**
 * Create CORS middleware with multiple origins
 */
export function createCorsWithOrigins(origins: string[], config?: Omit<CorsConfig, 'origin'>) {
    return createCorsMiddleware({
        ...config,
        origin: origins,
    });
}

/**
 * Create CORS middleware with custom origin validator
 */
export function createCorsWithValidator(
    validator: (origin: string) => boolean,
    config?: Omit<CorsConfig, 'origin'>
) {
    return createCorsMiddleware({
        ...config,
        origin: validator,
    });
}
