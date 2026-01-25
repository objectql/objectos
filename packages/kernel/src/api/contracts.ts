/**
 * Standard API Request Contracts
 * 
 * Implements request schemas according to @objectstack/spec/api
 */

export type RecordData = Record<string, any>;

/**
 * Create Request
 */
export interface CreateRequest {
    data: RecordData;
}

/**
 * Update Request
 */
export interface UpdateRequest {
    id: string;
    data: RecordData;
}

/**
 * Query Filter
 */
export interface QueryFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
    value: any;
}

/**
 * Query Request
 */
export interface QueryRequest {
    filters?: QueryFilter[];
    fields?: string[];
    sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
    limit?: number;
    offset?: number;
}

/**
 * Delete Request
 */
export interface DeleteRequest {
    id: string;
}

/**
 * Batch Request
 */
export interface BatchRequest<T = any> {
    operations: Array<{
        type: 'create' | 'update' | 'delete';
        data?: T;
        id?: string;
    }>;
}

/**
 * Validate Create Request
 */
export function validateCreateRequest(request: any): request is CreateRequest {
    return !!request && typeof request === 'object' && 'data' in request && typeof request.data === 'object' && request.data !== null;
}

/**
 * Validate Update Request
 */
export function validateUpdateRequest(request: any): request is UpdateRequest {
    return (
        !!request &&
        typeof request === 'object' &&
        'id' in request &&
        typeof request.id === 'string' &&
        'data' in request &&
        typeof request.data === 'object' &&
        request.data !== null
    );
}

/**
 * Validate Query Request
 */
export function validateQueryRequest(request: any): request is QueryRequest {
    if (!request || typeof request !== 'object') {
        return false;
    }
    
    // All fields are optional
    if (request.filters && !Array.isArray(request.filters)) {
        return false;
    }
    
    if (request.fields && !Array.isArray(request.fields)) {
        return false;
    }
    
    if (request.sort && !Array.isArray(request.sort)) {
        return false;
    }
    
    return true;
}

/**
 * Validate Delete Request
 */
export function validateDeleteRequest(request: any): request is DeleteRequest {
    return !!request && typeof request === 'object' && 'id' in request && typeof request.id === 'string';
}
