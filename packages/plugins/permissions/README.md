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

const permsAPI = getPermissionsAPI(app);

// Check if user can create contacts
const canCreate = await permsAPI.checkPermission({
  userId: 'user-123',
  profiles: ['sales'],
  objectName: 'contacts',
  action: 'create',
});

if (canCreate.allowed) {
  // Proceed with create
} else {
  console.log(`Access denied: ${canCreate.reason}`);
}
```

### Check Field Permission

```typescript
// Check if user can view salary field
const canViewSalary = await permsAPI.checkFieldPermission({
  userId: 'user-123',
  profiles: ['sales'],
  objectName: 'contacts',
  fieldName: 'salary',
  action: 'read',
});
```

### Apply Record-Level Security

```typescript
// Get filters for user's record access
const filters = await permsAPI.getRecordFilters({
  userId: 'user-123',
  profiles: ['sales'],
  objectName: 'contacts',
});

// Apply filters to query
const records = await objectQL.find('contacts', {
  filters: {
    ...userFilters,
    ...filters, // Apply RLS filters
  },
});
```

### Load Permission Sets

```typescript
// Load from YAML files
await permsAPI.loadPermissionSets('./permissions');

// Load from JSON
await permsAPI.loadPermissionSet({
  name: 'custom_perms',
  objectName: 'orders',
  profiles: {
    customer: {
      allowRead: true,
      allowCreate: true,
      allowEdit: false,
      allowDelete: false,
      viewFilters: {
        customerId: '{{ userId }}',
      },
    },
  },
});
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
  // Check read permission
  const canRead = await permsAPI.checkPermission(
    context,
    objectName,
    'read'
  );
  
  if (!canRead.allowed) {
    throw new Error(`No read permission for ${objectName}`);
  }
  
  // Apply RLS filters
  const filters = await permsAPI.getRecordFilters(context, objectName);
  
  // Execute query with filters
  const records = await objectQL.find(objectName, {
    ...query,
    filters: { ...query.filters, ...filters },
  });
  
  // Filter fields
  const filteredRecords = records.map(record => {
    const fields = Object.keys(record);
    const allowedFields = await permsAPI.filterFields(
      context,
      objectName,
      fields,
      'read'
    );
    
    return Object.fromEntries(
      allowedFields.map(field => [field, record[field]])
    );
  });
  
  return filteredRecords;
}
```

### With GraphQL Resolvers

```typescript
const resolvers = {
  Query: {
    contacts: async (parent, args, context) => {
      // Check permissions
      const canRead = await permsAPI.checkPermission(
        { userId: context.user.id, profiles: context.user.profiles },
        'contacts',
        'read'
      );
      
      if (!canRead.allowed) {
        throw new ForbiddenError('No permission to read contacts');
      }
      
      // Apply RLS
      const filters = await permsAPI.getRecordFilters(
        { userId: context.user.id, profiles: context.user.profiles },
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

**Current Implementation Status: Design Phase**

This package provides the type definitions and architecture design for the permissions system. Full implementation will include:

- [ ] Permission engine implementation
- [ ] YAML loader for permission sets
- [ ] Permission cache system
- [ ] Integration with ObjectQL
- [ ] GraphQL middleware
- [ ] Admin UI for permission management

## License

AGPL-3.0
