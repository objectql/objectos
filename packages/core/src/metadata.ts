/**
 * Represents the supported field data types in the ObjectQL schema.
 * These types determine how data is stored, validated, and rendered.
 * 
 * - `text`: Simple string.
 * - `textarea`: Long string.
 * - `select`: Choice from a list.
 * - `lookup`: Relationship to another object.
 */
export type FieldType = 
    | 'text' 
    | 'textarea' 
    | 'html' 
    | 'select' 
    | 'date' 
    | 'datetime' 
    | 'number' 
    | 'currency' 
    | 'boolean' 
    | 'lookup' 
    | 'master_detail' 
    | 'password'
    | 'object'
    | 'grid';

/**
 * Defines a single option for select/multiselect fields.
 */
export interface FieldOption {
    /** The display label for the option. */
    label: string;
    /** The actual value stored in the database. */
    value: string | number;
}

/**
 * Configuration for a single field on an object.
 * This defines the schema, validation rules, and UI hints for the attribute.
 */
export interface FieldConfig {
    /** 
     * The unique API name of the field. 
     * If defined within an object map, this is often automatically populated from the key.
     */
    name?: string;
    
    /** The human-readable label used in UIs. */
    label?: string;
    
    /** The data type of the field. */
    type: FieldType;
    
    /** Whether the field is mandatory. Defaults to false. */
    required?: boolean;
    
    /** The default value if not provided during creation. */
    defaultValue?: any;
    
    /** 
     * Whether the field allows multiple values. 
     * Supported by 'select' and 'lookup'.
     */
    multiple?: boolean;

    // String options
    /** 
     * Options available for `select` or `multiselect` types.
     * Can be an array of strings or {@link FieldOption} objects.
     */
    options?: FieldOption[] | string[];
    
    // Number options
    /** Number of decimal places for `currency` types (e.g., 2). */
    scale?: number;
    /** Total number of digits for `number` types. */
    precision?: number;
    
    // Relationship properties
    /** 
     * The API name of the target object.
     * Required when type is `lookup` or `master_detail`.
     */
    reference_to?: string;

    // UI properties (kept for compatibility, though ObjectQL is a query engine)
    /** Implementation hint: Whether this field should be indexed for search. */
    searchable?: boolean;
    /** Implementation hint: Whether this field is sortable in lists. */
    sortable?: boolean;
    /** Implementation hint: Whether to create a database index for this column. */
    index?: boolean;
    
    // Other properties
    /** Description for documentation purposes. */
    description?: string;
}

/**
 * Configuration for a custom action (RPC).
 */
export interface ActionConfig {
    label?: string;
    description?: string;
    /** Output/Result type definition. */
    result?: {
        type: FieldType;
    };
    /** Input parameters schema. */
    params?: Record<string, FieldConfig>;
    /** Implementation of the action. */
    handler?: (ctx: any, params: any) => Promise<any>;
}

import { HookFunction } from './types';

export interface ObjectListeners {
    beforeCreate?: HookFunction;
    afterCreate?: HookFunction;
    beforeUpdate?: HookFunction;
    afterUpdate?: HookFunction;
    beforeDelete?: HookFunction;
    afterDelete?: HookFunction;
    beforeFind?: HookFunction;
    afterFind?: HookFunction;
}

/**
 * Configuration for a business object (Entity).
 * Analogous to a Database Table or MongoDB Collection.
 */
export interface ObjectConfig {
    name: string;
    datasource?: string; // The name of the datasource to use
    label?: string;
    icon?: string;
    description?: string;
    
    fields: Record<string, FieldConfig>;
    
    /** Custom Actions (RPC) defined on this object. */
    actions?: Record<string, ActionConfig>;

    /** Lifecycle hooks. */
    listeners?: ObjectListeners;

    /** Initial data to populate when system starts. */
    data?: any[];
}
