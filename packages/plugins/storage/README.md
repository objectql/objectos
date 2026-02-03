# @objectos/plugin-storage

Key-Value and Blob storage abstraction for ObjectOS.

## Features

- **KV Storage**: Simple Key-Value store API.
- **Backends**:
  - **Memory Backend**: For testing and ephemeral data.
  - **SQLite Backend**: For local persistent storage.
  - **Redis Backend**: For high-performance, shared storage.
- **Type Safety**: TypeScript support for stored values.

## Installation

```bash
pnpm add @objectos/plugin-storage
```

## Usage

```typescript
import { StoragePlugin, getStorageAPI } from '@objectos/plugin-storage';

// Initialize with a backend
// ...

// Use the API
const storage = getStorageAPI(kernel);
await storage.set('config:retry_count', 5);
const val = await storage.get('config:retry_count');
```

## Development Plan

- [ ] Add **Object/Blob Storage** support (S3, MinIO, Azure Blob) for file uploads.
- [ ] Implement file upload handlers (Multipart).
- [ ] Add file metadata management.
- [ ] Add encryption support for stored va# @objectos/plug cat > packages/plugins/server/README.md <<'EOF'
# @objectos/plugin-server

NestJS-based HTTP Server plugin for the ObjectOS Runtime.

## Features

- **Kernel Hosting**: Acts as the host environment for the ObjectOS Kernel.
- **NestJS Integration**: Leverages the robust NestJS framework architecture.
- **API Gateway**: Serves as the entry point for GraphQL and REST APIs.
- **Static Assets**: Capabilities to serve static files.
- **Middleware**: supports standard Express/NestJS middleware iimport { Sto
#
// Initialize with a backend
// ...

// Use the API
const storage = ge
Th// ...

// Use the API
cons a
// U enconst storage tawait storage.set('config:retry_count pconst val = await storage.get('config:retrer```

## Development Plan

- [ ] Add **Object/Blob Sra
#ing
- [ ] Add **Objecelo- [ ] Implement file upload handlers (Multipart).
- [ ] Add file metmplement automat- [ ] Add file metadata management.
- [ ] Add en [- [ ] Add encryption support for s ]# @objectos/plugin-server

NestJS- exception filters to map ObjectOS errors to HTTP codes.
