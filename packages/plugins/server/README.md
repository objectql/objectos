# @objectos/plugin-server

NestJS HTTP server plugin for ObjectOS runtime.

## Overview

This plugin provides HTTP server capabilities to ObjectOS using NestJS. It replaces the deprecated `@objectos/server` package by implementing server functionality as a plugin.

## Features

- ✅ **NestJS Integration**: Full NestJS framework support
- ✅ **REST API**: Auto-generated REST endpoints via ObjectQL
- ✅ **GraphQL Support**: GraphQL endpoint for complex queries
- ✅ **WebSocket**: Real-time communication support
- ✅ **Authentication**: Integration with Better-Auth plugin
- ✅ **CORS**: Configurable CORS settings
- ✅ **Middleware**: Custom middleware support

## Installation

```bash
pnpm add @objectos/plugin-server @objectstack/runtime
```

## Quick Start

### Basic Usage

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { ServerPlugin } from '@objectos/plugin-server';

async function bootstrap() {
  const kernel = new ObjectKernel();
  
  // Register server plugin
  kernel.use(ServerPlugin);
  
  // Bootstrap kernel
  await kernel.bootstrap();
}

bootstrap();
```

### Custom Configuration

```typescript
import { createServerPlugin } from '@objectos/plugin-server';

const serverPlugin = createServerPlugin({
  port: 4000,
  cors: {
    origins: ['https://myapp.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

kernel.use(serverPlugin);
```

## Configuration Options

```typescript
interface ServerPluginOptions {
  // Server port (default: 3000 or OBJECTQL_PORT env var)
  port?: number;
  
  // CORS configuration
  cors?: {
    origins?: string[];      // Allowed origins
    credentials?: boolean;   // Allow credentials
    methods?: string[];      // Allowed methods
    allowedHeaders?: string[]; // Allowed headers
  };
  
  // ObjectQL instance (optional, auto-detected from service registry)
  objectql?: any;
}
```

## Environment Variables

```bash
# Server port
OBJECTQL_PORT=3000

# CORS origins (comma-separated)
OBJECTQL_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Database connection
OBJECTQL_CONNECTION=postgresql://user:pass@localhost:5432/mydb

# Metadata path
OBJECTQL_METADATA_PATH=./metadata
```

## API Endpoints

Once the server plugin is running, the following endpoints are available:

### REST API
- `GET /api/data/:object` - List records
- `GET /api/data/:object/:id` - Get record by ID
- `POST /api/data/:object` - Create record
- `PUT /api/data/:object/:id` - Update record
- `DELETE /api/data/:object/:id` - Delete record

### Metadata API
- `GET /api/metadata/objects` - List all objects
- `GET /api/metadata/objects/:name` - Get object definition
- `GET /api/metadata/apps` - List applications

### ObjectQL RPC
- `POST /api/objectql` - JSON-RPC interface

## Integration with Other Plugins

### With Better-Auth Plugin

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { ServerPlugin } from '@objectos/plugin-server';
import { BetterAuthPlugin } from '@objectos/plugin-better-auth';

const kernel = new ObjectKernel();

kernel.use(BetterAuthPlugin);  // Adds /api/auth/* routes
kernel.use(ServerPlugin);       // HTTP server

await kernel.bootstrap();
```

### With Audit Log Plugin

```typescript
import { AuditLogPlugin } from '@objectos/plugin-audit-log';

kernel.use(AuditLogPlugin);  // Tracks all API requests
kernel.use(ServerPlugin);

await kernel.bootstrap();
```

## Development Mode

```bash
# Development with hot reload
pnpm dev

# Production build
pnpm build
pnpm start
```

## Testing

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { createServerPlugin } from '@objectos/plugin-server';
import request from 'supertest';

describe('Server Plugin', () => {
  let kernel: ObjectKernel;
  let app: any;
  
  beforeEach(async () => {
    kernel = new ObjectKernel();
    kernel.use(createServerPlugin({ port: 0 })); // Random port for testing
    await kernel.bootstrap();
    
    app = kernel.getService('nestjs.app');
  });
  
  afterEach(async () => {
    await kernel.shutdown();
  });
  
  it('should respond to health check', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);
      
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
```

## Architecture

The server plugin follows the NestJS modular architecture:

```
@objectos/plugin-server
├── AppModule (Root module)
│   ├── ObjectQLModule (Database & metadata)
│   ├── AuthModule (Authentication)
│   └── AppController (Health checks)
└── Plugin Lifecycle
    ├── init() - Create NestJS app
    ├── start() - Start HTTP server
    └── destroy() - Shutdown server
```

## Migration from @objectos/server

If you're migrating from the deprecated `@objectos/server` package:

1. **Update imports:**
   ```typescript
   // Before
   import { NestFactory } from '@nestjs/core';
   import { AppModule } from '@objectos/server';
   
   // After
   import { ObjectKernel } from '@objectstack/runtime';
   import { ServerPlugin } from '@objectos/plugin-server';
   ```

2. **Update bootstrap code:**
   ```typescript
   // Before
   async function bootstrap() {
     const app = await NestFactory.create(AppModule);
     await app.listen(3000);
   }
   
   // After
   async function bootstrap() {
     const kernel = new ObjectKernel();
     kernel.use(ServerPlugin);
     await kernel.bootstrap();
   }
   ```

See the [Migration Guide](../../docs/guide/migration-from-kernel.md) for detailed instructions.

## Advanced Usage

### Custom Middleware

```typescript
import { NestFactory } from '@nestjs/core';

const serverPlugin = createServerPlugin({
  port: 3000,
  configure: async (app) => {
    // Add custom middleware
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }
});
```

### Access NestJS App

```typescript
async start(ctx: PluginContext) {
  // Get the NestJS app from service registry
  const app = ctx.getService('nestjs.app');
  
  // Use NestJS APIs
  const httpAdapter = app.getHttpAdapter();
  // ...
}
```

## Troubleshooting

### Port already in use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Change the port via environment variable or plugin options:
```bash
OBJECTQL_PORT=4000 pnpm dev
```

### CORS errors

```
Access to fetch at 'http://localhost:3000/api/data/contacts' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution**: Add your frontend origin to CORS configuration:
```bash
OBJECTQL_CORS_ORIGINS=http://localhost:5173
```

## Contributing

See [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.

## License

AGPL-3.0 - See [LICENSE](../../../LICENSE)

## Links

- [Plugin Development Guide](../../docs/guide/plugin-development.md)
- [Migration Guide](../../docs/guide/migration-from-kernel.md)
- [ObjectStack Runtime](../runtime/README.md)
