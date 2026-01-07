# ObjectQL Client API

**Version:** 1.0.0
**Context:** This document is part of the [ObjectQL Core Specification](./SPECIFICATION.md).

## 1. Overview

The Client API adopts the **Repository Pattern**, providing a type-safe, object-oriented way to interact with entities. It abstracts the underlying `UnifiedQuery` protocol, offering convenience methods for common usage while exposing the full power of the JSON-DSL when needed.

## 2. Getting Started

### 2.1 Accessing an Object Repository

Instead of passing the entity name with every request, retrieve a repository instance.

```typescript
const objectql = require('@objectql/core');

// Get the repository for 'orders'
const Orders = objectql.getObject('orders');
```

### 2.2 Operational Context (`options`)

All CRUD methods accept an optional `options` argument. To follow security best practices, strictly limiting the context to authentication and isolation parameters is recommended, rather than passing full user records.

```typescript
interface OperationOptions {
  // Security Context (Lightweight Session)
  context?: {
    user?: { id: string, roles: string[] }; // Minimal Identity Info
    spaceId?: string;                       // Multi-tenancy Isolation 
    locale?: string;                        // I18n
    [key: string]: any;                     // Extensible metadata
  };

  trx?: any;                                // Transaction Handle
  skipHooks?: boolean;                      // Bypass triggers (Admin only)
}
```

## 3. Query API (Read)

### 3.1 `find(query, options)`

Retrieves a list of records matching the criteria.

```typescript
const results = await Orders.find({
  fields: ['name', 'amount', 'status'],
  filters: [['status', '=', 'paid']]
}, { 
  context: { user: { id: 'u-001', roles: ['admin'] }, spaceId: 's-100' } 
});
```

### 3.2 `findOne(id | query, options)`

Retrieves a single record.

**By ID:**
```typescript
const order = await Orders.findOne('o-123', { context: { user: currentUser } });
```

**By Criteria:**
```typescript
const openOrder = await Orders.findOne({
  filters: [['status', '=', 'open'], 'and', ['owner', '=', currentUser.id]]
});
```

### 3.3 `count(filters, options)`

Efficiently counts records matching a filter.

```typescript
const count = await Orders.count([['status', '=', 'paid']]);
```

### 3.4 `aggregate(query, options)`

Performs database-side aggregation.

```typescript
const stats = await Orders.aggregate({
  groupBy: ['category'],
  aggregate: {
    'amount': 'sum',
    'id': 'count'
  }
});
// Result: [{ category: 'A', amount_sum: 100, id_count: 5 }, ...]
```
### 4.1 `insert(doc, options)`

Creates a new record. Triggers `beforeCreate` and `afterCreate` hooks.

```typescript
const newOrder = await Orders.insert({
  name: "Service Contract",
  amount: 2000,
  customer_id: "c-001"
}, { context: { user: currentUser } });
```

### 4.2 `update(id, doc, options)`

Updates an existing record. Triggers `beforeUpdate` and `afterUpdate`.

```typescript
const updated = await Orders.update('o-123', {
  status: 'approved',
  approved_by: currentUser.id
}, { context: { user: currentUser } });
```

### 4.3 `delete(id, options)`

Deletes a record. Triggers `beforeDelete` and `afterDelete`.

```typescript
await Orders.delete('o-123', { context: { user: currentUser } });
```
```typescript
await Orders.delete('o-123', { user: currentUser });
```

## 5. Advanced Query Features

### 5.1 Relational Queries (Expand/JOIN)

Fetch related data in a single request.

```typescript
const orders = await Orders.find({
  fields: ['name', 'amount'],
  expand: {
    customer: {
      fields: ['name', 'email']
    },
    lines: {
      fields: ['product', 'quantity', 'price'],
      sort: [['price', 'desc']]
    }
  }
});
```

### 5.2 Direct Query Execution

For scenarios requiring dynamic execution across arbitrary entities, use the core engine directly.

```typescript
await objectql.find({
  entity: 'audit_logs', // Must specify entity explicitly
  filters: [['created_at', '>', '2023-01-01']]
});
```

## 6. Transaction Management

Use `objectql.transaction` to ensure atomicity across multiple operations.

```typescript
await objectql.transaction(async (trx) => {
  // Use a consistent context with the transaction handle
  const execOpts = { 
    context: { user: currentUser, spaceId: 's-100' }, 
    trx 
  }; 
  
  // 1. Create Invoice
  const invoice = await objectql.getObject('invoices').insert({
    order_id: 'o-123',
    total: 5000
  }, execOpts);

  // 2. Update Order Status
  await objectql.getObject('orders').update('o-123', {
    status: 'invoiced',
    invoice_id: invoice.id
  }, execOpts);
});
```
