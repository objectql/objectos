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

<div align="center">
<sub>ObjectOS — The Enterprise Operating System | Built with @objectstack/spec</sub>
</div>
