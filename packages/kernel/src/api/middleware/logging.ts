/**
 * Logging Middleware
 * 
 * Logs HTTP requests and responses
 */

/**
 * Logging configuration
 */
export interface LoggingConfig {
    /** Log request body */
    logBody?: boolean;
    /** Log request headers */
    logHeaders?: boolean;
    /** Skip logging for certain paths */
    skipPaths?: string[];
    /** Custom logger */
    logger?: {
        info: (message: string, context?: any) => void;
        error: (message: string, error?: any) => void;
    };
}

/**
 * Default logger
 */
const defaultLogger = {
    info: (message: string, context?: any) => {
        console.log(message, context || '');
    },
    error: (message: string, error?: any) => {
        console.error(message, error || '');
    },
};

/**
 * Create logging middleware
 */
export function createLoggingMiddleware(config: LoggingConfig = {}) {
    const {
        logBody = false,
        logHeaders = false,
        skipPaths = ['/health'],
        logger = defaultLogger,
    } = config;

    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        // Skip logging for certain paths
        if (skipPaths.some(path => req.path?.startsWith(path))) {
            return next();
        }

        const startTime = Date.now();
        const requestId = req.headers?.['x-request-id'] || generateRequestId();

        // Log request
        const requestLog: any = {
            requestId,
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers?.['user-agent'],
        };

        if (logHeaders) {
            requestLog.headers = req.headers;
        }

        if (logBody && req.body) {
            requestLog.body = sanitizeBody(req.body);
        }

        logger.info('HTTP Request', requestLog);

        // Attach request ID to request
        req.requestId = requestId;

        try {
            // Continue to next middleware
            await next();

            // Log successful response
            const duration = Date.now() - startTime;
            logger.info('HTTP Response', {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode || 200,
                duration: `${duration}ms`,
            });
        } catch (error) {
            // Log error response
            const duration = Date.now() - startTime;
            logger.error('HTTP Error', {
                requestId,
                method: req.method,
                path: req.path,
                duration: `${duration}ms`,
                error: error instanceof Error ? error.message : 'Unknown error',
            });

            // Re-throw error
            throw error;
        }
    };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Sanitize body to remove sensitive information
 */
function sanitizeBody(body: any): any {
    if (typeof body !== 'object' || body === null) {
        return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'accessToken'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
        if (field in sanitized) {
            sanitized[field] = '[REDACTED]';
        }
    }

    return sanitized;
}

/**
 * Create request ID middleware
 */
export function createRequestIdMiddleware() {
    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        // Generate or use existing request ID
        const requestId = req.headers?.['x-request-id'] || generateRequestId();
        
        req.requestId = requestId;
        
        // Set response header
        if (res.setHeader) {
            res.setHeader('X-Request-ID', requestId);
        }

        await next();
    };
}
