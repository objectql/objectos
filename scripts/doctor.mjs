#!/usr/bin/env node

/**
 * ObjectOS Doctor — Environment Health Checker
 *
 * Validates that the development environment meets all requirements
 * for building and running ObjectOS.
 *
 * Usage: node scripts/doctor.mjs
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

let passed = 0;
let warned = 0;
let failed = 0;

function check(label, fn) {
  try {
    const result = fn();
    if (result.ok) {
      console.log(`  ✅ ${label}: ${result.message}`);
      passed++;
    } else if (result.warn) {
      console.log(`  ⚠️  ${label}: ${result.message}`);
      warned++;
    } else {
      console.log(`  ❌ ${label}: ${result.message}`);
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ ${label}: ${err.message}`);
    failed++;
  }
}

function getVersion(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function parseMajor(version) {
  const match = version?.match(/(\d+)\.\d+/);
  return match ? parseInt(match[1], 10) : 0;
}

console.log('\n🩺 ObjectOS Doctor\n');

// ─── Runtime Checks ─────────────────────────────────────────────────────────

console.log('Runtime:');

check('Node.js version', () => {
  const version = getVersion('node --version');
  if (!version) return { ok: false, message: 'Node.js not found' };
  const major = parseMajor(version);
  if (major >= 20) return { ok: true, message: `${version} (required: >=20.x)` };
  return { ok: false, message: `${version} — upgrade to Node.js 20+ (LTS)` };
});

check('pnpm version', () => {
  const version = getVersion('pnpm --version');
  if (!version) return { ok: false, message: 'pnpm not found — install via corepack enable' };
  const major = parseMajor(version);
  if (major >= 10) return { ok: true, message: `v${version} (required: >=10)` };
  return {
    ok: false,
    message: `v${version} — upgrade to pnpm 10+ (corepack use pnpm@latest)`,
  };
});

check('Git version', () => {
  const version = getVersion('git --version');
  if (!version) return { ok: false, message: 'Git not found' };
  return { ok: true, message: version.replace('git version ', 'v') };
});

// ─── Project Checks ─────────────────────────────────────────────────────────

console.log('\nProject:');

check('Dependencies installed', () => {
  const nodeModules = join(rootDir, 'node_modules');
  if (existsSync(nodeModules)) return { ok: true, message: 'node_modules/ exists' };
  return {
    ok: false,
    message: 'node_modules/ missing — run: pnpm install',
  };
});

check('Environment file', () => {
  const envFile = join(rootDir, '.env');
  if (existsSync(envFile)) return { ok: true, message: '.env file found' };
  return {
    warn: true,
    message: '.env file missing — run: cp .env.example .env',
  };
});

check('AUTH_SECRET configured', () => {
  const envFile = join(rootDir, '.env');
  if (!existsSync(envFile)) return { warn: true, message: '.env file missing (skipped)' };
  const content = readFileSync(envFile, 'utf-8');
  const match = content.match(/^AUTH_SECRET=(.+)$/m);
  if (!match) return { warn: true, message: 'AUTH_SECRET not set in .env' };
  const val = match[1].trim();
  if (val === 'your-super-secret-key-change-this-in-production' || val.length < 16) {
    return {
      warn: true,
      message: 'AUTH_SECRET is using the default/weak value — generate a secure key',
    };
  }
  return { ok: true, message: 'AUTH_SECRET is configured' };
});

check('TypeScript config', () => {
  const tsconfig = join(rootDir, 'tsconfig.json');
  if (existsSync(tsconfig)) return { ok: true, message: 'tsconfig.json found' };
  return { ok: false, message: 'tsconfig.json missing' };
});

check('Turbo config', () => {
  const turboJson = join(rootDir, 'turbo.json');
  if (existsSync(turboJson)) return { ok: true, message: 'turbo.json found' };
  return { ok: false, message: 'turbo.json missing' };
});

// ─── Tooling Checks ─────────────────────────────────────────────────────────

console.log('\nTooling:');

check('ESLint config', () => {
  const eslintConfig = join(rootDir, 'eslint.config.mjs');
  if (existsSync(eslintConfig)) return { ok: true, message: 'eslint.config.mjs found' };
  return { warn: true, message: 'ESLint config not found' };
});

check('Prettier config', () => {
  const prettierrc = join(rootDir, '.prettierrc');
  if (existsSync(prettierrc)) return { ok: true, message: '.prettierrc found' };
  return { warn: true, message: 'Prettier config not found' };
});

check('EditorConfig', () => {
  const editorconfig = join(rootDir, '.editorconfig');
  if (existsSync(editorconfig)) return { ok: true, message: '.editorconfig found' };
  return { warn: true, message: '.editorconfig not found' };
});

check('Git hooks (Husky)', () => {
  const huskyDir = join(rootDir, '.husky');
  const preCommit = join(huskyDir, 'pre-commit');
  if (existsSync(preCommit)) return { ok: true, message: '.husky/pre-commit installed' };
  if (existsSync(huskyDir))
    return { warn: true, message: '.husky exists but pre-commit hook missing' };
  return {
    warn: true,
    message: 'Husky not installed — run: pnpm prepare',
  };
});

// ─── Package Checks ─────────────────────────────────────────────────────────

console.log('\nPackages:');

check('Workspace packages', () => {
  const pkgDir = join(rootDir, 'packages');
  if (!existsSync(pkgDir)) return { ok: false, message: 'packages/ directory not found' };
  const packages = readdirSync(pkgDir).filter((d) => existsSync(join(pkgDir, d, 'package.json')));
  if (packages.length >= 20) return { ok: true, message: `${packages.length} packages found` };
  return {
    warn: true,
    message: `${packages.length} packages found (expected 20)`,
  };
});

check('Build artifacts', () => {
  const pkgDir = join(rootDir, 'packages');
  const packages = readdirSync(pkgDir).filter((d) => existsSync(join(pkgDir, d, 'package.json')));
  const built = packages.filter((d) => existsSync(join(pkgDir, d, 'dist')));
  if (built.length === packages.length)
    return {
      ok: true,
      message: `All ${built.length}/${packages.length} packages built`,
    };
  if (built.length > 0)
    return {
      warn: true,
      message: `${built.length}/${packages.length} packages built — run: pnpm build`,
    };
  return {
    warn: true,
    message: 'No packages built — run: pnpm build',
  };
});

// ─── Summary ────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(50));
console.log(`\n  Results: ${passed} passed, ${warned} warnings, ${failed} failed\n`);

if (failed > 0) {
  console.log('  ❌ Some checks failed. Fix the issues above before developing.\n');
  process.exit(1);
} else if (warned > 0) {
  console.log('  ⚠️  All checks passed with warnings. Review items above.\n');
  process.exit(0);
} else {
  console.log('  🎉 Environment is healthy! Ready to develop.\n');
  process.exit(0);
}
