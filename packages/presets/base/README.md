# @objectos/preset-base

The standard metadata preset for ObjectOS, providing the core object definitions required for any business application.

## Features

- **Core Objects**: Includes definitions for `User`, `Account`, `Organization`, `Team`, `Member`, `Session`, `Verification`, etc.
- **Admin App**: Defines the default `admin` application layout.
- **Standard Roles**: Includes default role definitions (e.g., admin, user).

## Installation

```bash
pnpm add @objectos/preset-base
```

## Usage

Include this preset in your ObjectOS configuration to bootstrap your application with standard system objects.

```typescript
import { BasePreset } from '@objectos/preset-base';

const os = new ObjectOS({
  presets: [BasePreset]
});
```

## Contents

- **User & Auth**: `user`, `account`, `session`, `verification`
- **Organization**: `organization`, `member`, `invitation`
- **Teams**: `team`, `teamMember`
- **Apps**: `admin` application definition.
