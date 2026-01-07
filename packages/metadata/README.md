# @objectql/metadata

The metadata management system for ObjectQL. This package provides a generic framework for discovering, loading, and managing metadata from various sources (files, npm packages, etc.).

While it includes plugins specifically for ObjectQL schemas (Objects, Apps, Hooks), it is designed to be extensible for any metadata-driven application.

## Features

- **MetadataRegistry**: A central in-memory store for all loaded metadata.
- **MetadataLoader**: A plugin-based file scanner that populates the registry.
- **Dynamic Loading**: Support for loading metadata from local directories or NPM packages at runtime.
- **ObjectQL Plugins**: Built-in support for loading `.object.yml`, `.app.yml`, `.hook.ts`, etc.

## Installation

```bash
npm install @objectql/metadata
```

## Usage

### Basic Usage

```typescript
import { MetadataRegistry, MetadataLoader } from '@objectql/metadata';

const registry = new MetadataRegistry();
const loader = new MetadataLoader(registry);

// Register custom plugin (optional)
loader.use({
    name: 'custom-report',
    glob: ['**/*.report.yml'],
    handler: (ctx) => {
        // parsing logic...
        ctx.registry.register('report', { ... });
    }
});

// Load from a directory
loader.load('/path/to/project');

// Access metadata
const reports = registry.list('report');
```

### Loading ObjectQL Schemas

If you are building a system that needs to understand ObjectQL schemas without running the full ORM:

```typescript
import { MetadataRegistry, MetadataLoader, registerObjectQLPlugins } from '@objectql/metadata';

const registry = new MetadataRegistry();
const loader = new MetadataLoader(registry);

// Register standard ObjectQL plugins (objects, apps, hooks, data)
registerObjectQLPlugins(loader);

// Load standard schemas
loader.load('./src');

const objects = registry.list('object');
console.log(objects.map(o => o.name));
```

## API

### `MetadataRegistry`
- `register(type, metadata)`
- `unregister(type, id)`
- `unregisterPackage(packageName)`
- `get(type, id)`
- `list(type)`

### `MetadataLoader`
- `use(plugin)`
- `load(dir)`
- `loadPackage(packageName)`
