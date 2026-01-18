# Writing Logic Hooks

Hooks allow you to intercept and modify standard CRUD operations in ObjectOS. They enable you to add custom business logic at specific points in the data lifecycle without modifying the core system.

## Overview

Hooks are callback functions that execute before or after specific operations:

- **Before Hooks**: Validate data, modify input, enforce business rules
- **After Hooks**: Send notifications, update related records, log activities

## Hook Events

ObjectOS provides the following lifecycle hooks:

### Find Operations

- **`beforeFind`**: Executed before querying records
  - Use case: Add additional filters, enforce record-level security
- **`afterFind`**: Executed after records are retrieved
  - Use case: Transform data, calculate derived fields

### Create Operations

- **`beforeInsert`** (or `beforeCreate`): Executed before creating a record
  - Use case: Validate data, set default values, check business rules
- **`afterInsert`** (or `afterCreate`): Executed after record is created
  - Use case: Send notifications, create related records, log activity

### Update Operations

- **`beforeUpdate`**: Executed before updating a record
  - Use case: Validate changes, enforce business constraints
- **`afterUpdate`**: Executed after record is updated
  - Use case: Notify stakeholders, sync related data

### Delete Operations

- **`beforeDelete`**: Executed before deleting a record
  - Use case: Check dependencies, prevent deletion if conditions not met
- **`afterDelete`**: Executed after record is deleted
  - Use case: Clean up related data, archive information

## Hook Registration

### Basic Registration

Register a hook using the kernel's `on()` method:

```typescript
import { ObjectOS } from '@objectos/kernel';

const kernel = new ObjectOS();

kernel.on('beforeInsert', async (ctx) => {
  console.log('Creating object:', ctx.objectName);
  console.log('Data:', ctx.data);
});
```

### Object-Specific Hooks

Register hooks for specific objects only:

```typescript
kernel.on('beforeInsert', async (ctx) => {
  // Only run for contacts
  if (ctx.objectName === 'contacts') {
    // Custom logic for contacts
  }
});
```

Or use a more elegant pattern:

```typescript
kernel.on('beforeInsert:contacts', async (ctx) => {
  // This hook only runs for contacts
});
```

## Hook Context

Every hook receives a context object with information about the operation:

```typescript
interface HookContext {
  // Object being operated on
  objectName: string;
  
  // User performing the operation
  user: {
    id: string;
    email: string;
    roles: string[];
  };
  
  // For create/update: the data being saved
  data?: Record<string, any>;
  
  // For update/delete: the record ID
  id?: string;
  
  // For find: the query options
  filters?: any;
  sort?: any;
  limit?: number;
  
  // For after hooks: the result of the operation
  result?: any;
  
  // For update: the old values before update
  oldValues?: Record<string, any>;
}
```

## Common Hook Patterns

### 1. Auto-Populate Fields

Automatically set fields when creating records:

```typescript
kernel.on('beforeInsert', async (ctx) => {
  // Set created_at timestamp
  ctx.data.created_at = new Date();
  
  // Set created_by to current user
  ctx.data.created_by = ctx.user.id;
  
  // Generate unique code
  if (ctx.objectName === 'projects') {
    ctx.data.code = `PRJ-${Date.now()}`;
  }
});
```

### 2. Data Validation

Enforce business rules before saving:

```typescript
kernel.on('beforeInsert:contacts', async (ctx) => {
  // Ensure email is lowercase
  if (ctx.data.email) {
    ctx.data.email = ctx.data.email.toLowerCase();
  }
  
  // Validate age
  if (ctx.data.age && ctx.data.age < 18) {
    throw new Error('Contacts must be 18 or older');
  }
});

kernel.on('beforeUpdate:opportunities', async (ctx) => {
  // Check that close_date is set when status is closed
  if (ctx.data.status === 'closed' && !ctx.data.close_date) {
    throw new Error('Close date is required when closing an opportunity');
  }
});
```

### 3. Send Notifications

Notify users when records change:

```typescript
kernel.on('afterInsert:contacts', async (ctx) => {
  // Send welcome email to new contact
  await sendEmail({
    to: ctx.result.email,
    subject: 'Welcome!',
    body: `Hello ${ctx.result.first_name}, welcome to our platform!`
  });
  
  // Notify sales team
  await notifySlack({
    channel: '#sales',
    message: `New contact created: ${ctx.result.first_name} ${ctx.result.last_name}`
  });
});

kernel.on('afterUpdate:opportunities', async (ctx) => {
  // Notify owner if stage changed
  if (ctx.oldValues.stage !== ctx.result.stage) {
    await sendEmail({
      to: ctx.result.owner.email,
      subject: 'Opportunity Stage Changed',
      body: `Opportunity "${ctx.result.name}" moved to ${ctx.result.stage}`
    });
  }
});
```

### 4. Record-Level Security

Add filters to enforce security:

```typescript
kernel.on('beforeFind', async (ctx) => {
  // Non-admin users can only see their own records
  if (!ctx.user.roles.includes('admin')) {
    ctx.filters = ctx.filters || {};
    ctx.filters.owner = ctx.user.id;
  }
});
```

### 5. Update Related Records

Sync data across related objects:

```typescript
kernel.on('afterUpdate:accounts', async (ctx) => {
  // If account status changed to inactive, update all contacts
  if (ctx.oldValues.status !== ctx.result.status && ctx.result.status === 'inactive') {
    await kernel.update('contacts', 
      { account: ctx.result.id },
      { status: 'inactive' }
    );
  }
});
```

### 6. Calculate Derived Fields

Compute values based on other fields:

```typescript
kernel.on('beforeInsert:opportunities', async (ctx) => {
  // Calculate expected_revenue = amount * probability
  if (ctx.data.amount && ctx.data.probability) {
    ctx.data.expected_revenue = ctx.data.amount * (ctx.data.probability / 100);
  }
});

kernel.on('beforeUpdate:opportunities', async (ctx) => {
  if (ctx.data.amount || ctx.data.probability) {
    const amount = ctx.data.amount || ctx.oldValues.amount;
    const probability = ctx.data.probability || ctx.oldValues.probability;
    ctx.data.expected_revenue = amount * (probability / 100);
  }
});
```

### 7. Prevent Deletion

Block deletion based on business rules:

```typescript
kernel.on('beforeDelete:accounts', async (ctx) => {
  // Check if account has opportunities
  const opportunities = await kernel.find('opportunities', {
    filters: { account: ctx.id }
  });
  
  if (opportunities.length > 0) {
    throw new Error('Cannot delete account with active opportunities');
  }
});
```

### 8. Audit Logging

Log all changes for compliance:

```typescript
kernel.on('afterInsert', async (ctx) => {
  await kernel.insert('audit_log', {
    action: 'create',
    object: ctx.objectName,
    record_id: ctx.result.id,
    user_id: ctx.user.id,
    timestamp: new Date(),
    data: ctx.data
  });
});

kernel.on('afterUpdate', async (ctx) => {
  await kernel.insert('audit_log', {
    action: 'update',
    object: ctx.objectName,
    record_id: ctx.id,
    user_id: ctx.user.id,
    timestamp: new Date(),
    old_values: ctx.oldValues,
    new_values: ctx.result
  });
});
```

## Hook Priority

When multiple hooks are registered for the same event, they execute in registration order:

```typescript
// This runs first
kernel.on('beforeInsert', async (ctx) => {
  console.log('Hook 1');
});

// This runs second
kernel.on('beforeInsert', async (ctx) => {
  console.log('Hook 2');
});
```

To control execution order, use priority:

```typescript
kernel.on('beforeInsert', async (ctx) => {
  console.log('Low priority - runs last');
}, { priority: 1 });

kernel.on('beforeInsert', async (ctx) => {
  console.log('High priority - runs first');
}, { priority: 10 });
```

## Error Handling

Throwing an error in a hook will:
1. Stop execution of remaining hooks
2. Rollback the database transaction
3. Return error to the client

```typescript
kernel.on('beforeInsert:contacts', async (ctx) => {
  if (!ctx.data.email) {
    throw new Error('Email is required');
  }
  
  // Check for duplicate email
  const existing = await kernel.find('contacts', {
    filters: { email: ctx.data.email }
  });
  
  if (existing.length > 0) {
    throw new Error('Email already exists');
  }
});
```

## Asynchronous Hooks

All hooks support async/await for asynchronous operations:

```typescript
kernel.on('afterInsert:contacts', async (ctx) => {
  // Call external API
  await fetch('https://crm.example.com/api/contacts', {
    method: 'POST',
    body: JSON.stringify(ctx.result)
  });
  
  // Wait for email to send
  await sendEmail({
    to: ctx.result.email,
    subject: 'Welcome'
  });
});
```

## Testing Hooks

Test hooks using a mock driver:

```typescript
import { ObjectOS } from '@objectos/kernel';
import { createMockDriver } from '@objectos/test-utils';

describe('Contact Hooks', () => {
  let kernel: ObjectOS;
  
  beforeEach(() => {
    kernel = new ObjectOS();
    kernel.useDriver(createMockDriver());
    
    // Register hooks
    kernel.on('beforeInsert:contacts', async (ctx) => {
      ctx.data.email = ctx.data.email.toLowerCase();
    });
  });
  
  it('should lowercase email on insert', async () => {
    const result = await kernel.insert('contacts', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'JOHN@EXAMPLE.COM'
    });
    
    expect(result.email).toBe('john@example.com');
  });
});
```

## Best Practices

1. **Keep Hooks Simple**: Each hook should do one thing well
2. **Avoid Circular Dependencies**: Don't create infinite loops by triggering the same event
3. **Handle Errors Gracefully**: Always validate data before processing
4. **Use Async/Await**: For better error handling and readability
5. **Document Side Effects**: Comment what your hooks do
6. **Test Thoroughly**: Hooks can have wide-reaching effects

## Advanced: Plugin-Based Hooks

For reusable hooks, create plugins:

```typescript
// plugins/audit-plugin.ts
export function AuditPlugin(kernel: ObjectOS) {
  kernel.on('afterInsert', async (ctx) => {
    await logAudit('create', ctx);
  });
  
  kernel.on('afterUpdate', async (ctx) => {
    await logAudit('update', ctx);
  });
  
  kernel.on('afterDelete', async (ctx) => {
    await logAudit('delete', ctx);
  });
}

// Usage
import { AuditPlugin } from './plugins/audit-plugin';
AuditPlugin(kernel);
```

## Related Documentation

- [Custom Actions](./logic-actions.md) - Create custom API endpoints
- [Security Guide](./security-guide.md) - Implement authentication and permissions
- [SDK Reference](./sdk-reference.md) - Complete API reference
