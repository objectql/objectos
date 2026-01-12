# ObjectOS Quick Reference

## Project Overview

**ObjectOS** is a high-performance, metadata-driven runtime engine that executes enterprise applications defined in YAML format.

### Key Concepts

- **ObjectQL**: The metadata protocol (separate repository: [objectql/objectql](https://github.com/objectql/objectql))
- **ObjectOS**: The runtime engine that interprets and executes ObjectQL metadata (this repository)
- **Metadata-First**: Everything is defined in YAML, no manual coding required

### Architecture

```
ObjectQL (Protocol) → ObjectOS (Runtime) → Your Application
```

**Three-Layer Design:**
1. **Kernel**: Handles business logic, validation, permissions
2. **Drivers**: Handle database operations (PostgreSQL, MongoDB, SQLite)
3. **Server**: Handles HTTP API (REST, GraphQL)

## Quick Start

### Installation

```bash
git clone https://github.com/objectql/objectos.git
cd objectos
pnpm install
pnpm run dev     # Start development (Server + Web Watch)
pnpm run build   # Build for production
pnpm run start   # Run production build
```

### Create Your First Object

**objects/contact.object.yml**:
```yaml
name: contacts
label: Contact
icon: user
fields:
  first_name:
    type: text
    required: true
  last_name:
    type: text
    required: true
  email:
    type: email
    unique: true
```

### Use the Kernel

```typescript
import { ObjectOS } from '@objectos/kernel';
import { PostgresDriver } from '@objectql/driver-sql';

const kernel = new ObjectOS();
const driver = new PostgresDriver({ /* config */ });

kernel.useDriver(driver);
await driver.connect();
await kernel.load(contactConfig);

// CRUD operations
const contacts = await kernel.find('contacts', {});
const contact = await kernel.insert('contacts', {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com'
});
```

## Package Reference

### @objectos/kernel

Core runtime engine.

```typescript
import { ObjectOS } from '@objectos/kernel';

const kernel = new ObjectOS();

// Load metadata
await kernel.load(objectConfig);

// CRUD operations
await kernel.find(objectName, options);
await kernel.findOne(objectName, id);
await kernel.insert(objectName, data);
await kernel.update(objectName, id, data);
await kernel.delete(objectName, id);

// Hooks
kernel.on('beforeInsert', async (ctx) => {
  ctx.data.created_at = new Date();
});
```

### @objectos/server

NestJS HTTP server.

**Auto-generated endpoints:**
- `POST /api/data/:object/query` - Query records
- `POST /api/data/:object` - Create record
- `PATCH /api/data/:object/:id` - Update record
- `DELETE /api/data/:object/:id` - Delete record
- `GET /api/metadata/:object` - Get metadata

### @objectos/ui

React UI components.

```tsx
import { ObjectGrid, ObjectForm } from '@objectos/ui';

// Auto-generated data grid
<ObjectGrid objectName="contacts" />

// Auto-generated form
<ObjectForm objectName="contacts" recordId={id} />
```

## Field Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Short text (max 255) | First Name |
| `textarea` | Long text | Description |
| `number` | Numeric value | Age, Quantity |
| `currency` | Money value | Price, Salary |
| `date` | Date only | Birth Date |
| `datetime` | Date + time | Created At |
| `boolean` | True/false | Is Active |
| `select` | Dropdown | Status, Priority |
| `lookup` | Foreign key | Account, Owner |
| `email` | Email address | Email |
| `url` | Web URL | Website |
| `phone` | Phone number | Phone |

## Common Patterns

### Define Relationships

```yaml
# Many-to-one (Lookup)
fields:
  account:
    type: lookup
    reference_to: accounts
    label: Account

# One-to-many (Master-Detail)
fields:
  account:
    type: master_detail
    reference_to: accounts
    on_delete: cascade  # Delete contacts when account is deleted
```

### Add Validation

```yaml
fields:
  email:
    type: email
    required: true
    unique: true
  
  age:
    type: number
    min: 0
    max: 150
  
  phone:
    type: text
    pattern: '^\+?[1-9]\d{1,14}$'
```

### Set Permissions

```yaml
permission_set:
  allowRead: true                    # Everyone can read
  allowCreate: ['sales', 'admin']    # Only sales and admin can create
  allowEdit: ['sales', 'admin']      # Only sales and admin can edit
  allowDelete: ['admin']             # Only admin can delete

# Field-level security
fields:
  salary:
    type: currency
    visible_to: ['hr', 'admin']      # Only HR and admin can see
    editable_by: ['hr']              # Only HR can edit
```

### Write Hooks

```typescript
// Auto-populate fields
kernel.on('beforeInsert', async (ctx) => {
  ctx.data.created_at = new Date();
  ctx.data.created_by = ctx.user.id;
});

// Send notifications
kernel.on('afterInsert', async (ctx) => {
  if (ctx.objectName === 'contacts') {
    await sendWelcomeEmail(ctx.result.email);
  }
});

// Validate business rules
kernel.on('beforeUpdate', async (ctx) => {
  if (ctx.data.status === 'closed' && !ctx.data.close_date) {
    throw new Error('Close date required when status is closed');
  }
});
```

## API Examples

### Query Records

```bash
curl -X POST http://localhost:3000/api/data/contacts/query \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "email": { "$like": "%@example.com" }
    },
    "fields": ["first_name", "last_name", "email"],
    "sort": [{ "field": "last_name", "order": "asc" }],
    "limit": 10
  }'
```

### Create Record

```bash
curl -X POST http://localhost:3000/api/data/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com"
  }'
```

### Update Record

```bash
curl -X PATCH http://localhost:3000/api/data/contacts/123 \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890"
  }'
```

### Delete Record

```bash
curl -X DELETE http://localhost:3000/api/data/contacts/123
```

## Filter Syntax

```typescript
// Equals
{ "status": "active" }

// Not equals
{ "status": { "$ne": "inactive" } }

// Greater than
{ "age": { "$gt": 18 } }

// Less than or equal
{ "price": { "$lte": 100 } }

// Like (SQL LIKE)
{ "name": { "$like": "%John%" } }

// In array
{ "status": { "$in": ["active", "pending"] } }

// Between
{ "created_at": { "$between": ["2024-01-01", "2024-12-31"] } }

// AND
{ "$and": [
  { "status": "active" },
  { "age": { "$gt": 18 } }
]}

// OR
{ "$or": [
  { "email": { "$like": "%@example.com" } },
  { "phone": { "$ne": null } }
]}
```

## Testing

### Unit Test Example

```typescript
import { ObjectOS } from '@objectos/kernel';

describe('ObjectOS', () => {
  let kernel: ObjectOS;
  
  beforeEach(() => {
    kernel = new ObjectOS();
    const mockDriver = createMockDriver();
    kernel.useDriver(mockDriver);
  });
  
  it('should validate required fields', async () => {
    await kernel.load({
      name: 'contacts',
      fields: {
        email: { type: 'email', required: true }
      }
    });
    
    await expect(
      kernel.insert('contacts', {})
    ).rejects.toThrow('email is required');
  });
});
```

### Integration Test Example

```typescript
import * as request from 'supertest';

describe('POST /api/data/contacts', () => {
  it('should create contact', async () => {
    const response = await request(app)
      .post('/api/data/contacts')
      .send({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });
});
```

## Configuration

### Database Configuration

```typescript
// PostgreSQL
const driver = new PostgresDriver({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'myapp'
  },
  pool: { min: 2, max: 10 }
});

// MongoDB
const driver = new MongoDriver({
  url: 'mongodb://localhost:27017',
  database: 'myapp'
});

// SQLite
const driver = new PostgresDriver({
  client: 'sqlite3',
  connection: {
    filename: './myapp.db'
  }
});
```

### Server Configuration

```typescript
// packages/server/src/main.ts
const app = await NestFactory.create(AppModule);

// Enable CORS
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true
});

// Set global prefix
app.setGlobalPrefix('api');

// Start server
await app.listen(3000);
```

## Troubleshooting

### "Object not found"

**Problem**: Object definition not loaded.

**Solution**: Ensure YAML is loaded:
```typescript
await kernel.load(objectConfig);
console.log(kernel.getObjects()); // Check if object exists
```

### "Permission denied"

**Problem**: User lacks required permissions.

**Solution**: Check permission_set in object definition:
```yaml
permission_set:
  allowRead: true
  allowCreate: ['admin']  # Add user's role here
```

### "Driver not connected"

**Problem**: Database connection not established.

**Solution**: Call connect() before using kernel:
```typescript
await driver.connect();
await kernel.load(objectConfig);
```

### "Validation failed"

**Problem**: Data doesn't meet validation rules.

**Solution**: Check field requirements:
```yaml
fields:
  email:
    type: email
    required: true  # Must provide email
    unique: true    # Must be unique
```

## Resources

- **Documentation**: [docs.objectos.org](https://docs.objectos.org)
- **GitHub**: [github.com/objectql/objectos](https://github.com/objectql/objectos)
- **Protocol Spec**: [github.com/objectql/objectql](https://github.com/objectql/objectql)
- **Examples**: [github.com/objectql/objectos/tree/main/examples](https://github.com/objectql/objectos/tree/main/examples)

## Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build all packages
npm run test          # Run tests
npm run docs:dev      # Start docs dev server
npm run docs:build    # Build documentation

# Package-specific
npm --prefix packages/kernel run build
npm --prefix packages/kernel run test
npm --prefix packages/server run dev
npm --prefix packages/server run test
```

## Next Steps

1. **Read the Guide**: [Getting Started](./docs/guide/index.md)
2. **Learn Architecture**: [Architecture Deep Dive](./docs/guide/architecture.md)
3. **Explore Examples**: Check the [examples/](./examples) directory
4. **Join Community**: Discord (coming soon)
5. **Contribute**: See [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Version**: 0.2.0  
**Last Updated**: January 2026
