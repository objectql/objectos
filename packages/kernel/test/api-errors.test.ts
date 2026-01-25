/**
 * API Errors Tests
 */

import {
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
    ApiErrorCode,
} from '../src/api/errors';

describe('API Errors', () => {
    describe('ApiError', () => {
        it('should create basic error', () => {
            const error = new ApiError('TEST_ERROR', 'Test message', 500);
            
            expect(error.code).toBe('TEST_ERROR');
            expect(error.message).toBe('Test message');
            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('ApiError');
        });

        it('should include details', () => {
            const details = { field: 'email' };
            const error = new ApiError('ERROR', 'Message', 400, details);
            
            expect(error.details).toEqual(details);
        });
    });

    describe('BadRequestError', () => {
        it('should have correct status code', () => {
            const error = new BadRequestError();
            
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe(ApiErrorCode.BAD_REQUEST);
        });
    });

    describe('UnauthorizedError', () => {
        it('should have correct status code', () => {
            const error = new UnauthorizedError();
            
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe(ApiErrorCode.UNAUTHORIZED);
        });
    });

    describe('ForbiddenError', () => {
        it('should have correct status code', () => {
            const error = new ForbiddenError();
            
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe(ApiErrorCode.FORBIDDEN);
        });
    });

    describe('NotFoundError', () => {
        it('should have correct status code', () => {
            const error = new NotFoundError();
            
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe(ApiErrorCode.NOT_FOUND);
        });
    });

    describe('ConflictError', () => {
        it('should have correct status code', () => {
            const error = new ConflictError();
            
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe(ApiErrorCode.CONFLICT);
        });
    });

    describe('ValidationError', () => {
        it('should have correct status code', () => {
            const error = new ValidationError();
            
            expect(error.statusCode).toBe(422);
            expect(error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
        });
    });

    describe('RateLimitError', () => {
        it('should have correct status code', () => {
            const error = new RateLimitError();
            
            expect(error.statusCode).toBe(429);
            expect(error.code).toBe(ApiErrorCode.RATE_LIMIT_EXCEEDED);
        });
    });

    describe('InternalError', () => {
        it('should have correct status code', () => {
            const error = new InternalError();
            
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe(ApiErrorCode.INTERNAL_ERROR);
        });
    });

    describe('ServiceUnavailableError', () => {
        it('should have correct status code', () => {
            const error = new ServiceUnavailableError();
            
            expect(error.statusCode).toBe(503);
            expect(error.code).toBe(ApiErrorCode.SERVICE_UNAVAILABLE);
        });
    });

    describe('toApiError', () => {
        it('should return ApiError as is', () => {
            const original = new NotFoundError('Not found');
            const converted = toApiError(original);
            
            expect(converted).toBe(original);
        });

        it('should convert ValidationError name', () => {
            const error = { name: 'ValidationError', message: 'Invalid' };
            const converted = toApiError(error);
            
            expect(converted).toBeInstanceOf(ValidationError);
            expect(converted.message).toBe('Invalid');
        });

        it('should convert NotFoundError name', () => {
            const error = { name: 'NotFoundError', message: 'Missing' };
            const converted = toApiError(error);
            
            expect(converted).toBeInstanceOf(NotFoundError);
        });

        it('should convert unknown error to InternalError', () => {
            const error = new Error('Unknown error');
            const converted = toApiError(error);
            
            expect(converted).toBeInstanceOf(InternalError);
            expect(converted.message).toBe('Unknown error');
        });
    });
});
