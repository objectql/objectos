# @objectos/kernel

The Brain of ObjectOS - Core runtime engine for metadata-driven enterprise applications.

## Overview

`@objectos/kernel` extends [ObjectQL](https://github.com/objectql/objectql) with ObjectOS-specific features:

- **Enhanced Metadata Loading**: Automatically loads objects, apps, and data from YAML files
- **Preset System**: Support for reusable metadata packages
- **Application Structure**: Built-in app configuration with navigation menus
- **Seed Data Management**: Automatic data loading and association with objects

## Architecture

Following the ObjectOS Architecture Guidelines:

- **Rule #1 (Dependency Wall)**: All types imported from `@objectql/types`, never redefined
- **Rule #2 (Security Wrapper Pattern)**: ObjectOS wraps ObjectQL to add business logic and security
- **Rule #3 (NestJS Native DI)**: Designed for dependency injection in NestJS applications
- **Rule #4 (Headless Principle)**: Serves metadata-rich APIs for UI consumption, never generates UI code

## Installation

```bash
npm install @objectos/kernel
```

**Note**: This package requires peer dependencies:
- `@objectql/core` - The underlying metadata engine
- `@objectql/types` - TypeScript type definitions

## Quick Start

### Basic Setup

```typescript
import { ObjectOS } from '@objectos/kernel';
import { KnexDriver } from '@objectql/driver-sql';

// Create ObjectOS instance
const objectos = new ObjectOS({
    datasources: {
        default: new KnexDriver({
            client: 'pg',
            connection: process.env.DATABASE_URL
        })
    },
    presets: ['@objectos/preset-base'], // Prebuilt system objects
    source: './metadata' // Your app metadata
});

// Initialize (connects to DB, loads metadata)
await objectos.init();

// Use ObjectQL methods
const contacts = await objectos.find('contacts', {
    filters: [{ field: 'status', operator: 'equals', value: 'active' }],
    sort: [{ field: 'created_at', order: 'desc' }],
    limit: 10
});
```

### Using with NestJS (Recommended)

```typescript
// objectql.provider.ts
import { Provider } from '@nestjs/common';
import { ObjectOS } from '@objectos/kernel';
import { KnexDriver } from '@objectql/driver-sql';

export const objectosProvider: Provider = {
    provide: ObjectOS,
    useFactory: async () => {
        const objectos = new ObjectOS({
            datasources: {
                default: new KnexDriver({
                    client: 'pg',
                    connection: process.env.DATABASE_URL
                })
            },
            presets: ['@objectos/preset-base']
        });
        
        await objectos.init();
        return objectos;
    }
};

// app.module.ts
import { Module } from '@nestjs/common';
import { objectosProvider } from './objectql.provider';

@Module({
    providers: [objectosProvider],
    exports: [objectosProvider]
})
export class AppModule {}

// your.controller.ts
import { Controller, Get, Inject } from '@nestjs/common';
import { ObjectOS } from '@objectos/kernel';

@Controller('contacts')
export class ContactsController {
    constructor(
        @Inject(ObjectOS) private readonly os: ObjectOS
    ) {}
    
    @Get()
    async list() {
        return this.os.find('contacts', {});
    }
}
```

## Metadata File Formats

### Object Definition (*.object.yml)

Define business entities with fields, validation, and relationships:

```yaml
# contacts.object.yml
name: contacts
label: Contact
icon: ri-user-line
fields:
  first_name:
    type: text
    label: First Name
    required: true
  
  last_name:
    type: text
    label: Last Name
    required: true
  
  email:
    type: email
    label: Email
    unique: true
    required: true
  
  phone:
    type: phone
    label: Phone Number
  
  account:
    type: lookup
    label: Account
    reference_to: accounts
    
  status:
    type: select
    label: Status
    options:
      - label: Active
        value: active
      - label: Inactive
        value: inactive
    default_value: active

permission_set:
  allowRead: true
  allowCreate: ['sales', 'admin']
  allowEdit: ['sales', 'admin']
  allowDelete: ['admin']
```

### App Configuration (*.app.yml)

Define application structure with navigation menus:

```yaml
# crm.app.yml
name: crm
label: Sales CRM
description: Customer relationship management system
icon: ri-briefcase-line
color: blue

menu:
  # Section with grouped items
  - label: Sales
    items:
      - label: Dashboard
        type: page
        url: /dashboard
        icon: ri-dashboard-line
      
      - label: Leads
        type: object
        object: leads
        icon: ri-user-add-line
      
      - label: Opportunities
        type: object
        object: opportunities
        icon: ri-money-dollar-circle-line
  
  # Direct items (flat menu)
  - label: Accounts
    type: object
    object: accounts
    icon: ri-building-line
  
  - label: Contacts
    type: object
    object: contacts
    icon: ri-contacts-line
```

### Seed Data (*.data.yml)

Provide initial data for objects:

```yaml
# contacts.data.yml
- first_name: John
  last_name: Doe
  email: john.doe@example.com
  phone: "+1-555-0100"
  status: active

- first_name: Jane
  last_name: Smith
  email: jane.smith@example.com
  phone: "+1-555-0101"
  status: active
```

## API Reference

### ObjectOS Class

Extends `ObjectQL` from `@objectql/core`.

#### Constructor

```typescript
constructor(config: ObjectQLConfig)
```

**Configuration Options:**

- `datasources: Record<string, Driver>` - Database drivers keyed by name
- `presets: string[]` - Array of preset package names (e.g., `['@objectos/preset-base']`)
- `source: string | string[]` - Directory or directories to scan for metadata files
- `objects: Record<string, ObjectConfig>` - Object definitions to register directly
- `plugins: Plugin[]` - Additional plugins to register
- `connection: any` - Legacy connection configuration (deprecated)
- `remotes: any` - Remote datasource configurations

#### Methods

##### `async init(options?: any): Promise<void>`

Initializes the ObjectOS instance:
1. Initializes underlying ObjectQL engine
2. Runs all registered plugins
3. Loads metadata from configured sources
4. Validates object configurations

Throws `Error` if initialization fails.

##### `useDriver(driver: any): void`

Sets the default database driver. Convenience method for dynamic driver configuration.

```typescript
const objectos = new ObjectOS();
objectos.useDriver(new KnexDriver({ client: 'sqlite3', connection: ':memory:' }));
await objectos.init();
```

### ObjectOSPlugin

The core plugin that handles metadata loading. Automatically registered by ObjectOS.

**Scans for:**
- `**/*.object.yml` - Object definitions
- `**/*.app.yml` - Application configurations
- `**/*.data.yml` - Seed data files

**Search locations:**
- Configured source directories (`config.source`)
- Preset package directories (`config.presets`)

## Type Exports

### AppConfig

Application configuration metadata:

```typescript
interface AppConfig {
    name: string;              // Unique identifier
    label: string;             // Display name
    description?: string;      // App description
    icon?: string;            // Icon identifier (e.g., 'ri-dashboard-line')
    color?: string;           // Color theme
    menu?: AppMenuSection[] | AppMenuItem[];  // Navigation menu
}
```

### AppMenuItem

Navigation menu item:

```typescript
interface AppMenuItem {
    label: string;            // Display label
    icon?: string;            // Icon identifier
    type?: 'object' | 'page' | 'url' | 'divider';
    object?: string;          // Object reference (for type: 'object')
    url?: string;            // URL path (for type: 'url' or 'page')
    badge?: string | number; // Badge text/count
    visible?: boolean;        // Visibility flag
    items?: AppMenuItem[];    // Nested items
}
```

### AppMenuSection

Navigation menu section/group:

```typescript
interface AppMenuSection {
    label?: string;           // Section title
    items: AppMenuItem[];     // Menu items in section
    collapsible?: boolean;    // Can be collapsed
    collapsed?: boolean;      // Initially collapsed
}
```

### Type Guards

```typescript
function isAppMenuSection(entry: AppMenuSection | AppMenuItem): entry is AppMenuSection
```

Checks if a menu entry is a section vs a menu item.

## Presets

Presets are npm packages containing reusable metadata. They follow the same structure as your app metadata.

### Using Presets

```typescript
const objectos = new ObjectOS({
    presets: [
        '@objectos/preset-base',      // System objects (User, Role, Permission)
        '@company/preset-accounting', // Custom preset
    ]
});
```

### Creating a Preset

1. Create an npm package with metadata files:

```
my-preset/
├── package.json
├── objects/
│   ├── invoice.object.yml
│   └── payment.object.yml
└── apps/
    └── accounting.app.yml
```

2. Publish and use:

```bash
npm publish
```

```typescript
const objectos = new ObjectOS({
    presets: ['my-preset']
});
```

## Best Practices

### 1. Follow Naming Conventions

- **Database fields**: `snake_case` (e.g., `first_name`, `created_at`)
- **API responses**: `camelCase` (handled automatically by serializer)

### 2. Always Include UI Metadata

Ensure all metadata includes `label`, `description`, and `options` so ObjectUI can render automatically:

```yaml
fields:
  status:
    type: select
    label: Status           # Required for UI
    description: Current status of the contact
    options:               # Required for select fields
      - label: Active
        value: active
```

### 3. Use Dependency Injection

Never use `new ObjectOS()` in NestJS applications. Always use DI:

```typescript
// ❌ BAD
const objectos = new ObjectOS();

// ✅ GOOD
constructor(@Inject(ObjectOS) private readonly os: ObjectOS) {}
```

### 4. Never Bypass the Kernel

In `@objectos/server`, controllers must call ObjectOS methods, not ObjectQL directly:

```typescript
// ❌ BAD
const data = await kernel.engine.find(obj, id);

// ✅ GOOD
const data = await kernel.find(obj, id);
```

## Testing

```typescript
import { ObjectOS } from '@objectos/kernel';

describe('ObjectOS', () => {
    let objectos: ObjectOS;
    
    beforeEach(async () => {
        objectos = new ObjectOS({
            datasources: {
                default: new MockDriver()
            }
        });
        await objectos.init();
    });
    
    it('should load objects from metadata', () => {
        const contactObject = objectos.getObject('contacts');
        expect(contactObject).toBeDefined();
        expect(contactObject.label).toBe('Contact');
    });
});
```

## License

[GNU Affero General Public License v3.0 (AGPL-3.0)](../../LICENSE)

## Related Packages

- **[@objectql/core](https://github.com/objectql/objectql)** - The underlying metadata engine
- **[@objectql/types](https://github.com/objectql/objectql)** - TypeScript type definitions
- **[@objectql/driver-sql](https://github.com/objectql/objectql)** - SQL database driver
- **[@objectos/server](../server)** - NestJS HTTP server
- **[@objectos/ui](../ui)** - React UI components
