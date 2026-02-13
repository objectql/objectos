# Contributing to ObjectOS

Thank you for your interest in contributing to ObjectOS! This guide will help you get started.

## About ObjectOS

ObjectOS is the **runtime engine** that executes metadata defined in the ObjectQL format. It's part of a two-repository ecosystem:

- **[objectql/objectql](https://github.com/objectstack-ai/objectql)**: The protocol definition and core drivers
- **objectstack-ai/objectos** (this repo): The runtime implementation

## Project Structure

This is a Monorepo managed by PNPM workspaces and organized as follows:

```
objectos/
├── packages/
│   ├── agent/           # @objectos/agent - AI Agent Framework
│   ├── analytics/       # @objectos/analytics - Analytics Engine
│   ├── audit/           # @objectos/audit - Audit Logging
│   ├── auth/            # @objectos/auth - Authentication (BetterAuth)
│   ├── automation/      # @objectos/automation - Triggers & Rules
│   ├── browser/         # @objectos/browser - Offline Runtime (SQLite WASM)
│   ├── cache/           # @objectos/cache - LRU + Redis Cache
│   ├── federation/      # @objectos/federation - Module Federation
│   ├── graphql/         # @objectos/graphql - GraphQL API
│   ├── i18n/            # @objectos/i18n - Localization
│   ├── jobs/            # @objectos/jobs - Background Jobs & Cron
│   ├── marketplace/     # @objectos/marketplace - Plugin Marketplace
│   ├── metrics/         # @objectos/metrics - Prometheus Metrics
│   ├── notification/    # @objectos/notification - Email/SMS/Push/Webhook
│   ├── permissions/     # @objectos/permissions - RBAC Engine
│   ├── realtime/        # @objectos/realtime - WebSocket Server
│   ├── storage/         # @objectos/storage - KV Storage Backends
│   ├── telemetry/       # @objectos/telemetry - OpenTelemetry Tracing
│   ├── ui/              # @objectos/ui - Admin Console shared components
│   └── workflow/        # @objectos/workflow - State Machine Engine
├── apps/
│   ├── web/             # @objectos/web - Admin Console (Vite + React 19)
│   └── site/            # @objectos/site - Documentation (Next.js + Fumadocs)
├── api/                 # Hono API routes & middleware
├── examples/            # Example applications (CRM, Todo)
├── docs/                # VitePress documentation (guides, spec)
├── e2e/                 # Playwright E2E tests
└── scripts/             # Build & maintenance scripts
```

### Package Responsibilities

| Package                 | Role                                           | Dependencies                                |
| ----------------------- | ---------------------------------------------- | ------------------------------------------- |
| `@objectos/auth`        | Identity — BetterAuth, SSO, 2FA, Sessions      | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/permissions` | Authorization — RBAC, Permission Sets          | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/audit`       | Compliance — CRUD events, field history        | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/workflow`    | Flow — FSM engine, approval processes          | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/automation`  | Triggers — WorkflowRule, action types          | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/jobs`        | Background — queues, cron, retry               | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/realtime`    | Sync — WebSocket, presence                     | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/graphql`     | GraphQL API — schema generation, subscriptions | `@objectstack/spec`, `graphql`              |
| `@objectos/agent`       | AI — LLM agents, tools, orchestration          | `@objectstack/spec`, `@objectstack/runtime` |
| `@objectos/analytics`   | Analytics — aggregation, reports, dashboards   | `@objectstack/spec`, `@objectstack/runtime` |

## Development Standards

### Architecture Principle

> **"Kernel handles logic, Drivers handle data, Server handles HTTP."**

This must be maintained at all times:

- Kernel never touches HTTP or database connections directly
- Server never touches database queries directly
- Drivers are injected via dependency injection

### Code Style

**TypeScript**

- Use strict mode (`strict: true` in tsconfig)
- No `any` - use `unknown` with type guards if needed
- Prefer interfaces over type aliases for public APIs
- Use async/await for all I/O operations

**Naming Conventions**

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/variables: `camelCase`
- Interfaces: `PascalCase` (no `I` prefix)
- Constants: `UPPER_SNAKE_CASE`

**Comments**

- Use JSDoc for all public APIs
- Explain _why_, not just _what_
- Include examples for complex functions

Example:

```typescript
/**
 * Loads an object definition into the registry.
 * Triggers a schema sync if the driver supports it.
 *
 * @param config The object metadata from YAML
 * @throws {ValidationError} If the config is invalid
 *
 * @example
 * await kernel.load({
 *   name: 'contacts',
 *   fields: { email: { type: 'email' } }
 * });
 */
async load(config: ObjectConfig): Promise<void> {
  // ...
}
```

### Type Safety Rules

#### Rule #1: Import Types, Don't Redefine

```typescript
// ❌ BAD
interface ObjectConfig {
  name: string;
  fields: any;
}

// ✅ GOOD
import { ObjectConfig } from '@objectql/types';
```

#### Rule #2: Use Strict Types

```typescript
// ❌ BAD
async find(name: string, opts: any): Promise<any> {
  // ...
}

// ✅ GOOD
import { FindOptions } from '@objectql/types';

async find(
  name: string,
  options: FindOptions
): Promise<Record<string, any>[]> {
  // ...
}
```

### Testing Requirements

**All new features must include tests.**

- **Unit Tests**: For kernel logic (target: 90%+ coverage)
- **Integration Tests**: For server endpoints (target: 80%+ coverage)
- **E2E Tests**: For critical user flows

Example test:

```typescript
describe('ObjectOS.insert', () => {
  let kernel: ObjectOS;
  let mockDriver: jest.Mocked<ObjectQLDriver>;

  beforeEach(() => {
    kernel = new ObjectOS();
    mockDriver = createMockDriver();
    kernel.useDriver(mockDriver);
  });

  it('should validate required fields', async () => {
    await kernel.load({
      name: 'contacts',
      fields: {
        email: { type: 'email', required: true },
      },
    });

    await expect(
      kernel.insert('contacts', {}), // Missing email
    ).rejects.toThrow('email is required');
  });
});
```

### Documentation Requirements

- Update relevant docs in `/docs` for any user-facing changes
- Add JSDoc comments for all public APIs
- Include migration notes for breaking changes
- Update CHANGELOG.md

## How to Build

### Prerequisites

- Node.js 20+ (LTS recommended — see `.node-version`)
- PNPM 10+ (exact version managed via `packageManager` field in `package.json`)
- PostgreSQL or MongoDB (optional — SQLite by default)

### Setup

```bash
# Clone the repository
git clone https://github.com/objectstack-ai/objectos.git
cd objectos

# Install dependencies
pnpm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env to set AUTH_SECRET (required)

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Development Workflow

```bash
# Start API server (:5320) + Admin Console (:5321)
pnpm dev

# Start everything including docs site
pnpm dev:all

# Start only the API server
pnpm objectstack:serve

# Start only the Admin Console
pnpm web:dev

# Start only the docs site
pnpm site:dev

# Build for production
pnpm build

# Run the production build
pnpm start

# Run all tests (via Turborepo)
pnpm test

# Lint all packages
pnpm lint

# Type-check all packages
pnpm type-check

# Validate ObjectStack configuration
pnpm objectstack:validate

# Check development environment health
pnpm objectstack:doctor
```

## How to Contribute

### 1. Find an Issue

- Check [GitHub Issues](https://github.com/objectstack-ai/objectos/issues)
- Look for labels: `good first issue`, `help wanted`
- Comment on the issue to claim it

### 2. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/issue-123
```

### 3. Make Changes

Follow the coding standards above and ensure:

- Code compiles without errors
- Tests pass
- Documentation is updated
- No regressions

### 4. Write Tests

```bash
# Run tests for specific package
cd packages/kernel
pnpm run test

# Run all tests
cd ../..
pnpm run test
```

### 5. Commit Changes

Use conventional commits:

```bash
# Format: <type>(<scope>): <subject>
git commit -m "feat(workflow): add hook priority support"
git commit -m "fix(graphql): handle null values in query"
git commit -m "docs(guide): add architecture examples"
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes

### 6. Push and Create PR

```bash
# Push your branch
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
# - Provide a clear description
# - Reference related issues
# - Add screenshots for UI changes
```

### PR Checklist

Before submitting, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No merge conflicts
- [ ] Conventional commit messages used

## Testing

### Running Tests

```bash
# All tests (via Turborepo, concurrency=3)
pnpm test

# Specific package
pnpm --filter @objectos/permissions test

# E2E tests (Playwright)
pnpm e2e
```

> **Note**: Most packages use **Jest** (with `ts-jest` ESM preset). Some packages (`permissions`, `automation`, `workflow`) use **Vitest**. Both frameworks use the same `describe`/`it`/`expect` API — check each package's `package.json` for the exact test runner.

### Writing Tests

```typescript
// packages/cache/test/plugin.test.ts
import { CachePlugin } from '../src/plugin';

describe('CachePlugin', () => {
  let plugin: CachePlugin;

  beforeEach(() => {
    plugin = new CachePlugin({ maxSize: 100, ttl: 60000 });
  });

  it('should store and retrieve values', async () => {
    await plugin.set('key', 'value');
    const result = await plugin.get('key');
    expect(result).toBe('value');
  });

  it('should return undefined for expired keys', async () => {
    await plugin.set('key', 'value', { ttl: 1 });
    await new Promise((r) => setTimeout(r, 10));
    const result = await plugin.get('key');
    expect(result).toBeUndefined();
  });
});
```

### Coverage

Each package has a `test:coverage` script that runs tests with coverage reporting:

```bash
# Run coverage for a specific package
pnpm --filter @objectos/cache test:coverage

# Run coverage for all packages (aggregated via Turborepo)
pnpm test:coverage
```

**Coverage thresholds** are enforced per package:

| Metric     | Server Packages | Frontend (apps/web) |
| ---------- | :-------------: | :-----------------: |
| Branches   |       70%       |         60%         |
| Functions  |       70%       |         60%         |
| Lines      |       80%       |         70%         |
| Statements |       80%       |         70%         |

CI automatically collects coverage from all packages and uploads to Codecov.

### Snapshot Testing Guidelines

Snapshot tests capture the output of a component or function and compare it against a stored reference. Use them judiciously:

#### When to Use Snapshots

- **Serialized output**: JSON responses, generated schema, config objects
- **Error messages**: Validate that error messages remain consistent
- **Complex transformations**: Metadata transforms, template rendering output

#### When NOT to Use Snapshots

- **Random/dynamic values**: Timestamps, UUIDs, incrementing IDs — these change every run
- **Large objects**: Snapshots over ~50 lines become difficult to review in PRs
- **UI components**: Prefer behavioral tests (`getByRole`, assertions on visible text) over HTML snapshots

#### Best Practices

```typescript
// ✅ GOOD: Small, focused snapshot
it('should generate correct schema for object', () => {
  const schema = generateSchema(objectMeta);
  expect(schema).toMatchSnapshot();
});

// ✅ GOOD: Inline snapshot for small expected values
it('should format error message', () => {
  const error = formatError({ code: 'NOT_FOUND', object: 'contacts' });
  expect(error).toMatchInlineSnapshot(`"Object 'contacts' not found"`);
});

// ❌ BAD: Snapshot of a large, frequently-changing object
it('should render the entire page', () => {
  const html = render(<DashboardPage />);
  expect(html).toMatchSnapshot(); // Too large, hard to review
});
```

#### Updating Snapshots

When a snapshot legitimately changes (e.g., you added a field to a schema):

```bash
# Jest
pnpm --filter @objectos/graphql test -- -u

# Vitest
pnpm --filter @objectos/permissions test -- --update
```

**Always review snapshot diffs** in your PR before committing. Never blindly update snapshots.

## Documentation

### Building Docs

```bash
# Start docs site in development mode
pnpm site:dev

# Build docs site for production
pnpm site:build

# Preview the built docs site
pnpm site:preview
```

### Documentation Structure

```
docs/
├── index.md              # Homepage
├── guide/
│   ├── index.md          # Getting Started
│   ├── architecture.md   # Architecture guide
│   ├── data-modeling.md  # Data modeling
│   ├── logic-hooks.md    # Writing hooks
│   └── ...
└── spec/
    ├── index.md          # Spec overview
    ├── metadata-format.md
    └── ...
```

### Writing Docs

- Use clear, concise language
- Include code examples
- Add diagrams for complex concepts
- Link to related documentation
- Test all code examples

## Releasing

Releases are managed by maintainers using Changesets.

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm version

# Publish to NPM
pnpm release
```

## Getting Help

- **Discord**: Coming soon
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help newcomers get started

## License

By contributing, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

---

Thank you for contributing to ObjectOS! 🎉
