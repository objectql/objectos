# Query Language Specification

The ObjectOS Query Language provides a powerful and flexible syntax for filtering, sorting, and querying records. This document specifies the complete query syntax.

## Query Structure

A complete query consists of:

```typescript
{
  filters?: FilterExpression;      // Filter criteria
  fields?: string[];               // Fields to return
  sort?: SortExpression[];         // Sort order
  limit?: number;                  // Max records to return
  skip?: number;                   // Records to skip (pagination)
  include?: string[];              // Related objects to include
}
```

## Filter Expressions

### Basic Filters

Filters use an object-based syntax:

```json
{
  "field_name": "value"
}
```

This is equivalent to: `field_name = 'value'`

### Filter Operators

Filters support advanced operators using the `$operator` syntax:

```json
{
  "age": { "$gt": 18 }
}
```

#### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` or implicit | Equals | `{ "status": "active" }` |
| `$ne` | Not equals | `{ "status": { "$ne": "inactive" } }` |
| `$gt` | Greater than | `{ "age": { "$gt": 18 } }` |
| `$gte` | Greater than or equal | `{ "age": { "$gte": 18 } }` |
| `$lt` | Less than | `{ "price": { "$lt": 100 } }` |
| `$lte` | Less than or equal | `{ "price": { "$lte": 100 } }` |

#### String Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$like` | Pattern matching (SQL LIKE) | `{ "name": { "$like": "%John%" } }` |
| `$ilike` | Case-insensitive LIKE | `{ "email": { "$ilike": "%@example.com" } }` |
| `$startswith` | Starts with | `{ "name": { "$startswith": "Mr" } }` |
| `$endswith` | Ends with | `{ "email": { "$endswith": "@example.com" } }` |
| `$contains` | Contains substring | `{ "description": { "$contains": "important" } }` |

#### Array Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$in` | Value in array | `{ "status": { "$in": ["active", "pending"] } }` |
| `$nin` | Value not in array | `{ "status": { "$nin": ["deleted", "archived"] } }` |

#### Null Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$null` | Is null | `{ "deleted_at": { "$null": true } }` |
| `$notnull` | Is not null | `{ "email": { "$notnull": true } }` |

#### Range Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$between` | Between two values | `{ "created_at": { "$between": ["2024-01-01", "2024-12-31"] } }` |

### Logical Operators

#### AND (default)

Multiple conditions at the same level are implicitly AND'd:

```json
{
  "status": "active",
  "age": { "$gt": 18 }
}
```

Equivalent to: `status = 'active' AND age > 18`

#### OR

Use `$or` for OR conditions:

```json
{
  "$or": [
    { "status": "active" },
    { "status": "pending" }
  ]
}
```

Equivalent to: `status = 'active' OR status = 'pending'`

#### NOT

Use `$not` to negate a condition:

```json
{
  "$not": {
    "status": "deleted"
  }
}
```

Equivalent to: `NOT (status = 'deleted')`

#### Complex Logic

Combine logical operators for complex queries:

```json
{
  "$and": [
    { "age": { "$gte": 18 } },
    {
      "$or": [
        { "country": "US" },
        { "country": "CA" }
      ]
    }
  ]
}
```

Equivalent to: `age >= 18 AND (country = 'US' OR country = 'CA')`

## Field Selection

Specify which fields to return:

```json
{
  "fields": ["first_name", "last_name", "email"]
}
```

- If omitted, all fields are returned
- Use `["*"]` to explicitly request all fields
- Related fields can be included (see [Include Related Records](#include-related-records))

## Sorting

Sort results by one or more fields:

```json
{
  "sort": [
    { "field": "last_name", "order": "asc" },
    { "field": "first_name", "order": "asc" }
  ]
}
```

- `order`: `"asc"` (ascending) or `"desc"` (descending)
- Multiple sort criteria are applied in order
- Shorthand: `{ "sort": "last_name" }` defaults to ascending

## Pagination

Control which records are returned:

```json
{
  "limit": 20,
  "skip": 40
}
```

- `limit`: Maximum number of records to return (default: 100, max: 1000)
- `skip`: Number of records to skip (for pagination)
- Page 1: `{ "limit": 20, "skip": 0 }`
- Page 2: `{ "limit": 20, "skip": 20 }`
- Page 3: `{ "limit": 20, "skip": 40 }`

## Include Related Records

Load related records in a single query:

```json
{
  "include": ["account", "created_by"]
}
```

This performs a JOIN and includes related object data in the response.

## Complete Query Examples

### Example 1: Simple Query

Find all active contacts:

```json
{
  "filters": {
    "status": "active"
  },
  "fields": ["first_name", "last_name", "email"],
  "sort": "last_name",
  "limit": 50
}
```

### Example 2: Complex Filters

Find contacts from US or Canada, age 18+, created this year:

```json
{
  "filters": {
    "$and": [
      {
        "$or": [
          { "country": "US" },
          { "country": "CA" }
        ]
      },
      { "age": { "$gte": 18 } },
      {
        "created_at": {
          "$between": ["2024-01-01", "2024-12-31"]
        }
      }
    ]
  },
  "sort": [
    { "field": "created_at", "order": "desc" }
  ]
}
```

### Example 3: Search Query

Search for contacts with "john" in name or email:

```json
{
  "filters": {
    "$or": [
      { "first_name": { "$ilike": "%john%" } },
      { "last_name": { "$ilike": "%john%" } },
      { "email": { "$ilike": "%john%" } }
    ]
  }
}
```

### Example 4: Related Records

Get opportunities with account and owner details:

```json
{
  "filters": {
    "stage": { "$in": ["proposal", "negotiation"] }
  },
  "include": ["account", "owner"],
  "sort": [
    { "field": "amount", "order": "desc" }
  ],
  "limit": 10
}
```

## Query Optimization Tips

### 1. Use Field Selection

Only request fields you need to reduce payload size:

```json
// ❌ Bad: Returns all fields
{}

// ✅ Good: Returns only needed fields
{ "fields": ["id", "name", "email"] }
```

### 2. Add Indexes

For frequently queried fields, ensure database indexes exist.

### 3. Limit Results

Always use `limit` to avoid loading too many records:

```json
{
  "limit": 100  // Good practice
}
```

### 4. Use Specific Filters

More specific filters are faster:

```json
// ❌ Slower
{ "name": { "$like": "%john%" } }

// ✅ Faster
{ "email": "john@example.com" }
```

## Programmatic Usage

### Using the Kernel SDK

```typescript
import { ObjectOS } from '@objectos/kernel';

const kernel = new ObjectOS();

// Simple query
const contacts = await kernel.find('contacts', {
  filters: { status: 'active' },
  sort: 'last_name',
  limit: 50
});

// Complex query
const results = await kernel.find('opportunities', {
  filters: {
    $and: [
      { stage: { $in: ['proposal', 'negotiation'] } },
      { amount: { $gte: 10000 } }
    ]
  },
  include: ['account', 'owner'],
  sort: [
    { field: 'amount', order: 'desc' }
  ],
  limit: 10
});
```

### Using the HTTP API

```bash
curl -X POST http://localhost:3000/api/data/contacts/query \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "status": "active",
      "age": { "$gte": 18 }
    },
    "fields": ["first_name", "last_name", "email"],
    "sort": "last_name",
    "limit": 50
  }'
```

## Database-Specific Considerations

### PostgreSQL

- Case-insensitive operations use `ILIKE`
- Date comparisons use ISO 8601 format
- Supports full-text search (future)

### MongoDB

- Operators map directly to MongoDB query syntax
- `$text` search available for indexed fields
- Aggregation pipeline for complex queries

### SQLite

- Limited date/time functions
- Case-insensitive operations may be slower
- No full-text search in basic mode

## Error Handling

Invalid queries return structured errors:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid filter: unknown operator '$invalid'",
    "details": {
      "field": "age",
      "operator": "$invalid"
    }
  }
}
```

Common errors:
- `400`: Invalid query syntax
- `404`: Object not found
- `422`: Invalid field name or operator
