# ObjectOS Roadmap

> **Version**: 7.0.0
> **Date**: February 12, 2026
> **Status**: Phase M — Technical Debt Resolution
> **Spec SDK**: `@objectstack/spec@2.0.7`
> **ObjectUI**: `@object-ui/*@2.0.0`

---

## Executive Summary

ObjectOS is a metadata-driven enterprise runtime platform built on the ObjectStack protocol. With all 13 server-side plugins fully implemented, spec compliance at 100%, and the Admin Console operational with 31 pages (including record create/edit), **Phases A–L are complete**. The platform now enters **Phase M — Technical Debt Resolution**, addressing 8 identified technical debt items critical for production readiness.

The integration of **@object-ui** (6 packages at v2.0.0) marks a strategic shift: the Admin Console's Business App Shell now leverages @object-ui's `SchemaRenderer` for metadata-driven UI rendering, replacing hand-built components with protocol-compliant controls.

> **Technical Debt Resolution**: Detailed technical proposals for all 8 debt items are documented in [Technical Debt Resolution Guide](docs/guide/technical-debt-resolution.md).

### What Changed

| Before (Plan v5.0) | After (Plan v7.0 — This Roadmap) |
|---|---|
| @object-ui listed as v1.1 future work | @object-ui v2.0.0 already installed and integrated |
| Hand-built DataGrid, MetadataForm, KanbanBoard | @object-ui SchemaRenderer as primary rendering engine |
| ObjectUI integration planned for April 2026 | ObjectUI integration active **now** — February 2026 |
| Business App Shell was Phase 1 "foundation" | Business App Shell upgraded to @object-ui powered |
| Custom field renderers for each type | @object-ui/fields provides field registry |
| @objectstack/* packages at v2.0.6 | @objectstack/* packages upgraded to v2.0.7 |
| Technical debt deferred | Phase M — Technical Debt Resolution with detailed proposals |

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

### Frontend — ✅ Phase I Complete

| Area | Status | Details |
|------|:------:|---------|
| Auth Pages | ✅ | 6 pages: sign-in, sign-up, forgot-password, reset-password, verify-2fa, home |
| Admin Console | ✅ | 16 pages: settings, org management, audit, jobs, metrics, plugins, etc. |
| Business App Shell | ✅ | App page, object list, object record, record create, record edit — powered by SchemaRenderer |
| @object-ui Integration | ✅ | Packages installed, adapter configured, SchemaRenderer for grid/detail/form/kanban/calendar |
| ObjectUI Components | ✅ | 18 components: DataGrid, MetadataForm, KanbanBoard, ChartWidget, ViewSwitcher, LayoutBuilder, ObjectUIExample, ObjectPage, ObjectToolbar, RelatedList, FilterPanel, InlineEditCell, BulkActionBar, SavedViewsPanel, CloneRecordDialog, CsvImportDialog, CsvExportButton, LookupAutocomplete |
| Workflow UI | ✅ | 5 components: WorkflowStatusBadge, ApprovalActions, ActivityTimeline, WorkflowVisualizer, AutomationRulesBuilder |
| Sync UI | ✅ | 2 components: OfflineIndicator, ConflictResolutionDialog |
| Data Hooks | ✅ | useRecords, useMetadata, useWorkflow, useSync, useOffline, useRecentItems, useInlineEdit, useBulkActions, useSavedViews, useLookupSearch, useCsvOperations |
| Navigation | ✅ | Dynamic sidebar from metadata, breadcrumbs, recent items tracking |
| Error Handling | ✅ | QueryErrorBoundary with retry capability |
| Rich Data Experience | ✅ | Inline editing, bulk actions, saved views, record cloning, CSV import/export, lookup autocomplete |

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
| H | @object-ui Driven Development | Feb 2026 | ✅ |
| I | Rich Data Experience | Feb 2026 | ✅ |
| J | Workflow & Automation UI | Feb 2026 | ✅ |
| K | Offline & Sync | Feb 2026 | ✅ |
| L | Polish & Performance | Feb 2026 | ✅ |
| **M** | **Technical Debt Resolution** | **Feb–Sep 2026** | **🔄 In Progress** |

### Phase G Outcomes

- ✅ All 10 core plugins adopt `@objectstack/spec/contracts` interfaces
- ✅ @objectstack/* packages upgraded to v2.0.7
- ✅ @object-ui v2.0.0 packages installed in apps/web
- ✅ ObjectStack data adapter created (`object-ui-adapter.ts`)
- ✅ SchemaRenderer integration example working
- ✅ Business App Shell pages created (app, object-list, object-record)
- ✅ TanStack Query hooks for CRUD operations with optimistic updates
- ✅ Mock data system for offline UI development

### Phase H Outcomes

- ✅ SchemaRenderer replaces hand-built views (grid, detail, form, kanban, calendar)
- ✅ Dynamic sidebar and breadcrumbs from metadata
- ✅ Server-side pagination, sorting, and filtering
- ✅ Record create/edit pages with SchemaRenderer form view
- ✅ ObjectPage, ObjectToolbar, RelatedList, FilterPanel bridge components
- ✅ QueryErrorBoundary with retry capability
- ✅ Recent items and favorites tracking

### Phase I Outcomes

- ✅ InlineEditCell for click-to-edit cells in grid view (I.1)
- ✅ BulkActionBar with delete, update field, change owner (I.2)
- ✅ SavedViewsPanel with localStorage persistence (I.3)
- ✅ Enhanced RelatedList section on record detail pages (I.4)
- ✅ CloneRecordDialog with field selection (I.5)
- ✅ CsvImportDialog with column mapping + CsvExportButton (I.6)
- ✅ LookupAutocomplete with async search (I.7)
- ✅ 5 new hooks: useInlineEdit, useBulkActions, useSavedViews, useLookupSearch, useCsvOperations

---

## Phase H — @object-ui Driven Development (Current — Feb–Mar 2026)

This phase replaces the previous "Phase 1: Foundation" from the frontend roadmap. Instead of building custom components from scratch, we now leverage @object-ui's `SchemaRenderer` as the primary rendering engine for business data views.

### H.1 — SchemaRenderer Integration for Business Pages

Replace hand-built business page views with @object-ui SchemaRenderer.

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.1.1 | Replace `RecordTable` in object-list.tsx with `SchemaRenderer view="grid"` | 🔴 | ✅ |
| H.1.2 | Replace field detail rendering in object-record.tsx with `SchemaRenderer view="detail"` | 🔴 | ✅ |
| H.1.3 | Add record creation page using `SchemaRenderer view="form"` | 🔴 | ✅ |
| H.1.4 | Add record editing using `SchemaRenderer view="form" recordId={id}` | 🔴 | ✅ |
| H.1.5 | Wire `KanbanBoard` view mode to `SchemaRenderer view="kanban"` | 🟡 | ✅ |
| H.1.6 | Implement calendar view using `SchemaRenderer view="calendar"` | 🟡 | ✅ |

### H.2 — Metadata-Driven Navigation

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.2.1 | Dynamic sidebar generated from `GET /api/v1/meta/apps` response | 🔴 | ✅ |
| H.2.2 | Object navigation within apps derived from app metadata | 🔴 | ✅ |
| H.2.3 | Breadcrumb generation from current route context | 🟡 | ✅ |
| H.2.4 | Recent items and favorites tracking | 🟢 | ✅ |

### H.3 — API Client Completion

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.3.1 | Connect useRecords hooks to live `@objectstack/client` API (remove mock fallback reliance) | 🔴 | ✅ |
| H.3.2 | Implement server-side pagination in object list view | 🔴 | ✅ |
| H.3.3 | Implement server-side sorting and filtering | 🟡 | ✅ |
| H.3.4 | Error boundary integration with TanStack Query | 🟡 | ✅ |

### H.4 — @object-ui / @objectos Bridge Components

Custom wrapper components that combine @object-ui controls with ObjectOS-specific features.

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| H.4.1 | `ObjectPage` — wraps SchemaRenderer with ObjectOS permissions check | 🔴 | ✅ |
| H.4.2 | `ObjectToolbar` — view switcher + new record button + bulk actions | 🟡 | ✅ |
| H.4.3 | `RelatedList` — displays child/lookup records on detail pages | 🟡 | ✅ |
| H.4.4 | `FilterPanel` — metadata-aware filter builder for list views | 🟡 | ✅ |

---

## Phase I — Rich Data Experience (✅ Complete — Feb 2026)

Advanced data manipulation features building on the @object-ui foundation.

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| I.1 | Inline editing in grid view | 🔴 | ✅ |
| I.2 | Bulk record actions | 🔴 | ✅ |
| I.3 | Saved filters / views | 🟡 | ✅ |
| I.4 | Related lists on record detail | 🟡 | ✅ |
| I.5 | Record cloning | 🟢 | ✅ |
| I.6 | CSV import/export | 🟡 | ✅ |
| I.7 | Lookup field autocomplete | 🔴 | ✅ |

---

## Phase J — Workflow & Automation UI (✅ Complete — Feb 2026)

Build visual interfaces for the workflow and automation engines.

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| J.1 | Visual Flow Editor | 🔴 | ✅ |
| J.2 | Approval Inbox | 🔴 | ✅ |
| J.3 | Automation Rule Builder | 🟡 | ✅ |
| J.4 | Workflow Instance Monitor | 🟡 | ✅ |
| J.5 | Trigger Monitoring Dashboard | 🟢 | ✅ |
| J.6 | Workflow Templates | 🟢 | ✅ |

---

## Phase K — Offline & Sync (✅ Complete — Feb 2026)

Integrate `@objectos/browser` with the Admin Console for offline-first capability.

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| K.1 | Service Worker registration | 🔴 | ✅ |
| K.2 | OPFS storage integration | 🔴 | ✅ |
| K.3 | Mutation queue | 🔴 | ✅ |
| K.4 | Conflict resolution UI | 🟡 | ✅ |
| K.5 | Sync status indicator | 🟡 | ✅ |
| K.6 | Selective sync | 🟢 | ✅ |

---

## Phase L — Polish & Performance (✅ Complete — Feb 2026)

| # | Task | Priority | Status |
|---|------|:--------:|:------:|
| L.1 | Virtual scrolling for large datasets | 🔴 | ✅ |
| L.2 | Optimistic updates / prefetching | ✅ | ✅ |
| L.3 | Skeleton loading states | 🟡 | ✅ |
| L.4 | Error boundary page | 🔴 | ✅ |
| L.5 | Reusable UI patterns (EmptyState, Skeletons) | 🟡 | ✅ |
| L.6 | Debounce hook | 🟡 | ✅ |
| L.7 | Dark mode support | 🟢 | ✅ |

---

## Phase M — Technical Debt Resolution (Current — Feb–Sep 2026)

> Detailed technical proposals: [Technical Debt Resolution Guide](docs/guide/technical-debt-resolution.md)

### M.1 — Critical Security (v1.0.1 — Target: March 2026)

| # | Task | TD | Priority | Status |
|---|------|:--:|:--------:|:------:|
| M.1.1 | Rate limiting middleware — sliding-window counter on `/api/v1/*` with per-IP/per-user throttling | TD-3 | 🔴 | ✅ |
| M.1.2 | Input sanitization middleware — body size limit, XSS stripping, Zod validation factory | TD-4 | 🔴 | ✅ |
| M.1.3 | WebSocket auth enforcement — token extraction from cookie/protocol header, session verification | TD-5 | 🟡 | ✅ |
| M.1.4 | Mock data tree-shaking — `DevDataProvider`, dynamic imports, `VITE_USE_MOCK_DATA` env flag | TD-8 | 🟡 | ✅ |

### M.2 — Infrastructure (v1.1.0 — Target: April 2026)

| # | Task | TD | Priority | Status |
|---|------|:--:|:--------:|:------:|
| M.2.1 | Event bus persistence — `PersistentJobStorage` backed by `@objectos/storage` | TD-1 | 🟡 | ✅ |
| M.2.2 | Dead Letter Queue + Replay API — DLQ, `replayDeadLetter()`, `purgeDeadLetters()` | TD-1 | 🟡 | ✅ |
| M.2.3 | Schema migration engine — `SchemaDiffer`, `MigrationGenerator`, `MigrationRunnerImpl` | TD-2 | 🟡 | ✅ |
| M.2.4 | `objectstack migrate` CLI — `MigrationCLI` with up/down/status commands | TD-2 | 🟡 | ✅ |
| M.2.5 | Browser sync E2E tests — 5 Playwright specs covering sync lifecycle | TD-6 | 🟡 | ✅ |

### M.3 — Platform Hardening (v2.0.0 — Target: September 2026)

| # | Task | TD | Priority | Status |
|---|------|:--:|:--------:|:------:|
| M.3.1 | Worker Thread plugin host — Level 1 isolation via `worker_threads` | TD-7 | 🟢 | ⬜ |
| M.3.2 | Child Process plugin host — Level 2 isolation via `child_process.fork()` | TD-7 | 🟢 | ⬜ |
| M.3.3 | Plugin watchdog — auto-restart with backoff, resource limit enforcement | TD-7 | 🟢 | ⬜ |

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
| @object-ui integration (SchemaRenderer for grid/form/detail) | ✅ Phase H |
| Business App Shell with live API data | ✅ Phase H |

### v1.0.1 — Security Hardening (Target: March 2026)

- Phase M.1: Critical Security ✅
  - Rate limiting middleware (TD-3) ✅
  - Input sanitization middleware (TD-4) ✅
  - WebSocket auth enforcement (TD-5) ✅
  - Mock data tree-shaking (TD-8) ✅

### v1.1.0 — Rich Business UI + Infrastructure (Target: April 2026)

- Phase I: Rich Data Experience (inline editing, bulk actions, filters)
- Phase J.1-J.2: Visual Flow Editor, Approval Inbox
- Phase M.2: Infrastructure
  - Event bus persistence + DLQ (TD-1) 🟡
  - Schema migration engine (TD-2) 🟡
  - Browser sync E2E tests (TD-6) 🟡

### v1.2.0 — Enterprise Features (Target: June 2026)

- Phase J.3-J.6: Full Workflow & Automation UI
- Phase K: Offline & Sync
- Multi-tenancy data isolation
- OpenTelemetry integration

### v2.0.0 — Platform (Target: September 2026)

- Phase L: Polish & Performance
- Phase M.3: Platform Hardening
  - Plugin isolation (Worker Threads + Child Process) (TD-7) 🟢
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
  ├── Phase M.1: Critical Security ─────────────┤              │
  │   (Rate limit, sanitize, WS auth)          │              │
  │                                      v1.0.1 Release       │
  │                                             │              │
  ├── Phase I: Rich Data Experience ────────────┤              │
  ├── Phase J: Workflow & Automation UI ────────┤              │
  ├── Phase M.2: Infrastructure ────────────────┤              │
  │   (Event bus, migrations, sync E2E)        │              │
  │                                             ▼              │
  │                                      v1.1.0 Release       │
  │                                             │              │
  ├── Phase K: Offline & Sync ──────────────────┤              │
  │                                             ▼              │
  │                                      v1.2.0 Release       │
  │                                             │              │
  ├── Phase L: Polish & Performance ────────────┤              │
  ├── Phase M.3: Platform Hardening ────────────┤              │
  │   (Plugin isolation)                       │              │
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
| Object Page | `apps/web/src/components/objectui/ObjectPage.tsx` | Bridge: SchemaRenderer + permissions |
| Object Toolbar | `apps/web/src/components/objectui/ObjectToolbar.tsx` | View switcher + actions |
| Filter Panel | `apps/web/src/components/objectui/FilterPanel.tsx` | Metadata-aware filtering |
| Related List | `apps/web/src/components/objectui/RelatedList.tsx` | Child/lookup records |
| Business App Page | `apps/web/src/pages/apps/app.tsx` | App landing with object cards |
| Object List | `apps/web/src/pages/apps/object-list.tsx` | SchemaRenderer grid/kanban/calendar |
| Object Record | `apps/web/src/pages/apps/object-record.tsx` | SchemaRenderer detail view |
| Record Create | `apps/web/src/pages/apps/record-create.tsx` | SchemaRenderer form (new) |
| Record Edit | `apps/web/src/pages/apps/record-edit.tsx` | SchemaRenderer form (edit) |
| Error Boundary | `apps/web/src/components/ui/query-error-boundary.tsx` | TanStack Query error handling |
| Recent Items | `apps/web/src/hooks/use-recent-items.ts` | Navigation history tracking |

---

## Technical Debt

> **Resolution Plan**: See [Technical Debt Resolution Guide](docs/guide/technical-debt-resolution.md) for detailed proposals.

| # | Area | Details | Priority | Phase | Status |
|---|------|---------|:--------:|:-----:|:------:|
| 1 | Event bus persistence | `PersistentJobStorage` with DLQ and replay | 🟡 | M.2 | ✅ |
| 2 | Schema migrations | `SchemaDiffer` + `MigrationRunnerImpl` + `MigrationCLI` | 🟡 | M.2 | ✅ |
| 3 | Rate limiting | Sliding-window counter on `/api/v1/*` | 🔴 | M.1 | ✅ |
| 4 | Input sanitization | Body limit + XSS strip + content-type guard + Zod validate | 🔴 | M.1 | ✅ |
| 5 | Realtime auth | WebSocket auth enforced via cookie/protocol/query token | 🟡 | M.1 | ✅ |
| 6 | Browser sync E2E | 5 Playwright E2E test specs for sync lifecycle | 🟡 | M.2 | ✅ |
| 7 | Plugin isolation | Plugins share process | 🟢 | M.3 | ⬜ |
| 8 | Mock data dependency | DevDataProvider + tree-shaking via `__mocks__/` | 🟡 | M.1 | ✅ |

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
<sub>ObjectOS v7.0.0 Roadmap — Technical Debt Resolution | Built with @objectstack/spec@2.0.7</sub>
</div>
