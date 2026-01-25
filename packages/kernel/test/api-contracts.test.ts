/**
 * API Contracts Tests
 */

import {
    validateCreateRequest,
    validateUpdateRequest,
    validateQueryRequest,
    validateDeleteRequest,
} from '../src/api/contracts';

describe('API Contracts', () => {
    describe('validateCreateRequest', () => {
        it('should validate valid create request', () => {
            const request = { data: { name: 'Test', value: 42 } };
            expect(validateCreateRequest(request)).toBe(true);
        });

        it('should reject invalid create request', () => {
            expect(validateCreateRequest({})).toBe(false);
            expect(validateCreateRequest({ data: null })).toBe(false);
            expect(validateCreateRequest(null)).toBe(false);
        });
    });

    describe('validateUpdateRequest', () => {
        it('should validate valid update request', () => {
            const request = { id: '123', data: { name: 'Updated' } };
            expect(validateUpdateRequest(request)).toBe(true);
        });

        it('should reject invalid update request', () => {
            expect(validateUpdateRequest({})).toBe(false);
            expect(validateUpdateRequest({ id: '123' })).toBe(false);
            expect(validateUpdateRequest({ data: {} })).toBe(false);
        });
    });

    describe('validateQueryRequest', () => {
        it('should validate empty query request', () => {
            expect(validateQueryRequest({})).toBe(true);
        });

        it('should validate query with filters', () => {
            const request = {
                filters: [{ field: 'status', operator: 'eq', value: 'active' }],
            };
            expect(validateQueryRequest(request)).toBe(true);
        });

        it('should validate query with all options', () => {
            const request = {
                filters: [{ field: 'age', operator: 'gt', value: 18 }],
                fields: ['name', 'email'],
                sort: [{ field: 'created_at', order: 'desc' }],
                limit: 10,
                offset: 0,
            };
            expect(validateQueryRequest(request as any)).toBe(true);
        });

        it('should reject invalid query request', () => {
            expect(validateQueryRequest({ filters: 'invalid' })).toBe(false);
            expect(validateQueryRequest({ fields: 'invalid' })).toBe(false);
        });
    });

    describe('validateDeleteRequest', () => {
        it('should validate valid delete request', () => {
            const request = { id: '123' };
            expect(validateDeleteRequest(request)).toBe(true);
        });

        it('should reject invalid delete request', () => {
            expect(validateDeleteRequest({})).toBe(false);
            expect(validateDeleteRequest({ id: 123 })).toBe(false);
            expect(validateDeleteRequest(null)).toBe(false);
        });
    });
});
