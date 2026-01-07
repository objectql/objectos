# Contributing to ObjectQL

## Project Structure

This is a Monorepo managed by npm workspaces.

*   `packages/core`: The query engine, AST parser, and metadata definitions.
*   `packages/driver-*`: Database adapters.
*   `examples/*`: Usage examples.

## Development Standards

### Metadata Specifications

We maintain a strict specification for Object Definitions.
See: [Metadata Specification](./docs/specifications/metadata.md)

### Code Style

*   Use TypeScript for all packages.
*   Use ESLint/Prettier (TODO: Setup).
*   **Tests**: Every new feature must include a test case.
    *   Metadata tests: `packages/core/test`
    *   Integration tests: Pending driver implementation.

## How to Build

```bash
npm install
npm run build
```
