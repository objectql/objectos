/**
 * API Response Wrapper
 * 
 * Implements standardized response format according to @objectstack/spec/api
 */

export interface ApiResponseMeta {
    timestamp: string;
    duration?: number;
    requestId?: string;
    traceId?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiResponseMeta;
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
    data: T,
    meta?: Partial<ApiResponseMeta>
): ApiResponse<T> {
    return {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };
}

/**
 * Create an error API response
 */
export function createErrorResponse(
    code: string,
    message: string,
    details?: any,
    meta?: Partial<ApiResponseMeta>
): ApiResponse {
    return {
        success: false,
        error: {
            code,
            message,
            details,
        },
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };
}

/**
 * Wrap a promise to return ApiResponse
 */
export async function wrapApiResponse<T>(
    fn: () => Promise<T>,
    meta?: Partial<ApiResponseMeta>
): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    try {
        const data = await fn();
        return createSuccessResponse(data, {
            ...meta,
            duration: Date.now() - startTime,
        });
    } catch (error) {
        const apiError = error as any;
        return createErrorResponse(
            apiError.code || 'INTERNAL_ERROR',
            apiError.message || 'An unexpected error occurred',
            apiError.details || { stack: apiError.stack },
            {
                ...meta,
                duration: Date.now() - startTime,
            }
        );
    }
}
