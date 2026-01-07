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

All internal communication uses the Unified Query Protocol (JSON-DSL).

> **Full Specification:** Please refer to [QUERY_PROTOCOL.md](./QUERY_PROTOCOL.md) for the complete TypeScript interface and examples.

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
    filters: 
      - ['owner', '=', '$user.id']

    # Field Level Security (FLS)
    # Whitelist approach
    fields: ['*'] 

```
