# ObjectQL Core Specification

**Version:** 1.0.0
**Target:** Core Engine & Driver Developers

## 1. Architecture Overview

ObjectQL is a **query transpiler** that converts a standardized JSON-DSL into native database queries.

* **Pattern:** Repository Pattern with a Dual-Stack strategy.
* **Design Time:** MongoDB (Schema-less, fast iteration).
* **Run Time:** PostgreSQL/Knex (Schema-strict, JSONB hybrid storage).
* **Execution Flow:** `Client -> JSON DSL -> ObjectQL Core -> Driver -> Native Query -> DB`.

## 2. Directory & Datasource Resolution

The system uses a **"Directory-as-Datasource"** convention to map objects to database connections.

### 2.1 Standard Structure

```text
/project-root
├── /objects
│   ├── /_common/           # [Reserved] Mixins or abstract definitions
│   │
│   ├── /logs/              # [Datasource: logs] (e.g., MongoDB)
│   │   └── access.yml      # -> Mapped to 'logs' connection
│   │
│   ├── /external/          # [Datasource: external] (e.g., Oracle)
│   │   └── erp_orders.yml  # -> Mapped to 'external' connection
│   │
│   └── user.yml            # [Datasource: default] (Root level = default)
│
├── /roles                  # RBAC Definitions
└── .objectqlrc.js          # Connection config (Environment specific)

```

### 2.2 Resolution Priority

1. **Explicit:** `datasource` property in YAML.
2. **Implicit:** Subdirectory name under `/objects/`.
3. **Fallback:** `default` connection.

## 3. Schema Definition (`.object.yml`)

Files must use **Snake Case** (e.g., `customer_orders.yml`).

```yaml
name: contracts             # Unique Entity Name (Table/Collection Name)
label: Sales Contracts
datasource: default         # Optional: Overrides directory convention

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

All internal communication uses this AST.

### 4.1 Interface (TypeScript)

```typescript
type Operator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'not in' | 'like';

interface UnifiedQuery {
  entity: string;
  fields?: string[];
  
  // Recursive Filter AST
  filters?: Array<
    [string, Operator, any] | // Criterion
    'and' | 'or' |            // Logic
    UnifiedQuery['filters']   // Nested Group
  >;

  sort?: Array<[string, 'asc' | 'desc']>;
  
  // Pagination
  top?: number;  // LIMIT
  skip?: number; // OFFSET

  // Graph Resolution
  expand?: Record<string, {
    fields?: string[];
    filters?: UnifiedQuery['filters'];
  }>;
}

```

### 4.2 Example

```javascript
{
  "entity": "orders",
  "filters": [
    ["status", "=", "paid"],
    "and",
    [["amount", ">", 100], "or", ["is_vip", "=", true]]
  ],
  "expand": {
    "customer": { "fields": ["name", "email"] }
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
* `create(entity: string, data: any): Promise<any>`
* `update(entity: string, id: any, data: any): Promise<any>`
* `delete(entity: string, id: any): Promise<any>`

### 6.2 The "Compiler" Responsibility

* **Mongo Driver:** Compiles `UnifiedQuery` -> `Aggregation Pipeline`.
* **Knex Driver:** Compiles `UnifiedQuery` -> `Knex QueryBuilder` (handling JSONB logic transparently).