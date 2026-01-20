# SDK Reference

This document provides a complete reference for the ObjectOS Kernel SDK. Use the Kernel to programmatically interact with your data and business logic.

## Installation

```bash
npm install @objectos/kernel @objectql/driver-sql
```

## Basic Setup

```typescript
import { ObjectOS } from '@objectos/kernel';
import { PostgresDriver } from '@objectql/driver-sql';

// Create kernel instance
const kernel = new ObjectOS();

// Configure database driver
const driver = new PostgresDriver({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'myapp'
  }
});

// Connect driver to kernel
kernel.useDriver(driver);
await driver.connect();

// Load object definitions
await kernel.load(objectConfig);
```

## Core Methods

### `kernel.load(config)`

Load an object definition into the registry.

**Parameters:**
- `config`: Object configuration (ObjectConfig)

**Returns:** `Promise<void>`

**Example:**
```typescript
await kernel.load({
  name: 'contacts',
  label: 'Contact',
  fields: {
    first_name: { type: 'text', required: true },
    last_name: { type: 'text', required: true },
    email: { type: 'email', unique: true }
  }
});
```

### `kernel.find(objectName, options, user?)`

Query multiple records.

**Parameters:**
- `objectName`: String - Object API name
- `options`: FindOptions - Query options
- `user?`: User - Current user context (for permissions)

**Returns:** `Promise<Record<string, any>[]>`

**Example:**
```typescript
const contacts = await kernel.find('contacts', {
  filters: {
    status: 'active',
    age: { $gte: 18 }
  },
  fields: ['first_name', 'last_name', 'email'],
  sort: [{ field: 'last_name', order: 'asc' }],
  limit: 50,
  skip: 0
}, currentUser);
```

**FindOptions Interface:**
```typescript
interface FindOptions {
  filters?: FilterExpression;
  fields?: string[];
  sort?: SortExpression[];
  limit?: number;
  skip?: number;
  include?: string[];
}
```

### `kernel.findOne(objectName, id, options?, user?)`

Get a single record by ID.

**Parameters:**
- `objectName`: String - Object API name
- `id`: String - Record ID
- `options?`: FindOptions - Optional query options
- `user?`: User - Current user context

**Returns:** `Promise<Record<string, any>>`

**Example:**
```typescript
const contact = await kernel.findOne('contacts', 'contact_123', {
  fields: ['first_name', 'last_name', 'email'],
  include: ['account']
}, currentUser);
```

### `kernel.insert(objectName, data, user?)`

Create a new record.

**Parameters:**
- `objectName`: String - Object API name
- `data`: Object - Record data
- `user?`: User - Current user context

**Returns:** `Promise<Record<string, any>>`

**Example:**
```typescript
const newContact = await kernel.insert('contacts', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1234567890'
}, currentUser);

console.log(newContact.id);  // Generated ID
```

### `kernel.update(objectName, id, data, user?)`

Update an existing record.

**Parameters:**
- `objectName`: String - Object API name
- `id`: String - Record ID
- `data`: Object - Fields to update
- `user?`: User - Current user context

**Returns:** `Promise<Record<string, any>>`

**Example:**
```typescript
const updated = await kernel.update('contacts', 'contact_123', {
  phone: '+1987654321',
  status: 'inactive'
}, currentUser);
```

### `kernel.delete(objectName, id, user?)`

Delete a record.

**Parameters:**
- `objectName`: String - Object API name
- `id`: String - Record ID
- `user?`: User - Current user context

**Returns:** `Promise<void>`

**Example:**
```typescript
await kernel.delete('contacts', 'contact_123', currentUser);
```

### `kernel.count(objectName, filters?, user?)`

Count records matching filters.

**Parameters:**
- `objectName`: String - Object API name
- `filters?`: FilterExpression - Filter criteria
- `user?`: User - Current user context

**Returns:** `Promise<number>`

**Example:**
```typescript
const activeCount = await kernel.count('contacts', {
  status: 'active'
}, currentUser);

console.log(`${activeCount} active contacts`);
```

## Hook Methods

### `kernel.on(event, handler, options?)`

Register a lifecycle hook.

**Parameters:**
- `event`: String - Hook event name
- `handler`: Function - Hook callback
- `options?`: HookOptions - Hook configuration

**Returns:** `void`

**Events:**
- `beforeFind`, `afterFind`
- `beforeInsert`, `afterInsert`
- `beforeUpdate`, `afterUpdate`
- `beforeDelete`, `afterDelete`

**Example:**
```typescript
kernel.on('beforeInsert', async (ctx) => {
  ctx.data.created_at = new Date();
  ctx.data.created_by = ctx.user.id;
});

kernel.on('afterInsert:contacts', async (ctx) => {
  await sendWelcomeEmail(ctx.result.email);
});
```

**Hook Context:**
```typescript
interface HookContext {
  objectName: string;
  user: User;
  data?: Record<string, any>;
  id?: string;
  filters?: any;
  result?: any;
  oldValues?: Record<string, any>;
}
```

### `kernel.off(event, handler?)`

Unregister a hook.

**Parameters:**
- `event`: String - Hook event name
- `handler?`: Function - Specific handler to remove (optional)

**Returns:** `void`

**Example:**
```typescript
// Remove all handlers for event
kernel.off('beforeInsert');

// Remove specific handler
kernel.off('beforeInsert', myHandler);
```

## Action Methods

### `kernel.registerAction(name, handler, options?)`

Register a custom action.

**Parameters:**
- `name`: String - Action name (e.g., 'contacts.sendEmail')
- `handler`: Function - Action callback
- `options?`: ActionOptions - Action configuration

**Returns:** `void`

**Example:**
```typescript
kernel.registerAction('contacts.sendEmail', async (ctx) => {
  const { id, subject, body } = ctx.params;
  
  const contact = await ctx.kernel.findOne('contacts', id);
  
  await sendEmail({
    to: contact.email,
    subject: subject,
    body: body
  });
  
  return {
    success: true,
    message: 'Email sent'
  };
});
```

### `kernel.executeAction(name, params, user?)`

Execute a registered action.

**Parameters:**
- `name`: String - Action name
- `params`: Object - Action parameters
- `user?`: User - Current user context

**Returns:** `Promise<any>`

**Example:**
```typescript
const result = await kernel.executeAction('contacts.sendEmail', {
  id: 'contact_123',
  subject: 'Hello',
  body: 'Welcome!'
}, currentUser);

console.log(result.message);
```

## Registry Methods

### `kernel.getObjects()`

Get list of all registered objects.

**Returns:** `string[]`

**Example:**
```typescript
const objects = kernel.getObjects();
console.log(objects);  // ['contacts', 'accounts', 'opportunities']
```

### `kernel.getObjectConfig(objectName)`

Get configuration for a specific object.

**Parameters:**
- `objectName`: String - Object API name

**Returns:** `ObjectConfig`

**Example:**
```typescript
const config = kernel.getObjectConfig('contacts');
console.log(config.label);        // 'Contact'
console.log(config.fields.email); // { type: 'email', unique: true, ... }
```

### `kernel.hasObject(objectName)`

Check if an object is registered.

**Parameters:**
- `objectName`: String - Object API name

**Returns:** `boolean`

**Example:**
```typescript
if (kernel.hasObject('contacts')) {
  console.log('Contacts object is available');
}
```

## Driver Methods

### `kernel.useDriver(driver)`

Set the database driver.

**Parameters:**
- `driver`: ObjectQLDriver - Driver instance

**Returns:** `void`

**Example:**
```typescript
import { PostgresDriver } from '@objectql/driver-sql';

const driver = new PostgresDriver({ /* config */ });
kernel.useDriver(driver);
await driver.connect();
```

### `kernel.getDriver()`

Get the current database driver.

**Returns:** `ObjectQLDriver | null`

**Example:**
```typescript
const driver = kernel.getDriver();
if (driver) {
  console.log('Driver connected');
}
```

## Transaction Methods

### `kernel.transaction(callback)`

Execute operations in a database transaction.

**Parameters:**
- `callback`: Function - Callback with transaction context

**Returns:** `Promise<any>`

**Example:**
```typescript
await kernel.transaction(async (trx) => {
  // Create account
  const account = await trx.insert('accounts', {
    name: 'Acme Corp'
  });
  
  // Create contact
  const contact = await trx.insert('contacts', {
    first_name: 'John',
    last_name: 'Doe',
    account: account.id
  });
  
  // If any operation fails, all changes are rolled back
  return { account, contact };
});
```

## Validation Methods

### `kernel.validate(objectName, data)`

Validate data against object schema.

**Parameters:**
- `objectName`: String - Object API name
- `data`: Object - Data to validate

**Returns:** `ValidationResult`

**Example:**
```typescript
const result = kernel.validate('contacts', {
  first_name: 'John',
  // Missing required 'last_name'
  email: 'invalid-email'  // Invalid email format
});

if (!result.valid) {
  console.log(result.errors);
  // [
  //   { field: 'last_name', message: 'Field is required' },
  //   { field: 'email', message: 'Invalid email format' }
  // ]
}
```

## Permission Methods

### `kernel.checkPermission(objectName, action, user)`

Check if user has permission for an action.

**Parameters:**
- `objectName`: String - Object API name
- `action`: String - Action ('read', 'create', 'update', 'delete')
- `user`: User - User context

**Returns:** `boolean`

**Example:**
```typescript
const canCreate = kernel.checkPermission('contacts', 'create', currentUser);

if (!canCreate) {
  throw new Error('Permission denied');
}
```

## Type Definitions

### User

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  [key: string]: any;
}
```

### FilterExpression

```typescript
type FilterExpression = {
  [field: string]: any | {
    $eq?: any;
    $ne?: any;
    $gt?: any;
    $gte?: any;
    $lt?: any;
    $lte?: any;
    $in?: any[];
    $nin?: any[];
    $like?: string;
    $ilike?: string;
    $null?: boolean;
    $between?: [any, any];
  };
  $and?: FilterExpression[];
  $or?: FilterExpression[];
  $not?: FilterExpression;
};
```

### SortExpression

```typescript
interface SortExpression {
  field: string;
  order: 'asc' | 'desc';
}
```

### ObjectConfig

```typescript
interface ObjectConfig {
  name: string;
  label?: string;
  icon?: string;
  description?: string;
  enable_api?: boolean;
  enable_audit?: boolean;
  fields: {
    [fieldName: string]: FieldConfig;
  };
  permission_set?: PermissionSet;
}
```

### FieldConfig

```typescript
interface FieldConfig {
  type: FieldType;
  label?: string;
  description?: string;
  required?: boolean;
  unique?: boolean;
  default?: any;
  readonly?: boolean;
  hidden?: boolean;
  // Type-specific attributes
  [key: string]: any;
}

type FieldType =
  | 'text' | 'textarea' | 'email' | 'url' | 'phone'
  | 'number' | 'currency' | 'percent'
  | 'date' | 'datetime' | 'time'
  | 'boolean' | 'select' | 'multiselect'
  | 'lookup' | 'master_detail'
  | 'autonumber' | 'formula' | 'rollup_summary';
```

## Complete Example

```typescript
import { ObjectOS } from '@objectos/kernel';
import { PostgresDriver } from '@objectql/driver-sql';

// Initialize
const kernel = new ObjectOS();
const driver = new PostgresDriver({
  connection: process.env.DATABASE_URL
});

kernel.useDriver(driver);
await driver.connect();

// Load objects
await kernel.load({
  name: 'contacts',
  label: 'Contact',
  fields: {
    first_name: { type: 'text', required: true },
    last_name: { type: 'text', required: true },
    email: { type: 'email', unique: true }
  }
});

// Register hooks
kernel.on('beforeInsert', async (ctx) => {
  ctx.data.created_at = new Date();
  ctx.data.created_by = ctx.user.id;
});

// Register actions
kernel.registerAction('contacts.sendEmail', async (ctx) => {
  const contact = await ctx.kernel.findOne('contacts', ctx.params.id);
  await sendEmail(contact.email, ctx.params.subject, ctx.params.body);
  return { success: true };
});

// Use the kernel
const currentUser = { id: 'user_123', roles: ['sales'] };

// Create
const contact = await kernel.insert('contacts', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
}, currentUser);

// Query
const contacts = await kernel.find('contacts', {
  filters: { status: 'active' },
  sort: [{ field: 'last_name', order: 'asc' }],
  limit: 50
}, currentUser);

// Update
await kernel.update('contacts', contact.id, {
  phone: '+1234567890'
}, currentUser);

// Execute action
await kernel.executeAction('contacts.sendEmail', {
  id: contact.id,
  subject: 'Welcome',
  body: 'Hello!'
}, currentUser);

// Delete
await kernel.delete('contacts', contact.id, currentUser);
```

## Error Handling

The SDK throws specific error types:

```typescript
try {
  await kernel.insert('contacts', data);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.errors);
  } else if (error instanceof PermissionDeniedError) {
    console.log('Permission denied');
  } else if (error instanceof NotFoundError) {
    console.log('Record not found');
  } else {
    console.log('Unexpected error:', error);
  }
}
```

## Related Documentation

- [Data Modeling](./data-modeling.md) - Define objects and fields
- [Logic Hooks](./logic-hooks.md) - Intercept operations
- [Custom Actions](./logic-actions.md) - Create custom endpoints
- [Query Language](../spec/query-language.md) - Filter syntax reference
