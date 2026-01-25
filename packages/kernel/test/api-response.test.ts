/**
 * API Response Tests
 */

import {
    createSuccessResponse,
    createErrorResponse,
    wrapApiResponse,
} from '../src/api/response';

describe('API Response', () => {
    describe('createSuccessResponse', () => {
        it('should create a successful response with data', () => {
            const data = { id: '123', name: 'Test' };
            const response = createSuccessResponse(data);

            expect(response.success).toBe(true);
            expect(response.data).toEqual(data);
            expect(response.meta).toBeDefined();
            expect(response.meta?.timestamp).toBeDefined();
        });

        it('should include custom meta', () => {
            const data = { value: 42 };
            const meta = { requestId: 'req-123', duration: 150 };
            const response = createSuccessResponse(data, meta);

            expect(response.meta?.requestId).toBe('req-123');
            expect(response.meta?.duration).toBe(150);
        });
    });

    describe('createErrorResponse', () => {
        it('should create an error response', () => {
            const response = createErrorResponse('NOT_FOUND', 'Resource not found');

            expect(response.success).toBe(false);
            expect(response.error).toBeDefined();
            expect(response.error?.code).toBe('NOT_FOUND');
            expect(response.error?.message).toBe('Resource not found');
        });

        it('should include error details', () => {
            const details = { field: 'email', reason: 'invalid format' };
            const response = createErrorResponse('VALIDATION_ERROR', 'Validation failed', details);

            expect(response.error?.details).toEqual(details);
        });
    });

    describe('wrapApiResponse', () => {
        it('should wrap successful promise', async () => {
            const fn = async () => ({ result: 'success' });
            const response = await wrapApiResponse(fn);

            expect(response.success).toBe(true);
            expect(response.data).toEqual({ result: 'success' });
            expect(response.meta?.duration).toBeGreaterThanOrEqual(0);
        });

        it('should wrap rejected promise', async () => {
            const fn = async () => {
                throw new Error('Test error');
            };
            const response = await wrapApiResponse(fn);

            expect(response.success).toBe(false);
            expect(response.error?.message).toBe('Test error');
        });

        it('should include custom meta in wrapped response', async () => {
            const fn = async () => ({ value: 1 });
            const response = await wrapApiResponse(fn, { requestId: 'test-123' });

            expect(response.meta?.requestId).toBe('test-123');
        });
    });
});
