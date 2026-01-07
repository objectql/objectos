# Unified Query DSL Specification

## Overview

The Unified Query DSL (Domain Specific Language) is a JSON-based syntax for querying data. It is driver-agnostic and compiles to native queries (SQL, Mongo Aggregation, etc.).

## Query Structure

```typescript
interface UnifiedQuery {
    entity: string;         // The object to query
    fields?: string[];      // List of fields to select
    filters?: FilterExpr;   // Filter conditions
    sort?: SortExpr[];      // Sorting rules
    expand?: ExpandExpr;    // Relationship expansion (Joins)
    limit?: number;
    offset?: number;
}
```

## Filters

Filters can be simple arrays or logical groups.

*   **Simple**: `['field', 'operator', value]`
    *   Example: `['amount', '>', 500]`
*   **Logical**: `[Filter, 'or' | 'and', Filter]`
    *   Example: `[['status', '=', 'active'], 'and', ['amount', '>', 500]]`

## Expansion (Joins)

Expand related records into the result set.

```javascript
expand: {
    customer: {
        fields: ['name', 'email']
    },
    tasks: {
        fields: ['subject'],
        filters: [['status', '!=', 'completed']]
    }
}
```
