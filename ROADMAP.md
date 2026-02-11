# ObjectOS Roadmap

> **Version**: 6.0.0
> **Date**: February 11, 2026
> **Status**: Phase H — @object-ui Driven Development
> **Spec SDK**: `@objectstack/spec@2.0.7`
> **ObjectUI**: `@object-ui/*@2.0.0`

---

## Executive Summary

ObjectOS is a metadata-driven enterprise runtime platform built on the ObjectStack protocol. With all 13 server-side plugins fully implemented, spec compliance at 100%, and the Admin Console operational with 29 pages, the project is transitioning from **infrastructure build-out** to **UI-centric business application delivery**.

The integration of **@object-ui** (6 packages at v2.0.0) marks a strategic shift: the Admin Console's Business App Shell now leverages @object-ui's `SchemaRenderer` for metadata-driven UI rendering, replacing hand-built components with protocol-compliant controls.

### What Changed

| Before (Plan v5.0) | After (Plan v6.0 — This Roadmap) |
|---|---|
| @object-ui listed as v1.1 future work | @object-ui v2.0.0 already installed and integrated |
| Hand-built DataGrid, MetadataForm, KanbanBoard | @object-ui SchemaRenderer as primary rendering engine |
| ObjectUI integration planned for April 2026 | ObjectUI integration active **now** — February 2026 |
| Business App Shell was Phase 1 "foundation" | Business App Shell upgraded to @object-ui powered |
| Custom field renderers for each type | @object-ui/fields provides field registry |
| @objectstack/* packages at v2.0.6 | @objectstack/* packages upgraded to v2.0.7 |

---

## Current State (February 2026)

### Server — ✅ Complete (13 Plugins)

| Plugin | Package | Status |
|--------|---------|:------:|
| Audit Logging | `@objectos/audit` | ✅ |
| Authentication | `@objectstack/plugin-auth` | ✅ |
| Automation | `@objectos/automation` | ✅ |
| Browser Runtime | `@objectos/browser` | ✅ |
| Cache | `@objectos/cache` | ✅ |
| i18n | `@objectos/i18n` | ✅ |
| Jobs | `@objectos/jobs` | ✅ |
| Metrics | `@objectos/metrics` | ✅ |
| Notification | `@objectos/notification` | ✅ |
| Permissions | `@objectos/permissions` | ✅ |
| Realtime | `@objectos/realtime` | ✅ |
| Storage | `@objectos/storage` | ✅ |
| Workflow | `@objectos/workflow` | ✅ |

**Server Metrics**: 21,947 source lines · 107 TypeScript files · 47 test files · 350+ tests

### Frontend — 🔄 Active Development

| Area | Status | Details |
|------|:------:|---------|
| Auth Pages | ✅ | 6 pages: sign-in, sign-up, forgot-password, reset-password, verify-2fa, home |
| Admin Console | ✅ | 16 pages: settings, org management, audit, jobs, metrics, plugins, etc. |
| Business App Shell | 🔄 | App page, object list, object record — wired to mock data + API client |
| @object-ui Integration | 🔄 | Packages installed, adapter configured, demo page functional |
| ObjectUI Components | 🔄 | 7 components: DataGrid, MetadataForm, KanbanBoard, ChartWidget, ViewSwitcher, LayoutBuilder, ObjectUIExample |
| Workflow UI | 🔄 | 5 components: WorkflowStatusBadge, ApprovalActions, ActivityTimeline, WorkflowVisualizer, AutomationRulesBuilder |
| Sync UI | 🔄 | 2 components: OfflineIndicator, ConflictResolutionDialog |
| Data Hooks | ✅ | useRecords (CRUD + optimistic updates), useMetadata, useWorkflow, useSync, useOffline |

### @object-ui Packages Installed

| Package | Version | Role |
|---------|---------|------|
| `@object-ui/core` | 2.0.0 | Core logic, types, validation |
| `@object-ui/react` | 2.0.0 | React bindings, SchemaRenderer |
| `@object-ui/components` | 2.0.0 | Standard UI components (Shadcn-based) |
| `@object-ui/layout` | 2.0.0 | Application shell components |
| `@object-ui/fields` | 2.0.0 | Field renderers and registry |
| `@object-ui/data-objectstack` | 2.0.0 | ObjectStack data adapter |

---

## Completed Phases

| Phase | Focus | Timeline | Status |
|:-----:|-------|:--------:|:------:|
| A | Kernel Compliance Baseline | Oct 2025 | ✅ |
| B | Security & Audit Parity | Nov 2025 | ✅ |
| C | Workflow & Automation Spec Execution | Nov 2025 | ✅ |
| D | Realtime Protocol Compliance | Dec 2025 | ✅ |
| E | Operational Readiness | Dec 2025 | ✅ |
| F | Release Candidate (Security, Performance, Docker, E2E) | Jan 2026 | ✅ |
| G | Spec Protocol Alignment + Admin Console | Feb 2026 | ✅ |

### Phase G Outcomes

- ✅ All 10 core plugins adopt `@objectstack/spec/contracts` interfaces
- ✅ @objectstack/* packages upgraded to v2.0.7
- ✅ @object-ui v2.0.0 packages installed in apps/web
- ✅ ObjectStack data adapter created (`object-ui-adapter.ts`)
- ✅ SchemaRenderer integration example working
- ✅ Business App Shell pages created (app, object-list, object-record)
- ✅ TanStack Query hooks for CRUD operations with optimistic updates
- ✅ Mock data system for offline UI development

---

## Phase H — @object-ui Driven Development (Current — Feb–Mar 2026)

This phase replaces the previous "Phase 1: Foundation" from the frontend roadmap. Instead of building custom components from scratch, we now leverage @object-ui's `SchemaRenderer` as the primary rendering engine for business data views.

### H.1 — SchemaRenderer Integration for Business Pages

Replace hand-built business page views with @object-ui SchemaRenderer.

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.1.1 | Replace `RecordTable` in object-list.tsx with `SchemaRenderer view="grid"` | 🔴 | 🔲 |
| H.1.2 | Replace field detail rendering in object-record.tsx with `SchemaRenderer view="detail"` | 🔴 | 🔲 |
| H.1.3 | Add record creation page using `SchemaRenderer view="form"` | 🔴 | 🔲 |
| H.1.4 | Add record editing using `SchemaRenderer view="form" recordId={id}` | 🔴 | 🔲 |
| H.1.5 | Wire `KanbanBoard` view mode to `SchemaRenderer view="kanban"` | 🟡 | 🔲 |
| H.1.6 | Implement calendar view using `SchemaRenderer view="calendar"` | 🟡 | 🔲 |

### H.2 — Metadata-Driven Navigation

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.2.1 | Dynamic sidebar generated from `GET /api/v1/meta/apps` response | 🔴 | 🔲 |
| H.2.2 | Object navigation within apps derived from app metadata | 🔴 | 🔲 |
| H.2.3 | Breadcrumb generation from current route context | 🟡 | 🔲 |
| H.2.4 | Recent items and favorites tracking | 🟢 | 🔲 |

### H.3 — API Client Completion

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.3.1 | Connect useRecords hooks to live `@objectstack/client` API (remove mock fallback reliance) | 🔴 | 🔲 |
| H.3.2 | Implement server-side pagination in object list view | 🔴 | 🔲 |
| H.3.3 | Implement server-side sorting and filtering | 🟡 | 🔲 |
| H.3.4 | Error boundary integration with TanStack Query | 🟡 | 🔲 |

### H.4 — @object-ui / @objectos Bridge Components

Custom wrapper components that combine @object-ui controls with ObjectOS-specific features.

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.4.1 | `ObjectPage` — wraps SchemaRenderer with ObjectOS permissions check | 🔴 | 🔲 |
| H.4.2 | `ObjectToolbar` — view switcher + new record button + bulk actions | 🟡 | 🔲 |
| H.4.3 | `RelatedList` — displays child/lookup records on detail pages | 🟡 | 🔲 |
| H.4.4 | `FilterPanel` — metadata-aware filter builder for list views | 🟡 | 🔲 |

---

## Phase I — Rich Data Experience (Mar–Apr 2026)

Advanced data manipulation features building on the @object-ui foundation.

| # | Task | Priority | Description |
|---|------|:--------:|-------------|
| I.1 | Inline editing in grid view | 🔴 | Click-to-edit cells using @object-ui/fields |
| I.2 | Bulk record actions | 🔴 | Select multiple → delete, update field, change owner |
| I.3 | Saved filters / views | 🟡 | Persist filter configurations per user per object |
| I.4 | Related lists on record detail | 🟡 | Child objects rendered as sub-tables |
| I.5 | Record cloning | 🟢 | Duplicate record with field selection |
| I.6 | CSV import/export | 🟡 | Bulk data upload with field mapping |
| I.7 | Lookup field autocomplete | 🔴 | Async search for related records using @object-ui/fields |

---

## Phase J — Workflow & Automation UI (Apr–May 2026)

Build visual interfaces for the workflow and automation engines.

| # | Task | Priority | Description |
|---|------|:--------:|-------------|
| J.1 | Visual Flow Editor | 🔴 | Drag-and-drop workflow designer using Flow spec |
| J.2 | Approval Inbox | 🔴 | Centralized view for pending approvals |
| J.3 | Automation Rule Builder | 🟡 | Visual trigger + condition + action configuration |
| J.4 | Workflow Instance Monitor | 🟡 | Real-time workflow execution tracking |
| J.5 | Trigger Monitoring Dashboard | 🟢 | View automation execution logs and statistics |
| J.6 | Workflow Templates | 🟢 | Pre-built workflow templates for common processes |

---

## Phase K — Offline & Sync (May–Jun 2026)

Integrate `@objectos/browser` with the Admin Console for offline-first capability.

| # | Task | Priority | Description |
|---|------|:--------:|-------------|
| K.1 | Service Worker registration | 🔴 | Cache static assets + API responses |
| K.2 | OPFS storage integration | 🔴 | SQLite WASM via @objectos/browser |
| K.3 | Mutation queue | 🔴 | Buffer writes when offline, sync on reconnect |
| K.4 | Conflict resolution UI | 🟡 | Visual diff + resolution strategy selection |
| K.5 | Sync status indicator | 🟡 | Global bar showing sync state |
| K.6 | Selective sync | 🟢 | Choose which objects to cache offline |

---

## Phase L — Polish & Performance (Jun–Jul 2026)

| # | Task | Priority | Description |
|---|------|:--------:|-------------|
| L.1 | Virtual scrolling for large datasets | 🔴 | Efficient rendering for 10k+ records |
| L.2 | Optimistic updates | ✅ | Already implemented in useRecords hooks |
| L.3 | Skeleton loading states | 🟡 | Replace spinners with content-aware skeletons |
| L.4 | Accessibility (WCAG 2.1 AA) | 🔴 | Full keyboard navigation, screen reader support |
| L.5 | Bundle optimization | 🟡 | Tree-shaking, dynamic imports, chunk analysis |
| L.6 | Responsive design audit | 🟡 | Mobile-first layouts for all business pages |
| L.7 | Dark mode support | 🟢 | Theme toggle with system preference detection |

---

## Release Timeline

### v1.0.0 — Production Release (Target: March 2026)

| Criterion | Status |
|-----------|:------:|
| All 13 plugins implemented | ✅ |
| Spec compliance 100% | ✅ |
| Admin Console operational (29 pages) | ✅ |
| Security review passed | ✅ |
| Integration test suite | ✅ |
| Performance baseline (P95 < 100ms) | ✅ |
| Docker deployment | ✅ |
| E2E smoke tests | ✅ |
| @object-ui integration (SchemaRenderer for grid/form/detail) | 🔲 Phase H |
| Business App Shell with live API data | 🔲 Phase H |

### v1.1.0 — Rich Business UI (Target: April 2026)

- Phase I: Rich Data Experience (inline editing, bulk actions, filters)
- Phase J.1-J.2: Visual Flow Editor, Approval Inbox

### v1.2.0 — Enterprise Features (Target: June 2026)

- Phase J.3-J.6: Full Workflow & Automation UI
- Phase K: Offline & Sync
- Multi-tenancy data isolation
- Rate limiting middleware
- OpenTelemetry integration

### v2.0.0 — Platform (Target: September 2026)

- Phase L: Polish & Performance
- Plugin Marketplace
- Dynamic Plugin Loading (Module Federation)
- AI Agent Framework
- Full GraphQL layer
- Analytics plugin

### Master Timeline

```
Feb 2026                                                    Sep 2026
  │                                                            │
  ├── Phase H: @object-ui Driven Development ──┐              │
  │   (SchemaRenderer, API client, navigation) │              │
  │                                             ▼              │
  │                                      v1.0.0 Release       │
  │                                             │              │
  ├── Phase I: Rich Data Experience ────────────┤              │
  ├── Phase J: Workflow & Automation UI ────────┤              │
  │                                             ▼              │
  │                                      v1.1.0 Release       │
  │                                             │              │
  ├── Phase K: Offline & Sync ──────────────────┤              │
  │                                             ▼              │
  │                                      v1.2.0 Release       │
  │                                             │              │
  ├── Phase L: Polish & Performance ────────────┤              │
  │                                             ▼              │
  │                                      v2.0.0 Release       │
  ▼                                             ▼              ▼
```

---

## Architecture: @object-ui Integration

### Three-Layer UI Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  @object-ui (npm packages — github.com/objectstack-ai/objectui) │
│  ├── @object-ui/core           → Types, validation, logic       │
│  ├── @object-ui/react          → SchemaRenderer component       │
│  ├── @object-ui/components     → Standard UI controls           │
│  ├── @object-ui/fields         → Field renderers registry       │
│  ├── @object-ui/layout         → Application shell components   │
│  └── @object-ui/data-objectstack → ObjectStack data adapter     │
└───────────────────────────────┬──────────────────────────────────┘
                                │ npm dependency
┌───────────────────────────────┴──────────────────────────────────┐
│  apps/web (Admin Console — THIS REPO)                            │
│  ├── App Shell: Auth, Navigation, Layout, Error Boundaries       │
│  ├── System Pages: Users, Roles, Plugins, Audit, Metrics         │
│  ├── Business Pages: Assembles @object-ui SchemaRenderer         │
│  │   ├── Object List: <SchemaRenderer view="grid" />             │
│  │   ├── Record Detail: <SchemaRenderer view="detail" />         │
│  │   ├── Record Form: <SchemaRenderer view="form" />             │
│  │   └── Kanban Board: <SchemaRenderer view="kanban" />          │
│  └── API Client: @objectstack/client → /api/v1/*                 │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTP / WebSocket
┌───────────────────────────────┴──────────────────────────────────┐
│  ObjectStack Hono Server (:5320)                                 │
│  ├── /api/v1/auth/*     → BetterAuth (Identity)                 │
│  ├── /api/v1/data/*     → ObjectQL (CRUD)                       │
│  ├── /api/v1/meta/*     → Metadata (Object schemas, views)      │
│  ├── /api/v1/graphql    → GraphQL endpoint                      │
│  ├── /console/*         → Static (apps/web/dist in prod)        │
│  └── /docs/*            → Static (apps/site/out in prod)        │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action → React Component → @object-ui/react SchemaRenderer
                                        ↓
                              @object-ui/data-objectstack adapter
                                        ↓
                              @objectstack/client SDK
                                        ↓
                              HTTP /api/v1/data/:object
                                        ↓
                              ObjectStack Hono → ObjectQL → Database
```

### Key Integration Points

| Integration Point | File | Description |
|---|---|---|
| Data Adapter | `apps/web/src/lib/object-ui-adapter.ts` | Bridges @object-ui with ObjectStack API |
| API Client | `apps/web/src/lib/api.ts` | @objectstack/client singleton |
| Schema Renderer | `apps/web/src/components/objectui/ObjectUIExample.tsx` | Example integration |
| Business App Page | `apps/web/src/pages/apps/app.tsx` | App landing with object cards |
| Object List | `apps/web/src/pages/apps/object-list.tsx` | Records list (to be @object-ui powered) |
| Object Record | `apps/web/src/pages/apps/object-record.tsx` | Record detail (to be @object-ui powered) |

---

## Technical Debt

| # | Area | Details | Priority |
|---|------|---------|:--------:|
| 1 | Event bus persistence | In-memory only; no DLQ or replay | 🟡 |
| 2 | Schema migrations | No version-controlled schema evolution | 🟡 |
| 3 | Rate limiting | Not implemented at HTTP layer | 🔴 |
| 4 | Input sanitization | Zod schema validation only; no HTTP-level protection | 🔴 |
| 5 | Realtime auth | WebSocket auth not enforced | 🟡 |
| 6 | Browser sync E2E | Sync protocol needs E2E testing | 🟡 |
| 7 | Plugin isolation | Plugins share process | 🟢 |
| 8 | Mock data dependency | UI relies on mock data when server is down | 🟡 |

---

## External Dependencies

| Dependency | Version | Role |
|-----------|---------|------|
| `@objectstack/runtime` | 2.0.7 | Microkernel — plugin lifecycle |
| `@objectstack/spec` | 2.0.7 | Protocol contracts |
| `@objectstack/cli` | 2.0.7 | Server bootstrap |
| `@objectstack/client` | 2.0.7 | Frontend SDK |
| `@objectstack/objectql` | 2.0.7 | ObjectQL plugin |
| `@objectstack/driver-memory` | 2.0.7 | In-memory driver |
| `@objectstack/plugin-hono-server` | 2.0.7 | Hono HTTP server |
| `@objectstack/plugin-auth` | 2.0.7 | Authentication |
| `@object-ui/core` | 2.0.0 | UI core logic |
| `@object-ui/react` | 2.0.0 | React components |
| `@object-ui/components` | 2.0.0 | Standard controls |
| `@object-ui/layout` | 2.0.0 | App shell |
| `@object-ui/fields` | 2.0.0 | Field renderers |
| `@object-ui/data-objectstack` | 2.0.0 | Data adapter |

---

## Quality Targets

| Metric | Target |
|--------|--------|
| API Response Time | P95 < 100ms |
| Test Coverage (Server) | ≥ 80% |
| Test Coverage (UI) | ≥ 70% |
| TypeScript Errors | 0 |
| Spec Compliance | 100% |
| Accessibility | WCAG 2.1 AA |

---

## Links

- **Repository**: https://github.com/objectstack-ai/objectos
- **Spec Protocol**: https://github.com/objectstack-ai/spec
- **ObjectQL**: https://github.com/objectstack-ai/objectql
- **ObjectUI**: https://github.com/objectstack-ai/objectui
- **Issues**: https://github.com/objectstack-ai/objectos/issues

---

<div align="center">
<sub>ObjectOS v6.0.0 Roadmap — @object-ui Driven Development | Built with @objectstack/spec@2.0.7</sub>
</div>
