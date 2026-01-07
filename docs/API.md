# ObjectQL Client API

**Version:** 1.0.0

## 1. Overview

The Client API adopts a **Context-Bound Repository Pattern**.
Instead of using a global static object, all interactions start with a `Context` (Session) that encapsulates the current user identity, tenancy, and transaction scope.

## 2. The Context Object (`ctx`)

### 2.1 Interface Definition

The `ctx` object is the core entry point for all data operations.

```typescript
interface ObjectQLContext {
  // === Identity & Isolation ===
  userId?: string;                        // Current User ID
  spaceId?: string;                       // Multi-tenancy Isolation (Organization ID)
  roles: string[];                        // RBAC Roles
  isSystem?: boolean;                     // Sudo mode flag

  // === Data Entry Point ===
  /**
   * Returns a repository proxy bound to this context.
   * All operations performed via this proxy inherit userId, spaceId, and transaction.
   */
  object(entityName: string): ObjectRepository;
}

```

### 2.2 Initializing a Context

You should create a context at the beginning of a request (e.g., in an API middleware).

```typescript
const objectql = require('@objectql/core');

// Create a context from HTTP request info
const ctx = objectql.createContext({
  userId: 'u-001',
  spaceId: 's-100',
  roles: ['admin']
});

// Now use 'ctx' to interact with data
const orders = await ctx.object('orders').find();

```

## 3. Query API (Read)

**Note:** You do **not** need to pass `userId` or `spaceId` in the options. They are injected automatically by `ctx`.

### 3.1 `find(query)`

Retrieves a list of records.

```typescript
// The engine automatically applies: WHERE space_id = 's-100'
const results = await ctx.object('orders').find({
  fields: ['name', 'amount', 'status'],
  filters: [['status', '=', 'paid']]
});

```

### 3.2 `findOne(id | query)`

Retrieves a single record.

**By ID:**

```typescript
const order = await ctx.object('orders').findOne('o-123');

```

**By Criteria:**

```typescript
const openOrder = await ctx.object('orders').findOne({
  filters: [['status', '=', 'open'], 'and', ['owner', '=', ctx.userId]]
});

```

### 3.3 `count(filters)`

Efficiently counts records matching a filter.

```typescript
const count = await ctx.object('orders').count([['status', '=', 'paid']]);

```

### 3.4 `aggregate(query)`

Performs database-side aggregation.

```typescript
const stats = await ctx.object('orders').aggregate({
  groupBy: ['category'],
  aggregate: {
    'amount': 'sum',
    'id': 'count'
  }
});

```

## 4. Mutation API (Write)

### 4.1 `create(doc)`

Creates a new record.

* **Triggers:** `beforeCreate`, `afterCreate`
* **Auto-fill:** `created_by`, `space_id` are automatically populated from `ctx`.

```typescript
const newOrder = await ctx.object('orders').create({
  name: "Service Contract",
  amount: 2000,
  customer_id: "c-001"
});

```

### 4.2 `update(id, doc)`

Updates an existing record.

* **Triggers:** `beforeUpdate`, `afterUpdate`
* **Atomic Operators:** Supports `$inc`, `$set`, `$push` (MongoDB style).

```typescript
// Standard Update
await ctx.object('orders').update('o-123', {
  status: 'approved'
});

// Atomic Increment (Concurrency Safe)
await ctx.object('inventory').update('i-999', {
  $inc: { stock: -1 }
});

```

### 4.3 `delete(id)`

Deletes a record.

* **Triggers:** `beforeDelete`, `afterDelete`

```typescript
await ctx.object('orders').delete('o-123');

```

## 5. Advanced Features

### 5.1 Relational Queries (Expand/JOIN)

Fetch related data in a single request.

```typescript
const orders = await ctx.object('orders').find({
  fields: ['name', 'amount'],
  expand: {
    customer: {
      fields: ['name', 'email']
    },
    line_items: {
      fields: ['product', 'quantity', 'price'],
      sort: [['price', 'desc']]
    }
  }
});

```

### 5.2 Sudo / System Bypass

To perform administrative tasks (ignoring permission checks), create a system context.

```typescript
// 'isSystem: true' bypasses RBAC and some triggers
const systemCtx = objectql.createContext({ isSystem: true });

await systemCtx.object('audit_logs').delete('log-old-001');

```

## 6. Transaction Management

The `ctx` pattern makes transaction management seamless. You don't need to pass `trx` handles manually; they are encapsulated within a new transaction-bound context.

```typescript
await objectql.transaction(async (trxCtx) => {
  // 'trxCtx' is a special context bound to the transaction.
  // Any operation called on 'trxCtx' joins the transaction automatically.

  // 1. Create Invoice
  const invoice = await trxCtx.object('invoices').create({
    order_id: 'o-123',
    total: 5000
  });

  // 2. Update Order Status
  // If this fails, Step 1 is rolled back.
  await trxCtx.object('orders').update('o-123', {
    status: 'invoiced',
    invoice_id: invoice.id
  });
});

```
