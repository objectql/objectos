# 🛠️ Local Development Guide

A step-by-step guide for developers working on ObjectOS day-to-day. For a quicker overview, see the [Quickstart Guide](./docs/guide/quickstart.md).

---

## 1. System Requirements

| Tool        | Version   | Required | Check            |
| ----------- | --------- | -------- | ---------------- |
| **Node.js** | 20+ (LTS) | Yes      | `node -v`        |
| **pnpm**    | 10.28.2   | Yes      | `pnpm -v`        |
| **Git**     | 2.x+      | Yes      | `git --version`  |
| **Docker**  | 24+       | Optional | `docker -v`      |
| **Redis**   | 7+        | Optional | `redis-cli ping` |

> The exact Node version is pinned in `.node-version`. Use a version manager like `fnm` or `nvm` to stay in sync:
>
> ```bash
> fnm install    # reads .node-version automatically
> fnm use
> ```

Install pnpm via Corepack (ships with Node.js):

```bash
corepack enable
corepack prepare pnpm@10.28.2 --activate
```

---

## 2. Environment Setup

### Clone and install

```bash
git clone https://github.com/<your-username>/objectos.git
cd objectos
pnpm install
```

This installs dependencies for all 20 packages and 2 apps via PNPM workspaces.

### Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. At minimum, set `AUTH_SECRET` (a random string for session signing). The file contains comments explaining each variable.

### Initial build

```bash
pnpm build
```

Turbo orchestrates the build across all packages. Each package uses `tsup` for bundling and `tsc` for type declarations. The first build populates the `dist/` directories that downstream packages depend on.

### Verify everything works

```bash
pnpm test
pnpm lint
```

If both pass, your environment is ready.

---

## 3. Development Workflow

### Start the dev stack

```bash
pnpm dev
```

This launches two servers concurrently:

| Service           | URL                     | Description          |
| ----------------- | ----------------------- | -------------------- |
| **API Server**    | `http://localhost:5320` | ObjectStack Hono API |
| **Admin Console** | `http://localhost:3001` | Vite + React 19 SPA  |

The Admin Console proxies `/api/v1/*` requests to the API server automatically.

To run **everything** including the documentation site:

```bash
pnpm dev:all
```

### The edit → build → test cycle

For most changes, the dev servers handle hot-reload automatically. When you need to verify manually:

```bash
# Build only the package you changed (Turbo handles dependencies)
pnpm --filter @objectos/workflow build

# Run its tests
pnpm --filter @objectos/workflow test

# Lint your changes
pnpm lint
```

### Pre-commit hooks

The project uses **Husky + lint-staged**. On every commit, ESLint and Prettier run automatically against staged files. If linting fails, the commit is blocked — fix the issues and try again.

### Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat(auth): add SAML SSO provider"
git commit -m "fix(jobs): prevent duplicate cron execution"
git commit -m "test(cache): add TTL expiration tests"
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`.

---

## 4. Working with Packages

The `packages/` directory contains 20 independent modules:

```
packages/
├── agent/          # AI Agent Framework
├── analytics/      # Analytics Engine
├── audit/          # Audit Logging
├── auth/           # Authentication (BetterAuth)
├── automation/     # Triggers & Rules          (Vitest)
├── browser/        # Offline Runtime (SQLite WASM)
├── cache/          # LRU + Redis Cache
├── federation/     # Module Federation
├── graphql/        # GraphQL API
├── i18n/           # Localization
├── jobs/           # Background Jobs & Cron
├── marketplace/    # Plugin Marketplace
├── metrics/        # Prometheus Metrics
├── notification/   # Email/SMS/Push/Webhook
├── permissions/    # RBAC Engine              (Vitest)
├── realtime/       # WebSocket Server
├── storage/        # KV Storage Backends
├── telemetry/      # OpenTelemetry Tracing
├── ui/             # Admin Console shared components
└── workflow/       # State Machine Engine      (Vitest)
```

> **Test runners:** 17 packages use **Jest** (with `ts-jest` ESM preset). Three packages (`permissions`, `automation`, `workflow`) use **Vitest**. Both use the same `describe`/`it`/`expect` API. Check each package's `package.json` to confirm.

### Common package commands

```bash
# Build a single package
pnpm --filter @objectos/cache build

# Run tests in watch mode (Jest)
pnpm --filter @objectos/cache test -- --watch

# Run tests in watch mode (Vitest)
pnpm --filter @objectos/workflow test -- --watch

# Type-check without emitting
pnpm --filter @objectos/cache type-check
```

### Adding a dependency to a package

```bash
pnpm --filter @objectos/notification add nodemailer
pnpm --filter @objectos/notification add -D @types/nodemailer
```

---

## 5. Working with Apps

### Admin Console (`apps/web`)

The Admin Console is a **Vite + React 19** SPA using React Router 7, Tailwind CSS 4, and shadcn/ui.

```bash
# Start standalone (requires API server on :5320)
cd apps/web && pnpm dev          # → http://localhost:3001

# Build for production
cd apps/web && pnpm build        # outputs to apps/web/dist/

# Run tests (Vitest)
cd apps/web && pnpm test
```

Key directories inside `apps/web/`:

| Path                     | Purpose                       |
| ------------------------ | ----------------------------- |
| `src/routes/`            | Page components (lazy-loaded) |
| `src/components/`        | Shared UI components          |
| `src/lib/auth-client.ts` | BetterAuth client instance    |
| `src/lib/api.ts`         | TanStack Query hooks          |

> **Rule:** No backend logic in the frontend. All data flows through `/api/v1/*` endpoints served by the ObjectStack API.

### Documentation Site (`apps/site`)

The docs site uses **Next.js 16 + Fumadocs** with MDX content from `docs/`.

```bash
# Start dev server
cd apps/site && pnpm dev         # → http://localhost:3000

# Build static export
cd apps/site && pnpm build       # outputs to apps/site/out/

# Preview the build
cd apps/site && pnpm start
```

---

## 6. Using the ObjectStack CLI

The `objectstack` CLI is the primary tool for managing the runtime. Available commands:

```bash
# Start the API server (production)
pnpm objectstack:serve

# Start the API server in dev mode with hot-reload
pnpm objectstack:dev

# Open ObjectStack Studio (visual editor)
pnpm objectstack:studio

# Validate objectstack.config.ts and all metadata
pnpm objectstack:validate

# Check environment health (Node version, deps, ports)
pnpm objectstack:doctor

# Generate boilerplate (objects, workflows, plugins)
pnpm objectstack:generate
```

The CLI reads `objectstack.config.ts` at the project root to discover plugins, metadata patterns, and server configuration.

---

## 7. Docker Development

For a containerized setup, use the provided Docker Compose configuration:

```bash
# Build and start all services
docker compose up --build

# Run in detached mode
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

The `Dockerfile` builds the full monorepo and the `docker-compose.yml` defines the service topology (API, web, database, Redis). Edit `.env` for container-specific overrides.

---

## 8. E2E Tests

End-to-end tests use **Playwright** and live in the `e2e/` directory.

```bash
# Install Playwright browsers (first time only)
pnpm --filter e2e exec playwright install --with-deps

# Run E2E tests (dev servers must be running)
pnpm e2e

# Run with UI mode for debugging
pnpm --filter e2e exec playwright test --ui

# Run a specific test file
pnpm --filter e2e exec playwright test tests/auth.spec.ts
```

> **Note:** E2E tests expect the full dev stack (`pnpm dev`) to be running.

---

## 9. Commands Cheatsheet

| Task                   | Command                              |
| ---------------------- | ------------------------------------ |
| Install dependencies   | `pnpm install`                       |
| Build all packages     | `pnpm build`                         |
| Dev (API + web)        | `pnpm dev`                           |
| Dev (API + web + site) | `pnpm dev:all`                       |
| API server only        | `pnpm objectstack:dev`               |
| Web app only           | `pnpm web:dev`                       |
| Docs site only         | `pnpm site:dev`                      |
| Run all tests          | `pnpm test`                          |
| Test one package       | `pnpm --filter @objectos/<pkg> test` |
| Lint all               | `pnpm lint`                          |
| Type-check all         | `pnpm type-check`                    |
| Clean all builds       | `pnpm clean`                         |
| E2E tests              | `pnpm e2e`                           |
| Validate config        | `pnpm objectstack:validate`          |
| Environment health     | `pnpm objectstack:doctor`            |
| Docker up              | `docker compose up --build`          |
| Production build       | `pnpm build && pnpm start`           |

---

## 10. Troubleshooting

**`Module not found` after pulling changes**
Run `pnpm install && pnpm build` — new packages or changed dependencies require a fresh install and build.

**Port already in use**
Kill the process occupying the port: `lsof -ti:5320 | xargs kill -9`, then restart.

**Turbo cache is stale**
Force a clean rebuild: `pnpm clean && pnpm build`.

**Pre-commit hook fails**
Run `pnpm lint` to see the errors. Fix them, stage the files again, and commit.

**E2E tests fail on first run**
Make sure Playwright browsers are installed: `pnpm --filter e2e exec playwright install --with-deps`.

---

For coding standards and contribution workflow, see [CONTRIBUTING.md](./CONTRIBUTING.md). For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).
