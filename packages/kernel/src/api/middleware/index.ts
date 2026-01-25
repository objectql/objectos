/**
 * Middleware Exports
 * 
 * Central export point for all middleware
 */

// Auth middleware
export {
    createAuthMiddleware,
    createAuthorizationMiddleware,
    createRoleMiddleware,
    extractTokenFromHeader,
    type AuthConfig,
    type JwtPayload,
} from './auth';

// Rate limit middleware
export {
    createRateLimitMiddleware,
    createEndpointRateLimiter,
    type RateLimitMiddlewareConfig,
} from './rate-limit';

// Logging middleware
export {
    createLoggingMiddleware,
    createRequestIdMiddleware,
    type LoggingConfig,
} from './logging';

// Validation middleware
export {
    createValidationMiddleware,
    createQueryValidationMiddleware,
    validate,
    ValidationRules,
    type ValidationSchema,
    type FieldRule,
    type ValidationResult,
} from './validation';

// CORS middleware
export {
    createCorsMiddleware,
    createCorsWithOrigins,
    createCorsWithValidator,
    type CorsConfig,
} from './cors';
