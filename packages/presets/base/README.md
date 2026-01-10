# @objectql/preset-base

Metadata package for ObjectQL providing platform-level object definitions.

Includes integration for:
- Better-Auth (User, Session, Account, Organization, etc.)
- Platform Roles (Super Admin, Admin, User)

## Objects

- `user`
- `account`
- `session`
- `verification`
- `organization`
- `member`
- `invitation`
- `team`
- `teamMember`

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
