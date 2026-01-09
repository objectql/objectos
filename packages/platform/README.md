# @objectql/platform

Metadata package for ObjectQL providing platform-level object definitions.

Includes integration for:
- Better-Auth (User, Session, Account, Organization, etc.)
- Platform Roles (Super Admin, Admin, User)
- Base/Workspace management

## Objects

- `user`
- `account`
- `session`
- `verification`
- `organization`
- `member`
- `invitation`
- `base`
- `base_member`

## Roles

- `super_admin`: System Administrator
- `admin`: Organization Administrator
- `user`: Standard Member

## Usage

In your ObjectQL configuration:

```typescript
import { PlatformPackage } from '@objectql/platform';
// The package name is used to load from node_modules
```
