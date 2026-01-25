/**
 * API Protocol Exports
 * 
 * Main entry point for API-related functionality
 */

// Response handling
export {
    ApiResponseMeta,
    ApiResponse,
    createSuccessResponse,
    createErrorResponse,
    wrapApiResponse,
} from './response';

// Request contracts
export * from './contracts';

// Error handling
export {
    ApiErrorCode,
    ApiError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    RateLimitError,
    InternalError,
    ServiceUnavailableError,
    toApiError,
} from './errors';

// Router
export {
    Router,
    createRouter,
    type HttpMethod,
    type RouteCategory,
    type MiddlewareFunction,
    type RouteHandler,
    type RouteMetadata,
    type RouteParams,
} from './router';

// Rate limiting
export {
    RateLimiter,
    createRateLimiter,
    MemoryRateLimitStore,
    RateLimitPresets,
    type RateLimitConfig,
    type RateLimitInfo,
    type RateLimitStore,
} from './rate-limit';

// Middleware
export * from './middleware';

// Data mapping and transformation
export {
    DataMapper,
    Transformers,
    createTransformConfig,
    transform,
    type TransformRule,
    type TransformConfig,
} from './mapping';

// Endpoint registry
export {
    EndpointRegistry,
    createEndpointRegistry,
    EndpointType,
    type EndpointConfig,
    type EndpointHandler,
} from './endpoint-registry';

// Endpoint types
export * from './endpoint-types';
