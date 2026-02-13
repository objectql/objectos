# Deployment Guide

## Overview

ObjectOS can run in two modes:

| Mode            | Command      | Description                                        |
| --------------- | ------------ | -------------------------------------------------- |
| **Self-hosted** | `pnpm start` | Single Node.js process serving API + static assets |
| **Vercel**      | Push to Git  | Serverless function (API) + CDN (static assets)    |

---

## Build Outputs (dist folders)

| Output                 | Path              | Contents                         |
| ---------------------- | ----------------- | -------------------------------- |
| Admin Console (SPA)    | `apps/web/dist`   | Vite build — HTML/JS/CSS         |
| Documentation (static) | `apps/site/out`   | Next.js static export — HTML/CSS |
| Server Plugins         | `packages/*/dist` | tsup bundles — ESM + CJS         |

Run `pnpm build` (Turborepo) to build everything. Build order is managed
automatically via workspace dependency graph.

---

## Self-Hosted Deployment (`pnpm start`)

### How it works

```
pnpm start
  └─ pnpm objectstack:serve
       └─ objectstack serve --port 5320
            └─ Hono + @hono/node-server
```

`objectstack serve` boots the ObjectStack Kernel:

1. Reads `objectstack.config.ts` for plugin list and metadata patterns
2. Loads all plugins (Auth, RBAC, Workflow, Automation, etc.)
3. Starts the Hono HTTP server on the configured port
4. Mounts static directories for the Admin Console and docs

### URL Routing

| URL Pattern  | Served By                                               |
| ------------ | ------------------------------------------------------- |
| `/api/v1/*`  | Hono API routes (plugins register handlers)             |
| `/console/*` | `apps/web/dist` — Vite SPA (static mount, SPA fallback) |
| `/docs/*`    | `apps/site/out` — Next.js static HTML (static mount)    |

### Production Steps

```bash
# 1. Install dependencies
pnpm install

# 2. Build everything (packages + apps)
pnpm build

# 3. Start single-process server
pnpm start
# → http://localhost:5320/api/v1/health
# → http://localhost:5320/console/
# → http://localhost:5320/docs/
```

### Docker

```bash
docker compose up -d
# → http://localhost:5320
```

See `Dockerfile` for multi-stage build and `docker-compose.yml` for
PostgreSQL + Redis services.

### Environment Variables

| Variable       | Default                                       | Description                        |
| -------------- | --------------------------------------------- | ---------------------------------- |
| `PORT`         | `5320`                                        | Server listen port                 |
| `LOG_LEVEL`    | `info`                                        | Pino log level                     |
| `CORS_ORIGINS` | `http://localhost:5321,http://localhost:5320` | Comma-separated allowed origins    |
| `NODE_ENV`     | —                                             | Set to `production` for production |

---

## Vercel Deployment

### Architecture

On Vercel, the single-process server is split into two parts:

```
Vercel CDN (Edge)               Vercel Serverless (Node.js)
┌──────────────────────┐        ┌───────────────────────────┐
│  apps/web/dist       │        │  api/index.ts             │
│  ├── index.html      │        │  └─ bootstraps Kernel     │
│  ├── assets/         │        │     └─ Hono app           │
│  └── docs/           │        │        └─ /api/v1/*       │
│      └── (site/out)  │        │                           │
└──────────────────────┘        └───────────────────────────┘
```

- **Static assets** (`apps/web/dist` + `apps/site/out`) are served by
  Vercel's global CDN.
- **API** (`api/index.ts`) runs as a Vercel Serverless Function that
  bootstraps the ObjectStack Kernel on cold-start, then handles requests
  via the Hono adapter (`@hono/node-server/vercel`).

### Files

| File                      | Purpose                                                    |
| ------------------------- | ---------------------------------------------------------- |
| `vercel.json`             | Build command, output directory, rewrites, function config |
| `api/index.ts`            | Serverless function — kernel bootstrap + Hono handler      |
| `apps/web/vite.config.ts` | Sets `base: '/'` when `VERCEL` env is detected             |

### Build Flow

```
pnpm run build:vercel
  └─ turbo run build          # Builds packages → apps (dependency order)
       ├─ packages/*/dist     # Server plugins (tsup)
       ├─ apps/web/dist       # Admin Console (Vite)
       └─ apps/site/out       # Docs (Next.js static export)
  └─ cp -r apps/site/out apps/web/dist/docs   # Combine into single output
```

Output directory: **`apps/web/dist`** (includes `docs/` subfolder)

### URL Routing on Vercel

| URL Pattern  | Destination                             | Type    |
| ------------ | --------------------------------------- | ------- |
| `/api/v1/*`  | `api/index.ts` serverless function      | Rewrite |
| `/docs/*`    | Static files from `apps/web/dist/docs/` | CDN     |
| `/*` (other) | `index.html` (SPA fallback)             | Rewrite |

### Vercel Setup

1. **Import the repository** in the Vercel dashboard
2. **Framework Preset**: Other (not Next.js — this is a monorepo)
3. Vercel auto-detects `vercel.json` and applies the configuration
4. Push to the connected branch to trigger a deployment

### Key Differences from Self-Hosted

| Aspect          | Self-Hosted (`pnpm start`)       | Vercel                            |
| --------------- | -------------------------------- | --------------------------------- |
| API runtime     | Long-running Node.js process     | Serverless function (cold-start)  |
| Static assets   | Served by Hono static mounts     | Served by Vercel CDN (Edge)       |
| SPA base path   | `/console/`                      | `/` (root)                        |
| Docs path       | `/docs/` (static mount)          | `/docs/` (CDN subfolder)          |
| WebSocket       | Supported (`@objectos/realtime`) | Not supported (Vercel limitation) |
| Background Jobs | In-process queues                | Limited by function timeout (30s) |

### Limitations on Vercel

- **No WebSocket support** — `@objectos/realtime` requires a persistent
  connection. Use a separate WebSocket provider (e.g., Ably, Pusher) or
  self-host for realtime features.
- **Cold-start latency** — The kernel bootstraps on first request to a
  serverless function instance. Subsequent requests reuse the warm instance.
- **Function timeout** — Default 30 seconds (`maxDuration` in `vercel.json`).
  Long-running workflows or jobs should use external queues.
- **No filesystem persistence** — Use external databases (PostgreSQL, MongoDB)
  instead of SQLite. The default `InMemoryDriver` works for demos but data
  is lost on cold-start.

---

## Summary: Where is `dist`?

```
objectos/
├── apps/
│   ├── web/
│   │   └── dist/          ← Admin Console (Vite SPA)
│   │       ├── index.html
│   │       ├── assets/
│   │       └── docs/      ← (Vercel only: copied from apps/site/out)
│   └── site/
│       └── out/           ← Documentation (Next.js static export)
└── packages/
    ├── audit/dist/        ← @objectos/audit plugin
    ├── workflow/dist/     ← @objectos/workflow plugin
    ├── ...                ← (all other packages)
    └── ui/dist/           ← @objectos/ui plugin
```
