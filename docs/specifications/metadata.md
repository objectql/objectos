# ObjectQL Metadata Specification

## Overview

This document defines the structure of the Object Definition format used in ObjectQL. It is inspired by the Steedos `object.yml` format but adapted for a standalone query engine.

## Object Definition (`ObjectConfig`)

An object represents a business entity (e.g., `projects`, `tasks`).

```typescript
interface ObjectConfig {
    name: string;        // Unique machine name (e.g., 'project_tasks')
    label?: string;      // Human readable label
    icon?: string;       // Icon name
    description?: string;
    fields: Record<string, FieldConfig>; // Field definitions
}
```

## Field Definition (`FieldConfig`)

Fields define the data structure of the object.

### properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | string | Field API Name. Optional if key is used. |
| `type` | string | See Supported Types below. |
| `label` | string | Human readable label. |
| `required` | boolean | Is the field mandatory? |
| `defaultValue` | any | Default value for new records. |

### Supported Types

*   **Primitive**: `text`, `textarea`, `html`, `boolean`, `date`, `datetime`, `password`
*   **Numeric**: `number` (float), `currency` (fixed precision)
*   **Selection**: `select` (single), `multiselect` (multiple)
    *   Requires `options`: `{ label: string, value: any }[]` or `string[]`
*   **Relationship**:
    *   `lookup`: Many-to-One relationship. Requires `reference_to` (Object Name).
    *   `master_detail`: Strong ownership relationship. Requires `reference_to`.

## Example (YAML)

```yaml
name: project
label: Project
fields:
  name:
    type: text
    required: true
  status:
    type: select
    options: ["planned", "active", "closed"]
  manager:
    type: lookup
    reference_to: users
```
