export type FieldType = 
    | 'text' 
    | 'textarea' 
    | 'html' 
    | 'select' 
    | 'date' 
    | 'datetime' 
    | 'number' 
    | 'currency' 
    | 'percent'
    | 'boolean' 
    | 'lookup' 
    | 'master_detail' 
    | 'password'
    | 'formula'
    | 'summary'
    | 'auto_number'
    | 'object'
    | 'grid';

export interface FieldOption {
    label: string;
    value: string | number;
}

export interface FieldConfig {
    name?: string;
    label?: string;
    type: FieldType;
    required?: boolean;
    defaultValue?: any;
    multiple?: boolean;
    options?: FieldOption[] | string[];
    scale?: number;
    precision?: number;
    reference_to?: string;
    
    // Formula
    expression?: string;
    data_type?: 'text' | 'boolean' | 'date' | 'datetime' | 'number' | 'currency' | 'percent';

    // Summary
    summary_object?: string;
    summary_type?: 'count' | 'sum' | 'min' | 'max' | 'avg';
    summary_field?: string;
    summary_filters?: any[] | string;

    // Auto Number
    auto_number_format?: string;

    searchable?: boolean;
    sortable?: boolean;
    index?: boolean;
    description?: string;
}

export interface ActionConfig {
    label?: string;
    description?: string;
    handler?: Function;
    result?: unknown;
}

export interface ObjectConfig {
    name: string;
    label?: string;
    description?: string;
    icon?: string;
    fields?: Record<string, FieldConfig>;
    methods?: Record<string, Function>;
    listeners?: Record<string, Function>;
    actions?: Record<string, ActionConfig>;
    data?: any[];
}
