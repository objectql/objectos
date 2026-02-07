# ObjectOS Development Plan

> **Version**: 3.0.0
> **Date**: February 7, 2026
> **Status**: Frontend Migration + v1.0 Sprint — 13/13 Plugins Implemented

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
12. [Frontend Architecture Decision](#12-frontend-architecture-decision)
13. [Detailed Roadmap: Frontend + Server Integration](#13-detailed-roadmap-frontend--server-integration)

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
| **Server Runtime** | @objectstack/cli Hono server (objectstack serve) |
| **Applications** | 2 (Documentation Site + Admin Console) |
| **Frontend Decision** | ✅ Migrate `apps/web` from Next.js → Vite SPA |

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
| **@objectos/site** | Official documentation & marketing site | Next.js 16 + Fumadocs (MDX, static export) | 🟢 Active |
| **@objectos/web** | Admin console — Auth, Dashboard, Organization, System management | **Vite + React 19 + React Router** (migrating from Next.js) | 🟡 Migrating |

### External Dependencies

| Dependency | Role | Used By |
|-----------|------|---------|
| `@objectstack/runtime` | Microkernel — plugin lifecycle, service registry, event bus | All 13 plugins |
| `@objectstack/spec` | Protocol contracts — Zod schemas, TypeScript interfaces | audit, automation, auth, jobs, permissions, workflow |
| `@objectql/core` | Data engine — metadata registry, query compiler | audit, auth, automation, jobs, permissions, workflow |

---

## 6. Spec-Driven Roadmap to v1.0 (Baseline Release)

This roadmap is derived from **@objectstack/spec** requirements (kernel, system, security, automation, data, UI, API) and a deep scan of current package implementations.

### 6.1 v1.0 Release Criteria (Must-Have)

**Kernel & Plugin Contract**
- Plugin capability and security manifests aligned to spec: `PluginCapabilityManifest`, `PluginSecurityManifest`.
- Kernel context populated per spec: `KernelContext`.
- Health checks and startup reporting: `PluginHealthCheck`, `PluginHealthReport`, `PluginStartupResult`.
- Event bus configuration compliance: `EventBusConfig` (persistence, retries, DLQ, webhooks).

**Security & Identity**
- Permissions align to spec: `PermissionSet`, `ObjectPermission`, `FieldPermission`, `RLSConfig`, `SharingRule`.
- Audit policy coverage for spec event types: `AuditConfig`.
- Session and password policies aligned to spec: `SessionPolicy`, `PasswordPolicy`.

**Automation & Workflow**
- Native execution of spec `WorkflowRule` and `Flow` formats (not only compatibility).
- Action execution sandbox policy (spec security expectations).

**Realtime & API**
- WebSocket protocol compliance (subscribe/unsubscribe/ack/presence) with auth + tenant scoping.
- Metadata + data APIs aligned to spec HTTP protocol conventions.

**Operational Readiness**
- Structured logging, basic metrics export, and audit retention.
- Integration tests across core paths (auth → permissions → data → audit).

### 6.2 Roadmap Phases

#### Phase A — Kernel Compliance Baseline (2 weeks)

**Goal**: Align runtime with kernel protocol schemas.

| Task | Scope | Spec Reference |
|------|------|---------------|
| Define plugin capability manifests | All plugins | `PluginCapabilityManifest` |
| Define plugin security manifests | All plugins | `PluginSecurityManifest` |
| Kernel context and startup reporting | Runtime | `KernelContext`, `PluginStartupResult` |
| Plugin health checks | Runtime + Plugins | `PluginHealthCheck`, `PluginHealthReport` |
| Event bus config and persistence | Runtime | `EventBusConfig` |
| Webhook event forwarding | Runtime | `EventBusConfig.webhooks` |

#### Phase B — Security & Audit Parity (2–3 weeks)

**Goal**: Match security and audit schemas for a minimal enterprise-ready release.

| Task | Package(s) | Spec Reference |
|------|------------|---------------|
| Implement Sharing Rules (criteria/owner-based) | `@objectos/permissions` | `SharingRule`, `OwnerSharingRule`, `CriteriaSharingRule` |
| Map RLS policies to spec model | `@objectos/permissions` | `RLSConfig`, `RowLevelSecurityPolicy` |
| Add password/session policies | `@objectos/auth` | `PasswordPolicy`, `SessionPolicy` |
| Align audit event coverage | `@objectos/audit` | `AuditConfig` |
| Add audit retention strategy | `@objectos/audit` | `AuditRetentionPolicy` |

#### Phase C — Workflow & Automation Native Spec Execution (2–3 weeks)

**Goal**: Execute spec formats as first-class runtime, not just compatibility.

| Task | Package(s) | Spec Reference |
|------|------------|---------------|
| Native Flow execution engine | `@objectos/workflow` | `Flow`, `FlowNode`, `FlowEdge` |
| Conversion utilities (legacy ↔ spec) | `@objectos/workflow` | `Flow` / legacy FSM |
| Spec validation on load | `@objectos/automation`, `@objectos/workflow` | `WorkflowRule`, `Flow` |
| Action execution sandbox | `@objectos/automation` | `PluginSecurityManifest` |

#### Phase D — Realtime Protocol Compliance (2 weeks)

**Goal**: Reach WebSocket protocol compatibility with auth + tenant-aware events.

| Task | Package(s) | Spec Reference |
|------|------------|---------------|
| WebSocket protocol compliance (subscribe/unsubscribe/ack) | `@objectos/realtime` | WebSocket API spec |
| Presence and awareness updates | `@objectos/realtime` | Awareness schemas |
| Auth + tenant scoping | `@objectos/auth`, `@objectos/realtime` | Identity + Security |
| Event bus integration | Runtime + Realtime | `EventBusConfig` |
| Tests + README coverage | `@objectos/realtime` | Quality baseline |

#### Phase E — Operational Readiness (2 weeks)

**Goal**: Minimum observability and reliability for a v1.0 launch.

| Task | Package(s) | Spec Reference |
|------|------------|---------------|
| Metrics export endpoint | `@objectos/metrics`, server adapter | Metrics schemas |
| Structured logging policy | Runtime + server | Logging schemas |
| Audit log query API standardization | `@objectos/audit` | Audit schemas |
| Integration test suite | All core packages | Spec-driven test cases |

#### Phase F — Release Candidate (1–2 weeks)

**Goal**: Stabilize and ship the baseline v1.0.

| Task | Scope | Exit Criteria |
|------|------|---------------|
| Security review | Platform | No critical findings |
| Performance baseline | Runtime + server | P95 < 100ms on CRUD |
| Documentation updates | Docs + site | Spec-aligned guides |
| Versioning and release | Monorepo | Tagged v1.0.0 |

### 6.3 Package-Level Spec Gaps (from code scan)

| Package | Observed Gap | Spec Impact |
|---------|--------------|------------|
| `@objectos/realtime` | Minimal implementation, no tests | WebSocket protocol + awareness missing |
| `@objectos/permissions` | Sharing Rules not implemented | `SharingRule` schema not satisfied |
| `@objectos/auth` | No password/session policy wiring | `PasswordPolicy`, `SessionPolicy` |
| `@objectos/audit` | Limited event coverage and retention | `AuditConfig`, `AuditRetentionPolicy` |
| `@objectos/workflow` | Spec Flow not executed natively | `Flow` execution requirement |
| `@objectos/automation` | Script/action sandboxing flagged | `PluginSecurityManifest` expectations |
| Runtime (external) | Capability/security manifests not enforced | Kernel protocol compliance |

### 6.4 v1.0 Spec Checklist by Package

**Legend**: ✅ Implemented · 🟡 Partial · 🔲 Missing

| Package | Spec Areas | Status | v1.0 Target |
|---------|-----------|:---:|-------------|
| `@objectos/audit` | `AuditConfig`, `AuditEvent`, `AuditRetentionPolicy` | 🟡 | Full event type coverage + retention policy |
| `@objectos/auth` | Identity schemas, `SessionPolicy`, `PasswordPolicy` | 🟡 | Enforced policies + session lifecycle hooks |
| `@objectos/automation` | `WorkflowRule`, action schemas, sandbox policy | 🟡 | Native spec validation + sandboxed execution |
| `@objectos/workflow` | `Flow`, `FlowNode`, `FlowEdge`, approvals | 🟡 | Native Flow execution + conversion utilities |
| `@objectos/permissions` | `PermissionSet`, `SharingRule`, `RLSConfig` | 🟡 | Sharing rules + full RLS alignment |
| `@objectos/realtime` | WebSocket API + awareness schemas | 🔲 | Protocol-compliant server + tests |
| `@objectos/metrics` | Metrics schemas | ✅ | Export endpoint + labels parity |
| `@objectos/storage` | Storage schemas | ✅ | No change |
| `@objectos/cache` | Cache schemas | ✅ | No change |
| `@objectos/notification` | Notification schemas | ✅ | Channel policy alignment |
| `@objectos/jobs` | Job + schedule schemas | ✅ | Add DLQ visibility |
| `@objectos/i18n` | Translation schemas | ✅ | No change |
| `@objectos/browser` | Local-first + sync schemas | 🟡 | Align conflict resolution to spec |

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
┌──────────────────────┐      ┌──────────────────────┐
│ Vite Dev (apps/web)  │      │ Fumadocs (apps/site) │
│ :3001                │      │ :3002                │
└──────────┬───────────┘      └──────────┬───────────┘
           │ proxy /api/v1               │
           ▼                             │
┌──────────────────────┐                 │
│ ObjectStack Hono     │◀────────────────┘
│ :3000                │
│ ├── /api/v1/*        │
│ ├── /.well-known     │
│ └── Kernel + Plugins │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ PostgreSQL / SQLite   │
└──────────────────────┘
```

### Production Environment (Single-Process)

```
┌─────────────────────────────────────────┐
│         ObjectStack Hono (:3000)        │
│  ├── /api/v1/*    → Kernel API          │
│  ├── /console/*   → apps/web/dist/      │
│  ├── /docs/*      → apps/site/out/      │
│  └── /.well-known → Discovery           │
└────────────────────┬────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ PostgreSQL      │     │ Redis           │
│ (Primary +      │     │ (Cache + Queue) │
│  Standby)       │     │                 │
└─────────────────┘     └─────────────────┘
```

### Scaled Production

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

### With ObjectUI (View Layer — Separate Repository)

ObjectUI (`github.com/objectql/objectui`) is an **independent control library** — similar to amis — that provides metadata-driven UI components:

- **Schema Renderer**: Dynamically renders Forms, Grids, Charts from ObjectStack UI protocol
- **Plugin UI Loader**: Module Federation for plugin-contributed UI components
- **Offline Sync**: Integrates with `@objectos/browser` for local-first data

ObjectOS exposes a **Metadata API** that ObjectUI consumes:

```
GET /api/v1/meta/objects/contacts → ObjectUI <ObjectGrid objectName="contacts" />
GET /api/v1/meta/objects/contacts → ObjectUI <ObjectForm objectName="contacts" />
```

### With apps/web (Admin Console — This Repository)

`apps/web` is the **App Shell** that assembles everything for end users:

```
apps/web (Vite SPA)
  ├── App Shell: Login, Navigation, Layout, Routing
  ├── System Admin Pages: Users, Roles, Plugins, Audit Logs
  ├── imports ObjectUI controls for business data rendering
  └── All API calls → ObjectStack Hono /api/v1/*
```

### Server: ObjectStack Hono

The HTTP server is provided by `@objectstack/cli` via `objectstack serve`:

```
objectstack serve (Hono + @hono/node-server)
  ├── /api/v1/auth/*        → BetterAuth (Identity)
  ├── /api/v1/data/*        → ObjectQL CRUD (Data)
  ├── /api/v1/graphql       → GraphQL endpoint
  ├── /api/v1/meta/*        → Metadata CRUD
  ├── /api/v1/analytics/*   → Analytics queries
  ├── /api/v1/storage/*     → File storage
  ├── /api/v1/automation/*  → Automation triggers
  ├── /.well-known/objectstack → Discovery
  └── Static mounts: /console/* (web), /docs/* (site)
```

### Framework Adapters

| Adapter | Purpose |
|---------|---------|
| `@objectstack/hono` | **Primary** — Hono framework adapter (used by `objectstack serve`) |
| `@objectstack/nestjs` | NestJS module integration (legacy) |

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

## 11. Open Items & Next Steps (v1.0 Baseline)

### 🔴 Immediate (Release Blockers)

| # | Item | Owner | Spec Reference | Notes |
|---|------|-------|----------------|------|
| 1 | Plugin capability + security manifests | Runtime + All plugins | `PluginCapabilityManifest`, `PluginSecurityManifest` | Define and validate in build/test |
| 2 | Event bus persistence + retries + DLQ | Runtime | `EventBusConfig` | Required for reliable automation/audit |
| 3 | WebSocket protocol compliance | `@objectos/realtime` | WebSocket API spec | Add auth, tenant scoping, tests |
| 4 | Sharing Rules | `@objectos/permissions` | `SharingRule` | Required for enterprise security parity |
| 5 | Integration test suite | All core packages | Spec-driven cases | Auth → Permissions → Data → Audit |

### 🟡 Near-Term (Release Candidate)

| # | Item | Owner | Spec Reference | Notes |
|---|------|-------|----------------|------|
| 6 | Health checks + startup reporting | Runtime + Plugins | `PluginHealthCheck`, `PluginStartupResult` | Required for ops readiness |
| 7 | Audit retention + policy coverage | `@objectos/audit` | `AuditConfig`, `AuditRetentionPolicy` | Align to event coverage list |
| 8 | Password + session policies | `@objectos/auth` | `PasswordPolicy`, `SessionPolicy` | Enforce security baseline |
| 9 | Native Flow execution | `@objectos/workflow` | `Flow` | Remove reliance on legacy FSM path |
| 10 | Action execution sandbox | `@objectos/automation` | `PluginSecurityManifest` | Restrict scripts + resource access |

### 🟢 Post v1.0 (Optional Enhancements)

| # | Area | Items |
|---|------|-------|
| 11 | Multi-Tenancy | Tenant isolation, quotas, migration tooling |
| 12 | Observability | OpenTelemetry tracing, log aggregation, Sentry |
| 13 | Developer Tools | CLI, VS Code extension, advanced docs |
| 14 | Identity | SCIM endpoints + provisioning models |
| 15 | Data & Query | Relationship expansion, advanced query operators |
| 16 | UI | Visual workflow editor + admin UI configuration |

### Updated Timeline Summary (v1.0 Baseline)

| Phase | Duration | Status | Deliverables |
|-------|:---:|:---:|-------------|
| **Phase A**: Kernel Compliance | 2 weeks | 🔄 Planned | Manifests + health + event bus |
| **Phase B**: Security & Audit | 2–3 weeks | 🔲 Planned | Sharing rules + policy alignment |
| **Phase C**: Automation & Workflow | 2–3 weeks | 🔲 Planned | Native Flow + sandbox |
| **Phase D**: Realtime | 2 weeks | 🔲 Planned | WebSocket protocol compliance |
| **Phase E**: Ops Readiness | 2 weeks | 🔲 Planned | Metrics + logging + tests |
| **Phase F**: Release Candidate | 1–2 weeks | 🔲 Planned | Performance + docs + tag |
| **Total to v1.0** | **~11–14 weeks** | | **Baseline ObjectOS v1.0** |

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

## 12. Frontend Architecture Decision

### ADR-001: Migrate apps/web from Next.js to Vite SPA

**Date**: February 7, 2026
**Status**: Accepted

#### Context

`apps/web` was initially built with Next.js 15. Evaluation revealed:

1. **No SSR need** — All pages (sign-in, sign-up, dashboard, organization) are client-rendered forms/data views behind a login wall.
2. **Duplicate Auth instance** — Next.js API Routes (`/api/auth/[...all]`) created a separate BetterAuth + SQLite instance, isolated from the ObjectStack Kernel's `BetterAuthPlugin`.
3. **Port conflict** — Next.js and `objectstack serve` both default to port 3000.
4. **Architecture violation** — Next.js API Routes tempt developers to embed backend logic in the frontend, violating the Kernel/Plugin separation principle.
5. **ObjectUI is separate** — Business UI components (Schema Renderer, Plugin UI Loader) live in the `objectui` repository as a standalone control library (amis-like). `apps/web` is the App Shell that assembles them.

#### Decision

**Replace Next.js with Vite + React + React Router for `apps/web`.**

Keep Next.js only for `apps/site` (Fumadocs documentation framework dependency).

#### Consequences

| Aspect | Impact |
|--------|--------|
| **Dev startup** | 3-5s → <1s |
| **Dependencies** | ~180MB → ~40MB (node_modules) |
| **API Routes** | Eliminated — impossible to create backend code in frontend |
| **Auth** | Single source: ObjectStack Kernel `BetterAuthPlugin` |
| **Production deploy** | Single process: `objectstack serve` with staticMount |
| **SSR capability** | Removed (not needed for admin console) |
| **ObjectUI integration** | Simpler — direct `import()` or Module Federation in Vite |

#### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Bundler** | Vite | Fast HMR, native ESM, proxy config |
| **Framework** | React 19 | Ecosystem, ObjectUI compatibility |
| **Routing** | React Router 7 | Lightweight, well-known, sufficient for admin console |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Already in use, design system |
| **Data Fetching** | TanStack Query | Caching, optimistic updates, deduplication |
| **Auth Client** | better-auth/react | Direct from ObjectStack `/api/v1/auth` |
| **State** | Zustand (when needed) | Lightweight, no boilerplate |

### Three-Layer UI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  ObjectUI (Separate Repo: github.com/objectql/objectui)     │
│  ├── Schema Renderer  → JSON → React Components             │
│  ├── Control Library   → Form, Grid, Chart, Kanban, ...     │
│  └── Plugin UI Loader → Module Federation for plugin UIs    │
└──────────────────────────┬──────────────────────────────────┘
                           │ npm dependency / dynamic import
┌──────────────────────────┴──────────────────────────────────┐
│  apps/web (Admin Console — THIS REPO)                        │
│  ├── App Shell: Auth, Navigation, Layout, Error Boundaries  │
│  ├── System Pages: Users, Roles, Plugins, Audit, Metrics    │
│  ├── Business Pages: Assembles ObjectUI components          │
│  │   └── <SchemaRenderer object="contacts" view="grid" />   │
│  └── API Client: TanStack Query → /api/v1/*                 │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────┴──────────────────────────────────┐
│  ObjectStack Hono Server (:3000)                             │
│  ├── /api/v1/auth/*     → BetterAuth (Identity)             │
│  ├── /api/v1/data/*     → ObjectQL (CRUD)                   │
│  ├── /api/v1/meta/*     → Metadata (Object schemas, views)  │
│  ├── /api/v1/graphql    → GraphQL                           │
│  ├── /console/*         → Static (apps/web/dist in prod)    │
│  └── /docs/*            → Static (apps/site/out in prod)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. Detailed Roadmap: Frontend + Server Integration

### Phase 0 — Vite Migration (1–2 days)

**Goal**: Replace Next.js with Vite in `apps/web`, uniform all API calls to ObjectStack.

| # | Task | Details |
|---|------|---------|
| 0.1 | Initialize Vite + React project | `apps/web/` — vite.config.ts, index.html, tsconfig |
| 0.2 | Configure dev proxy | `/api/v1` → `http://localhost:3000` |
| 0.3 | Install shadcn/ui + Tailwind | Same design system, port existing styles |
| 0.4 | Migrate auth-client.ts | Point to `/api/v1/auth`, remove `better-sqlite3` dep |
| 0.5 | Migrate pages to React Router | sign-in, sign-up, dashboard, organization/create, forgot-password |
| 0.6 | Delete Next.js artifacts | next.config.ts, api/ routes, auth-server.ts, postcss next config |
| 0.7 | Update monorepo scripts | `web:dev`, `web:build` in root package.json |
| 0.8 | Configure objectstack.config.ts | Add `staticMounts` for `/console/*` → `apps/web/dist/` |

**Exit Criteria**: `pnpm web:dev` starts Vite on :3001, all auth flows work against `objectstack serve` on :3000.

### Phase 1 — Admin Console Foundation (1 week)

**Goal**: Build the core admin shell with navigation, protected routes, and system pages.

| # | Task | Details |
|---|------|---------|
| 1.1 | Implement App Shell | Sidebar navigation, topbar with user menu, breadcrumbs |
| 1.2 | Protected route wrapper | Redirect to `/sign-in` if no session, role-based guards |
| 1.3 | Dashboard page | Session info, system health summary (from `/api/v1/meta`) |
| 1.4 | Users management | List/create/edit users (CRUD via `/api/v1/data/user`) |
| 1.5 | Organization management | List/switch/create orgs (existing functionality, improved) |
| 1.6 | TanStack Query setup | API client wrapper, query keys convention, error handling |

### Phase 2 — System Administration Pages (2 weeks)

**Goal**: Expose all ObjectOS Kernel capabilities through the admin UI.

| # | Task | Details |
|---|------|---------|
| 2.1 | Roles & Permissions UI | View/edit Permission Sets, Object Permissions, Field-level Security |
| 2.2 | Audit Log Viewer | Filterable table of audit events, user/object/action filters |
| 2.3 | Plugin Management | List loaded plugins, health status, enable/disable (future) |
| 2.4 | Workflow Designer (basic) | View workflow definitions, state transitions, run history |
| 2.5 | Automation Rules | List/create/edit automation rules, trigger type selection |
| 2.6 | Jobs Monitor | Active/completed/failed jobs, retry actions |
| 2.7 | Metrics Dashboard | System metrics display (from `@objectos/metrics` export) |
| 2.8 | Notification Settings | Channel configuration (email/SMS/webhook templates) |

### Phase 3 — ObjectUI Integration (2 weeks)

**Goal**: Wire up ObjectUI component library for metadata-driven business UIs.

| # | Task | Details |
|---|------|---------|
| 3.1 | Install `@objectui/core` | Add as dependency, configure provider |
| 3.2 | Metadata-driven routing | Dynamic routes: `/app/:objectName` → fetch schema → render |
| 3.3 | Schema Renderer integration | `<SchemaRenderer object="contacts" view="grid" />` |
| 3.4 | Form Renderer integration | `<SchemaRenderer object="contacts" view="form" recordId={id} />` |
| 3.5 | Plugin UI slots | Define extension points where plugin UIs can be injected |
| 3.6 | View configuration | Support ObjectStack UI protocol for custom views/dashboards |

### Phase 4 — Production Readiness (1 week)

**Goal**: Single-process production deployment, optimized build.

| # | Task | Details |
|---|------|---------|
| 4.1 | Vite build optimization | Code splitting, lazy routes, asset hashing |
| 4.2 | objectstack.config.ts staticMounts | `/console/*` → `apps/web/dist/`, `/docs/*` → `apps/site/out/` |
| 4.3 | Default UI redirect | `/` → `/console/` in ObjectStack server |
| 4.4 | Environment configuration | `.env` for API URL, basePath, feature flags |
| 4.5 | Docker build pipeline | Multi-stage: build web → build site → copy to server image |
| 4.6 | E2E smoke tests | Playwright: login flow, dashboard load, CRUD operations |

### Phase 5 — Advanced Features (Ongoing)

| # | Task | Details |
|---|------|---------|
| 5.1 | Real-time updates | WebSocket integration via `@objectos/realtime` |
| 5.2 | i18n support | Integrate `@objectos/i18n` for multi-locale admin UI |
| 5.3 | Theme system | Dark/light mode, custom branding per organization |
| 5.4 | Keyboard shortcuts | Command palette (Cmd+K) for power users |
| 5.5 | Offline support | Service Worker + `@objectos/browser` for offline admin access |
| 5.6 | Module Federation | Dynamic loading of plugin UIs from CDN/external bundles |

### Updated Master Timeline

| Phase | Duration | Dependencies | Deliverables |
|-------|:---:|-------------|-------------|
| **Phase 0**: Vite Migration | 1–2 days | None | Working Vite SPA, auth against ObjectStack |
| **Phase A**: Kernel Compliance | 2 weeks | None | Plugin manifests, health checks, event bus |
| **Phase 1**: Admin Console Foundation | 1 week | Phase 0 | App shell, protected routes, dashboard |
| **Phase B**: Security & Audit | 2–3 weeks | Phase A | Sharing rules, policies |
| **Phase 2**: System Admin Pages | 2 weeks | Phase 1 | Full admin CRUD for all subsystems |
| **Phase C**: Workflow & Automation | 2–3 weeks | Phase B | Native Flow execution |
| **Phase 3**: ObjectUI Integration | 2 weeks | Phase 2, ObjectUI repo | Metadata-driven business UI |
| **Phase D**: Realtime Protocol | 2 weeks | Phase C | WebSocket compliance |
| **Phase 4**: Production Readiness | 1 week | Phase 3 | Single-process deploy, Docker |
| **Phase E**: Ops Readiness | 2 weeks | Phase D | Metrics, logging, integration tests |
| **Phase F**: Release Candidate | 1–2 weeks | Phase E | v1.0.0 tag |
| **Total to v1.0** | **~16–20 weeks** | | **ObjectOS v1.0 + Admin Console** |

---

## Licensing

- **Core Runtime**: AGPL-3.0
- **Plugins**: AGPL-3.0
- **Documentation**: CC BY-SA 4.0

## Links

- **Repository**: https://github.com/objectql/objectos
- **Spec Protocol**: https://github.com/objectstack-ai/spec
- **ObjectQL**: https://github.com/objectql/objectql
- **ObjectUI**: https://github.com/objectql/objectui
- **Issues**: https://github.com/objectql/objectos/issues
- **Discussions**: https://github.com/objectql/objectos/discussions

---

<div align="center">
<sub>ObjectOS — The Enterprise Operating System | Built with @objectstack/spec</sub>
</div>
