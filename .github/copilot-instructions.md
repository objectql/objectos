# ObjectQL - Copilot Instructions

This is a TypeScript-based monorepo for ObjectQL, a universal data query engine designed to bridge MongoDB (schema-less) and PostgreSQL (schema-strict) with a unified JSON-DSL protocol. The project is AI-native and designed for LLM integration.

## Code Standards

### Required Before Each Commit
- Ensure all TypeScript code compiles without errors
- Run tests for packages you modified
- Follow existing code structure and patterns in the monorepo

### Development Flow
- **Install dependencies**: `npm install`
- **Build all packages**: `npm run build` (runs TypeScript compiler with project references)
- **Test all packages**: `npm run test` (runs Jest tests across workspaces)
- **Test specific package**: `npm run test --workspace=@objectql/core`
- **Dev server**: `npm run dev` (starts @objectql/server in development mode)

## Repository Structure

This is a monorepo managed by npm workspaces:

- `packages/core`: The query engine, AST parser, and metadata definitions
- `packages/metadata`: Metadata type definitions and validation
- `packages/driver-mongo`: MongoDB driver implementation
- `packages/driver-knex`: SQL driver (PostgreSQL, MySQL, SQLite) using Knex with JSONB strategy
- `packages/api`: API layer and query handling
- `packages/server`: Server implementation
- `packages/ui`: UI components
- `packages/better-auth`: Authentication utilities
- `examples/`: Usage examples and demonstrations
- `docs/`: VitePress documentation site

## Key Guidelines

1. **Follow TypeScript best practices**
   - Use strict type checking
   - Export types from package index files
   - Maintain existing type definitions

2. **Maintain monorepo structure**
   - Each package has its own `package.json`, `tsconfig.json`, and `jest.config.js`
   - Use workspace protocol (`"@objectql/metadata": "*"`) for internal dependencies
   - Root `tsconfig.json` uses project references for incremental builds

3. **Write comprehensive tests**
   - Place tests in `test/` directory within each package
   - Use naming pattern `*.test.ts` for test files
   - Use Jest as the testing framework with `ts-jest` preset
   - Standard Jest config in each package: preset `ts-jest`, testEnvironment `node`, testMatch pattern `**/test/**/*.test.ts`
   - Every new feature must include test cases

4. **Follow metadata specifications**
   - Maintain strict specification for Object Definitions
   - See `docs/specifications/metadata.md` for details
   - Object definitions use `.object.yml` files with YAML format

5. **Preserve AI-native design**
   - Queries are JSON ASTs, not string concatenation
   - Maintain the unified JSON-DSL protocol across drivers
   - Keep the abstraction layer between DSL and driver implementations

6. **Documentation**
   - Update relevant documentation in `docs/` when making significant changes
   - Use VitePress for documentation: `npm run docs:dev` to preview

## Architecture Principles

- **Dual-Stack Engine**: Support both MongoDB (via native driver) and SQL databases (via Knex)
- **Pluggable Architecture**: Core logic is decoupled from storage drivers
- **Zero Heavy Dependencies**: Keep the project lightweight and modern
- **Promise-based async API**: All async operations use Promises, not callbacks
