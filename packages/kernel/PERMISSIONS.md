# ObjectOS Permission System

The ObjectOS Permission System provides comprehensive object-level and field-level permission management based on the [@objectstack/spec](https://github.com/objectstack-ai/spec) protocol.

## Features

- **Object-Level Permissions**: Control CRUD operations (Create, Read, Update, Delete) per object
- **Field-Level Security**: Control visibility and editability of individual fields
- **Permission Sets**: Reusable collections of permissions that can be assigned to users
- **Profiles**: Primary permission set that defines a user's base capabilities
- **Permission Stacking**: Combine multiple permission sets for granular access control
- **View All / Modify All**: Super-user permissions that bypass ownership checks
- **YAML Configuration**: Define permissions in human-readable YAML files
- **Caching**: Efficient permission set loading and caching

## Quick Start

### 1. Initialize ObjectOS with Permissions

```typescript
import { ObjectOS } from '@objectos/kernel';
import * as path from 'path';

const objectos = new ObjectOS({
    permissions: {
        // Path to permission set YAML files
        permissionSetsPath: path.join(__dirname, 'permissions'),
        // Enable caching
        enableCache: true,
        // Enable permission checking
        enabled: true,
    },
});

await objectos.init();
```

### 2. Define Permission Sets

Create YAML files in your permissions directory:

**permissions/sales_user.yml**
```yaml
name: sales_user
label: Sales User
isProfile: true

objects:
  contacts:
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: false
  
  accounts:
    allowRead: true
    allowCreate: true
    allowEdit: true
    allowDelete: false

fields:
  contacts.salary:
    readable: false
    editable: false
  
  contacts.created_date:
    readable: true
    editable: false

systemPermissions:
  - export_reports
  - view_dashboards
```

### 3. Check Permissions

```typescript
import { User } from '@objectos/kernel';

const user: User = {
    id: 'user123',
    username: 'john.sales',
    profile: 'sales_user',
    permissionSets: [],
};

const permissionManager = objectos.getPermissionManager();

// Check object-level permissions
const canRead = await permissionManager.canRead(user, 'contacts');
const canCreate = await permissionManager.canCreate(user, 'contacts');
const canEdit = await permissionManager.canEdit(user, 'contacts');
const canDelete = await permissionManager.canDelete(user, 'contacts');

// Check field-level permissions
const visibleFields = await permissionManager.getVisibleFields(
    user,
    'contacts',
    ['first_name', 'last_name', 'email', 'salary']
);

const editableFields = await permissionManager.getEditableFields(
    user,
    'contacts',
    ['first_name', 'last_name', 'email', 'created_date']
);

// Filter record fields
const record = {
    id: 'contact123',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    salary: 100000,
};

const filteredRecord = await permissionManager.filterRecordFields(
    user,
    'contacts',
    record
);
// Returns: { id: 'contact123', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
// (salary is hidden)
```

## Permission Set Schema

### Object Permissions

Each object can have the following permissions:

| Permission | Type | Description |
|------------|------|-------------|
| `allowCreate` | boolean | Can create new records |
| `allowRead` | boolean | Can read owned or shared records |
| `allowEdit` | boolean | Can edit owned or shared records |
| `allowDelete` | boolean | Can delete owned or shared records |
| `allowTransfer` | boolean | Can change record ownership |
| `allowRestore` | boolean | Can restore soft-deleted records |
| `allowPurge` | boolean | Can permanently delete records |
| `viewAllRecords` | boolean | Can view all records (bypasses ownership) |
| `modifyAllRecords` | boolean | Can modify all records (bypasses ownership) |

### Field Permissions

Field permissions are defined with the format `objectName.fieldName`:

| Permission | Type | Description |
|------------|------|-------------|
| `readable` | boolean | Can view this field |
| `editable` | boolean | Can edit this field |

### Permission Set Structure

```yaml
# Unique identifier (lowercase snake_case)
name: permission_set_name

# Display label
label: Permission Set Label

# Is this a profile? (base permission set for a user)
isProfile: true|false

# Object permissions
objects:
  object_name:
    allowRead: true
    allowCreate: true
    # ... other permissions

# Field permissions (optional)
fields:
  object_name.field_name:
    readable: true
    editable: false

# System permissions (optional)
systemPermissions:
  - permission_name_1
  - permission_name_2
```

## User Model

Users have the following permission-related properties:

```typescript
interface User {
    id: string;
    username?: string;
    profile?: string;           // Primary permission set
    permissionSets?: string[];  // Additional permission sets
    role?: string;              // For hierarchy-based access
}
```

## Permission Stacking

Users can have multiple permission sets:

1. **Profile**: The primary permission set (e.g., "sales_user")
2. **Additional Permission Sets**: Extra permissions (e.g., "sales_manager")

Permissions are cumulative - if ANY permission set grants access, the user has access.

**Example:**

```typescript
const user: User = {
    id: 'user123',
    profile: 'sales_user',      // Base permissions
    permissionSets: [
        'sales_manager',         // Adds manager capabilities
        'export_access',         // Adds export permissions
    ],
};
```

## API Reference

### PermissionManager

The main interface for permission checking:

```typescript
class PermissionManager {
    // Initialize and load permission sets
    async init(): Promise<void>;

    // Object-level permissions
    async canRead(user: User, objectName: string): Promise<boolean>;
    async canCreate(user: User, objectName: string): Promise<boolean>;
    async canEdit(user: User, objectName: string, recordId?: string): Promise<boolean>;
    async canDelete(user: User, objectName: string, recordId?: string): Promise<boolean>;
    async canViewAll(user: User, objectName: string): Promise<boolean>;
    async canModifyAll(user: User, objectName: string): Promise<boolean>;

    // Field-level permissions
    async getVisibleFields(user: User, objectName: string, allFields: string[]): Promise<string[]>;
    async getEditableFields(user: User, objectName: string, allFields: string[]): Promise<string[]>;
    async canReadField(user: User, objectName: string, fieldName: string): Promise<boolean>;
    async canEditField(user: User, objectName: string, fieldName: string): Promise<boolean>;

    // Record filtering
    async filterRecordFields(user: User, objectName: string, record: any): Promise<any>;

    // Component access
    getLoader(): PermissionSetLoader;
    getObjectChecker(): ObjectPermissionChecker;
    getFieldChecker(): FieldPermissionChecker;
}
```

### FieldFilter

Utility class for filtering data fields:

```typescript
class FieldFilter {
    // Filter a single object's fields
    filterFields(data: any, visibleFields: string[]): any;
    
    // Filter an array of objects' fields
    filterFieldsArray(dataArray: any[], visibleFields: string[]): any[];
}
```

**Usage Example:**

```typescript
import { FieldFilter } from '@objectos/kernel';

const filter = new FieldFilter();

// Filter a single record
const record = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    salary: 100000,
};

const visibleFields = ['id', 'name', 'email'];
const filtered = filter.filterFields(record, visibleFields);
// Returns: { id: '123', name: 'John Doe', email: 'john@example.com' }

// Filter multiple records
const records = [
    { id: '1', name: 'John', salary: 100000 },
    { id: '2', name: 'Jane', salary: 120000 },
];

const filteredRecords = filter.filterFieldsArray(records, ['id', 'name']);
// Returns: [
//   { id: '1', name: 'John' },
//   { id: '2', name: 'Jane' }
// ]
```

### PermissionSetLoader

Loads and caches permission sets:

```typescript
class PermissionSetLoader {
    constructor(config: PermissionSetLoaderConfig);

    async loadPermissionSet(name: string): Promise<PermissionSet | undefined>;
    async loadAllPermissionSets(): Promise<PermissionSet[]>;
    
    addPermissionSet(permissionSet: PermissionSet): void;
    clearCache(): void;
    removeFromCache(name: string): void;
    getCachedPermissionSetNames(): string[];
}
```

## Examples

See the `examples/` directory for complete usage examples:

- `permission-system-example.ts` - Comprehensive permission system usage
- `permissions/sales_user.yml` - Sales user permission set
- `permissions/system_admin.yml` - Administrator permission set
- `permissions/read_only.yml` - Read-only user permission set
- `permissions/sales_manager.yml` - Sales manager add-on permission set

## Best Practices

### 1. Use Profiles for Base Permissions

Define a profile for each user type:
- `system_admin` - Full access
- `sales_user` - Sales team member
- `customer_support` - Support team member
- `read_only` - View-only access

### 2. Use Permission Sets for Add-on Capabilities

Add specific capabilities with additional permission sets:
- `sales_manager` - Team management capabilities
- `export_access` - Data export permissions
- `api_access` - API usage permissions

### 3. Follow Naming Conventions

- Use **lowercase snake_case** for permission set names
- Use descriptive labels for display
- Group related permissions together

### 4. Implement Least Privilege

- Grant minimum permissions necessary
- Use field-level security for sensitive data
- Explicitly deny dangerous operations

### 5. Document Permission Sets

Add comments to YAML files explaining:
- Purpose of the permission set
- Which user types should have it
- Any special considerations

## Integration with CRUD Operations

The permission system can be integrated with ObjectQL CRUD operations using the `FieldFilter` class:

```typescript
import { FieldFilter } from '@objectos/kernel';

const fieldFilter = new FieldFilter();

// Example: Check permissions before find operation
async function findWithPermissions(user: User, objectName: string, options: any) {
    // Check read permission
    if (!await permissionManager.canRead(user, objectName)) {
        throw new ForbiddenError('No read permission');
    }

    // Execute query
    const records = await objectql.find(objectName, options);

    // Get visible fields for this user
    const allFields = records.length > 0 ? Object.keys(records[0]) : [];
    const visibleFields = await permissionManager.getVisibleFields(user, objectName, allFields);

    // Filter fields using FieldFilter
    return fieldFilter.filterFieldsArray(records, visibleFields);
}

// Example: Check permissions before insert operation
async function insertWithPermissions(user: User, objectName: string, data: any) {
    // Check create permission
    if (!await permissionManager.canCreate(user, objectName)) {
        throw new ForbiddenError('No create permission');
    }

    // Get editable fields for this user
    const allFields = Object.keys(data);
    const editableFields = await permissionManager.getEditableFields(user, objectName, allFields);

    // Filter data to only editable fields using FieldFilter
    const filteredData = fieldFilter.filterFields(data, editableFields);

    // Execute insert
    const record = await objectql.insert(objectName, filteredData);

    // Filter result fields
    return await permissionManager.filterRecordFields(user, objectName, record);
}
```

## Testing

The permission system includes comprehensive tests:

```bash
# Run all permission tests
npm test -- permission

# Run specific test file
npm test -- permission-set-loader
npm test -- object-permissions
npm test -- field-permissions
npm test -- field-filter
npm test -- permission-manager
```

## Security Considerations

1. **Always validate permissions on the server side** - Never rely on client-side permission checks
2. **Use HTTPS in production** - Protect permission data in transit
3. **Audit permission changes** - Log who grants/revokes permissions
4. **Review permissions regularly** - Ensure users have appropriate access
5. **Test permission configurations** - Verify permissions work as expected

## License

This package is part of ObjectOS and follows the same license.
