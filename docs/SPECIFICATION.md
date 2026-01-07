# ObjectQL Core Specification

**Version:** 1.0.0
**Target:** Core Engine & Driver Developers

## 1. Architecture Overview

ObjectQL is a **query transpiler** that converts a standardized JSON-DSL into native database queries.

* **Pattern:** Repository Pattern with a Multi-Datasource strategy.
* **Datasources:**
  * **MongoDB:** Schema-less, fast iteration.
  * **PostgreSQL/Knex:** Schema-strict, JSONB hybrid storage.
* **Execution Flow:** `Client -> JSON DSL -> ObjectQL Core -> Driver -> Native Query -> DB`.

## 2. Directory & Datasource Resolution

The system uses a **"Directory-as-Datasource"** convention to map objects to database connections.

### 2.1 Standard Structure

```text
/project-root
├── /objects
│   ├── /_common/           # [Reserved] Mixins or abstract definitions
│   │
│   ├── /external/          # [Datasource: external] (e.g., pg)
│   │   └── erp_orders.yml  # -> Mapped to 'external' connection
│   │
│   └── users.yml            # [Datasource: default] (Root level = default)
│
├── /roles                  # RBAC Definitions
└── .objectqlrc.js          # Connection config (Environment specific)

```

### 2.2 Resolution Priority

1. **Explicit:** `datasource` property in YAML.
2. **Implicit:** Subdirectory name under `/objects/`.
3. **Fallback:** `default` connection.

### 2.3 Connection Configuration (`.objectqlrc.js`)

This file exports the configuration for all valid datasources. The `default` datasource is required.

```javascript
module.exports = {
  datasources: {
    // The 'default' connection (Required)
    // Used for files in /objects/*.yml (root)
    default: {
      driver: '@objectql/driver-mongo',
      connection: process.env.MONGO_URL
    },

    // 'logs' connection
    // Used for files in /objects/logs/*.yml
    external: {
      driver: '@objectql/driver-knex', // NPM package or Driver Instance
      client: 'pg',                    // Knex specific config
      connection: process.env.POSTGRES_URL
    },

  }
}
```

## 3. Schema Definition (`.object.yml`)

Files must use **Snake Case** (e.g., `customer_orders.yml`).

```yaml
name: contracts             # Unique Entity Name (Table/Collection Name)
label: Sales Contracts

fields:
  # Primitive Types
  name: { type: text, required: true, index: true }
  amount: { type: currency, scale: 2 }
  is_active: { type: boolean, default: true }

  # Relational Types
  owner: 
    type: lookup
    reference: users        # References 'users' entity
    relationship: many-to-one

  # Dynamic Types (Stored as JSONB in SQL)
  metadata:
    type: object

```

**SQL Hybrid Storage Strategy:**

* Fields defined in `fields` map to physical columns if they exist.
* New/Dynamic fields map to `_extra_data->>'field_name'` automatically by the Knex Driver.

## 4. The Unified Query Protocol (JSON-DSL)

All internal communication uses this AST. It is designed to be a JSON-serializable representation of a SQL/NoSQL query.

### 4.1 Interface (TypeScript)

```typescript
export type Operator = 
  | '=' | '!=' | '>' | '>=' | '<' | '<=' 
  | 'in' | 'not in' 
  | 'like' | 'not like'         // SQL generic matching
  | 'startswith' | 'endswith'   // String optimization
  | 'contains'                  // Array or String containment
  | 'between';                  // Range check

export interface UnifiedQuery {
  // Target
  entity: string;
  
  // Projection
  fields?: string[]; 
  
  // Selection
  filters?: Array<
    [string, Operator, any] | // Leaf Condition
    'and' | 'or' |            // Logical Operator
    UnifiedQuery['filters']   // Nested Group
  >;
  
  // Global Text Search (optional implementation)
  search?: string;

  // Ordering
  sort?: Array<[string, 'asc' | 'desc']>;
  
  // Pagination
  top?: number;  // LIMIT
  skip?: number; // OFFSET

  // Graph Resolution (JOINs)
  expand?: Record<string, {
    fields?: string[];
    filters?: UnifiedQuery['filters'];
    sort?: UnifiedQuery['sort'];
    top?: number;
  }>;

  // Analytics & Grouping
  groupBy?: string[];
  aggregate?: Record<string, 'sum' | 'avg' | 'min' | 'max' | 'count'>;
}
```

### 4.2 Example

```javascript
{
  "entity": "orders",
  "fields": ["name", "amount", "created_at"],
  
  // (status = 'paid' OR status = 'pending') AND amount > 100
  "filters": [
    [["status", "=", "paid"], "or", ["status", "=", "pending"]],
    "and",
    ["amount", ">", 100]
  ],
  
  "sort": [["created_at", "desc"]],
  "top": 20,
  "skip": 0,

  "expand": {
    "customer": { 
      "fields": ["name", "email"],
      "filters": [["is_active", "=", true]] 
    },
    "items": {
      "fields": ["product_name", "qty", "price"],
      "sort": [["price", "desc"]]
    }
  }
}
```

## 5. Security Model (Modern RBAC)

* **Philosophy:** Additive Permissions (Union Strategy).
* **Mechanism:** Predicate Pushdown (Injects filters into AST before execution).

### 5.1 Role Definition (`/roles/*.yml`)

```yaml
kind: Role
name: sales_rep
description: Access to own data only

policies:
  - resource: contracts
    actions: [read, update, create] # No delete
    
    # Row Level Security (RLS)
    # Injected into the Query AST as an 'AND' condition
    filter: 
      - [owner, '=', '$user.id']

    # Field Level Security (FLS)
    # Whitelist approach
    fields: ['*'] 

```

### 5.2 Context Injection

Supported variables in filters:

* `$user.id`: Current User ID.
* `$user.roles`: Array of role names.
* `$context.tenant_id`: For multi-tenancy isolation.

## 6. Driver Specification

Drivers must implement the `ObjectQLDriver` interface.

### 6.1 Required Methods

* `init(config: any): Promise<void>`
* `find(query: UnifiedQuery): Promise<any[]>`
* `count(query: UnifiedQuery): Promise<number>`
* `aggregate?(query: UnifiedQuery): Promise<any[]>`
* `create(entity: string, data: any): Promise<any>`
* `update(entity: string, id: any, data: any): Promise<any>`
* `delete(entity: string, id: any): Promise<any>`
* `transaction?(work: (trx: any) => Promise<any>): Promise<any>`

### 6.2 The "Compiler" Responsibility

* **Mongo Driver:** Compiles `UnifiedQuery` -> `Aggregation Pipeline`.
* **Knex Driver:** Compiles `UnifiedQuery` -> `Knex QueryBuilder` (handling JSONB logic transparently).
## 7. Lifecycle Hooks (Business Logic)

To decouple business logic from the core CRUD, the system supports an event-driven hook system.

### 7.1 Hook Definitions

Hooks can be defined in a companion file (e.g., `orders.trigger.js`) or registered at runtime.

```javascript
module.exports = {
  listenTo: 'orders',
  
  beforeCreate: async (ctx) => {
    if (ctx.data.amount > 10000 && !ctx.user.is_manager) {
      throw new Error("Needs manager approval");
    }
  },

  afterUpdate: async (ctx) => {
    if (ctx.changes.status === 'paid') {
      await ctx.broker.emit('order.paid', ctx.doc);
    }
  }
}
```

### 7.2 Pipeline Execution

1. **Request** -> **Authentication**
2. **Access Control (RBAC/RLS)**
3. `beforeCUD` Hooks
4. **Validation** (Schema check)
5. **Execution** (Driver)
6. `afterCUD` Hooks
7. **Response**
