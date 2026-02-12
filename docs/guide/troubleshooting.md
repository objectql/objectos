# 🔧 Troubleshooting Guide

Common issues and solutions for developing in the ObjectOS monorepo. If you're stuck, start here before opening an issue.

---

## 📥 Installation Issues

### Lockfile conflicts after pulling changes

**Problem:** `pnpm install` fails with lockfile version mismatch or merge conflict errors.

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"...
```

**Solution:** Delete the lockfile and regenerate it:

```bash
rm pnpm-lock.yaml
pnpm install
```

If you're on a feature branch, rebase onto `main` first to pick up the latest lockfile.

### Wrong pnpm version

**Problem:** Cryptic errors or unexpected behavior because your pnpm version doesn't match the project's requirement (10.28.2).

**Solution:** Use Corepack to pin the correct version:

```bash
corepack enable
corepack prepare pnpm@10.28.2 --activate
pnpm -v  # should print 10.28.2
```

### Wrong Node.js version

**Problem:** Build or runtime errors caused by a Node.js version below 20.

**Solution:** Verify your version and upgrade if needed:

```bash
node -v  # must be 20+
```

> **Tip:** Use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node versions:
>
> ```bash
> nvm install 20 && nvm use 20
> ```

### Missing `node_modules` in workspace packages

**Problem:** A package fails to resolve its dependencies even after `pnpm install` at the root.

**Solution:** Clean and reinstall everything:

```bash
pnpm store prune
rm -rf node_modules packages/*/node_modules apps/*/node_modules
pnpm install
```

---

## 🏗️ Build Issues

### TypeScript declaration errors across packages

**Problem:** Type errors referencing another workspace package's types, e.g., `Cannot find module '@objectos/auth' or its corresponding type declarations`.

**Solution:** Build the dependency first. Turbo handles this automatically for a full build:

```bash
pnpm build
```

If you're building a single package, build its dependencies too:

```bash
pnpm --filter @objectos/workflow... build
```

The `...` suffix tells pnpm to include all transitive dependencies.

### Stale Turbo cache

**Problem:** Build output doesn't reflect your latest changes — Turbo served a cached result.

**Solution:** Bypass or clear the cache:

```bash
# Run build without cache
pnpm build --force

# Or nuke the cache entirely
rm -rf .turbo node_modules/.cache/turbo
pnpm build
```

### `tsup` bundling fails

**Problem:** `tsup` errors during build, often related to external dependencies or entry point resolution.

**Solution:** Verify the package's `tsup.config.ts` (or `tsconfig.json` build settings). Ensure `external` lists all workspace dependencies:

```bash
# Rebuild a single package with verbose output
pnpm --filter @objectos/<package> build 2>&1 | head -50
```

---

## 🧪 Test Issues

### Mixed test frameworks — which one does my package use?

This repo uses **two** test runners. Check the package's `package.json` to confirm:

| Framework  | Packages                                |
| ---------- | --------------------------------------- |
| **Vitest** | `permissions`, `automation`, `workflow` |
| **Jest**   | All other packages                      |

```bash
# Run tests for a specific package
pnpm --filter @objectos/<package> test
```

### Tests fail with `Cannot find module '@objectos/...'`

**Problem:** Tests import from another workspace package that hasn't been built yet.

**Solution:** Run a full build before testing:

```bash
pnpm build && pnpm test
```

Or build only the required dependency chain:

```bash
pnpm --filter @objectos/<package>... build
pnpm --filter @objectos/<package> test
```

### Test timeouts

**Problem:** Async tests time out, especially in `jobs`, `realtime`, or `workflow` packages.

**Solution:** Increase the timeout for the specific test or check for unresolved promises:

```typescript
// Jest
jest.setTimeout(15000);

// Vitest
test(
  'long operation',
  async () => {
    /* ... */
  },
  { timeout: 15000 },
);
```

> **Tip:** Timeouts often indicate a missing `await`, an unclosed server handle, or a timer that wasn't cleaned up with `afterEach`.

---

## 🖥️ Development Server Issues

### Port already in use

**Problem:** `pnpm dev` fails with `EADDRINUSE` on port 5320 or 3001.

**Solution:** Find and kill the existing process:

```bash
# Find what's using the port
lsof -i :5320
lsof -i :3001

# Kill by PID
kill <PID>
```

Then restart:

```bash
pnpm dev
```

### Vite proxy not forwarding API requests

**Problem:** The Admin Console at `localhost:3001` returns 404 or CORS errors for `/api/v1/*` requests.

**Solution:** Ensure the API server is running on port 5320 first:

```bash
# Terminal 1 — start the API server
pnpm objectstack:dev

# Terminal 2 — then start the web app
cd apps/web && pnpm dev
```

Verify the proxy config in `apps/web/vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api/v1': 'http://localhost:5320',
  },
}
```

### CORS errors in the browser

**Problem:** Browser console shows `Access-Control-Allow-Origin` errors.

**Solution:** In development, requests from `localhost:3001` should be proxied through Vite — not sent directly to port 5320. Check that your frontend code uses **relative** URLs (e.g., `/api/v1/auth`) instead of absolute ones (`http://localhost:5320/api/v1/auth`).

If you need direct access, verify `objectstack.config.ts` includes your origin:

```typescript
cors: {
  origin: ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
}
```

---

## ✏️ Lint & Formatting Issues

### ESLint errors on commit

**Problem:** `git commit` fails because Husky + lint-staged runs ESLint and finds issues.

**Solution:** Fix lint errors before committing:

```bash
pnpm lint
```

To auto-fix what's possible:

```bash
pnpm lint --fix
```

### Prettier conflicts with ESLint

**Problem:** ESLint and Prettier disagree on formatting, causing a cycle of fixes.

**Solution:** Prettier runs as part of the ESLint flat config (`eslint.config.mjs`). Always run lint to apply both:

```bash
pnpm lint --fix
```

Do **not** run Prettier separately unless you know the configs are aligned.

### Pre-commit hook skipping or failing silently

**Problem:** Husky hooks don't run, or `lint-staged` exits with no output.

**Solution:** Re-initialize Husky:

```bash
pnpm exec husky install
chmod +x .husky/pre-commit
```

Verify lint-staged is configured in `package.json` or `.lintstagedrc`.

---

## ❌ Common Error Messages

| Error                                  | Cause                     | Fix                                                 |
| -------------------------------------- | ------------------------- | --------------------------------------------------- |
| `ERR_PNPM_OUTDATED_LOCKFILE`           | Lockfile out of date      | `pnpm install --no-frozen-lockfile`                 |
| `Cannot find module '@objectos/...'`   | Dependency not built      | `pnpm build` or `pnpm --filter <pkg>... build`      |
| `EADDRINUSE :::5320`                   | Port already in use       | `lsof -i :5320` then `kill <PID>`                   |
| `TS2307: Cannot find module`           | Missing type declarations | Build the referenced package first                  |
| `ENOENT: .turbo/...`                   | Corrupted turbo cache     | `rm -rf .turbo && pnpm build`                       |
| `ERR_PNPM_PEER_DEP_ISSUES`             | Peer dependency mismatch  | Check `peerDependencies` in the failing package     |
| `Jest encountered an unexpected token` | ESM/CJS mismatch in Jest  | Verify `transformIgnorePatterns` in `jest.config`   |
| `Vitest failed to load config`         | Wrong vitest config path  | Check `vitest.config.ts` exists in the package root |

---

## 🧹 Nuclear Reset

When nothing else works, reset the entire workspace:

```bash
git clean -fdx -e .env -e .env.local
pnpm install
pnpm build
pnpm test
```

> **Warning:** `git clean -fdx` removes **all** untracked and ignored files (node_modules, dist, caches). The `-e` flags preserve your local env files.

---

> **Still stuck?** Open a [GitHub Discussion](https://github.com/objectql/objectos/discussions) with your error output and the steps you've tried. Happy debugging! 🐛
