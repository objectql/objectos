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
    | 'markdown'
    | 'html' 
    | 'select' 
    | 'date' 
    | 'datetime' 
    | 'time'
    | 'number' 
    | 'currency' 
    | 'percent'
    | 'boolean' 
    | 'email'
    | 'phone'
    | 'url'
    | 'image'
    | 'file'
    | 'avatar'
    | 'location'
    | 'lookup' 
    | 'master_detail'  
    | 'password'
    | 'formula'
    | 'summary'
    | 'auto_number'
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

    /** Whether the field is unique in the table. */
    unique?: boolean;

    /** Whether the field is read-only in UI. */
    readonly?: boolean;

    /** Whether the field is hidden from default UI/API response. */
    hidden?: boolean;
    
    /** The default value if not provided during creation. */
    defaultValue?: any;

    /** Tooltip or help text for the user. */
    help_text?: string;
    
    /** 
     * Whether the field allows multiple values. 
     * Supported by 'select', 'lookup', 'file', 'image'.
     */
    multiple?: boolean;
    
    // Validation properties
    /** Minimum for number/currency/percent. */
    min?: number;
    /** Maximum for number/currency/percent. */
    max?: number;
    /** Minimum length for text based fields. */
    min_length?: number;
    /** Maximum length for text based fields. */
    max_length?: number;
    /** Regular expression pattern for validation. */
    regex?: string;

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

    // UI properties
    /** Number of rows for textarea fields. */
    rows?: number;
    
    // Relationship properties
    /** 
     * The API name of the target object.
     * Required when type is `lookup` or `master_detail` or `summary`.
     */
    reference_to?: string;

    // Formula properties
    /** The expression for formula fields. */
    expression?: string;
    /** The return data type for formula or summary fields. */
    data_type?: 'text' | 'boolean' | 'date' | 'datetime' | 'number' | 'currency' | 'percent';

    // Summary properties
    /** The child object to summarize. */
    summary_object?: string;
    /** The type of summary calculation. */
    summary_type?: 'count' | 'sum' | 'min' | 'max' | 'avg';
    /** The field on the child object to aggregate. */
    summary_field?: string;
    /** Filters to apply to child records before summarizing. */
    summary_filters?: any[] | string;

    // Auto Number properties
    /** The format pattern for auto number fields (e.g. 'INV-{YYYY}-{0000}'). */
    auto_number_format?: string;

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
