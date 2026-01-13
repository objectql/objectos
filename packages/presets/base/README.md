# @objectos/preset-base

System objects preset for ObjectOS - provides essential objects for authentication and multi-tenancy.

## Overview

`@objectos/preset-base` is a metadata package containing pre-built system objects that integrate with Better-Auth and provide multi-tenancy support. This preset is required for all ObjectOS applications.

Following the AI Guidelines:
- **Rule #4 (Headless Principle)**: All objects include `label` and `description` for UI consumption
- **Metadata Standards**: Uses snake_case for database fields, provides UI metadata

## Features

- **Authentication Objects**: User, Account, Session, Verification (Better-Auth integration)
- **Multi-Tenancy Objects**: Organization, Member, Invitation
- **Team Management**: Team, TeamMember
- **Role-Based Access Control**: Pre-configured roles for common use cases

## Installation

```bash
pnpm add @objectos/preset-base
```

## Usage

Add to your ObjectOS configuration:

```typescript
// objectql.config.ts
export default {
  datasource: {
    default: { /* your database config */ }
  },
  presets: [
    '@objectos/preset-base' // Required for authentication and multi-tenancy
  ]
};
```

## Included Objects

### Authentication Objects (Better-Auth Integration)

#### `user`
User accounts with authentication credentials.

**Key Fields:**
- `name` (string) - User's full name
- `email` (string) - Email address (unique)
- `emailVerified` (boolean) - Email verification status
- `image` (string) - Profile picture URL
- `role` (string) - System role (super_admin, admin, user)

#### `account`
OAuth accounts linked to users (for social login).

**Key Fields:**
- `userId` (string) - Reference to user
- `accountId` (string) - Provider account ID
- `providerId` (string) - OAuth provider (google, github, etc.)
- `accessToken` (string) - OAuth access token

#### `session`
Active user sessions.

**Key Fields:**
- `userId` (string) - Reference to user
- `token` (string) - Session token (JWT)
- `expiresAt` (datetime) - Expiration timestamp
- `activeOrganizationId` (string) - Currently active organization

#### `verification`
Email verification tokens.

**Key Fields:**
- `identifier` (string) - Email address
- `value` (string) - Verification token
- `expiresAt` (datetime) - Token expiration

### Multi-Tenancy Objects

#### `organization`
Organizations for multi-tenant applications.

**Key Fields:**
- `name` (string) - Organization name
- `slug` (string) - URL-friendly identifier (unique)
- `logo` (string) - Organization logo URL
- `metadata` (json) - Additional custom data

#### `member`
Organization membership linking users to organizations.

**Key Fields:**
- `organizationId` (string) - Reference to organization
- `userId` (string) - Reference to user
- `role` (string) - Role in organization (owner, admin, member)

#### `invitation`
Pending organization invitations.

**Key Fields:**
- `organizationId` (string) - Reference to organization
- `email` (string) - Invitee email
- `role` (string) - Proposed role
- `status` (string) - Invitation status (pending, accepted, rejected)

### Team Management Objects

#### `team`
Teams within organizations for fine-grained access control.

**Key Fields:**
- `organizationId` (string) - Reference to organization
- `name` (string) - Team name
- `description` (string) - Team description

#### `teamMember`
Team membership linking users to teams.

**Key Fields:**
- `teamId` (string) - Reference to team
- `userId` (string) - Reference to user
- `role` (string) - Role in team

### Application Objects

#### `app`
Application/interface configurations.

**Key Fields:**
- `name` (string) - App identifier
- `label` (string) - Display name
- `icon` (string) - App icon
- `menu` (json) - Navigation menu structure

## Included Roles

Pre-configured role definitions for RBAC.

### `super_admin`
System administrator with full access to all features.

**Permissions:**
- Bypasses all ACL checks (`isSystem: true`)
- Can manage system settings
- Can access all organizations

### `admin`
Organization administrator.

**Permissions:**
- Full access within organization
- Can manage organization settings
- Can invite/remove members

### `owner`
Organization owner (created when organization is created).

**Permissions:**
- Full access within organization
- Can delete organization
- Can transfer ownership

### `user`
Standard member role.

**Permissions:**
- Basic access to organization resources
- Permissions defined by object-level rules

## Database Schema

The preset automatically creates the following tables:

```sql
-- Authentication
CREATE TABLE user (...)
CREATE TABLE account (...)
CREATE TABLE session (...)
CREATE TABLE verification (...)

-- Multi-tenancy
CREATE TABLE organization (...)
CREATE TABLE member (...)
CREATE TABLE invitation (...)

-- Teams
CREATE TABLE team (...)
CREATE TABLE teamMember (...)

-- Apps
CREATE TABLE app (...)
```

## Customization

While system objects are marked `customizable: false`, you can extend them with custom fields:

```yaml
# my-custom-user-fields.object.yml
name: user
extends: user  # Extend the base user object
fields:
  department:
    type: string
    label: Department
  phone:
    type: phone
    label: Phone Number
```

## Integration with Better-Auth

This preset is designed to work seamlessly with Better-Auth:

```typescript
// auth.client.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: {
    // Better-Auth will use the tables created by this preset
    type: 'postgres',
    url: process.env.DATABASE_URL
  },
  // ObjectOS handles the schema
  autoMigrate: false
});
```

## Multi-Tenancy Usage

### Creating an Organization

```typescript
const org = await objectos.insert('organization', {
  name: 'Acme Corp',
  slug: 'acme-corp',
  logo: 'https://example.com/logo.png'
});

// Add the creator as owner
await objectos.insert('member', {
  organizationId: org.id,
  userId: currentUser.id,
  role: 'owner'
});
```

### Filtering by Organization

```typescript
// Get all members of current organization
const members = await objectos.find('member', {
  filters: [
    { field: 'organizationId', operator: 'equals', value: currentOrg.id }
  ]
});
```

## Best Practices

### 1. Always Include Labels

Ensure UI metadata is present for all custom objects:

```yaml
# ✅ GOOD
name: custom_object
label: Custom Object  # Required for UI
description: My custom object
fields:
  name:
    type: string
    label: Name  # Required for form fields
```

### 2. Use snake_case for Database Fields

```yaml
# ✅ GOOD
fields:
  created_at:
    type: datetime
  
# ❌ BAD
fields:
  createdAt:  # This violates naming convention
    type: datetime
```

### 3. Leverage System Roles

Use the pre-configured roles instead of creating custom ones:

```typescript
// ✅ GOOD
if (user.roles.includes('admin')) {
  // Allow action
}

// ❌ BAD - creating custom system roles
await objectos.insert('role', {
  name: 'custom_admin'  // Don't do this
});
```

## Development

### Building the Preset

```bash
cd packages/presets/base
pnpm run build
```

This copies YAML files to the `dist` directory.

### Testing

The preset is tested as part of the main ObjectOS test suite:

```bash
# From repository root
pnpm test
```

## File Structure

```
packages/presets/base/
├── src/
│   ├── user.object.yml          # User authentication
│   ├── account.object.yml       # OAuth accounts
│   ├── session.object.yml       # User sessions
│   ├── verification.object.yml  # Email verification
│   ├── organization.object.yml  # Organizations
│   ├── member.object.yml        # Organization members
│   ├── invitation.object.yml    # Pending invites
│   ├── team.object.yml          # Teams
│   ├── teamMember.object.yml    # Team membership
│   ├── app.object.yml           # Applications
│   └── roles/
│       ├── super_admin.role.yml
│       ├── admin.role.yml
│       ├── owner.role.yml
│       └── user.role.yml
├── package.json
├── tsconfig.json
└── README.md
```

## License

[GNU Affero General Public License v3.0 (AGPL-3.0)](../../../LICENSE)

## Related Packages

- **[@objectos/kernel](../../kernel)** - ObjectOS runtime engine
- **[@objectos/server](../../server)** - NestJS HTTP server
- **[Better-Auth](https://github.com/better-auth/better-auth)** - Authentication library
