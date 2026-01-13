import { ObjectConfig, FieldConfig } from '@objectql/types';

/**
 * Special marker value to indicate field deletion.
 * Use this in YAML: `field_name: null` or `field_name: { _deleted: true }`
 */
export const DELETED_MARKER = { _deleted: true };

/**
 * Check if a value is a deletion marker.
 */
export function isDeleted(value: any): boolean {
    return value === null || 
           value === undefined || 
           (typeof value === 'object' && value !== null && value._deleted === true);
}

/**
 * Merge two field configurations.
 * - If override is null or { _deleted: true }, returns null (field deleted)
 * - Otherwise, performs deep merge of field properties
 */
export function mergeFieldConfig(base: FieldConfig, override: any): FieldConfig | null {
    // Check for deletion
    if (isDeleted(override)) {
        return null;
    }

    // If override is not an object, treat as replacement
    if (typeof override !== 'object' || override === null) {
        return override;
    }

    // Deep merge field properties
    const merged: any = { ...base };

    for (const [key, value] of Object.entries(override)) {
        if (key === '_deleted') continue; // Skip marker

        if (isDeleted(value)) {
            // Delete this specific property
            delete merged[key];
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Deep merge nested objects
            if (typeof merged[key] === 'object' && merged[key] !== null && !Array.isArray(merged[key])) {
                merged[key] = { ...merged[key], ...value };
            } else {
                merged[key] = value;
            }
        } else {
            // Override simple values and arrays
            merged[key] = value;
        }
    }

    return merged;
}

/**
 * Merge fields from override into base fields.
 * Supports:
 * - Adding new fields
 * - Overriding existing fields
 * - Deleting fields (when set to null or { _deleted: true })
 * - Deep merging field properties
 */
export function mergeFields(
    baseFields: Record<string, FieldConfig>,
    overrideFields: Record<string, any>
): Record<string, FieldConfig> {
    const merged: Record<string, FieldConfig> = { ...baseFields };

    for (const [fieldName, fieldOverride] of Object.entries(overrideFields)) {
        const baseField = merged[fieldName];

        if (isDeleted(fieldOverride)) {
            // Delete the field
            delete merged[fieldName];
        } else if (baseField) {
            // Merge with existing field
            const mergedField = mergeFieldConfig(baseField, fieldOverride);
            if (mergedField === null) {
                delete merged[fieldName];
            } else {
                merged[fieldName] = mergedField;
            }
        } else {
            // Add new field
            merged[fieldName] = fieldOverride;
        }
    }

    return merged;
}

/**
 * Merge two object configurations.
 * Supports:
 * - Overriding top-level properties (label, icon, description, etc.)
 * - Extending/overriding fields
 * - Deleting fields
 * - Merging indexes and actions
 */
export function mergeObjectConfig(base: ObjectConfig, override: Partial<ObjectConfig>): ObjectConfig {
    const merged: ObjectConfig = { ...base };

    // Merge top-level properties
    if (override.label !== undefined) merged.label = override.label;
    if (override.icon !== undefined) merged.icon = override.icon;
    if (override.description !== undefined) merged.description = override.description;
    if (override.datasource !== undefined) merged.datasource = override.datasource;

    // Merge fields
    if (override.fields) {
        merged.fields = mergeFields(base.fields, override.fields);
    }

    // Merge indexes
    if (override.indexes) {
        merged.indexes = { ...base.indexes, ...override.indexes };
    }

    // Merge actions
    if (override.actions) {
        merged.actions = { ...base.actions, ...override.actions };
    }

    // Merge validation
    if (override.validation) {
        merged.validation = {
            rules: override.validation.rules || base.validation?.rules,
            ai_context: override.validation.ai_context || base.validation?.ai_context
        };
    }

    // Merge AI config
    if (override.ai) {
        merged.ai = {
            search: override.ai.search || base.ai?.search
        };
    }

    return merged;
}
