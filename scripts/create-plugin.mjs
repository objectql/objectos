#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

const name = process.argv[2];

if (!name) {
  console.error('Usage: node scripts/create-plugin.mjs <plugin-name>');
  process.exit(1);
}

if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error(
    `Error: Plugin name "${name}" is invalid. Use lowercase kebab-case (a-z, 0-9, hyphens).`,
  );
  process.exit(1);
}

const pascalName = name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('');

const pkgDir = join(rootDir, 'packages', name);

if (existsSync(pkgDir)) {
  console.error(`Error: Directory packages/${name}/ already exists.`);
  process.exit(1);
}

const files = {
  'package.json':
    JSON.stringify(
      {
        name: `@objectos/${name}`,
        version: '0.1.0',
        type: 'module',
        license: 'AGPL-3.0',
        description: `${pascalName} plugin for ObjectOS`,
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        scripts: {
          build:
            'tsup src/index.ts --format esm,cjs --clean && tsc --emitDeclarationOnly --declaration',
          test: 'vitest run',
          'test:coverage': 'vitest run --coverage',
          'test:watch': 'vitest',
          lint: 'eslint src/',
          clean: 'rm -rf dist',
          'type-check': 'tsc --noEmit',
        },
        dependencies: {
          '@objectstack/runtime': '^3.0.0',
          '@objectstack/spec': '3.0.0',
        },
        devDependencies: {
          tsup: '^8.5.1',
          typescript: '^5.9.3',
          vitest: '^4.0.18',
        },
      },
      null,
      2,
    ) + '\n',

  'tsconfig.json':
    JSON.stringify(
      {
        extends: '../../tsconfig.base.json',
        compilerOptions: {
          outDir: 'dist',
          rootDir: 'src',
        },
        include: ['src'],
      },
      null,
      2,
    ) + '\n',

  'vitest.config.ts': `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts'],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 80,
        statements: 80,
      },
    },
  },
});
`,

  'src/index.ts': `export { ${pascalName}Plugin } from './plugin.js';
`,

  'src/plugin.ts': `import type { Plugin, PluginContext } from '@objectstack/runtime';

export interface ${pascalName}PluginOptions {
  /** Enable debug logging */
  debug?: boolean;
}

export class ${pascalName}Plugin implements Plugin {
  readonly id = '@objectos/${name}';
  readonly name = '${pascalName}';
  private options: ${pascalName}PluginOptions;

  constructor(options: ${pascalName}PluginOptions = {}) {
    this.options = options;
  }

  async onLoad(ctx: PluginContext): Promise<void> {
    ctx.logger.info(\`\${this.name} plugin loaded\`);
  }
}
`,

  'test/plugin.test.ts': `import { describe, it, expect, vi } from 'vitest';
import { ${pascalName}Plugin } from '../src/plugin';

describe('${pascalName}Plugin', () => {
  it('should have correct id', () => {
    const plugin = new ${pascalName}Plugin();
    expect(plugin.id).toBe('@objectos/${name}');
  });

  it('should have correct name', () => {
    const plugin = new ${pascalName}Plugin();
    expect(plugin.name).toBe('${pascalName}');
  });

  it('should call onLoad without errors', async () => {
    const plugin = new ${pascalName}Plugin();
    const ctx = {
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    };
    await expect(plugin.onLoad(ctx as any)).resolves.not.toThrow();
    expect(ctx.logger.info).toHaveBeenCalledWith('${pascalName} plugin loaded');
  });
});
`,

  'README.md': `# @objectos/${name}

> ${pascalName} plugin for ObjectOS

## Installation

This package is part of the ObjectOS monorepo.

## Usage

\`\`\`typescript
import { ${pascalName}Plugin } from '@objectos/${name}';

const plugin = new ${pascalName}Plugin();
\`\`\`

## Development

\`\`\`bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build
pnpm build

# Type check
pnpm type-check
\`\`\`

## License

AGPL-3.0
`,
};

// Create directories
mkdirSync(join(pkgDir, 'src'), { recursive: true });
mkdirSync(join(pkgDir, 'test'), { recursive: true });

// Write files
const createdFiles = [];
for (const [relativePath, content] of Object.entries(files)) {
  const filePath = join(pkgDir, relativePath);
  writeFileSync(filePath, content, 'utf-8');
  createdFiles.push(`  packages/${name}/${relativePath}`);
}

console.log(`✅ Plugin "@objectos/${name}" created successfully!\n`);
console.log('Created files:');
for (const f of createdFiles) {
  console.log(f);
}
console.log(`\nNext steps:`);
console.log(`  cd packages/${name}`);
console.log(`  pnpm install`);
console.log(`  pnpm test`);
