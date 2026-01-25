/**
 * Validation Middleware
 * 
 * Validates request data against schemas
 */

import { ValidationError } from '../errors';

/**
 * Field validation rule
 */
export interface FieldRule {
    /** Field is required */
    required?: boolean;
    /** Field type */
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    /** Minimum value (for numbers) or length (for strings/arrays) */
    min?: number;
    /** Maximum value (for numbers) or length (for strings/arrays) */
    max?: number;
    /** Pattern to match (for strings) */
    pattern?: RegExp;
    /** Allowed values (enum) */
    enum?: any[];
    /** Custom validation function */
    validate?: (value: any) => boolean | string;
}

/**
 * Validation schema
 */
export interface ValidationSchema {
    [field: string]: FieldRule;
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: Array<{ field: string; message: string }>;
}

/**
 * Validate a value against a field rule
 */
function validateField(field: string, value: any, rule: FieldRule): string | null {
    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
        return `${field} is required`;
    }

    // Skip other validations if value is not provided and not required
    if (value === undefined || value === null) {
        return null;
    }

    // Check type
    if (rule.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
            return `${field} must be of type ${rule.type}`;
        }
    }

    // Check min/max for numbers
    if (rule.type === 'number') {
        if (rule.min !== undefined && value < rule.min) {
            return `${field} must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && value > rule.max) {
            return `${field} must be at most ${rule.max}`;
        }
    }

    // Check min/max length for strings and arrays
    if (rule.type === 'string' || rule.type === 'array') {
        const length = value.length;
        if (rule.min !== undefined && length < rule.min) {
            return `${field} must have at least ${rule.min} characters`;
        }
        if (rule.max !== undefined && length > rule.max) {
            return `${field} must have at most ${rule.max} characters`;
        }
    }

    // Check pattern for strings
    if (rule.type === 'string' && rule.pattern) {
        if (!rule.pattern.test(value)) {
            return `${field} does not match the required pattern`;
        }
    }

    // Check enum
    if (rule.enum && !rule.enum.includes(value)) {
        return `${field} must be one of: ${rule.enum.join(', ')}`;
    }

    // Custom validation
    if (rule.validate) {
        const result = rule.validate(value);
        if (result === false) {
            return `${field} is invalid`;
        }
        if (typeof result === 'string') {
            return result;
        }
    }

    return null;
}

/**
 * Validate data against schema
 */
export function validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    // Validate each field in schema
    for (const [field, rule] of Object.entries(schema)) {
        const value = data[field];
        const error = validateField(field, value, rule);
        
        if (error) {
            errors.push({ field, message: error });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Create validation middleware for request body
 */
export function createValidationMiddleware(schema: ValidationSchema) {
    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        const result = validate(req.body || {}, schema);

        if (!result.valid) {
            throw new ValidationError('Request validation failed', {
                errors: result.errors,
            });
        }

        await next();
    };
}

/**
 * Create validation middleware for query parameters
 */
export function createQueryValidationMiddleware(schema: ValidationSchema) {
    return async (req: any, res: any, next: () => void | Promise<void>): Promise<void> => {
        const result = validate(req.query || {}, schema);

        if (!result.valid) {
            throw new ValidationError('Query parameter validation failed', {
                errors: result.errors,
            });
        }

        await next();
    };
}

/**
 * Common validation rules
 */
export const ValidationRules = {
    email: {
        type: 'string' as const,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    url: {
        type: 'string' as const,
        pattern: /^https?:\/\/.+/,
    },
    uuid: {
        type: 'string' as const,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    },
    positiveInteger: {
        type: 'number' as const,
        min: 1,
        validate: (value: any) => Number.isInteger(value) || 'Must be an integer',
    },
};
