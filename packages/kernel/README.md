# @objectos/kernel

The core runtime engine for ObjectOS - a metadata-driven platform that transforms declarative YAML definitions into fully functional enterprise applications.

## Overview

`@objectos/kernel` is the execution engine that powers ObjectOS. It extends ObjectQL with application-specific capabilities, providing:

- **Metadata Processing**: Parse and validate object definitions, apps, and data files
- **Lifecycle Hooks**: Execute custom logic at key points in data operations
- **Permission Enforcement**: Apply role-based access control and field-level security
- **Plugin System**: Extend functionality through a modular plugin architecture
- **Event Bus**: Coordinate actions across different parts of your application

## Features

### Core Capabilities

- **ObjectOS Runtime**: Extends `ObjectQL` to provide a complete application kernel
- **App Metadata**: Built-in support for loading `.app.yml` for application configuration and navigation
- **Data Loading**: Built-in support for loading `.data.yml` for seed data and initial records
- **MetadataRegistry**: Central metadata store inherited from ObjectQL
- **Hook System**: Lifecycle hooks for beforeFind, afterInsert, beforeUpdate, etc.
- **Action Registry**: Custom business logic endpoints
- **Transaction Support**: Database transaction management

### Metadata File Support

The kernel automatically discovers and loads:

- `*.object.yml` - Object definitions (from ObjectQL)
- `*.app.yml` - Application configurations (ObjectOS-specific)
- `*.data.yml` - Seed data and initial records (ObjectOS-specific)
- `*.action.yml` - Custom action definitions
- `*.workflow.yml` - Workflow definitions (future)

## Installation

```bash
npm install @objectos/kernel @objectql/driver-sql
```

## Quick Start

### Basic Usage

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
await kernel.load({
  name: 'contacts',
  label: 'Contact',
  fields: {
    first_name: { type: 'text', required: true },
    last_name: { type: 'text', required: true },
    email: { type: 'email', unique: true }
  }
});

// Use the kernel
const contacts = await kernel.find('contacts', {
  filters: { status: 'active' },
  limit: 50
});
```

### Loading Metadata from Files

```typescript
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

const objectsDir = path.join(__dirname, '../objects');
const files = fs.readdirSync(objectsDir);

for (const file of files) {
  if (file.endsWith('.object.yml')) {
    const content = fs.readFileSync(path.join(objectsDir, file), 'utf8');
    const config = yaml.load(content);
    await kernel.load(config);
  }
}
```

### Application Configuration

Define applications with menu structures:

```yaml
# my-app.app.yml
name: my_crm
label: CRM Application
icon: users
description: Customer Relationship Management

menu:
  - type: header
    label: Sales
  
  - type: object
    object: leads
    label: Leads
    icon: user-plus
  
  - type: object
    object: opportunities
    label: Opportunities
    icon: chart-line
  
  - type: header
    label: Service
  
  - type: object
    object: cases
    label: Cases
    icon: ticket
```

### Seed Data

Load initial data with `.data.yml`:

```yaml
# seed-data.data.yml
object: contacts
records:
  - first_name: John
    last_name: Doe
    email: john@example.com
    status: active
  
  - first_name: Jane
    last_name: Smith
    email: jane@example.com
    status: active
```

## API Reference

### Core Methods

#### `kernel.load(config: ObjectConfig)`

Load an object definition into the registry.

```typescript
await kernel.load({
  name: 'contacts',
  label: 'Contact',
  fields: { /* ... */ }
});
```

#### `kernel.find(objectName, options, user?)`

Query records with filtering, sorting, and pagination.

```typescript
const results = await kernel.find('contacts', {
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

#### `kernel.findOne(objectName, id, options?, user?)`

Get a single record by ID.

```typescript
const contact = await kernel.findOne('contacts', 'contact_123', {
  fields: ['first_name', 'last_name', 'email'],
  include: ['account']
}, currentUser);
```

#### `kernel.insert(objectName, data, user?)`

Create a new record.

```typescript
const newContact = await kernel.insert('contacts', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
}, currentUser);
```

#### `kernel.update(objectName, id, data, user?)`

Update an existing record.

```typescript
await kernel.update('contacts', 'contact_123', {
  phone: '+1234567890'
}, currentUser);
```

#### `kernel.delete(objectName, id, user?)`

Delete a record.

```typescript
await kernel.delete('contacts', 'contact_123', currentUser);
```

### Hooks

Register lifecycle hooks to add custom logic:

```typescript
// Before operations
kernel.on('beforeInsert', async (ctx) => {
  ctx.data.created_at = new Date();
  ctx.data.created_by = ctx.user.id;
});

kernel.on('beforeUpdate', async (ctx) => {
  ctx.data.updated_at = new Date();
  ctx.data.updated_by = ctx.user.id;
});

// After operations
kernel.on('afterInsert:contacts', async (ctx) => {
  await sendWelcomeEmail(ctx.result.email);
});

kernel.on('afterUpdate:opportunities', async (ctx) => {
  if (ctx.oldValues.stage !== ctx.result.stage) {
    await notifyOwner(ctx.result);
  }
});
```

### Actions

Register custom action endpoints:

```typescript
kernel.registerAction('contacts.sendEmail', async (ctx) => {
  const { id, subject, body } = ctx.params;
  
  const contact = await ctx.kernel.findOne('contacts', id);
  
  await sendEmail({
    to: contact.email,
    subject,
    body
  });
  
  return {
    success: true,
    message: 'Email sent successfully'
  };
});

// Execute action
const result = await kernel.executeAction('contacts.sendEmail', {
  id: 'contact_123',
  subject: 'Hello',
  body: 'Welcome!'
}, currentUser);
```

### Registry Methods

```typescript
// Get list of all objects
const objects = kernel.getObjects();

// Get object configuration
const config = kernel.getObjectConfig('contacts');

// Check if object exists
if (kernel.hasObject('contacts')) {
  // Object is available
}
```

## Architecture

The kernel follows a clean layered architecture:

```
┌─────────────────────────────────────┐
│        Application Layer            │
│   (Your hooks, actions, plugins)    │
├─────────────────────────────────────┤
│         @objectos/kernel            │
│  (Metadata, Hooks, Permissions)     │
├─────────────────────────────────────┤
│        @objectql/core               │
│   (Query Engine, Type System)       │
├─────────────────────────────────────┤
│       @objectql/driver-*            │
│  (Database-specific implementations)│
├─────────────────────────────────────┤
│          Database                   │
│  (PostgreSQL, MongoDB, SQLite)      │
└─────────────────────────────────────┘
```

## Plugin System

Create reusable plugins:

```typescript
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

// Use plugin
import { AuditPlugin } from './plugins/audit';
AuditPlugin(kernel);
```

## TypeScript Support

Full TypeScript support with strict typing:

```typescript
import { ObjectOS, ObjectConfig, FindOptions, User } from '@objectos/kernel';

const config: ObjectConfig = {
  name: 'contacts',
  label: 'Contact',
  fields: {
    email: { type: 'email', required: true }
  }
};

const options: FindOptions = {
  filters: { status: 'active' },
  limit: 50
};

const user: User = {
  id: 'user_123',
  email: 'user@example.com',
  roles: ['sales']
};

const results = await kernel.find('contacts', options, user);
```

## Testing

The kernel is designed for testability:

```typescript
import { ObjectOS } from '@objectos/kernel';
import { createMockDriver } from '@objectos/test-utils';

describe('Contacts', () => {
  let kernel: ObjectOS;
  
  beforeEach(() => {
    kernel = new ObjectOS();
    kernel.useDriver(createMockDriver());
  });
  
  it('should create contact', async () => {
    await kernel.load(contactConfig);
    
    const result = await kernel.insert('contacts', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com'
    });
    
    expect(result).toHaveProperty('id');
    expect(result.email).toBe('john@example.com');
  });
});
```

## Performance

The kernel includes several performance optimizations:

- **Metadata Caching**: Object definitions are cached in memory
- **Query Optimization**: Efficient query building and execution
- **Lazy Loading**: Related records loaded only when needed
- **Connection Pooling**: Database connections are pooled for efficiency

## Security

Security is built into the kernel:

- **Permission Enforcement**: Automatic RBAC checking
- **Field-Level Security**: Control access to specific fields
- **Record-Level Security**: Filter records based on ownership
- **Input Validation**: Automatic validation against schema
- **SQL Injection Prevention**: Parameterized queries

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

AGPL-3.0 - See [LICENSE](../../LICENSE) for details.

## Documentation

- [Complete Documentation](../../docs/guide/index.md)
- [SDK Reference](../../docs/guide/sdk-reference.md)
- [Architecture Guide](../../docs/guide/architecture.md)

## Links

- [GitHub Repository](https://github.com/objectstack-ai/objectos)
- [ObjectQL Protocol](https://github.com/objectql/objectql)
- [Issue Tracker](https://github.com/objectstack-ai/objectos/issues)
