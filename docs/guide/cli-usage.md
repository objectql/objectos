# ObjectStack CLI Usage Guide

This guide covers how to use the `@objectstack/cli` commands to develop and manage your ObjectOS applications.

## Overview

The ObjectStack CLI (`@objectstack/cli`) provides a comprehensive set of tools for:
- Starting and managing development servers
- Generating metadata files (objects, flows, views, etc.)
- Validating and compiling configurations
- Building and deploying applications

All commands are accessible via `pnpm` scripts in the root `package.json`.

## Server Commands

### Start Development Server

Start the ObjectStack API server with hot-reload:

```bash
pnpm objectstack:dev
```

This runs the server in development mode with automatic reloading when code changes.

### Start Production Server

Start the ObjectStack API server in production mode:

```bash
pnpm objectstack:serve
```

The server will start on port 5320 (configurable via `objectstack.config.ts`).

### Start Studio (UI + API)

Launch the Console UI with the development server:

```bash
pnpm objectstack:studio
```

This combines the API server and Console UI in a single process.

### Full Development Stack

Start API server + Admin Console (recommended for daily development):

```bash
pnpm dev
```

This runs:
- API server on `http://localhost:5320`
- Admin Console on `http://localhost:5321/console/`

Or start everything including the documentation site:

```bash
pnpm dev:all
```

## Code Generation Commands

The CLI includes powerful code generation tools for creating metadata files.

### Generate Object Schema

Create a new business object:

```bash
pnpm generate:object product
```

This creates a TypeScript file with a complete object schema including:
- Standard fields (name, description)
- Metadata (ownership, labels)
- Field definitions

Example output (`src/objects/product.ts`):

```typescript
import { Data } from '@objectstack/spec';

const product: Data.Object = {
  name: 'product',
  label: 'Product',
  pluralLabel: 'Products',
  ownership: 'own',
  fields: {
    name: {
      type: 'text',
      label: 'Name',
      required: true,
      maxLength: 255,
    },
    description: {
      type: 'textarea',
      label: 'Description',
    },
  },
};

export default product;
```

### Generate Workflow/Flow

Create a new automation flow:

```bash
pnpm generate:flow approval-process
```

This creates a flow definition with:
- Trigger configuration
- Node definitions
- Transition logic

### Generate View

Create a new view definition:

```bash
pnpm generate:view product-list
```

### Generate Action

Create a new action:

```bash
pnpm generate:action send-notification
```

### Generate Agent

Create a new AI agent:

```bash
pnpm generate:agent customer-support
```

### Generate Dashboard

Create a new dashboard:

```bash
pnpm generate:dashboard sales-overview
```

### Generate Application

Create a new application:

```bash
pnpm generate:app crm
```

### Create Plugin

Create a new plugin from template:

```bash
pnpm create:plugin my-plugin
```

This scaffolds a complete plugin structure with:
- Plugin manifest
- Service definitions
- Tests
- Documentation

### Create Example

Create a new example application from template:

```bash
pnpm create:example demo-crm
```

### Interactive Generation

Use the generic generate command for an interactive prompt:

```bash
pnpm generate
```

### Custom Output Directory

Specify a custom output directory:

```bash
pnpm generate:object product --dir packages/crm/objects
```

### Dry Run Mode

Preview what will be generated without creating files:

```bash
pnpm generate:object product --dry-run
```

## Configuration Commands

### Validate Configuration

Validate your `objectstack.config.ts` against the ObjectStack Protocol:

```bash
pnpm objectstack:validate
```

This checks:
- Configuration structure
- Plugin compatibility
- Metadata format compliance
- Type correctness

### Compile Configuration

Compile your configuration to a JSON artifact for production:

```bash
pnpm objectstack:compile
```

This outputs to `dist/objectstack.json` by default.

Custom output path:

```bash
pnpm objectstack:compile --output build/config.json
```

### Display Configuration Info

Show a summary of your configuration:

```bash
pnpm objectstack:info
```

This displays:
- Number of plugins loaded
- Configuration metadata
- Load time

### Check Environment Health

Run a health check on your development environment:

```bash
pnpm objectstack:doctor
```

This verifies:
- Node.js version
- Package manager (pnpm/npm/yarn)
- TypeScript installation
- Dependencies installation
- Git configuration

Use verbose mode for detailed fix suggestions:

```bash
pnpm objectstack:doctor --verbose
```

## Build Commands

### Build All Packages

Build all workspace packages using Turborepo:

```bash
pnpm build
```

### Build Web Console

Build the Admin Console (Vite app):

```bash
pnpm web:build
```

Output: `apps/web/dist/`

### Build Documentation Site

Build the documentation site (Next.js 16 + Fumadocs):

```bash
pnpm site:build
```

Output: `apps/site/out/`

**Note:** The repository has two documentation systems:
- `apps/site/` - Main documentation site (Next.js + Fumadocs) - builds to `out/`
- `docs/` - VitePress guides (legacy) - not built for production

## Testing Commands

### Run All Tests

Run tests across all packages:

```bash
pnpm test
```

### Run Type Checking

Type-check all packages:

```bash
pnpm type-check
```

### Run Linters

Lint all packages:

```bash
pnpm lint
```

## Application-Specific Commands

### Web Console Development

Start only the Admin Console (without API):

```bash
pnpm web:dev
```

Access at `http://localhost:5321/console/`

Note: The web app proxies API requests to `http://localhost:5320`, so you'll need the API server running separately.

### Documentation Site Development

Start the documentation site:

```bash
pnpm site:dev
```

### Preview Production Build

Preview the built Admin Console:

```bash
pnpm web:preview
```

## Production Deployment

### Build Everything

```bash
# Build all packages
pnpm build

# Build web console
pnpm web:build

# Build documentation site
pnpm site:build
```

### Start Production Server

```bash
pnpm start
```

This runs a single-process server that:
- Serves the API on `http://localhost:5320/api/v1/*`
- Serves the Admin Console at `http://localhost:5320/console/`
- Serves the documentation at `http://localhost:5320/docs/`

All static assets are served from the built `dist/` and `out/` directories via static mounts configured in `objectstack.config.ts`.

**Note:** In production, everything runs on a single port (5320). The development setup uses two ports (5320 for API, 5321 for Vite dev server) to enable hot-reload for the frontend.

## Configuration

The server configuration is defined in `objectstack.config.ts`:

```typescript
export default {
  metadata: {
    baseDir: resolve(__dirname),
    patterns: [
      'packages/*/objects/*.object.yml',
      'packages/*/workflows/*.workflow.yml',
    ]
  },
  
  plugins: [
    new MetricsPlugin(),
    new CachePlugin(), 
    new StoragePlugin(),
    new BetterAuthPlugin(),
    // ... more plugins
  ],

  server: {
    port: process.env.PORT || 5320,
    staticMounts: [
      { root: './apps/web/dist', path: '/console', spa: true },
      { root: './apps/site/out', path: '/docs' },
    ],
    cors: {
      origin: ['http://localhost:5321'],
      credentials: true,
    }
  },
};
```

## Environment Variables

- `PORT` - Server port (default: 5320)
- `LOG_LEVEL` - Logging level (default: 'info')
- `CORS_ORIGINS` - Comma-separated list of allowed origins

## Tips and Best Practices

1. **Use `pnpm dev` for daily development** - It starts both API and web app with hot-reload

2. **Generate metadata files** - Use the generate commands to scaffold new objects, flows, etc. with proper TypeScript types

3. **Validate before deploying** - Always run `pnpm objectstack:validate` before production deployment

4. **Build packages first** - If you encounter errors with CLI commands, run `pnpm build` first to compile all workspace packages

5. **Use dry-run for testing** - Test generation commands with `--dry-run` before creating actual files

6. **Organize metadata** - Use `--dir` flag to organize generated files into appropriate directories

## Troubleshooting

### "Cannot find package" errors

Build all packages first:

```bash
pnpm build
```

### Server won't start

Check if the port is already in use:

```bash
lsof -i :5320
```

### Validation errors

Review the error output and check your `objectstack.config.ts` against the protocol schema.

### Generate command not working

Make sure you're running from the project root directory where `package.json` exists.

## Further Reading

- [Architecture Guide](./architecture.md)
- [Plugin Development](./plugin-development.md)
- [Data Modeling](./data-modeling.md)
- [HTTP Protocol Specification](../spec/http-protocol.md)
