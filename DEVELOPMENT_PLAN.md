# ObjectOS Development Plan

> **Version**: 2.0.0
> **Date**: February 7, 2026
> **Status**: System Integration Phase — 13/13 Plugins Implemented

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Vision & Positioning](#2-project-vision--positioning)
3. [Architecture Overview](#3-architecture-overview)
4. [Monorepo Structure](#4-monorepo-structure)
5. [Package Status Report](#5-package-status-report)
6. [Development Roadmap](#6-development-roadmap)
7. [Spec Compliance Status](#7-spec-compliance-status)
8. [Quality Assurance](#8-quality-assurance)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Ecosystem Integration](#10-ecosystem-integration)
11. [Open Items & Next Steps](#11-open-items--next-steps)

---

## 1. Executive Summary

**ObjectOS** is a metadata-driven, microkernel-based enterprise runtime platform. It transforms declarative YAML definitions into fully functional, secure, and scalable enterprise APIs.

### Current Achievement

| Metric | Status |
|--------|--------|
| **Plugins Implemented** | 13/13 (100%) |
| **Spec Compliance** | ✅ 100% — All packages pass `@objectstack/spec` audit |
| **Test Files** | 39 across 12 packages |
| **Build System** | Turborepo + PNPM workspaces + tsup |
| **Applications** | 2 (Documentation Site + Web Console) |

### Key Milestones Completed

- ✅ Microkernel architecture (`@objectstack/runtime`) — fully operational
- ✅ All 13 plugin packages implemented with lifecycle compliance
- ✅ Authentication (Better-Auth with SSO, 2FA, Multi-tenant)
- ✅ RBAC Permission Engine (Object, Field, Record-level security)
- ✅ Workflow Engine (FSM + Spec-compliant Flow format)
- ✅ Automation System (Triggers, Cron, Queue with retry)
- ✅ Audit Logging (Field-level history, metadata tracking)
- ✅ Browser Runtime (SQLite WASM, Offline-first)
- ✅ `@objectstack/spec` protocol compliance audit passed

---

## 2. Project Vision & Positioning

### Vision

ObjectOS aims to be the **world's leading enterprise management software runtime platform**, providing:

- 🚀 **Instant Backend** — Auto-generate enterprise-grade APIs from YAML metadata
- 🛡️ **Security Kernel** — Enterprise-level authentication, authorization, audit logging
- ⚙️ **Workflow Automation** — Workflow engine, triggers, scheduled jobs
- 🔌 **Plugin Ecosystem** — Extensible microkernel architecture with unlimited expansion
- 🌐 **Multi-tenant SaaS** — Native support for tenant isolation and data security

### Three-Repository Model

```
┌──────────────────────────────────────────────────────────────┐
│                    ObjectStack Ecosystem                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ObjectQL (Data)    ←→    ObjectOS (Runtime)    ←→    ObjectUI (Views)  │
│                                                               │
│  • Metadata Schemas       • Authentication            • React Components │
│  • Database Drivers       • Authorization             • Forms & Grids    │
│  • Query Engine           • Workflow Engine            • Dashboards       │
│  • Relationship Mgmt      • Plugin System             • Low-Code Editor  │
│                           • API Gateway                                  │
└──────────────────────────────────────────────────────────────┘
```

| Layer | Repository | Responsibility |
|-------|-----------|---------------|
| **Data** | [ObjectQL](https://github.com/objectql/objectql) | Defines "what data is" — objects, fields, relationships, drivers |
| **Runtime** | ObjectOS (this repo) | Defines "how business runs" — security, processes, automation |
| **Views** | [ObjectUI](https://github.com/objectql/objectui) | Defines "how UI presents" — components, layouts, interactions |

### Protocol Foundation

ObjectOS is built on **[@objectstack/spec](https://github.com/objectstack-ai/spec)**, which defines five protocol namespaces:

| Namespace | Scope | ObjectOS Implementation |
|-----------|-------|------------------------|
| **Data** | Object schemas, fields, queries, hooks | Via `@objectql/core` |
| **Kernel** | Plugin lifecycle, manifests, context | `@objectstack/runtime` |
| **System** | Audit events, jobs, scheduling | System plugins |
| **UI** | App configs, views, dashboards | Metadata API for ObjectUI |
| **API** | Endpoints, contracts | `@objectos/plugin-server` |

---

## 3. Architecture Overview

### Microkernel Design

ObjectOS implements a **micro-kernel + plugin** architecture where the core kernel is minimal and all features are loaded as plugins:

```
┌────────────────────────────────────────────────────────────────────┐
│                         User Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  Web Browser  │  │ Mobile App   │  │  API Client  │            │
│  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘            │
└──────────┼─────────────────┼─────────────────┼───────────────────┘
           └─────────────────┴─────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────────┐
│                    API Gateway Layer                                 │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         @objectos/plugin-server (NestJS)                   │   │
│  │  • REST API (/api/data/:object)                            │   │
│  │  • GraphQL (/graphql)                                      │   │
│  │  • WebSocket (/ws) — Realtime sync                         │   │
│  │  • Metadata API (/api/metadata)                            │   │
│  └────────────────────────┬───────────────────────────────────┘   │
└───────────────────────────┼───────────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────────┐
│                  Business Logic Layer                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │      @objectstack/runtime (Microkernel)                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │Plugin Registry│  │  Event Bus   │  │ Dep Resolver │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│  ┌──────────────────────────┴──────────────────────────────────┐ │
│  │                    Plugin Ecosystem                          │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │ ObjectQL   │  │Better-Auth │  │  Workflow  │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │ Audit-Log  │  │   Cache    │  │  Storage   │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │Permissions │  │    Jobs    │  │Notification│            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐            │ │
│  │  │ Automation │  │  Realtime  │  │  Metrics   │            │ │
│  │  └────────────┘  └────────────┘  └────────────┘            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────────┐
│                    Data Layer                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │         @objectql/core (Data Engine)                         │ │
│  │  • Metadata Registry    • Query Compiler                    │ │
│  │  • Relationship Resolver • Hook Pipeline                    │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│  ┌────────────────────────┴────────────────────────────────────┐ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │ │
│  │  │  driver-sql   │  │ driver-mongo  │  │ driver-sqlite│      │ │
│  │  │ (PostgreSQL)  │  │  (MongoDB)    │  │  (SQLite)    │      │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

### Core Design Principles

1. **Everything is a Plugin** — Even the HTTP server and auth system are plugins
2. **Loose Coupling** — Plugins communicate via the event bus, never direct imports
3. **Hot-Swappable** — Plugins can be loaded/unloaded at runtime (dev mode)
4. **Protocol Compliance** — Strict adherence to `@objectstack/spec`
5. **Security First** — Zero Trust model: every request is authenticated and authorized

---

## 4. Monorepo Structure

```
objectos/                         # Root — PNPM workspace + Turborepo
├── packages/                     # All packages (plugins)
│   ├── audit/                    # @objectos/audit          — Audit logging
│   ├── auth/                     # @objectos/auth           — Authentication (Better-Auth)
│   ├── automation/               # @objectos/automation     — Automation engine
│   ├── browser/                  # @objectos/browser        — Browser runtime (WASM)
│   ├── cache/                    # @objectos/cache          — Cache abstraction
│   ├── i18n/                     # @objectos/i18n           — Internationalization
│   ├── jobs/                     # @objectos/jobs           — Background job queue
│   ├── metrics/                  # @objectos/metrics        — Prometheus metrics
│   ├── notification/             # @objectos/notification   — Multi-channel notifications
│   ├── permissions/              # @objectos/permissions    — RBAC permission engine
│   ├── realtime/                 # @objectos/realtime       — WebSocket realtime
│   ├── storage/                  # @objectos/storage        — KV storage abstraction
│   └── workflow/                 # @objectos/workflow       — Workflow & FSM engine
│
├── apps/
│   ├── site/                     # @objectos/site           — Documentation (Next.js + Fumadocs)
│   └── web/                      # @objectos/web            — Admin console (Next.js)
│
├── docs/                         # VitePress documentation source
│   ├── guide/                    # Developer guides
│   └── spec/                     # Protocol specification docs
│
└── scripts/                      # Build & audit scripts
```

### Toolchain

| Tool | Purpose |
|------|---------|
| **PNPM 9.x** | Package manager with workspace support |
| **Turborepo** | Monorepo build orchestration |
| **tsup** | TypeScript bundler (ESM output) |
| **TypeScript 5.x** | Strict mode, ESM modules |
| **Jest / Vitest** | Unit & integration testing |
| **Changesets** | Version management & changelogs |

---

## 5. Package Status Report

### Plugin Packages (13 total)

All packages are at version `0.1.0`, licensed under `AGPL-3.0`, and output ESM via `tsup`.

| # | Package | Description | Source Files | Tests | Status |
|---|---------|-------------|:---:|:---:|:---:|
| 1 | **@objectos/audit** | Audit logging — CRUD event capture, field-level history, IP/UA/session tracking | 4 | 2 | 🟢 Complete |
| 2 | **@objectos/auth** | Authentication — Better-Auth integration, Email/Password, Social Login (Google/GitHub/MS), 2FA TOTP, session management, multi-tenant org support | 13 | 1 | 🟢 Complete |
| 3 | **@objectos/automation** | Automation engine — Spec-compliant WorkflowRule/Action/TimeTrigger, 7 action types, formula engine, conditional filtering, in-memory queue with retry | 9 | 6 | 🟢 Complete |
| 4 | **@objectos/browser** | Browser runtime — SQLite WASM database, OPFS persistence, Service Worker API interception, Web Worker isolation, offline-first architecture | 6+ | 1 | 🟢 Complete |
| 5 | **@objectos/cache** | Cache abstraction — LRU in-memory + Redis distributed cache, TTL support, namespace isolation, cache statistics | 5 | 2 | 🟢 Complete |
| 6 | **@objectos/i18n** | Internationalization — Multi-locale support, dynamic switching, nested keys, variable interpolation, pluralization, number/date formatting, fallback chain | 4 | 2 | 🟢 Complete |
| 7 | **@objectos/jobs** | Job queue — Multi-priority queues, Cron scheduling, auto-retry with exponential backoff, concurrency control, sandbox isolation | 7 | 5 | 🟢 Complete |
| 8 | **@objectos/metrics** | System metrics — Counter/Gauge/Histogram types, label support, Prometheus export format, built-in kernel metrics | 5 | 1 | 🟢 Complete |
| 9 | **@objectos/notification** | Notifications — 4 channels (Email/SMS/Push/Webhook), Handlebars templates, user preferences, message queue | 9 | 3 | 🟢 Complete |
| 10 | **@objectos/permissions** | Permission engine — RBAC roles, Permission Sets, object sharing, field-level security (FLS), record-level security (RLS), filter merging, template variable recursion | 6 | 5 | 🟢 Complete |
| 11 | **@objectos/realtime** | WebSocket realtime — Basic WebSocket server | 2 | 0 | 🟡 Minimal |
| 12 | **@objectos/storage** | KV storage — Memory/Redis/SQLite backends, unified put/get/del API, namespace isolation, streaming support | 6 | 2 | 🟢 Complete |
| 13 | **@objectos/workflow** | Workflow engine — BPMN-Lite FSM, approval processes, YAML/JSON definitions, state history, timeout escalation, spec Flow/FlowNode/FlowEdge format | 13 | 9 | 🟢 Complete |

### Application Packages

| App | Description | Framework | Status |
|-----|-------------|-----------|:---:|
| **@objectos/site** | Official documentation & marketing site | Next.js 16 + Fumadocs (MDX) | 🟢 Active |
| **@objectos/web** | Admin console with auth flows & record management | Next.js 15 + Tailwind CSS | 🟢 Active |

### External Dependencies

| Dependency | Role | Used By |
|-----------|------|---------|
| `@objectstack/runtime` | Microkernel — plugin lifecycle, service registry, event bus | All 13 plugins |
| `@objectstack/spec` | Protocol contracts — Zod schemas, TypeScript interfaces | audit, automation, auth, jobs, permissions, workflow |
| `@objectql/core` | Data engine — metadata registry, query compiler | audit, auth, automation, jobs, permissions, workflow |

---

## 6. Development Roadmap

### ✅ Phase 1: Core Infrastructure (Completed)

**Deliverables**: Microkernel + standard plugin architecture

| Task | Status |
|------|:---:|
| `@objectstack/runtime` — complete plugin lifecycle (onInstall/onEnable/onLoad/onDisable/onUninstall) | ✅ |
| Dependency resolution with topological sorting | ✅ |
| Plugin-isolated storage | ✅ |
| Hot reload support (dev mode) | ✅ |
| Standard PluginManifest with Zod validation | ✅ |
| Plugin version compatibility checking | ✅ |
| Core plugin migration from legacy kernel | ✅ |

### ✅ Phase 2: Enterprise Features (Completed)

**Deliverables**: Permissions + Workflow + Automation

| Task | Status |
|------|:---:|
| **Permission System** | |
| Object-level permissions (CRUD) | ✅ |
| Field-level permissions (visibility/editability) | ✅ |
| Record-level security (RLS) | ✅ |
| Permission Sets with filter merging | ✅ |
| Permission caching optimization | ✅ |
| Sharing Rules | 🔲 Planned |
| **Workflow Engine** | |
| Finite State Machine (FSM) engine | ✅ |
| YAML/JSON workflow definitions with loader | ✅ |
| State transition validation | ✅ |
| Workflow hooks (on_enter, on_exit) | ✅ |
| Workflow history tracking (persisted instances) | ✅ |
| Standard action library (log, sendEmail, webhook) | ✅ |
| Auto-triggers (listen to data events → workflow.trigger) | ✅ |
| Approval process support | ✅ |
| Spec-compliant Flow/FlowNode/FlowEdge format | ✅ |
| Visual workflow editor (ObjectUI) | 🔲 Planned |
| **Automation System** | |
| Trigger framework (event-driven evaluation) | ✅ |
| Scheduled jobs (Cron via cron-parser) | ✅ |
| In-memory job queue with retry & exponential backoff | ✅ |
| Job monitoring via automation_log object | ✅ |
| 7 spec-compliant action types | ✅ |
| Formula engine | ✅ |

### ✅ Phase 2.5: System Infrastructure Plugins (Completed)

| Plugin | Key Capabilities | Status |
|--------|-----------------|:---:|
| **Audit** | CRUD capture, field history, IP/UA/session metadata | ✅ |
| **Auth** | Better-Auth, Social Login, 2FA, multi-tenant orgs | ✅ |
| **Browser** | SQLite WASM, OPFS, Service Worker, offline-first | ✅ |
| **Cache** | LRU + Redis, TTL, namespaces, statistics | ✅ |
| **i18n** | Multi-locale, interpolation, plurals, date/number | ✅ |
| **Jobs** | Priority queues, Cron, retry, concurrency, sandbox | ✅ |
| **Metrics** | Counter/Gauge/Histogram, Prometheus export | ✅ |
| **Notification** | Email/SMS/Push/Webhook, templates, preferences | ✅ |
| **Storage** | Memory/Redis/SQLite KV, namespaces, streaming | ✅ |

### 🔄 Phase 3: System Integration & Validation (Current Focus)

**Goal**: Connect independent plugins into a cohesive operating system

| Task | Status | Priority |
|------|:---:|:---:|
| Hook standard — `data.create/update/delete` events flow through kernel | ✅ | — |
| Security aspect — permission checks injected before data operations | ✅ | — |
| **Realtime package — expand beyond minimal implementation** | 🟡 | 🔴 High |
| Add README, tests, and proper WebSocket channel management to `@objectos/realtime` | 🔲 | 🔴 High |
| `apps/web` console — integrate Workflow management UI | 🔲 | 🟡 Medium |
| `apps/web` console — integrate Permission configuration UI | 🔲 | 🟡 Medium |
| End-to-end integration tests across plugin boundaries | 🔲 | 🔴 High |
| Spec migration utilities (`convertToFlow`, `convertFromFlow`) | 🔲 | 🟡 Medium |

### 🔲 Phase 4: Multi-Tenancy & Security Hardening

**Goal**: Production SaaS readiness

| Task | Status | Duration |
|------|:---:|:---:|
| Tenant isolation strategy (Schema-level vs. Row-level) | 🔲 | 1 week |
| Tenant context injection into all plugin operations | 🔲 | 1 week |
| Cross-tenant data isolation verification | 🔲 | 3 days |
| Tenant quota management | 🔲 | 3 days |
| Tenant migration tooling | 🔲 | 3 days |
| OWASP Top 10 security audit | 🔲 | 3 days |
| SQL injection protection (parameterized queries) | 🔲 | 2 days |
| XSS protection (input validation + output encoding) | 🔲 | 2 days |
| CSRF token implementation | 🔲 | 1 day |
| Rate limiting (per-tenant, per-endpoint) | 🔲 | 2 days |

### 🔲 Phase 5: Observability

**Goal**: Production monitoring and debugging

| Task | Status | Duration |
|------|:---:|:---:|
| Prometheus metrics export endpoint (leverage `@objectos/metrics`) | 🔲 | 2 days |
| System metrics collectors (CPU, memory, event loop) | 🔲 | 2 days |
| Business metrics (request volume, error rate, P95 latency) | 🔲 | 2 days |
| Custom metrics API for plugins | 🔲 | 2 days |
| Structured logging with Winston/Pino | 🔲 | 2 days |
| Distributed tracing with OpenTelemetry | 🔲 | 3 days |
| Log aggregation configuration (ELK/Loki) | 🔲 | 2 days |
| Error tracking integration (Sentry) | 🔲 | 1 day |

### 🔲 Phase 6: Developer Experience

**Goal**: Lower learning curve, improve development velocity

| Task | Status | Duration |
|------|:---:|:---:|
| **CLI Tools** | | |
| `objectos init` — project scaffolding | 🔲 | 2 days |
| `objectos plugin:create` — plugin generator | 🔲 | 2 days |
| `objectos migrate` — migration tooling | 🔲 | 2 days |
| `objectos dev` — development server with hot reload | 🔲 | 1 day |
| **VS Code Extension** | | |
| YAML syntax highlighting for `.object.yml` | 🔲 | 2 days |
| Object definition auto-completion | 🔲 | 2 days |
| Field type validation & IntelliSense | 🔲 | 2 days |
| Workflow visualization preview | 🔲 | 3 days |
| **Documentation** | | |
| Quick start tutorial | 🔲 | 2 days |
| Complete API reference | 🔲 | 3 days |
| Plugin development tutorial (step-by-step) | 🔲 | 2 days |
| Best practice cookbook | 🔲 | 2 days |
| FAQ & troubleshooting guide | 🔲 | 1 day |

---

## 7. Spec Compliance Status

### Audit Results (Last Run: February 4, 2026)

| Metric | Result |
|--------|--------|
| **Total Packages Scanned** | 17 (13 plugins + 3 adapters + 1 preset) |
| **Issues Found** | 1 |
| **Issues Fixed** | 1 |
| **Final Status** | ✅ **ALL PACKAGES COMPLIANT** |

### Compliance Rules Enforced

| Rule | Description | Status |
|------|-------------|:---:|
| Plugin Interface | All plugins implement `Plugin` from `@objectstack/runtime` | ✅ |
| Runtime Dependency | All plugins declare `@objectstack/runtime` as dependency | ✅ |
| Spec Dependency | Packages importing from `@objectstack/spec` declare it | ✅ |
| Version Consistency | `@objectstack/spec: 1.0.0`, `@objectstack/runtime: ^1.0.0` | ✅ |
| Lifecycle Methods | All plugins implement `init()`, `start()`, `destroy()` | ✅ |

### Automation & Workflow Spec Migration

Both `@objectos/automation` and `@objectos/workflow` support **dual format**:

| Format | Package | Status |
|--------|---------|:---:|
| Legacy `AutomationRule` | automation | ✅ Supported (backward compat) |
| Spec `WorkflowRule` | automation | ✅ Primary format |
| Legacy `WorkflowDefinition` (state machine) | workflow | ✅ Supported (backward compat) |
| Spec `Flow` (visual flow) | workflow | ✅ Primary format |

**Spec-Compliant Action Types (7/7)**:
`field_update`, `email_alert`, `http_call`, `connector_action`, `task_creation`, `push_notification`, `custom_script`

**Spec-Compliant Flow Node Types (14/14)**:
`start`, `end`, `decision`, `assignment`, `loop`, `create_record`, `update_record`, `delete_record`, `get_record`, `http_request`, `script`, `wait`, `subflow`, `connector_action`

### Automated Compliance Audit

```bash
# Run the spec compliance audit
pnpm audit:spec
# or
node scripts/audit-spec-compliance.mjs
```

---

## 8. Quality Assurance

### Testing Strategy

| Test Type | Target Coverage | Tooling | Current Status |
|-----------|:-:|---------|:---:|
| **Unit Tests** | 90%+ (core) | Jest / Vitest | 39 test files across 12 packages |
| **Integration Tests** | 80%+ (plugins) | Jest + Supertest | In progress |
| **E2E Tests** | 100% critical flows | Playwright | 🔲 Planned |
| **Performance Tests** | Benchmark regression | k6 | 🔲 Planned |
| **Security Tests** | OWASP compliance | OWASP ZAP | 🔲 Planned |

### Test Coverage by Package

| Package | Test Files | Framework | Notes |
|---------|:---:|---------|-------|
| audit | 2 | Jest | CRUD capture, field history |
| auth | 1 | Jest | Auth flows, session management |
| automation | 6 | Vitest | Actions, triggers, formulas, queue |
| browser | 1 | Jest | SQLite WASM driver |
| cache | 2 | Jest | LRU + Redis backends |
| i18n | 2 | Jest | Interpolation, plurals |
| jobs | 5 | Jest | Queue, scheduler, retry, built-in jobs |
| metrics | 1 | Jest | Counter, gauge, histogram |
| notification | 3 | Jest | Channels, templates, queue |
| permissions | 5 | Vitest | Engine, loader, filter merging |
| realtime | **0** | — | ⚠️ **No tests — needs immediate attention** |
| storage | 2 | Jest | Memory, SQLite, Redis backends |
| workflow | 9 | Vitest | Engine, parser, approval, stdlib, loader |

### Code Quality Standards

- **TypeScript**: Strict mode (`strict: true`)
- **Modules**: ESM-only (`"type": "module"`)
- **Linting**: ESLint + Prettier
- **Commits**: Conventional Commits
- **Code Review**: All PRs require review
- **No `any`**: Use `unknown` with type guards

### Performance Targets

| Metric | Target |
|--------|--------|
| API Response Time | P95 < 100ms |
| Concurrent Users | 10,000+ |
| Database Connection Pool | Configurable (default 100) |
| Memory Usage | < 512MB (base configuration) |

---

## 9. Deployment Architecture

### Development Environment

```
┌─────────────────┐
│ ObjectUI (Vite) │ :5173
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ObjectOS Server │ :3000
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL      │ :5432
└─────────────────┘
```

### Production Environment

```
┌─────────────────────────┐
│   Nginx (Load Balancer) │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    ▼                ▼
┌─────────┐      ┌─────────┐
│ ObjectOS│      │ ObjectOS│
│ Node 1  │      │ Node 2  │
└────┬────┘      └────┬────┘
     │                │
     └────────┬───────┘
              ▼
    ┌─────────────────┐     ┌─────────────────┐
    │ PostgreSQL      │     │ Redis           │
    │ (Primary +      │     │ (Cache + Queue) │
    │  Standby)       │     │                 │
    └─────────────────┘     └─────────────────┘
```

### Cloud-Native Deployment

| Component | Technology |
|-----------|-----------|
| **Containerization** | Docker + Docker Compose |
| **Orchestration** | Kubernetes (Helm Charts) |
| **Service Mesh** | Istio (optional) |
| **Persistence** | StatefulSet for PostgreSQL |
| **Configuration** | ConfigMap + Secrets |
| **CI/CD** | GitHub Actions + Changesets |

### Prerequisites

- Node.js 18+ (LTS)
- PostgreSQL or MongoDB
- Redis (for caching & job queues)
- PNPM 9.x

---

## 10. Ecosystem Integration

### With ObjectQL (Data Layer)

```typescript
import { createObjectQL } from '@objectql/core';
import { SqlDriver } from '@objectql/driver-sql';

const objectql = createObjectQL({
  driver: new SqlDriver({ url: process.env.DATABASE_URL })
});

// ObjectOS loads metadata and provides security + business logic
await objectql.loadMetadata('./objects/**/*.yml');
```

### With ObjectUI (View Layer)

ObjectOS exposes a **Metadata API** that ObjectUI consumes to dynamically render forms, grids, and dashboards:

```
GET /api/metadata/objects/contacts → ObjectUI <ObjectGrid objectName="contacts" />
GET /api/metadata/objects/contacts → ObjectUI <ObjectForm objectName="contacts" />
```

### Framework Adapters

| Adapter | Purpose |
|---------|---------|
| `@objectstack/nestjs` | NestJS module integration |
| `@objectstack/hono` | Hono framework adapter |
| `@objectstack/nextjs` | Next.js API route integration |

### Plugin Manifest Pattern

Every business module is an ObjectOS Plugin:

```typescript
export const CrmPlugin: PluginManifest = {
  id: 'steedos-crm',
  version: '1.0.0',
  dependencies: ['@objectos/auth'],
  objects: ['./objects/*.object.yml'],
  workflows: ['./workflows/*.workflow.yml'],
  onLoad: async (ctx) => { ctx.logger.info('CRM Loaded'); },
  onEvent: {
    'user.signup': async (ctx, payload) => {
      await createLeadFromUser(payload);
    }
  }
};
```

### Workflow Definition (YAML)

```yaml
name: leave_request_flow
object: leave_request
states:
  draft:
    initial: true
    transitions:
      submit: pending_approval
  pending_approval:
    transitions:
      approve: approved
      reject: rejected
    on_enter:
      - action: notify_manager
  approved:
    final: true
```

---

## 11. Open Items & Next Steps

### 🔴 High Priority

| # | Item | Package | Description |
|---|------|---------|-------------|
| 1 | **Realtime package expansion** | `@objectos/realtime` | Only 2 source files, no tests, no README. Needs full WebSocket channel management, presence, and pub/sub. |
| 2 | **Cross-plugin integration tests** | All | End-to-end tests verifying plugin interactions (e.g., auth → permissions → audit pipeline). |
| 3 | **Sharing Rules** | `@objectos/permissions` | Object sharing rules not yet implemented. |

### 🟡 Medium Priority

| # | Item | Package | Description |
|---|------|---------|-------------|
| 4 | Web console — Workflow management | `apps/web` | UI for workflow definition, monitoring, and instance management. |
| 5 | Web console — Permission configuration | `apps/web` | UI for configuring roles, permission sets, and sharing rules. |
| 6 | Spec migration utilities | `@objectos/workflow` | `convertToFlow()` and `convertFromFlow()` conversion functions. |
| 7 | Visual workflow editor | `@objectos/workflow` + ObjectUI | Drag-and-drop workflow designer integrated with ObjectUI. |
| 8 | Job monitoring dashboard | `@objectos/automation` | UI task for monitoring automation jobs and their status. |

### 🟢 Future Phases (Post v1.0)

| # | Phase | Items |
|---|-------|-------|
| 9 | Multi-Tenancy | Tenant isolation, context injection, quotas, migration tools |
| 10 | Observability | Prometheus endpoint, OpenTelemetry tracing, structured logging, Sentry |
| 11 | CLI Tools | `objectos init`, `objectos plugin:create`, `objectos migrate`, `objectos dev` |
| 12 | VS Code Extension | YAML highlighting, auto-completion, field type checking, workflow visualization |
| 13 | Documentation | Quick start, API reference, plugin tutorials, best practices, FAQ |
| 14 | Enterprise SSO | SAML 2.0, LDAP integration |
| 15 | Advanced Queries | Aggregations, GROUP BY, subqueries, full-text search |
| 16 | Data Relationships | Lookup fields, master-detail, many-to-many, circular dependency detection |

### Timeline Summary

| Phase | Duration | Status | Deliverables |
|-------|:---:|:---:|-------------|
| **Phase 1**: Core Infrastructure | 4 weeks | ✅ Complete | Microkernel + standard plugins |
| **Phase 2**: Enterprise Features | 6 weeks | ✅ Complete | Permissions + workflow + automation |
| **Phase 2.5**: System Plugins | 4 weeks | ✅ Complete | All 13 plugins implemented |
| **Phase 3**: Integration & Validation | 3 weeks | 🔄 In Progress | Cross-plugin integration, realtime expansion |
| **Phase 4**: Multi-Tenancy & Security | 3 weeks | 🔲 Planned | Tenant isolation + OWASP hardening |
| **Phase 5**: Observability | 2 weeks | 🔲 Planned | Monitoring + logging + tracing |
| **Phase 6**: Developer Experience | 3 weeks | 🔲 Planned | CLI + VS Code extension + docs |
| **Total to v1.0** | **~25 weeks** | | **Production-ready ObjectOS v1.0** |

---

## Licensing

- **Core Runtime**: AGPL-3.0
- **Plugins**: AGPL-3.0
- **Documentation**: CC BY-SA 4.0

## Links

- **Repository**: https://github.com/objectql/objectos
- **Spec Protocol**: https://github.com/objectstack-ai/spec
- **ObjectQL**: https://github.com/objectql/objectql
- **Issues**: https://github.com/objectql/objectos/issues
- **Discussions**: https://github.com/objectql/objectos/discussions

---

<div align="center">
<sub>ObjectOS — The Enterprise Operating System | Built with @objectstack/spec</sub>
</div>
