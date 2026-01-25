/**
 * API Error Handling
 * 
 * Implements standardized error codes and error classes
 */

export enum ApiErrorCode {
    // Client Errors (4xx)
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    
    // Server Errors (5xx)
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    TIMEOUT = 'TIMEOUT',
    
    // Business Logic Errors
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
    INVALID_STATE = 'INVALID_STATE',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
}

/**
 * Base API Error class
 */
export class ApiError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: any;

    constructor(code: string, message: string, statusCode: number = 500, details?: any) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        
        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends ApiError {
    constructor(message: string = 'Bad Request', details?: any) {
        super(ApiErrorCode.BAD_REQUEST, message, 400, details);
        this.name = 'BadRequestError';
    }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized', details?: any) {
        super(ApiErrorCode.UNAUTHORIZED, message, 401, details);
        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends ApiError {
    constructor(message: string = 'Forbidden', details?: any) {
        super(ApiErrorCode.FORBIDDEN, message, 403, details);
        this.name = 'ForbiddenError';
    }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
    constructor(message: string = 'Resource not found', details?: any) {
        super(ApiErrorCode.NOT_FOUND, message, 404, details);
        this.name = 'NotFoundError';
    }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
    constructor(message: string = 'Resource conflict', details?: any) {
        super(ApiErrorCode.CONFLICT, message, 409, details);
        this.name = 'ConflictError';
    }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends ApiError {
    constructor(message: string = 'Validation failed', details?: any) {
        super(ApiErrorCode.VALIDATION_ERROR, message, 422, details);
        this.name = 'ValidationError';
    }
}

/**
 * Rate Limit Exceeded Error (429)
 */
export class RateLimitError extends ApiError {
    constructor(message: string = 'Rate limit exceeded', details?: any) {
        super(ApiErrorCode.RATE_LIMIT_EXCEEDED, message, 429, details);
        this.name = 'RateLimitError';
    }
}

/**
 * Internal Error (500)
 */
export class InternalError extends ApiError {
    constructor(message: string = 'Internal server error', details?: any) {
        super(ApiErrorCode.INTERNAL_ERROR, message, 500, details);
        this.name = 'InternalError';
    }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends ApiError {
    constructor(message: string = 'Service unavailable', details?: any) {
        super(ApiErrorCode.SERVICE_UNAVAILABLE, message, 503, details);
        this.name = 'ServiceUnavailableError';
    }
}

/**
 * Convert error to API error
 */
export function toApiError(error: any): ApiError {
    if (error instanceof ApiError) {
        return error;
    }
    
    // Handle common error types
    if (error.name === 'ValidationError') {
        return new ValidationError(error.message, error.details);
    }
    
    if (error.name === 'NotFoundError') {
        return new NotFoundError(error.message, error.details);
    }
    
    // Default to internal error
    return new InternalError(error.message || 'An unexpected error occurred', {
        originalError: error.message,
        stack: error.stack,
    });
}
