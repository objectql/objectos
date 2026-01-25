/**
 * Data Transformation and Mapping Engine
 * 
 * Transforms request/response data using JSONPath and custom transformers
 */

/**
 * Transformation rule
 */
export interface TransformRule {
    /** Source path (JSONPath expression) */
    from: string;
    /** Target path (JSONPath expression) */
    to: string;
    /** Optional transformation function */
    transform?: (value: any) => any;
}

/**
 * Transformation config
 */
export interface TransformConfig {
    rules: TransformRule[];
}

/**
 * Simple JSONPath implementation for basic needs
 * For production use, consider jsonpath-plus library
 */
class SimpleJSONPath {
    /**
     * Get value from object using path
     */
    static get(obj: any, path: string): any {
        if (!path || path === '$' || path === '.') {
            return obj;
        }

        // Remove leading $. or $
        path = path.replace(/^\$\.?/, '');

        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (current === undefined || current === null) {
                return undefined;
            }

            // Handle array indexing
            const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
            if (arrayMatch) {
                const [, key, index] = arrayMatch;
                current = current[key]?.[parseInt(index)];
            } else {
                current = current[part];
            }
        }

        return current;
    }

    /**
     * Set value in object using path
     */
    static set(obj: any, path: string, value: any): void {
        if (!path || path === '$') {
            throw new Error('Cannot set root object');
        }

        // Remove leading $. or $
        path = path.replace(/^\$\.?/, '');

        const parts = path.split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];

            // Handle array indexing
            const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
            if (arrayMatch) {
                const [, key, index] = arrayMatch;
                if (!current[key]) {
                    current[key] = [];
                }
                if (!current[key][parseInt(index)]) {
                    current[key][parseInt(index)] = {};
                }
                current = current[key][parseInt(index)];
            } else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }

        const lastPart = parts[parts.length - 1];
        const arrayMatch = lastPart.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
            const [, key, index] = arrayMatch;
            if (!current[key]) {
                current[key] = [];
            }
            current[key][parseInt(index)] = value;
        } else {
            current[lastPart] = value;
        }
    }
}

/**
 * Data mapper class
 */
export class DataMapper {
    /**
     * Apply transformations to data
     */
    static transform(data: any, config: TransformConfig): any {
        const result = {};

        for (const rule of config.rules) {
            // Get value from source
            let value = SimpleJSONPath.get(data, rule.from);

            // Apply transformation if provided
            if (rule.transform) {
                value = rule.transform(value);
            }

            // Set value in target
            if (value !== undefined) {
                SimpleJSONPath.set(result, rule.to, value);
            }
        }

        return result;
    }

    /**
     * Map array of data
     */
    static transformArray(dataArray: any[], config: TransformConfig): any[] {
        return dataArray.map(data => this.transform(data, config));
    }

    /**
     * Create mapper function
     */
    static createMapper(config: TransformConfig): (data: any) => any {
        return (data: any) => this.transform(data, config);
    }
}

/**
 * Common transformers
 */
export const Transformers = {
    /** Convert to uppercase */
    toUpperCase: (value: any) => typeof value === 'string' ? value.toUpperCase() : value,

    /** Convert to lowercase */
    toLowerCase: (value: any) => typeof value === 'string' ? value.toLowerCase() : value,

    /** Convert to number */
    toNumber: (value: any) => {
        const num = Number(value);
        return isNaN(num) ? value : num;
    },

    /** Convert to string */
    toString: (value: any) => String(value),

    /** Convert to boolean */
    toBoolean: (value: any) => Boolean(value),

    /** Parse JSON string */
    parseJSON: (value: any) => {
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
            return value;
        }
    },

    /** Stringify to JSON */
    stringifyJSON: (value: any) => JSON.stringify(value),

    /** Trim whitespace */
    trim: (value: any) => typeof value === 'string' ? value.trim() : value,

    /** Format date to ISO string */
    toISODate: (value: any) => {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toISOString();
    },

    /** Default value if null/undefined */
    defaultValue: (defaultVal: any) => (value: any) => value ?? defaultVal,

    /** Rename field (used in rules) */
    rename: (from: string, to: string): TransformRule => ({
        from,
        to,
    }),

    /** Copy field */
    copy: (from: string, to: string): TransformRule => ({
        from,
        to,
    }),
};

/**
 * Create transformation config
 */
export function createTransformConfig(rules: TransformRule[]): TransformConfig {
    return { rules };
}

/**
 * Quick transform helper
 */
export function transform(data: any, rules: TransformRule[]): any {
    return DataMapper.transform(data, { rules });
}
