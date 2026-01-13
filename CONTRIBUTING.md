# Contributing to ObjectOS

Thank you for your interest in contributing to ObjectOS! This guide will help you get started.

## About ObjectOS

ObjectOS is the **runtime engine** that executes metadata defined in the ObjectQL format. It's part of a two-repository ecosystem:

- **[objectql/objectql](https://github.com/objectql/objectql)**: The protocol definition and core drivers
- **objectql/objectos** (this repo): The runtime implementation

## Project Structure

This is a Monorepo managed by PNPM workspaces and organized as follows:

```
objectos/
├── packages/
│   ├── kernel/          # @objectos/kernel - Core runtime engine
│   ├── server/          # @objectos/server - NestJS HTTP server
│   ├── ui/              # @objectos/ui - React components
│   └── presets/         # @objectos/preset-* - Standard metadata
├── examples/            # Example applications
├── docs/                # VitePress documentation
└── apps/                # Full-stack applications (if any)
```

### Package Responsibilities

| Package | Role | Can Import | Cannot Import |
|---------|------|------------|---------------|
| `@objectos/kernel` | Core logic, object registry, hooks | `@objectql/types`, `@objectql/core` | `pg`, `express`, `nest` |
| `@objectos/server` | HTTP layer, REST API | `@objectos/kernel`, `@nestjs/*` | `knex`, direct SQL |
| `@objectos/ui` | React components | `@objectos/kernel` types | Server-specific code |
| `@objectos/preset-*` | Metadata YAML files | None | No .ts files allowed |

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
- Explain *why*, not just *what*
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
        email: { type: 'email', required: true }
      }
    });
    
    await expect(
      kernel.insert('contacts', {}) // Missing email
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

- Node.js 18+ (LTS recommended)
- PNPM 8+
- PostgreSQL 13+ (for integration tests)

### Setup

```bash
# Clone the repository
git clone https://github.com/objectql/objectos.git
cd objectos

# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm run test
```

### Development Workflow

```bash
# Start the full stack development environment
# - Server runs in watch mode on http://localhost:3000
# - Web runs in build watch mode (changes auto-compile)
pnpm run dev

# Start only the server (without frontend build watch)
pnpm run server

# Start only the frontend build watch
pnpm run web:watch

# Build for production (compiles both server and web)
pnpm run build

# Run the production build (starts server serving built web assets)
pnpm run start

# Run tests in watch mode
pnpm run test --watch

# Build documentation
pnpm run docs:dev

# Lint code
pnpm run lint  # (TODO: Add lint script)
```

## How to Contribute

### 1. Find an Issue

- Check [GitHub Issues](https://github.com/objectql/objectos/issues)
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
git commit -m "feat(kernel): add hook priority support"
git commit -m "fix(server): handle null values in query"
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
# All tests
pnpm run test

# Specific package
pnpm --filter @objectos/kernel test

# With coverage
pnpm run test --coverage

# Watch mode
pnpm run test --watch
```

### Writing Tests

#### Unit Test Example (Kernel)

```typescript
// packages/kernel/src/__tests__/registry.test.ts
import { ObjectRegistry } from '../registry';

describe('ObjectRegistry', () => {
  let registry: ObjectRegistry;
  
  beforeEach(() => {
    registry = new ObjectRegistry();
  });
  
  it('should register an object', () => {
    registry.register({
      name: 'contacts',
      fields: { email: { type: 'email' } }
    });
    
    expect(registry.has('contacts')).toBe(true);
  });
  
  it('should throw if object not found', () => {
    expect(() => {
      registry.get('nonexistent');
    }).toThrow('Object not found: nonexistent');
  });
});
```

#### Integration Test Example (Server)

```typescript
// packages/server/test/api.e2e-spec.ts
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('ObjectDataController (e2e)', () => {
  let app;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleRef.createNestApplication();
    await app.init();
  });
  
  it('POST /api/data/contacts should create contact', () => {
    return request(app.getHttpServer())
      .post('/api/data/contacts')
      .send({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
      });
  });
  
  afterAll(async () => {
    await app.close();
  });
});
```

## Documentation

### Building Docs

```bash
# Start docs dev server
pnpm run docs:dev

# Build static docs
pnpm run docs:build

# Preview built docs
pnpm run docs:preview
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
