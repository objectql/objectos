# ObjectOS

**The Business Operating System.**

State. Identity. Synchronization. Orchestration. Admin Console.

*Built on [ObjectQL](https://github.com/objectstack-ai/objectql) & [ObjectStack](https://objectstack.ai).*

[![License](https://img.shields.io/badge/license-AGPL%20v3-red.svg)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Hono%20%7C%20React%20%7C%20TypeScript-blue.svg)](#-tech-stack)

---

## Introduction

**ObjectOS** is the system layer of the ObjectStack ecosystem.

| Layer | Repo | Responsibility |
|---|---|---|
| **ObjectQL** | [objectql/objectql](https://github.com/objectstack-ai/objectql) | Data — metadata, drivers, queries |
| **ObjectUI** | [objectql/objectui](https://github.com/objectstack-ai/objectui) | Views — amis-like control library |
| **ObjectOS** | this repo | **State, Identity, Sync, Orchestration, Admin Console** |

ObjectOS acts as the "Kernel" that boots up, loads drivers (ObjectQL) and applications (Plugins), then governs every request through Authentication, Authorization, and Audit.

---

## Key Features

- **Identity & Auth** — BetterAuth integration, SSO, 2FA, multi-tenant organization management
- **RBAC Engine** — Object/Field/Record-level security with permission sets
- **Audit Logging** — CRUD event capture, field-level history, IP/UA/session tracking
- **Workflow Engine** — State machines, BPMN-Lite approval processes
- **Automation Triggers** — WorkflowRule, 7 action types, formula engine, queue with retry
- **Background Jobs** — Multi-priority queues, cron scheduling, concurrency control
- **Notifications** — Email/SMS/Push/Webhook with Handlebars templates
- **Realtime** — WebSocket server, subscribe/unsubscribe, presence
- **Cache** — LRU + Redis, TTL, namespace isolation
- **KV Storage** — Memory/Redis/SQLite backends
- **Metrics** — Counter/Gauge/Histogram, Prometheus export
- **i18n** — Multi-locale, interpolation, pluralization
- **Offline Sync** — SQLite WASM, OPFS, Service Worker (browser package)

---

## Tech Stack

### Server (ObjectStack Kernel)

- **Runtime:** Node.js (LTS)
- **Language:** TypeScript 5.0+ (Strict)
- **HTTP Server:** Hono + `@hono/node-server` (via `objectstack serve`)
- **Architecture:** Modular Monolith / Micro-kernel
- **APIs:** REST `/api/v1/*` · GraphQL `/api/v1/graphql` · WebSocket

### Admin Console (`apps/web`)

- **Bundler:** Vite 6
- **Framework:** React 19
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Auth Client:** better-auth/react → `/api/v1/auth`

### Documentation (`apps/site`)

- **Framework:** Next.js 16 + Fumadocs (MDX)
- **Output:** Static export

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   objectstack serve (:5320)                  │
│                                                              │
│  ┌──────────┐ ┌────────────┐ ┌──────────┐ ┌─────────────┐  │
│  │  Hono    │ │ BetterAuth │ │ ObjectQL │ │  Plugins    │  │
│  │  Router  │ │ /api/v1/   │ │  Driver  │ │  (13 svcs)  │  │
│  └────┬─────┘ └──────┬─────┘ └────┬─────┘ └──────┬──────┘  │
│       └──────────────┴────────────┴──────────────┘          │
│                                                              │
│  Static Mounts:                                              │
│    /console/*  → apps/web/dist   (Vite SPA)                │
│    /docs/*     → apps/site/out   (Static HTML)              │
└─────────────────────────────────────────────────────────────┘
```

### Three-Layer UI Architecture

```
ObjectUI (Controls)  →  apps/web (App Shell)  →  ObjectStack Hono (API)
     npm import              HTTP / WebSocket        Kernel + Plugins
```

- **ObjectUI** = Control Library (Form, Grid, Chart, Kanban — amis-like)
- **apps/web** = App Shell (routes, layout, auth, navigation)
- **ObjectStack** = API Server (data, auth, permissions, workflow)

---

## Monorepo Structure

### Kernel Packages

| Package | Role |
|---|---|
| `@objectos/auth` | Identity — BetterAuth, SSO, 2FA, Sessions |
| `@objectos/permissions` | Authorization — RBAC, Permission Sets |
| `@objectos/audit` | Compliance — CRUD events, field history |
| `@objectos/workflow` | Flow — FSM engine, approval processes |
| `@objectos/automation` | Triggers — WorkflowRule, action types |
| `@objectos/jobs` | Background — queues, cron, retry |
| `@objectos/notification` | Outbound — Email/SMS/Push/Webhook |
| `@objectos/realtime` | Sync — WebSocket, presence |
| `@objectos/cache` | Performance — LRU + Redis |
| `@objectos/storage` | Persistence — KV (Memory/Redis/SQLite) |
| `@objectos/metrics` | Observability — Prometheus export |
| `@objectos/i18n` | Localization — multi-locale |
| `@objectos/browser` | Offline — SQLite WASM, OPFS |

### Application Packages

| Package | Role | Stack |
|---|---|---|
| `apps/web` | Admin Console | Vite + React 19 + React Router 7 |
| `apps/site` | Documentation | Next.js 16 + Fumadocs |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL or MongoDB (optional — SQLite by default)

### Installation

```bash
git clone https://github.com/objectql/objectos.git
cd objectos
pnpm install
```

### Development

```bash
# Start API server (:5320) + Admin Console (:5321) together
pnpm dev

# Start everything including docs site
pnpm dev:all

# Or use ObjectStack CLI directly
pnpm objectstack:serve    # API server only
pnpm objectstack:studio   # API + Console UI together
```

The Admin Console is available at **http://localhost:5321/console/**
with API proxy to ObjectStack at `:5320`.

### All Commands

#### Development Commands

| Command | Description |
|---|---|
| `pnpm dev` | API `:5320` + Web `:5321` (daily development) |
| `pnpm dev:all` | API + Web + Site (full stack) |
| `pnpm start` | Production — single process with static mounts |
| `pnpm build` | Build all packages (Turborepo) |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | TypeScript check all packages |

#### ObjectStack CLI Commands

| Command | Description |
|---|---|
| `pnpm objectstack:serve` | Start ObjectStack server (port 5320) |
| `pnpm objectstack:dev` | Start dev mode with hot-reload |
| `pnpm objectstack:studio` | Launch Console UI with dev server |
| `pnpm objectstack:validate` | Validate configuration against protocol |
| `pnpm objectstack:compile` | Compile configuration to JSON artifact |
| `pnpm objectstack:info` | Display metadata summary |

#### Code Generation Commands

| Command | Description |
|---|---|
| `pnpm generate` | Generate metadata files (interactive) |
| `pnpm generate:object <name>` | Generate a new object schema |
| `pnpm generate:flow <name>` | Generate a new workflow/flow |
| `pnpm generate:view <name>` | Generate a new view definition |
| `pnpm generate:action <name>` | Generate a new action |
| `pnpm generate:agent <name>` | Generate a new AI agent |
| `pnpm generate:dashboard <name>` | Generate a new dashboard |
| `pnpm generate:app <name>` | Generate a new application |

#### App-Specific Commands

| Command | Description |
|---|---|
| `pnpm web:dev` | Admin Console only (port 5321) |
| `pnpm web:build` | Build Admin Console |
| `pnpm site:dev` | Documentation site only |
| `pnpm site:build` | Build documentation |

### Production

```bash
# Build frontend assets
pnpm web:build
pnpm site:build

# Start single-process server
# Serves API + /console (SPA) + /docs (static)
pnpm start
```

---

## Documentation

- [Architecture Guide](./ARCHITECTURE.md)
- [Development Plan](./DEVELOPMENT_PLAN.md)
- [Contributing Guide](./CONTRIBUTING.md)

### Spec & Guides (docs site)

- [Platform Architecture](./docs/guide/architecture.md)
- [Data Modeling](./docs/guide/data-modeling.md)
- [Plugin Development](./docs/guide/plugin-development.md)
- [Security Guide](./docs/guide/security-guide.md)
- [HTTP Protocol](./docs/spec/http-protocol.md)
- [Metadata Format](./docs/spec/metadata-format.md)
- [Query Language](./docs/spec/query-language.md)

---

## License & Commercial Usage

**ObjectOS is open-source software licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE).**

- ✅ **Free for internal use** within your organization
- ✅ **Free for open source** AGPL-licensed projects
- ⚠️ **Copyleft** — SaaS usage requires open-sourcing under AGPL or purchasing a commercial license

**Commercial License:** [Contact us](https://github.com/objectql/objectos/issues)

---

<div align="center">

Part of the **ObjectStack Ecosystem**

[ObjectQL (Data)](https://github.com/objectstack-ai/objectql) · **ObjectOS (System)** · [ObjectUI (View)](https://github.com/objectstack-ai/objectui)

</div>
