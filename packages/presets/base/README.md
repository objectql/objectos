# @objectos/preset-base

Base metadata package for ObjectOS providing essential platform-level object definitions and integrations.

## Overview

`@objectos/preset-base` is a foundational metadata package that provides pre-built object definitions for user management, authentication, and organizational structures. It integrates seamlessly with Better-Auth to provide a complete authentication and authorization system.

## Features

- **User Management**: Complete user object definitions with profiles and preferences
- **Authentication**: Integration with Better-Auth for sessions, accounts, and verification
- **Organization Management**: Multi-tenant support with organizations, teams, and members
- **Role-Based Access Control**: Pre-configured roles and permission structures
- **Zero Configuration**: Drop-in metadata definitions ready to use

## Included Objects

### Core Authentication Objects

- **`user`**: User profiles and account information
- **`account`**: OAuth account linkages (Google, GitHub, etc.)
- **`session`**: Active user sessions
- **`verification`**: Email verification and password reset tokens

### Organization Objects

- **`organization`**: Company or tenant entities
- **`member`**: Organization membership records
- **`invitation`**: Pending organization invitations
- **`team`**: Sub-groups within organizations
- **`teamMember`**: Team membership records

### Access Control Objects

- **`role`**: Role definitions (Super Admin, Admin, User)
- **`permission`**: Granular permission definitions
- **`rolePermission`**: Role-to-permission mappings

## Installation

```bash
npm install @objectos/preset-base
```

## Usage

### Basic Setup

```typescript
import { ObjectOS } from '@objectos/kernel';
import { basePreset } from '@objectos/preset-base';

const kernel = new ObjectOS();

// Load base preset
await kernel.loadPreset(basePreset);

// Base objects are now available
const users = await kernel.find('user', {});
```

### With Configuration

```typescript
import { basePreset, BasePresetConfig } from '@objectos/preset-base';

const config: BasePresetConfig = {
  // Customize default roles
  roles: {
    super_admin: {
      label: 'System Administrator',
      permissions: ['*']
    },
    admin: {
      label: 'Organization Administrator',
      permissions: ['manage_users', 'manage_teams']
    }
  },
  
  // Enable/disable features
  features: {
    multiTenant: true,
    teamManagement: true,
    emailVerification: true
  }
};

await kernel.loadPreset(basePreset(config));
```

## Object Definitions

### User Object

```yaml
name: user
label: User
icon: user
description: User account and profile

fields:
  name:
    type: text
    label: Name
    required: true
  
  email:
    type: email
    label: Email Address
    unique: true
    required: true
  
  emailVerified:
    type: datetime
    label: Email Verified At
  
  image:
    type: url
    label: Profile Image
  
  createdAt:
    type: datetime
    label: Created At
    default: now
  
  updatedAt:
    type: datetime
    label: Updated At

permission_set:
  allowRead: ['admin', 'user']
  allowCreate: ['admin']
  allowEdit: ['admin', 'self']
  allowDelete: ['admin']
```

### Organization Object

```yaml
name: organization
label: Organization
icon: building
description: Company or tenant entity

fields:
  name:
    type: text
    label: Organization Name
    required: true
  
  slug:
    type: text
    label: Slug
    unique: true
  
  logo:
    type: url
    label: Logo
  
  metadata:
    type: json
    label: Metadata

permission_set:
  allowRead: ['member']
  allowCreate: ['super_admin']
  allowEdit: ['admin']
  allowDelete: ['super_admin']
```

### Team Object

```yaml
name: team
label: Team
icon: users
description: Team within an organization

fields:
  name:
    type: text
    label: Team Name
    required: true
  
  organization:
    type: lookup
    label: Organization
    reference_to: organization
    required: true
  
  description:
    type: textarea
    label: Description

permission_set:
  allowRead: ['member']
  allowCreate: ['admin']
  allowEdit: ['admin']
  allowDelete: ['admin']
```

## Default Roles

### Super Admin
- **Label**: System Administrator
- **Permissions**: Full system access
- **Description**: Platform-level administrator with unrestricted access

### Admin
- **Label**: Organization Administrator
- **Permissions**: Organization-level management
- **Description**: Can manage users, teams, and settings within their organization

### User
- **Label**: Standard User
- **Permissions**: Basic access
- **Description**: Regular user with standard access rights

## Integration with Better-Auth

This preset is designed to work seamlessly with Better-Auth:

```typescript
import { betterAuth } from 'better-auth';
import { ObjectOS } from '@objectos/kernel';
import { basePreset } from '@objectos/preset-base';

const kernel = new ObjectOS();
await kernel.loadPreset(basePreset);

const auth = betterAuth({
  database: kernel.getDriver(),
  // Better-Auth will use the object definitions from preset
  user: 'user',
  session: 'session',
  account: 'account',
  verification: 'verification'
});
```

## Customization

### Extending User Object

Add custom fields to the user object:

```typescript
await kernel.load({
  name: 'user',
  extend: true,  // Extend existing definition
  fields: {
    department: {
      type: 'select',
      label: 'Department',
      options: ['Engineering', 'Sales', 'Support']
    },
    phone: {
      type: 'text',
      label: 'Phone Number'
    }
  }
});
```

### Adding Custom Roles

```typescript
await kernel.insert('role', {
  name: 'sales_manager',
  label: 'Sales Manager',
  description: 'Manages sales team and opportunities',
  permissions: [
    'read_contacts',
    'create_contacts',
    'edit_contacts',
    'read_opportunities',
    'create_opportunities',
    'edit_opportunities'
  ]
});
```

## Multi-Tenancy Support

The preset includes full multi-tenancy support through organizations:

```typescript
// Query users in a specific organization
const orgUsers = await kernel.find('member', {
  filters: { organization: organizationId },
  include: ['user']
}, currentUser);

// Automatic filtering by organization (using hooks)
kernel.on('beforeFind', async (ctx) => {
  if (ctx.objectName !== 'organization' && ctx.user.organization) {
    ctx.filters = ctx.filters || {};
    ctx.filters.organization = ctx.user.organization;
  }
});
```

## Security Features

### Row-Level Security

Automatically enforced through hooks:

- Users can only see records in their organization
- Admins can manage users in their organization
- Super admins can access all records

### Field-Level Security

Sensitive fields are protected:

```yaml
fields:
  emailVerified:
    visible_to: ['admin', 'self']
  
  metadata:
    visible_to: ['admin']
    editable_by: ['super_admin']
```

## Data Seeding

Seed initial data for development:

```typescript
import { seedBaseData } from '@objectos/preset-base';

await seedBaseData(kernel, {
  superAdmin: {
    email: 'admin@example.com',
    password: 'secure-password',
    name: 'System Administrator'
  }
});
```

## API Examples

### Creating a User

```typescript
const user = await kernel.insert('user', {
  name: 'John Doe',
  email: 'john@example.com',
  emailVerified: new Date()
});
```

### Adding User to Organization

```typescript
const member = await kernel.insert('member', {
  user: userId,
  organization: organizationId,
  role: 'user'
});
```

### Creating a Team

```typescript
const team = await kernel.insert('team', {
  name: 'Engineering',
  organization: organizationId,
  description: 'Software development team'
});

// Add members to team
await kernel.insert('teamMember', {
  team: teamId,
  user: userId,
  role: 'member'
});
```

## Testing

The preset includes test utilities:

```typescript
import { createTestUser, createTestOrganization } from '@objectos/preset-base/testing';

describe('User Management', () => {
  it('should create user', async () => {
    const user = await createTestUser(kernel, {
      email: 'test@example.com'
    });
    
    expect(user).toHaveProperty('id');
  });
});
```

## Migration from Other Systems

Utilities for migrating from other platforms:

```typescript
import { importUsers } from '@objectos/preset-base/migration';

await importUsers(kernel, {
  source: 'auth0',
  users: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' }
  ]
});
```

## Contributing

See the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## License

AGPL-3.0 - See [LICENSE](../../../LICENSE) for details.

## Documentation

- [Complete Documentation](../../../docs/guide/index.md)
- [Security Guide](../../../docs/guide/security-guide.md)
- [Better-Auth Integration](https://better-auth.com)

## Links

- [GitHub Repository](https://github.com/objectstack-ai/objectos)
- [Issue Tracker](https://github.com/objectstack-ai/objectos/issues)
