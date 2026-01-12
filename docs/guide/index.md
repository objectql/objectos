# Getting Started with ObjectOS

Welcome to ObjectOS! This guide will help you understand what ObjectOS is, how it works, and how to build your first metadata-driven application.

## What is ObjectOS?

ObjectOS is a **metadata-driven runtime engine** that interprets and executes business applications defined in YAML format.

### The Big Picture

```
┌─────────────────────────────────────────────────┐
│  ObjectQL (Protocol Repository)                 │
│  - Metadata standard in YAML                    │
│  - Type definitions (@objectql/types)           │
│  - Database drivers                             │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  ObjectOS (Runtime Repository - This One)       │
│  - @objectos/kernel: Execution engine           │
│  - @objectos/server: HTTP API layer             │
│  - @objectos/ui: React components               │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│  Your Enterprise Application                    │
│  - contacts.object.yml                          │
│  - accounts.object.yml                          │
│  - opportunities.object.yml                     │
└─────────────────────────────────────────────────┘
```

**Key Concept**: ObjectQL is the "blueprint language", ObjectOS is the "builder" that constructs applications from those blueprints.

## Core Concepts

### 1. Objects

An **Object** represents a business entity (like Contact, Account, or Order). Objects are defined in `.object.yml` files.

```yaml
name: contacts
label: Contact
icon: user
fields:
  first_name:
    type: text
    required: true
```

### 2. Fields

**Fields** define the properties of an object. ObjectOS supports various field types:

| Field Type | Description | Example |
|------------|-------------|---------|
| `text` | Short text (up to 255 characters) | First Name |
| `textarea` | Long text | Description |
| `number` | Numeric value | Age |
| `currency` | Money value | Price |
| `date` | Date only | Birth Date |
| `datetime` | Date and time | Created At |
| `boolean` | True/false | Is Active |
| `select` | Dropdown options | Status |
| `lookup` | Reference to another object | Account |
| `email` | Email address | Email |
| `url` | Web URL | Website |

### 3. The Three Layers

ObjectOS follows a strict architectural principle:

> **"Kernel handles logic, Drivers handle data, Server handles HTTP."**

- **Kernel** (`@objectos/kernel`): Validates, enforces permissions, runs hooks
- **Drivers** (`@objectql/driver-*`): Translates to SQL/NoSQL queries
- **Server** (`@objectos/server`): Exposes REST APIs

This separation means you can swap databases without changing business logic!

## Installation

### Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 13+ or MongoDB 5+ or SQLite 3+
- npm, yarn, or pnpm

### Option 1: Clone the Monorepo

```bash
# Clone the repository
git clone https://github.com/objectql/objectos.git
cd objectos

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Start the development server
pnpm run dev
```

### Option 2: Use as Dependencies

```bash
# Create a new project
mkdir my-app
cd my-app
npm init -y

# Install ObjectOS packages
npm install @objectos/kernel @objectos/server @objectql/driver-sql

# Install database driver
npm install pg  # for PostgreSQL
# or
npm install mongodb  # for MongoDB
```

## Quick Start: Build a CRM

Let's build a simple CRM with Contacts and Accounts in under 5 minutes.

### Step 1: Create Object Definitions

Create a directory for your metadata:

```bash
mkdir -p objects
```

**objects/account.object.yml**:

```yaml
name: accounts
label: Account
icon: building
fields:
  name:
    type: text
    label: Account Name
    required: true
  
  industry:
    type: select
    label: Industry
    options:
      - Technology
      - Finance
      - Healthcare
      - Retail
  
  website:
    type: url
    label: Website
  
  annual_revenue:
    type: currency
    label: Annual Revenue

permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

**objects/contact.object.yml**:

```yaml
name: contacts
label: Contact
icon: user
fields:
  first_name:
    type: text
    label: First Name
    required: true
  
  last_name:
    type: text
    label: Last Name
    required: true
  
  email:
    type: email
    label: Email
    unique: true
  
  phone:
    type: text
    label: Phone
  
  account:
    type: lookup
    label: Account
    reference_to: accounts

permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

### Step 2: Initialize the Kernel

Create `src/main.ts`:

```typescript
import { ObjectOS } from '@objectos/kernel';
import { PostgresDriver } from '@objectql/driver-sql';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// 1. Create the kernel
const kernel = new ObjectOS();

// 2. Configure database driver
const driver = new PostgresDriver({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'mycrm'
  }
});

// 3. Connect driver to kernel
kernel.useDriver(driver);
await driver.connect();

// 4. Load object definitions
const objectsDir = path.join(__dirname, '../objects');
const files = fs.readdirSync(objectsDir);

for (const file of files) {
  if (file.endsWith('.object.yml')) {
    const content = fs.readFileSync(path.join(objectsDir, file), 'utf8');
    const config = yaml.load(content);
    await kernel.load(config);
  }
}

console.log('✅ Kernel initialized with objects:', kernel.getObjects());
```

### Step 3: Start the Server

If using the monorepo, the server is already configured. Otherwise, create a NestJS server:

```bash
pnpm install @nestjs/core @nestjs/common @nestjs/platform-express
```

The server will automatically expose endpoints:

- `POST /api/data/accounts/query` - Query accounts
- `POST /api/data/accounts` - Create account
- `PATCH /api/data/accounts/:id` - Update account
- `DELETE /api/data/accounts/:id` - Delete account

Same for contacts!

### Step 4: Test with cURL

```bash
# Create an account
curl -X POST http://localhost:3000/api/data/accounts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "industry": "Technology",
    "website": "https://acme.com"
  }'

# Query accounts
curl -X POST http://localhost:3000/api/data/accounts/query \
  -H "Content-Type: application/json" \
  -d '{
    "filters": { "industry": "Technology" },
    "limit": 10
  }'

# Create a contact
curl -X POST http://localhost:3000/api/data/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@acme.com",
    "account": "<account_id_from_previous_call>"
  }'
```

## Using the UI Components

ObjectOS provides React components that automatically render based on metadata:

```tsx
import { ObjectGrid, ObjectForm } from '@objectos/ui';

function ContactsPage() {
  return (
    <div>
      <h1>Contacts</h1>
      {/* Automatically generates a data grid */}
      <ObjectGrid objectName="contacts" />
    </div>
  );
}

function ContactDetail({ contactId }) {
  return (
    <div>
      {/* Automatically generates a form */}
      <ObjectForm 
        objectName="contacts" 
        recordId={contactId}
      />
    </div>
  );
}
```

The components automatically:
- Fetch metadata from the server
- Render appropriate input types
- Handle validation
- Submit data to API
- Display errors

## Next Steps

Now that you have a basic understanding:

1. **[Data Modeling](./data-modeling.md)** - Learn about field types, relationships, and validation
2. **[Architecture Guide](./architecture.md)** - Understand the three-layer architecture
3. **[Security Guide](./security-guide.md)** - Implement authentication and permissions
4. **[Writing Hooks](./logic-hooks.md)** - Add custom business logic
5. **[SDK Reference](./sdk-reference.md)** - Full API documentation

## Common Patterns

### Adding Validation

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
    pattern: '^\+?[1-9]\d{1,14}$'  # E.164 format
```

### Adding Relationships

```yaml
# Master-detail: Deleting Account deletes all Contacts
fields:
  account:
    type: master_detail
    reference_to: accounts
    label: Account

# Lookup: Deleting Account sets Contact.account to null
fields:
  account:
    type: lookup
    reference_to: accounts
    label: Account
```

### Adding Hooks

```typescript
// Auto-populate created_by
kernel.on('beforeInsert', async (ctx) => {
  if (!ctx.data.created_by) {
    ctx.data.created_by = ctx.user.id;
  }
  ctx.data.created_at = new Date();
});

// Send email when contact is created
kernel.on('afterInsert', async (ctx) => {
  if (ctx.objectName === 'contacts') {
    await sendWelcomeEmail(ctx.result.email);
  }
});
```

## Troubleshooting

### "Object not found"

Make sure your `.object.yml` file is in the correct directory and has been loaded:

```typescript
console.log(kernel.getObjects()); // Should include your object
```

### "Driver not connected"

Ensure you called `driver.connect()` before loading objects:

```typescript
await driver.connect();
await kernel.load(objectConfig);
```

### "Permission denied"

Check your `permission_set` in the object definition and ensure the user has the correct role.

## Resources

- **[GitHub Repository](https://github.com/objectql/objectos)** - Source code
- **[ObjectQL Protocol](https://github.com/objectql/objectql)** - Metadata standard
- **[Examples](https://github.com/objectql/objectos/tree/main/examples)** - Sample applications
- **[API Reference](./sdk-reference.md)** - Complete API docs

## Community

- **Discord**: Coming soon
- **Forum**: Coming soon
- **Twitter**: @ObjectOS (coming soon)

Need help? Open an issue on GitHub!
