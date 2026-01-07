# ObjectQL Query Protocol (JSON-DSL)

**Version:** 1.0.0
**Context:** This document is part of the [ObjectQL Core Specification](./SPECIFICATION.md).

## 1. Overview

The Unified Query Protocol (JSON-DSL) is the internal Abstract Syntax Tree (AST) used for all data operations within ObjectQL. It serves as an intermediate language that decouples the client and business logic from the underlying storage engine.

It is designed to be a JSON-serializable representation of a SQL/NoSQL query.

## 2. Interface (TypeScript)

```typescript
export type Operator = 
  | '=' | '!=' | '>' | '>=' | '<' | '<=' 
  | 'in' | 'not in' 
  | 'like' | 'not like'         // SQL generic matching
  | 'startswith' | 'endswith'   // String optimization
  | 'contains'                  // Array or String containment
  | 'between';                  // Range check

export interface UnifiedQuery {
  // Target
  entity: string;
  
  // Projection
  fields?: string[]; 
  
  // Selection
  filters?: Array<
    [string, Operator, any] | // Leaf Condition
    'and' | 'or' |            // Logical Operator
    UnifiedQuery['filters']   // Nested Group
  >;
  
  // Global Text Search (optional implementation)
  search?: string;

  // Ordering
  sort?: Array<[string, 'asc' | 'desc']>;
  
  // Pagination
  top?: number;  // LIMIT
  skip?: number; // OFFSET

  // Graph Resolution (JOINs)
  expand?: Record<string, {
    fields?: string[];
    filters?: UnifiedQuery['filters'];
    sort?: UnifiedQuery['sort'];
    top?: number;
  }>;

  // Analytics & Grouping
  groupBy?: string[];
  aggregate?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
}
```

## 3. Example

```javascript
{
  "entity": "orders",
  "fields": ["name", "amount", "created_at"],
  
  // (status = 'paid' OR status = 'pending') AND amount > 100
  "filters": [
    [["status", "=", "paid"], "or", ["status", "=", "pending"]],
    "and",
    ["amount", ">", 100]
  ],
  
  "sort": [["created_at", "desc"]],
  "top": 20,
  "skip": 0,

  "expand": {
    "customer": { 
      "fields": ["name", "email"],
      "filters": [["is_active", "=", true]] 
    },
    "items": {
      "fields": ["product_name", "qty", "price"],
      "sort": [["price", "desc"]]
    }
  }
}
```
