# Security Model (Modern RBAC)

* **Philosophy:** Additive Permissions (Union Strategy).
* **Mechanism:** Predicate Pushdown (Injects filters into AST before execution).

## 1. Directory Structure

The security configuration supports both **Role-Based Access Control (RBAC)** and **Managed Policies** for reusability.

```text
/project-root
├── /security
│   ├── /roles/             # Role Definitions
│   │   └── sales_rep.role.yml
│   │
│   └── /policies/          # Reusable Permisison Sets
│       └── contract_manage.policy.yml
```

## 2. Policy Definition (`.policy.yml`)

A **Policy** is a reusable collection of permission statements without being tied to a specific user identity. It defines "what can be done".

**File:** `/security/policies/contract_manage.policy.yml`

```yaml
name: contract_manage
description: Standard contract management rules

statements:
  - object: contracts
    actions: [read, create, update] # No delete permission
    
    # Row Level Security (RLS)
    # Automatically injected into the Query AST as an 'AND' condition
    filters: 
      - ['owner', '=', '$user.id']

    # Field Level Security (FLS)
    # Whitelist approach (only these fields are returned)
    fields: ['*'] 
```

## 3. Role Definition (`.role.yml`)

A **Role** defines an identity and assigns permissions. It can compose permissions by referencing **Managed Policies** or defining **Inline Policies**.

**File:** `/security/roles/sales_rep.role.yml`

```yaml
name: sales_rep
label: Sales Representative
description: Access to own data and public catalogues

# 1. Managed Policies (References)
# Reuses definitions from /security/policies/*.policy.yml
policies:
  - contract_manage      # References contract_manage.policy.yml
  - base_read_only       # References base_read_only.policy.yml

# 2. Inline Policies (Specific)
# Valid specifically for this role, not shared
inline_policies:
  - object: leads
    actions: [read, create]
    filters:
      - ['status', '=', 'new']
```

## 4. Resolution Logic

When a user with the role `sales_rep` executes a query:
1.  The system loads all referenced **Managed Policies**.
2.  The system loads all **Inline Policies**.
3.  All policies are **merged (Union)**.
    *   If *any* policy allows access to an object, access is granted.
    *   If multiple policies define RLS filters for the same object, they are typically combined with `OR`.
