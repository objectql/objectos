# @objectos/plugin-permissions

Permission and authorization plugin for ObjectOS - RBAC, field-level security, and record-level security.

## Overview

The Permissions Plugin provides a comprehensive authorization system for ObjectOS, supporting:

- **Object-Level Permissions**: Control CRUD operations on objects
- **Field-Level Security**: Fine-grained access control for specific fields
- **Record-Level Security (RLS)**: Filter-based access control for records
- **Profile-Based Permissions**: Assign permissions through user profiles/roles
- **Permission Sets**: Declarative YAML-based permission configuration

## Installation

```bash
npm install @objectos/plugin-permissions
```

## Architecture

### Permission Hierarchy

1. **Object Permissions**: Control access to entire objects
2. **Field Permissions**: Control access to specific fields within objects
3. **Record Filters**: Apply filters to limit which records a user can access

### Permission Check Flow

```
User Request → Check Object Permission → Check Field Permission → Apply Record Filters → Execute Query
```

## Configuration

### Permission Set YAML Format

```yaml
# permissions/contact_permissions.yml
name: contact_permissions
objectName: contacts
description: Permissions for contact object

profiles:
  sales:
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: false
    viewFilters:
      owner: "{{ userId }}"
  
  admin:
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: true

fieldPermissions:
  salary:
    visibleTo: [admin, hr]
    editableBy: [admin]
  
  ssn:
    visibleTo: [admin, hr]
    editableBy: [admin]
  
  email:
    visibleTo: [sales, admin, hr]
    editableBy: [sales, admin]
```

## Usage

### Basic Setup

```typescript
import { createPermissionsPlugin } from '@objectos/plugin-permissions';

const permissionsPlugin = createPermissionsPlugin({
  enabled: true,
  defaultDeny: true,
  permissionsDir: './permissions',
  cachePermissions: true,
});

// Add to ObjectOS
const os = new ObjectOS({
  plugins: [permissionsPlugin]
});
```

### Check Object Permission

```typescript
import { getPermissionsAPI } from '@objectos/plugin-permissions';

const permsAPI = getPermissionsAPI(kernel);
const engine = permsAPI?.getEngine();

// Check if user can create contacts
const result = await engine?.checkPermission(
  {
    userId: 'user-123',
    profiles: ['sales'],
  },
  'contacts',
  'create'
);

if (result?.allowed) {
  // Proceed with create
} else {
  console.log(`Access denied: ${result?.reason}`);
}
```

### Check Field Permission

```typescript
// Check if user can view salary field
const canViewSalary = await engine?.checkFieldPermission(
  {
    userId: 'user-123',
    profiles: ['sales'],
  },
  'contacts',
  'salary',
  'read'
);

console.log(`Can view salary: ${canViewSalary}`);
```

### Apply Record-Level Security

```typescript
// Get filters for user's record access
const filters = await engine?.getRecordFilters(
  {
    userId: 'user-123',
    profiles: ['sales'],
  },
  'contacts'
);

// Filters will contain: { owner: 'user-123' }
// Apply filters to query
const records = await objectQL.find('contacts', {
  filters: {
    ...userFilters,
    ...filters, // Apply RLS filters
  },
});
```

### Filter Fields

```typescript
// Filter fields based on user permissions
const allFields = ['name', 'email', 'phone', 'salary', 'ssn'];
const allowedFields = await engine?.filterFields(
  {
    userId: 'user-123',
    profiles: ['sales'],
  },
  'contacts',
  allFields,
  'read'
);

// allowedFields will exclude 'salary' and 'ssn' for sales profile
console.log(allowedFields); // ['name', 'email', 'phone']
```

### Reload Permission Sets

```typescript
// Reload permissions from disk
const permsAPI = getPermissionsAPI(kernel);
await permsAPI?.reloadPermissions();
```

## Permission Patterns

### Owner-Based Access

```yaml
profiles:
  user:
    allowRead: true
    allowEdit: true
    viewFilters:
      owner: "{{ userId }}"
```

### Team-Based Access

```yaml
profiles:
  team_member:
    allowRead: true
    allowEdit: true
    viewFilters:
      teamId: "{{ user.teamId }}"
```

### Hierarchical Access

```yaml
profiles:
  manager:
    allowRead: true
    allowEdit: true
    viewFilters:
      department: "{{ user.department }}"
      level: { $lte: "{{ user.level }}" }
```

## API Reference

### `checkPermission(context, objectName, action)`

Check if a user has permission to perform an action on an object.

**Parameters:**
- `context`: User permission context (userId, profiles)
- `objectName`: Name of the object
- `action`: CRUD action (create, read, update, delete)

**Returns:** `PermissionCheckResult`

### `checkFieldPermission(context, objectName, fieldName, action)`

Check if a user has permission to access a field.

**Parameters:**
- `context`: User permission context
- `objectName`: Name of the object
- `fieldName`: Name of the field
- `action`: Action (read, update)

**Returns:** `PermissionCheckResult`

### `getRecordFilters(context, objectName)`

Get record-level security filters for a user.

**Parameters:**
- `context`: User permission context
- `objectName`: Name of the object

**Returns:** Record filters object

### `filterFields(context, objectName, fields, action)`

Filter a list of fields based on user permissions.

**Parameters:**
- `context`: User permission context
- `objectName`: Name of the object
- `fields`: Array of field names or objects
- `action`: Action (read, update)

**Returns:** Filtered fields array

## Integration Examples

### With ObjectQL Queries

```typescript
// Wrap ObjectQL find with permission checking
async function findWithPermissions(objectName, query, context) {
  const permsAPI = getPermissionsAPI(kernel);
  const engine = permsAPI?.getEngine();
  
  // Check read permission
  const canRead = await engine?.checkPermission(
    context,
    objectName,
    'read'
  );
  
  if (!canRead?.allowed) {
    throw new Error(`No read permission for ${objectName}`);
  }
  
  // Apply RLS filters
  const filters = await engine?.getRecordFilters(context, objectName);
  
  // Execute query with filters
  const records = await objectQL.find(objectName, {
    ...query,
    filters: { ...query.filters, ...filters },
  });
  
  // Filter fields
  const filteredRecords = await Promise.all(
    records.map(async (record) => {
      const fields = Object.keys(record);
      const allowedFields = await engine?.filterFields(
        context,
        objectName,
        fields,
        'read'
      );
      
      return Object.fromEntries(
        allowedFields?.map(field => [field, record[field]]) || []
      );
    })
  );
  
  return filteredRecords;
}
```

### With GraphQL Resolvers

```typescript
const resolvers = {
  Query: {
    contacts: async (parent, args, context) => {
      const permsAPI = getPermissionsAPI(context.kernel);
      const engine = permsAPI?.getEngine();
      
      const permContext = {
        userId: context.user.id,
        profiles: context.user.profiles,
      };
      
      // Check permissions
      const canRead = await engine?.checkPermission(
        permContext,
        'contacts',
        'read'
      );
      
      if (!canRead?.allowed) {
        throw new ForbiddenError('No permission to read contacts');
      }
      
      // Apply RLS
      const filters = await engine?.getRecordFilters(
        permContext,
        'contacts'
      );
      
      return await contactService.find({ ...args.filter, ...filters });
    },
  },
};
```

## Best Practices

### 1. Default Deny

Always use `defaultDeny: true` in production to ensure secure-by-default behavior.

### 2. Granular Permissions

Define fine-grained permissions rather than broad "admin" access:

```yaml
# Good
profiles:
  sales_manager:
    allowRead: true
    allowEdit: true
    viewFilters:
      department: sales

# Less secure
profiles:
  admin:
    allowRead: true
    allowEdit: true
    allowDelete: true
```

### 3. Field Sensitivity

Always restrict sensitive fields:

```yaml
fieldPermissions:
  ssn:
    visibleTo: [admin, hr]
    editableBy: [admin]
  password:
    visibleTo: []  # Never visible
    editableBy: [admin]
```

### 4. Audit Permission Changes

Log all permission checks and changes for compliance.

## Status

**Current Implementation Status: ✅ Implemented**

This package provides a complete, production-ready permissions system for ObjectOS:

- [x] **Permission Engine**: Full CRUD permission checking with caching
- [x] **YAML Loader**: Load permission sets from YAML files
- [x] **Permission Cache**: TTL-based caching for performance
- [x] **Field-Level Security**: Filter fields based on user permissions
- [x] **Record-Level Security**: Apply filters to limit record access
- [x] **Plugin Integration**: Hooks into ObjectOS data lifecycle
- [x] **Comprehensive Tests**: 63+ unit and integration tests
- [x] **Examples**: YAML permission set examples

### Test Coverage

- **Storage Tests**: 17 tests
- **Loader Tests**: 18 tests  
- **Engine Tests**: 20 tests
- **Plugin Tests**: 8 tests
- **Total**: 63 passing tests

### Example Files

See the `examples/` directory for complete YAML permission set examples:

- `contact-permissions.yml` - Contact object with sales/admin roles
- `account-permissions.yml` - Department-based access control
- `employee-permissions.yml` - HR-specific field restrictions

## Roadmap

Future enhancements:

- [ ] GraphQL middleware for automatic permission enforcement
- [ ] REST API middleware
- [ ] Admin UI for permission management
- [ ] Permission migration tools
- [ ] Advanced RLS with dynamic expressions

## License

AGPL-3.0
