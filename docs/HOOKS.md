# ObjectQL Lifecycle Hooks & Business Logic

**Version:** 1.0.0
**Context:** This document is part of the [ObjectQL Core Specification](./SPECIFICATION.md).

## 1. Overview

The system provides a rich interception model to inject business logic into the CRUD lifecycle. Hooks are event-driven functions that execute within the transaction scope (if applicable), allowing developers to implement validation, side effects, and complex business rules.

## 2. Hook Signature

Hooks are async functions that receive a strongly-typed `HookContext`.

```typescript
import { UnifiedQuery } from './QUERY';

export type HookType = 
  | 'beforeFind' | 'afterFind' 
  | 'beforeCreate' | 'afterCreate' 
  | 'beforeUpdate' | 'afterUpdate' 
  | 'beforeDelete' | 'afterDelete'
  | 'beforeAggregate' | 'afterAggregate';

export interface HookContext {
  // Operational Context
  entity: string;
  op: 'find' | 'create' | 'update' | 'delete' | 'aggregate';
  
  userId?: string;                        // Current User ID
  spaceId?: string;                       // Multi-tenancy Isolation 
  roles?: string[];                       // Authorization Roles
  
  // Security Context (Lightweight Session)
  // Mirrors the 'context' object passed in the Client API
  params: {
    [key: string]: any;                     // Extensible metadata
  };
  
  // Data Context (Varies by Op)
  id?: any;               // ID for update/delete
  query?: UnifiedQuery;   // For find/aggregate
  
  // Data Payload / Result
  // - In before* hooks: Represents INPUT data. Modifications are persisted.
  // - In after* hooks:  Represents OUTPUT result. Modifications affect the response.
  doc?: any;              

  // Infrastructure
  transaction?: any;              // Transaction Handle (Forward to sub-queries)
  
  // Helpers
  getPreviousDoc: () => Promise<any>; // Lazy load previous version (beforeUpdate/Delete only)
}

export type HookFunction = (ctx: HookContext) => Promise<void>;
```

## 3. Registering Hooks

Hooks can be declared in `*.trigger.js` files adjacent to the object definition.

```javascript
// objects/orders/orders.trigger.js
module.exports = {
  listenTo: 'orders',

  async beforeCreate(ctx) {
    // 1. Validation
    if (ctx.doc.amount < 0) {
      throw new Error("Amount must be positive");
    }

    // 2. Default Values/Calculation
    ctx.doc.total = ctx.doc.amount + (ctx.doc.tax || 0);
  },

  async afterUpdate(ctx) {
    // 3. Side Effects (Audit Log)
    // IMPORTANT: specific logic for 'status' change
    // Note: ctx.doc represents the Result in after* hooks
    const previousDoc = await ctx.getPreviousDoc();
    
    if (ctx.doc.status === 'shipped' && previousDoc.status !== 'shipped') {
        // Use the same transaction for consistency
        await objectql.create('audit_logs', {
            order_id: ctx.id,
            action: 'shipped',
            operator: ctx.context.userId
        }, { transaction: ctx.transaction });
    }
  }
}
```

## 4. Execution Pipeline

The execution flow ensures that hooks run within the transaction boundaries.

1. **Transaction Start**
2. **`before*` Hook** 
   - Can validate inputs
   - Can mutate `ctx.doc` or `ctx.query`
   - Can throw Error to abort transaction
3. **Driver Operation**
4. **`after*` Hook** 
   - Can mutate `ctx.result`
   - Can perform side-effects using `ctx.transaction`
5. **Transaction Commit**
