# ObjectOS Architecture

## Overview

ObjectOS is a **metadata-driven runtime engine** that transforms declarative YAML definitions into fully functional enterprise applications. This document explains the architectural decisions, component interactions, and design principles behind ObjectOS.

## The Two-Repository Model

### ObjectQL Repository (Protocol Definition)
- **Location**: https://github.com/objectql/objectql
- **Purpose**: Defines the metadata standard and provides core implementations
- **Key Packages**:
  - `@objectql/core` - Metadata parser, AST builder, query compiler
  - `@objectql/types` - TypeScript type definitions for the protocol
  - `@objectql/driver-sql` - SQL database driver (PostgreSQL, MySQL, SQLite)
  - `@objectql/driver-mongo` - MongoDB driver

### ObjectOS Repository (Runtime Implementation)
- **Location**: This repository
- **Purpose**: Implements the runtime engine that executes ObjectQL metadata
- **Key Packages**:
  - `@objectos/kernel` - Core execution engine
  - `@objectos/server` - HTTP API layer
  - `@objectos/ui` - React UI components

## Core Architectural Principle

> **"Kernel handles logic, Drivers handle data, Server handles HTTP."**

This separation ensures:
1. **Testability**: Each layer can be tested independently
2. **Flexibility**: Swap databases without changing business logic
3. **Scalability**: Scale HTTP layer independently from data layer
4. **Maintainability**: Clear boundaries reduce coupling

## Layer 1: Metadata Protocol (ObjectQL)

### What is ObjectQL?

ObjectQL is a **declarative metadata format** for describing:
- Business objects (entities)
- Fields and data types
- Relationships (lookup, master-detail)
- Validation rules
- Permission rules
- UI layouts

### Example: Contact Object

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
  
  account:
    type: lookup
    reference_to: accounts
    label: Account

permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

### Why YAML?

1. **Human-Readable**: Easy for developers to write and AI to generate
2. **Version-Controllable**: Can be tracked in Git
3. **Language-Agnostic**: Can be consumed by any runtime
4. **Tooling-Friendly**: Easy for code generators and validators

## Layer 2: Runtime Engine (@objectos/kernel)

### Responsibilities

The Kernel is responsible for:

1. **Metadata Loading**: Parse and validate `*.object.yml` files
2. **Object Registry**: Maintain an in-memory registry of all objects
3. **Query Dispatching**: Translate high-level queries to driver calls
4. **Hook Execution**: Run lifecycle hooks (beforeInsert, afterUpdate, etc.)
5. **Permission Enforcement**: Check field-level and record-level permissions
6. **Relationship Resolution**: Handle lookups and related lists

### Key Classes

#### ObjectOS (Main Class)

```typescript
export class ObjectOS {
  private registry: Map<string, ObjectConfig>;
  private driver: ObjectQLDriver;
  private hooks: HookManager;

  // Load metadata into registry
  async load(config: ObjectConfig): Promise<void>

  // CRUD operations
  async find(objectName: string, options: FindOptions): Promise<any[]>
  async insert(objectName: string, data: any): Promise<any>
  async update(objectName: string, id: string, data: any): Promise<any>
  async delete(objectName: string, id: string): Promise<void>

  // Driver management
  useDriver(driver: ObjectQLDriver): void
}
```

#### HookManager

Hooks allow custom logic to be executed at specific points:

```typescript
// Register a hook
kernel.on('beforeInsert', async (context) => {
  context.data.created_at = new Date();
  context.data.created_by = context.user.id;
});

// Hook types
type HookType = 
  | 'beforeFind' 
  | 'afterFind'
  | 'beforeInsert'
  | 'afterInsert'
  | 'beforeUpdate'
  | 'afterUpdate'
  | 'beforeDelete'
  | 'afterDelete';
```

### Dependency Injection Pattern

The Kernel **never directly instantiates** a driver. It receives it via dependency injection:

```typescript
// ❌ BAD: Hard-coded dependency
class ObjectOS {
  constructor() {
    this.driver = new PostgresDriver(); // Tight coupling!
  }
}

// ✅ GOOD: Injected dependency
const driver = new PostgresDriver({ /* config */ });
const kernel = new ObjectOS();
kernel.useDriver(driver);
```

This allows:
- Unit testing with mock drivers
- Swapping databases at runtime
- Multi-tenant applications with different databases per tenant

## Layer 3: Data Layer (ObjectQL Drivers)

### Driver Interface

All drivers implement the `ObjectQLDriver` interface:

```typescript
interface ObjectQLDriver {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Schema management
  syncSchema(config: ObjectConfig): Promise<void>;

  // CRUD operations
  find(objectName: string, options: FindOptions): Promise<any[]>;
  findOne(objectName: string, id: string): Promise<any>;
  insert(objectName: string, data: any): Promise<any>;
  update(objectName: string, id: string, data: any): Promise<any>;
  delete(objectName: string, id: string): Promise<void>;

  // Query building
  buildQuery(objectName: string, filters: FilterGroup): Query;
}
```

### Why Separate Drivers?

1. **Database Agnostic**: Business logic in Kernel works with any database
2. **Optimized Queries**: Each driver can optimize for its database
3. **Feature Parity**: SQL joins vs. MongoDB aggregations are handled internally

### Supported Drivers

| Driver | Package | Databases |
|--------|---------|-----------|
| SQL Driver | `@objectql/driver-sql` | PostgreSQL, MySQL, SQLite |
| MongoDB Driver | `@objectql/driver-mongo` | MongoDB |

## Layer 4: HTTP Layer (@objectos/server)

### Responsibilities

The Server layer is a **thin HTTP wrapper** around the Kernel:

1. **Request Parsing**: Extract parameters from HTTP requests
2. **Authentication**: Validate JWT tokens
3. **Response Formatting**: Convert Kernel output to JSON
4. **Error Handling**: Map exceptions to HTTP status codes

### Controller Pattern

```typescript
@Controller('api/data')
export class ObjectDataController {
  constructor(private kernel: ObjectOS) {}

  @Post(':objectName/query')
  @UseGuards(AuthGuard)
  async query(
    @Param('objectName') name: string,
    @Body() body: QueryDTO,
    @CurrentUser() user: User
  ) {
    // Controller only handles HTTP translation
    return this.kernel.find(name, {
      filters: body.filters,
      fields: body.fields,
      sort: body.sort,
      limit: body.limit,
      user: user // For permission checks
    });
  }
}
```

### Why NestJS?

1. **Dependency Injection**: Built-in IoC container
2. **Decorators**: Clean syntax for routes and guards
3. **OpenAPI**: Automatic API documentation
4. **Middleware**: Easy to add logging, rate limiting, etc.

### REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/data/:object/query` | Query records |
| POST | `/api/data/:object` | Create record |
| PATCH | `/api/data/:object/:id` | Update record |
| DELETE | `/api/data/:object/:id` | Delete record |
| GET | `/api/metadata/:object` | Get object metadata |

## Layer 5: UI Layer (@objectos/ui)

### Component Architecture

The UI layer provides **metadata-driven React components**:

```typescript
// Automatically generates a data grid from metadata
<ObjectGrid 
  objectName="contacts" 
  kernel={kernel}
/>

// Automatically generates a form from metadata
<ObjectForm 
  objectName="contacts"
  recordId={id}
  kernel={kernel}
/>
```

### Key Components

1. **ObjectGrid**: Airtable-like data grid with inline editing
2. **ObjectForm**: Salesforce-like detail form with sections
3. **ObjectChart**: Chart component for analytics
4. **FilterBuilder**: Visual query builder

### Design System

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui
- **State**: React Query for server state
- **Grid**: TanStack Table

## Extension Points

### 1. Plugins

Plugins extend the Kernel with new features:

```typescript
// Auth Plugin
export function authPlugin(kernel: ObjectOS) {
  kernel.on('beforeInsert', async (ctx) => {
    ctx.data.owner = ctx.user.id;
  });

  kernel.on('beforeFind', async (ctx) => {
    // Add record-level security filter
    ctx.filters.push({ owner: ctx.user.id });
  });
}
```

### 2. Custom Fields

Add new field types:

```typescript
kernel.registerFieldType('gps_location', {
  validate: (value) => {
    // Validate GPS coordinates
  },
  format: (value) => {
    // Format for display
  }
});
```

### 3. Custom Drivers

Implement `ObjectQLDriver` for new databases:

```typescript
class RedisDriver implements ObjectQLDriver {
  // Implement interface methods
}
```

## Data Flow Example

Let's trace a request to create a contact:

```
1. Client sends POST /api/data/contacts
   └─> Body: { first_name: "John", last_name: "Doe" }

2. NestJS Controller receives request
   └─> Extracts user from JWT
   └─> Calls kernel.insert('contacts', data)

3. Kernel processes the request
   └─> Loads contact metadata from registry
   └─> Runs beforeInsert hooks
   └─> Validates required fields
   └─> Checks user permissions
   └─> Calls driver.insert('contacts', data)

4. Driver executes database operation
   └─> PostgresDriver builds SQL query
   └─> Executes: INSERT INTO contacts ...
   └─> Returns inserted record

5. Kernel post-processes
   └─> Runs afterInsert hooks
   └─> Returns record to controller

6. Controller returns HTTP response
   └─> Status: 201 Created
   └─> Body: { id: "...", first_name: "John", ... }
```

## Security Architecture

### Authentication

- **Implementation**: Better-Auth
- **Token Type**: JWT
- **Storage**: HTTP-only cookies
- **Refresh**: Automatic with refresh tokens

### Authorization

Two levels of security:

#### 1. Object-Level Permissions

```yaml
permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

#### 2. Record-Level Security (RLS)

```typescript
// Only show records owned by current user
kernel.on('beforeFind', async (ctx) => {
  if (!ctx.user.isAdmin) {
    ctx.filters.push({ owner: ctx.user.id });
  }
});
```

### Field-Level Security

```yaml
fields:
  salary:
    type: currency
    visible_to: ['hr', 'admin']
```

## Performance Considerations

### 1. Metadata Caching

- Object definitions are loaded once at startup
- Changes require server restart (hot-reload in dev mode)

### 2. Query Optimization

- Drivers use database-specific optimizations
- Lazy loading for related records
- Pagination for large datasets

### 3. Connection Pooling

- Database connections are pooled
- Configurable pool size per environment

## Testing Strategy

### 1. Unit Tests (Kernel)

```typescript
describe('ObjectOS', () => {
  it('should validate required fields', async () => {
    const kernel = new ObjectOS();
    const mockDriver = createMockDriver();
    kernel.useDriver(mockDriver);
    
    await expect(
      kernel.insert('contacts', { /* missing required field */ })
    ).rejects.toThrow('first_name is required');
  });
});
```

### 2. Integration Tests (Server)

```typescript
describe('POST /api/data/contacts', () => {
  it('should create a contact', async () => {
    const response = await request(app)
      .post('/api/data/contacts')
      .send({ first_name: 'John', last_name: 'Doe' })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });
});
```

### 3. E2E Tests (Full Stack)

```typescript
describe('Contact Management', () => {
  it('should create and display contact', async () => {
    await page.goto('/contacts');
    await page.click('button:has-text("New")');
    await page.fill('[name="first_name"]', 'John');
    await page.fill('[name="last_name"]', 'Doe');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
```

## Deployment Architecture

### Development

```
┌─────────────────┐
│  Vite Dev Server │ :5173
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  NestJS Server   │ :3000
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL      │ :5432
└─────────────────┘
```

### Production

```
┌─────────────────┐
│   Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ App 1 │ │ App 2 │
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         ▼
┌─────────────────┐
│  PostgreSQL      │
│  (Primary)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL      │
│  (Replica)       │
└─────────────────┘
```

## Future Considerations

### 1. Microservices

As the application grows, layers can be split:
- Metadata Service (reads object definitions)
- CRUD Service (handles data operations)
- Auth Service (handles authentication)

### 2. Event Sourcing

Instead of updating records directly:
- Store events (ContactCreated, ContactUpdated)
- Rebuild state from events
- Enables audit trails and time travel

### 3. GraphQL Support

Alternative to REST:
- Single endpoint
- Client specifies fields
- Reduces over-fetching

## Conclusion

ObjectOS achieves its goal of being a **metadata-driven runtime** through:

1. **Clear Layer Separation**: Kernel, Driver, Server have distinct responsibilities
2. **Protocol Adherence**: Strictly implements ObjectQL standard
3. **Dependency Injection**: Enables testing and flexibility
4. **Extension Points**: Hooks and plugins for customization
5. **Type Safety**: Full TypeScript coverage

This architecture allows ObjectOS to generate complete enterprise applications from simple YAML definitions while remaining maintainable, testable, and scalable.
