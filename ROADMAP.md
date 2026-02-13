# ObjectOS Roadmap

> **Version**: 15.0.0
> **Date**: February 13, 2026
> **Status**: Phase Q — Mobile UX Optimization ✅ Complete
> **Spec SDK**: `@objectstack/spec@3.0.2`
> **ObjectUI**: `@object-ui/*@2.0.0`

---

## Executive Summary

ObjectOS is a metadata-driven enterprise runtime platform built on the ObjectStack protocol. With all 19 server-side plugins fully implemented, spec compliance at 100%, and the Admin Console operational with 31 pages (including record create/edit), **Phases A–Q are complete**. The platform has completed **Phase Q — Mobile UX Optimization**, delivering responsive layouts, adaptive table columns, touch-friendly headers, and responsive typography across all 31 pages of the Admin Console.

The integration of **@object-ui** (6 packages at v2.0.0) marks a strategic shift: the Admin Console's Business App Shell now leverages @object-ui's `SchemaRenderer` for metadata-driven UI rendering, replacing hand-built components with protocol-compliant controls.

**All roadmap phases are now complete.** The platform is production-ready with comprehensive developer tooling, coverage reporting, plugin scaffolding, environment health checks, and mobile-optimized UI.

> **@objectstack/\* v3.0.1 Upgrade**: All ObjectStack SDK packages upgraded to v3.0.1 — the latest patch release of the 3.x series, bringing bug fixes and performance improvements while maintaining full protocol compatibility.

### What Changed

| Before (Plan v14.1)                          | After (Plan v15.0 — This Roadmap)                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Phase P was the last completed phase         | **Phase Q — Mobile UX Optimization** complete across all 31 Admin Console pages                  |
| Cards used fixed `px-6` padding              | Cards use responsive `px-4 sm:px-6` padding for mobile comfort                                   |
| Layout headers fixed at `h-16 px-4`          | Headers adapt to `h-14 px-3` on mobile, `h-16 px-4` on desktop                                   |
| Tables showed all columns on all screens     | Non-essential table columns hidden on mobile via `hidden sm:table-cell` / `hidden md:table-cell` |
| Page headings used fixed `text-2xl`          | Headings use responsive `text-xl sm:text-2xl` across all pages                                   |
| Header + action button rows used inline flex | Header sections stack vertically on mobile via `flex-col sm:flex-row`                            |

---

## Current State (February 2026)

### Server — ✅ Complete (19 Plugins)

| Plugin          | Package                     | Status |
| --------------- | --------------------------- | :----: |
| Audit Logging   | `@objectos/audit`           |   ✅   |
| Authentication  | `@objectstack/plugin-auth`  |   ✅   |
| Automation      | `@objectos/automation`      |   ✅   |
| Browser Runtime | `@objectos/browser`         |   ✅   |
| Cache           | `@objectos/cache`           |   ✅   |
| **GraphQL**     | **`@objectos/graphql`**     | **✅** |
| i18n            | `@objectos/i18n`            |   ✅   |
| Jobs            | `@objectos/jobs`            |   ✅   |
| Metrics         | `@objectos/metrics`         |   ✅   |
| Notification    | `@objectos/notification`    |   ✅   |
| Permissions     | `@objectos/permissions`     |   ✅   |
| Realtime        | `@objectos/realtime`        |   ✅   |
| Storage         | `@objectos/storage`         |   ✅   |
| Telemetry       | `@objectos/telemetry`       |   ✅   |
| Workflow        | `@objectos/workflow`        |   ✅   |
| **Marketplace** | **`@objectos/marketplace`** | **✅** |
| **AI Agent**    | **`@objectos/agent`**       | **✅** |
| **Analytics**   | **`@objectos/analytics`**   | **✅** |
| **Federation**  | **`@objectos/federation`**  | **✅** |

**Server Metrics**: 30,000+ source lines · 160+ TypeScript files · 70+ test files · 660+ tests

### Frontend — ✅ Phase I Complete

| Area                   | Status | Details                                                                                                                                                                                                                                                                                     |
| ---------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth Pages             |   ✅   | 6 pages: sign-in, sign-up, forgot-password, reset-password, verify-2fa, home                                                                                                                                                                                                                |
| Admin Console          |   ✅   | 16 pages: settings, org management, audit, jobs, metrics, plugins, etc.                                                                                                                                                                                                                     |
| Business App Shell     |   ✅   | App page, object list, object record, record create, record edit — powered by SchemaRenderer                                                                                                                                                                                                |
| @object-ui Integration |   ✅   | Packages installed, adapter configured, SchemaRenderer for grid/detail/form/kanban/calendar                                                                                                                                                                                                 |
| ObjectUI Components    |   ✅   | 18 components: DataGrid, MetadataForm, KanbanBoard, ChartWidget, ViewSwitcher, LayoutBuilder, ObjectUIExample, ObjectPage, ObjectToolbar, RelatedList, FilterPanel, InlineEditCell, BulkActionBar, SavedViewsPanel, CloneRecordDialog, CsvImportDialog, CsvExportButton, LookupAutocomplete |
| Workflow UI            |   ✅   | 5 components: WorkflowStatusBadge, ApprovalActions, ActivityTimeline, WorkflowVisualizer, AutomationRulesBuilder                                                                                                                                                                            |
| Sync UI                |   ✅   | 2 components: OfflineIndicator, ConflictResolutionDialog                                                                                                                                                                                                                                    |
| Data Hooks             |   ✅   | useRecords, useMetadata, useWorkflow, useSync, useOffline, useRecentItems, useInlineEdit, useBulkActions, useSavedViews, useLookupSearch, useCsvOperations                                                                                                                                  |
| Navigation             |   ✅   | Dynamic sidebar from metadata, breadcrumbs, recent items tracking                                                                                                                                                                                                                           |
| Error Handling         |   ✅   | QueryErrorBoundary with retry capability                                                                                                                                                                                                                                                    |
| Rich Data Experience   |   ✅   | Inline editing, bulk actions, saved views, record cloning, CSV import/export, lookup autocomplete                                                                                                                                                                                           |

### @object-ui Packages Installed

| Package                       | Version | Role                                  |
| ----------------------------- | ------- | ------------------------------------- |
| `@object-ui/core`             | 2.0.0   | Core logic, types, validation         |
| `@object-ui/react`            | 2.0.0   | React bindings, SchemaRenderer        |
| `@object-ui/components`       | 2.0.0   | Standard UI components (Shadcn-based) |
| `@object-ui/layout`           | 2.0.0   | Application shell components          |
| `@object-ui/fields`           | 2.0.0   | Field renderers and registry          |
| `@object-ui/data-objectstack` | 2.0.0   | ObjectStack data adapter              |

---

## Completed Phases

| Phase | Focus                                                  |     Timeline     |     Status      |
| :---: | ------------------------------------------------------ | :--------------: | :-------------: |
|   A   | Kernel Compliance Baseline                             |     Oct 2025     |       ✅        |
|   B   | Security & Audit Parity                                |     Nov 2025     |       ✅        |
|   C   | Workflow & Automation Spec Execution                   |     Nov 2025     |       ✅        |
|   D   | Realtime Protocol Compliance                           |     Dec 2025     |       ✅        |
|   E   | Operational Readiness                                  |     Dec 2025     |       ✅        |
|   F   | Release Candidate (Security, Performance, Docker, E2E) |     Jan 2026     |       ✅        |
|   G   | Spec Protocol Alignment + Admin Console                |     Feb 2026     |       ✅        |
|   H   | @object-ui Driven Development                          |     Feb 2026     |       ✅        |
|   I   | Rich Data Experience                                   |     Feb 2026     |       ✅        |
|   J   | Workflow & Automation UI                               |     Feb 2026     |       ✅        |
|   K   | Offline & Sync                                         |     Feb 2026     |       ✅        |
|   L   | Polish & Performance                                   |     Feb 2026     |       ✅        |
| **M** | **Technical Debt Resolution**                          | **Feb–Sep 2026** | **✅ Complete** |
| **N** | **Enterprise Features**                                |   **Feb 2026**   | **✅ Complete** |
| **O** | **Platform Expansion**                                 |   **Feb 2026**   | **✅ Complete** |
| **P** | **Developer Experience**                               | **Feb–Apr 2026** | **✅ Complete** |
| **Q** | **Mobile UX Optimization**                             |   **Feb 2026**   | **✅ Complete** |

### Phase G Outcomes

- ✅ All 10 core plugins adopt `@objectstack/spec/contracts` interfaces
- ✅ @objectstack/\* packages upgraded to v3.0.0
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

| #     | Task                                                                                    | Priority | Status |
| ----- | --------------------------------------------------------------------------------------- | :------: | :----: |
| H.1.1 | Replace `RecordTable` in object-list.tsx with `SchemaRenderer view="grid"`              |    🔴    |   ✅   |
| H.1.2 | Replace field detail rendering in object-record.tsx with `SchemaRenderer view="detail"` |    🔴    |   ✅   |
| H.1.3 | Add record creation page using `SchemaRenderer view="form"`                             |    🔴    |   ✅   |
| H.1.4 | Add record editing using `SchemaRenderer view="form" recordId={id}`                     |    🔴    |   ✅   |
| H.1.5 | Wire `KanbanBoard` view mode to `SchemaRenderer view="kanban"`                          |    🟡    |   ✅   |
| H.1.6 | Implement calendar view using `SchemaRenderer view="calendar"`                          |    🟡    |   ✅   |

### H.2 — Metadata-Driven Navigation

| #     | Task                                                            | Priority | Status |
| ----- | --------------------------------------------------------------- | :------: | :----: |
| H.2.1 | Dynamic sidebar generated from `GET /api/v1/meta/apps` response |    🔴    |   ✅   |
| H.2.2 | Object navigation within apps derived from app metadata         |    🔴    |   ✅   |
| H.2.3 | Breadcrumb generation from current route context                |    🟡    |   ✅   |
| H.2.4 | Recent items and favorites tracking                             |    🟢    |   ✅   |

### H.3 — API Client Completion

| #     | Task                                                                                       | Priority | Status |
| ----- | ------------------------------------------------------------------------------------------ | :------: | :----: |
| H.3.1 | Connect useRecords hooks to live `@objectstack/client` API (remove mock fallback reliance) |    🔴    |   ✅   |
| H.3.2 | Implement server-side pagination in object list view                                       |    🔴    |   ✅   |
| H.3.3 | Implement server-side sorting and filtering                                                |    🟡    |   ✅   |
| H.3.4 | Error boundary integration with TanStack Query                                             |    🟡    |   ✅   |

### H.4 — @object-ui / @objectos Bridge Components

Custom wrapper components that combine @object-ui controls with ObjectOS-specific features.

| #     | Task                                                                | Priority | Status |
| ----- | ------------------------------------------------------------------- | :------: | :----: |
| H.4.1 | `ObjectPage` — wraps SchemaRenderer with ObjectOS permissions check |    🔴    |   ✅   |
| H.4.2 | `ObjectToolbar` — view switcher + new record button + bulk actions  |    🟡    |   ✅   |
| H.4.3 | `RelatedList` — displays child/lookup records on detail pages       |    🟡    |   ✅   |
| H.4.4 | `FilterPanel` — metadata-aware filter builder for list views        |    🟡    |   ✅   |

---

## Phase I — Rich Data Experience (✅ Complete — Feb 2026)

Advanced data manipulation features building on the @object-ui foundation.

| #   | Task                           | Priority | Status |
| --- | ------------------------------ | :------: | :----: |
| I.1 | Inline editing in grid view    |    🔴    |   ✅   |
| I.2 | Bulk record actions            |    🔴    |   ✅   |
| I.3 | Saved filters / views          |    🟡    |   ✅   |
| I.4 | Related lists on record detail |    🟡    |   ✅   |
| I.5 | Record cloning                 |    🟢    |   ✅   |
| I.6 | CSV import/export              |    🟡    |   ✅   |
| I.7 | Lookup field autocomplete      |    🔴    |   ✅   |

---

## Phase J — Workflow & Automation UI (✅ Complete — Feb 2026)

Build visual interfaces for the workflow and automation engines.

| #   | Task                         | Priority | Status |
| --- | ---------------------------- | :------: | :----: |
| J.1 | Visual Flow Editor           |    🔴    |   ✅   |
| J.2 | Approval Inbox               |    🔴    |   ✅   |
| J.3 | Automation Rule Builder      |    🟡    |   ✅   |
| J.4 | Workflow Instance Monitor    |    🟡    |   ✅   |
| J.5 | Trigger Monitoring Dashboard |    🟢    |   ✅   |
| J.6 | Workflow Templates           |    🟢    |   ✅   |

---

## Phase K — Offline & Sync (✅ Complete — Feb 2026)

Integrate `@objectos/browser` with the Admin Console for offline-first capability.

| #   | Task                        | Priority | Status |
| --- | --------------------------- | :------: | :----: |
| K.1 | Service Worker registration |    🔴    |   ✅   |
| K.2 | OPFS storage integration    |    🔴    |   ✅   |
| K.3 | Mutation queue              |    🔴    |   ✅   |
| K.4 | Conflict resolution UI      |    🟡    |   ✅   |
| K.5 | Sync status indicator       |    🟡    |   ✅   |
| K.6 | Selective sync              |    🟢    |   ✅   |

---

## Phase L — Polish & Performance (✅ Complete — Feb 2026)

| #   | Task                                         | Priority | Status |
| --- | -------------------------------------------- | :------: | :----: |
| L.1 | Virtual scrolling for large datasets         |    🔴    |   ✅   |
| L.2 | Optimistic updates / prefetching             |    ✅    |   ✅   |
| L.3 | Skeleton loading states                      |    🟡    |   ✅   |
| L.4 | Error boundary page                          |    🔴    |   ✅   |
| L.5 | Reusable UI patterns (EmptyState, Skeletons) |    🟡    |   ✅   |
| L.6 | Debounce hook                                |    🟡    |   ✅   |
| L.7 | Dark mode support                            |    🟢    |   ✅   |

---

## Phase M — Technical Debt Resolution (Current — Feb–Sep 2026)

> Detailed technical proposals: [Technical Debt Resolution Guide](docs/guide/technical-debt-resolution.md)

### M.1 — Critical Security (v1.0.1 — Target: March 2026)

| #     | Task                                                                                             |  TD  | Priority | Status |
| ----- | ------------------------------------------------------------------------------------------------ | :--: | :------: | :----: |
| M.1.1 | Rate limiting middleware — sliding-window counter on `/api/v1/*` with per-IP/per-user throttling | TD-3 |    🔴    |   ✅   |
| M.1.2 | Input sanitization middleware — body size limit, XSS stripping, Zod validation factory           | TD-4 |    🔴    |   ✅   |
| M.1.3 | WebSocket auth enforcement — token extraction from cookie/protocol header, session verification  | TD-5 |    🟡    |   ✅   |
| M.1.4 | Mock data tree-shaking — `DevDataProvider`, dynamic imports, `VITE_USE_MOCK_DATA` env flag       | TD-8 |    🟡    |   ✅   |

### M.2 — Infrastructure (v1.1.0 — Target: April 2026)

| #     | Task                                                                                  |  TD  | Priority | Status |
| ----- | ------------------------------------------------------------------------------------- | :--: | :------: | :----: |
| M.2.1 | Event bus persistence — `PersistentJobStorage` backed by `@objectos/storage`          | TD-1 |    🟡    |   ✅   |
| M.2.2 | Dead Letter Queue + Replay API — DLQ, `replayDeadLetter()`, `purgeDeadLetters()`      | TD-1 |    🟡    |   ✅   |
| M.2.3 | Schema migration engine — `SchemaDiffer`, `MigrationGenerator`, `MigrationRunnerImpl` | TD-2 |    🟡    |   ✅   |
| M.2.4 | `objectstack migrate` CLI — `MigrationCLI` with up/down/status commands               | TD-2 |    🟡    |   ✅   |
| M.2.5 | Browser sync E2E tests — 5 Playwright specs covering sync lifecycle                   | TD-6 |    🟡    |   ✅   |

### M.3 — Platform Hardening (v2.0.0 — Target: September 2026)

| #     | Task                                                                     |  TD  | Priority | Status |
| ----- | ------------------------------------------------------------------------ | :--: | :------: | :----: |
| M.3.1 | Worker Thread plugin host — Level 1 isolation via `worker_threads`       | TD-7 |    🟢    |   ✅   |
| M.3.2 | Child Process plugin host — Level 2 isolation via `child_process.fork()` | TD-7 |    🟢    |   ✅   |
| M.3.3 | Plugin watchdog — auto-restart with backoff, resource limit enforcement  | TD-7 |    🟢    |   ✅   |

---

## Phase N — Enterprise Features (✅ Complete — Feb 2026)

Enterprise-grade capabilities for production multi-tenant deployments and observability.

### N.1 — OpenTelemetry Integration (`@objectos/telemetry`)

New plugin providing OpenTelemetry-compatible distributed tracing.

| #     | Task                                                          | Priority | Status |
| ----- | ------------------------------------------------------------- | :------: | :----: |
| N.1.1 | TelemetryPlugin with span management and buffered export      |    🔴    |   ✅   |
| N.1.2 | W3C Trace Context propagation (traceparent / tracestate)      |    🔴    |   ✅   |
| N.1.3 | Automatic HTTP request instrumentation (Hono middleware)      |    🔴    |   ✅   |
| N.1.4 | Data operation span creation (CRUD hooks)                     |    🟡    |   ✅   |
| N.1.5 | Plugin lifecycle tracing (load/enable hooks)                  |    🟡    |   ✅   |
| N.1.6 | OTLP HTTP exporter (Jaeger, Zipkin, Grafana Tempo compatible) |    🔴    |   ✅   |
| N.1.7 | Console exporter for development                              |    🟢    |   ✅   |
| N.1.8 | Probabilistic sampling with configurable rate                 |    🟡    |   ✅   |
| N.1.9 | Telemetry stats API (`/api/v1/telemetry/stats`)               |    🟢    |   ✅   |

### N.2 — Multi-tenancy Data Isolation

Extend permissions system with organization-scoped data access control.

| #     | Task                                                                | Priority | Status |
| ----- | ------------------------------------------------------------------- | :------: | :----: |
| N.2.1 | Add `organizationId` to `PermissionContext`                         |    🔴    |   ✅   |
| N.2.2 | Add `TenantContext` type for middleware integration                 |    🔴    |   ✅   |
| N.2.3 | Automatic tenant field stamping on write operations (create/update) |    🔴    |   ✅   |
| N.2.4 | Automatic tenant filter on read operations (find/delete)            |    🔴    |   ✅   |
| N.2.5 | Configurable tenant field name (`tenantIsolation`, `tenantField`)   |    🟡    |   ✅   |
| N.2.6 | Metadata fallback for `organizationId` extraction                   |    🟡    |   ✅   |
| N.2.7 | 12 tenant isolation tests (write, read, custom field, disabled)     |    🟡    |   ✅   |

### N.3 — @objectstack/\* v3.0.0 Upgrade

| #     | Task                                                        | Priority | Status |
| ----- | ----------------------------------------------------------- | :------: | :----: |
| N.3.1 | Upgrade all @objectstack/\* packages from v2.0.7 to v3.0.0  |    🔴    |   ✅   |
| N.3.2 | Update pnpm-lock.yaml with new dependency tree              |    🔴    |   ✅   |
| N.3.3 | Verify build and test compatibility with v3.0.0             |    🔴    |   ✅   |
| N.3.4 | Update documentation references (ROADMAP, DEVELOPMENT_PLAN) |    🟡    |   ✅   |

---

## Phase O — Platform Expansion (✅ Complete — Feb 2026)

Building towards the v2.0.0 platform release with extensibility, AI, and advanced query capabilities.

### O.1 — Full GraphQL Layer

Complete GraphQL API alongside existing REST endpoints.

| #     | Task                                                | Priority | Status |
| ----- | --------------------------------------------------- | :------: | :----: |
| O.1.1 | GraphQL schema generation from ObjectStack metadata |    🔴    |   ✅   |
| O.1.2 | Query resolvers with permission enforcement         |    🔴    |   ✅   |
| O.1.3 | Mutation resolvers with audit logging               |    🔴    |   ✅   |
| O.1.4 | Subscription support via WebSocket                  |    🟡    |   ✅   |
| O.1.5 | DataLoader pattern for N+1 prevention               |    🟡    |   ✅   |
| O.1.6 | GraphQL Playground / Explorer integration           |    🟢    |   ✅   |

### O.2 — Plugin Marketplace

Enable discovery, installation, and management of community plugins.

| #     | Task                                                 | Priority | Status |
| ----- | ---------------------------------------------------- | :------: | :----: |
| O.2.1 | Plugin registry API (`/api/v1/plugins/registry`)     |    🔴    |   ✅   |
| O.2.2 | Plugin manifest validation and dependency resolution |    🔴    |   ✅   |
| O.2.3 | Dynamic plugin installation from registry            |    🟡    |   ✅   |
| O.2.4 | Plugin versioning and upgrade paths                  |    🟡    |   ✅   |
| O.2.5 | Admin Console marketplace UI page                    |    🟡    |   ✅   |
| O.2.6 | Plugin sandboxing and security review                |    🟢    |   ✅   |

### O.3 — AI Agent Framework

Integrate LLM-powered agents into the ObjectOS kernel.

| #     | Task                                                           | Priority | Status |
| ----- | -------------------------------------------------------------- | :------: | :----: |
| O.3.1 | Agent plugin interface and lifecycle hooks                     |    🔴    |   ✅   |
| O.3.2 | Tool registry for agent actions (CRUD, workflow, notification) |    🔴    |   ✅   |
| O.3.3 | Conversation context with tenant isolation                     |    🟡    |   ✅   |
| O.3.4 | Agent orchestration (multi-step reasoning)                     |    🟡    |   ✅   |
| O.3.5 | Admin Console AI assistant page                                |    🟢    |   ✅   |
| O.3.6 | Agent audit logging and cost tracking                          |    🟢    |   ✅   |

### O.4 — Analytics Plugin

Metadata-driven analytics and reporting engine.

| #     | Task                                       | Priority | Status |
| ----- | ------------------------------------------ | :------: | :----: |
| O.4.1 | Analytics plugin with aggregation pipeline |    🔴    |   ✅   |
| O.4.2 | Report definition format (YAML/JSON)       |    🟡    |   ✅   |
| O.4.3 | Dashboard widget system                    |    🟡    |   ✅   |
| O.4.4 | Scheduled report generation via Jobs       |    🟢    |   ✅   |
| O.4.5 | Admin Console analytics dashboard page     |    🟢    |   ✅   |

### O.5 — Dynamic Plugin Loading (Module Federation)

| #     | Task                                 | Priority | Status |
| ----- | ------------------------------------ | :------: | :----: |
| O.5.1 | Module Federation host configuration |    🔴    |   ✅   |
| O.5.2 | Remote plugin loading at runtime     |    🔴    |   ✅   |
| O.5.3 | Shared dependency management         |    🟡    |   ✅   |
| O.5.4 | Hot-reload support for development   |    🟢    |   ✅   |

---

## Phase P — Developer Experience (Current — Feb–Apr 2026)

> Improving onboarding, documentation quality, package consistency, and code quality infrastructure to provide the best developer experience for contributors and adopters.

### DX Audit Findings (February 2026)

A comprehensive scan of the entire codebase identified the following improvement areas:

| Area          | Finding                                                                                                  | Severity |                             Status                              |
| ------------- | -------------------------------------------------------------------------------------------------------- | :------: | :-------------------------------------------------------------: |
| Documentation | CONTRIBUTING.md referenced non-existent packages (`kernel`, `server`, `presets`) and wrong prerequisites |    🔴    |                            ✅ Fixed                             |
| Documentation | 8 of 20 packages missing README.md files                                                                 |    🔴    |                            ✅ Fixed                             |
| Documentation | No quickstart guide or troubleshooting guide in docs/                                                    |    🟡    |                            ✅ Fixed                             |
| Tooling       | No ESLint or Prettier configuration across the monorepo                                                  |    🔴    |                            ✅ Fixed                             |
| Tooling       | No `.editorconfig` for consistent formatting                                                             |    🟡    |                            ✅ Fixed                             |
| Tooling       | No pre-commit hooks (Husky/lint-staged)                                                                  |    🟡    |                            ✅ Fixed                             |
| Consistency   | Mixed test frameworks — 16 packages use Jest, 4 use Vitest                                               |    🟡    | ⬜ P.3 (ADR-001: Vitest selected, migration tracked separately) |
| Consistency   | Only 1 package has `clean`/`type-check` scripts; others missing                                          |    🟡    |                            ✅ Fixed                             |
| Consistency   | No package has a `lint` script defined                                                                   |    🟡    |                            ✅ Fixed                             |

### P.1 — Documentation Accuracy (v2.1.0 — Target: February 2026)

| #     | Task                                                                                                                  | Priority | Status |
| ----- | --------------------------------------------------------------------------------------------------------------------- | :------: | :----: |
| P.1.1 | Update CONTRIBUTING.md — fix project structure, prerequisites (Node 20+, pnpm 10+), and development commands          |    🔴    |   ✅   |
| P.1.2 | Add README.md to all 8 missing packages (agent, analytics, federation, graphql, marketplace, realtime, telemetry, ui) |    🔴    |   ✅   |
| P.1.3 | Update ROADMAP.md — add Phase P, refresh version and timeline                                                         |    🔴    |   ✅   |
| P.1.4 | Add quickstart guide to docs/ for first-time contributors                                                             |    🟡    |   ✅   |
| P.1.5 | Add troubleshooting guide to docs/ for common development issues                                                      |    🟡    |   ✅   |
| P.1.6 | Add API reference guide to docs/ with endpoint documentation                                                          |    🟢    |   ✅   |

### P.2 — Code Quality Tooling (v2.2.0 — Target: March 2026)

| #     | Task                                                        | Priority | Status |
| ----- | ----------------------------------------------------------- | :------: | :----: |
| P.2.1 | Add root ESLint configuration with TypeScript support       |    🔴    |   ✅   |
| P.2.2 | Add root Prettier configuration for consistent formatting   |    🔴    |   ✅   |
| P.2.3 | Add `.editorconfig` for editor-agnostic formatting defaults |    🟡    |   ✅   |
| P.2.4 | Add `lint` script to all package.json files                 |    🟡    |   ✅   |
| P.2.5 | Add Husky + lint-staged for pre-commit checks               |    🟡    |   ✅   |
| P.2.6 | Add `type-check` and `clean` scripts to all packages        |    🟢    |   ✅   |

### P.3 — Test Infrastructure Standardization (v2.3.0 — Target: March 2026)

| #     | Task                                                              | Priority | Status |
| ----- | ----------------------------------------------------------------- | :------: | :----: |
| P.3.1 | Evaluate test framework unification (Jest vs Vitest) — choose one |    🟡    |   ✅   |
| P.3.2 | Add coverage reporting with minimum thresholds per package        |    🟡    |   ✅   |
| P.3.3 | Add test coverage aggregation to CI pipeline                      |    🟢    |   ✅   |
| P.3.4 | Add snapshot testing guidelines to CONTRIBUTING.md                |    🟢    |   ✅   |

### P.4 — Developer Onboarding (v2.4.0 — Target: April 2026)

| #     | Task                                                                               | Priority | Status |
| ----- | ---------------------------------------------------------------------------------- | :------: | :----: |
| P.4.1 | Create `DEVELOPMENT.md` with step-by-step local setup guide                        |    🟡    |   ✅   |
| P.4.2 | Add `pnpm create:plugin` template with README, test scaffold, and CI config        |    🟡    |   ✅   |
| P.4.3 | Add interactive `objectstack doctor` checks for common environment issues          |    🟢    |   ✅   |
| P.4.4 | Create architecture decision records (ADR) directory for key decisions             |    🟢    |   ✅   |
| P.4.5 | Add GitHub issue templates for bug reports, feature requests, and plugin proposals |    🟢    |   ✅   |

---

## Phase Q — Mobile UX Optimization (v3.0.0 — February 2026) ✅

> **Goal**: Evaluate every page and component in the Admin Console, optimize mobile user experience with responsive layouts, adaptive tables, and touch-friendly interactions.

### Q.1 — Shared Component Optimization

| #     | Task                                                                  | Priority | Status |
| ----- | --------------------------------------------------------------------- | :------: | :----: |
| Q.1.1 | Card component: responsive padding (`px-4 sm:px-6`) for all sub-parts |    🔴    |   ✅   |
| Q.1.2 | SettingsLayout: compact mobile header (`h-14 px-3 sm:h-16 sm:px-4`)   |    🔴    |   ✅   |
| Q.1.3 | AppLayout: compact mobile header with truncated breadcrumbs           |    🔴    |   ✅   |
| Q.1.4 | SettingsLayout: hide ObjectOS label on mobile (`hidden sm:inline`)    |    🟡    |   ✅   |

### Q.2 — Page-Level Responsive Typography

| #     | Task                                                                           | Priority | Status |
| ----- | ------------------------------------------------------------------------------ | :------: | :----: |
| Q.2.1 | All settings page headings: `text-xl sm:text-2xl` (16 pages)                   |    🔴    |   ✅   |
| Q.2.2 | Home page: responsive hero text (`text-3xl sm:text-5xl`, `text-lg sm:text-xl`) |    🟡    |   ✅   |
| Q.2.3 | Business app page headings: `text-xl sm:text-2xl` (5 pages)                    |    🟡    |   ✅   |
| Q.2.4 | Organization page headings: `text-xl sm:text-2xl` (5 pages)                    |    🟡    |   ✅   |
| Q.2.5 | ObjectUI demo heading: `text-xl sm:text-3xl`                                   |    🟢    |   ✅   |

### Q.3 — Responsive Table Columns

| #     | Task                                                                           | Priority | Status |
| ----- | ------------------------------------------------------------------------------ | :------: | :----: |
| Q.3.1 | Members table: hide "Joined" column on mobile (`hidden sm:table-cell`)         |    🔴    |   ✅   |
| Q.3.2 | Audit table: hide Record ID / User / Changes columns progressively             |    🔴    |   ✅   |
| Q.3.3 | Jobs table: hide Priority / Created / Retries columns on mobile                |    🟡    |   ✅   |
| Q.3.4 | Invitations tables: hide Expires / Sent columns on mobile                      |    🟡    |   ✅   |
| Q.3.5 | Metrics tables: hide Labels / Description columns; histogram hide P50/P99/Max  |    🟡    |   ✅   |
| Q.3.6 | Permissions table: hide Label / Description / Type / Objects columns on mobile |    🟡    |   ✅   |
| Q.3.7 | Plugins table: hide Version / Uptime / Services / Security columns on mobile   |    🟡    |   ✅   |
| Q.3.8 | Security sessions table: hide IP Address / Created columns on mobile           |    🟡    |   ✅   |
| Q.3.9 | Notifications table: hide Configuration column on mobile                       |    🟢    |   ✅   |

### Q.4 — Responsive Header + Action Layouts

| #     | Task                                                                          | Priority | Status |
| ----- | ----------------------------------------------------------------------------- | :------: | :----: |
| Q.4.1 | Members page: header + Invite button stack on mobile (`flex-col sm:flex-row`) |    🔴    |   ✅   |
| Q.4.2 | Teams page: header + Create Team button stack on mobile                       |    🟡    |   ✅   |
| Q.4.3 | Jobs card header: title + filter dropdown stack on mobile                     |    🟡    |   ✅   |
| Q.4.4 | Object list toolbar: stack on mobile                                          |    🟡    |   ✅   |
| Q.4.5 | Object record: title + action buttons stack on mobile                         |    🟡    |   ✅   |
| Q.4.6 | Stats card grids: `sm:grid-cols-2 md:grid-cols-4` (Jobs, Notifications)       |    🟢    |   ✅   |

### Q.5 — Mobile-Specific Enhancements

| #     | Task                                                                       | Priority | Status |
| ----- | -------------------------------------------------------------------------- | :------: | :----: |
| Q.5.1 | Members invite button: short label on mobile (`Invite` vs `Invite Member`) |    🟢    |   ✅   |
| Q.5.2 | Content area padding: `p-3 sm:p-4` in both layouts                         |    🟡    |   ✅   |

---

## Release Timeline

### v1.0.0 — Production Release (Target: March 2026)

| Criterion                                                    |   Status   |
| ------------------------------------------------------------ | :--------: |
| All 14 plugins implemented                                   |     ✅     |
| Spec compliance 100%                                         |     ✅     |
| Admin Console operational (31 pages)                         |     ✅     |
| Security review passed                                       |     ✅     |
| Integration test suite                                       |     ✅     |
| Performance baseline (P95 < 100ms)                           |     ✅     |
| Docker deployment                                            |     ✅     |
| E2E smoke tests                                              |     ✅     |
| @object-ui integration (SchemaRenderer for grid/form/detail) | ✅ Phase H |
| Business App Shell with live API data                        | ✅ Phase H |

### v1.0.1 — Security Hardening (Target: March 2026)

- Phase M.1: Critical Security ✅
  - Rate limiting middleware (TD-3) ✅
  - Input sanitization middleware (TD-4) ✅
  - WebSocket auth enforcement (TD-5) ✅
  - Mock data tree-shaking (TD-8) ✅

### v1.1.0 — Rich Business UI + Infrastructure (Target: April 2026)

- Phase I: Rich Data Experience (inline editing, bulk actions, filters) ✅
- Phase J.1-J.2: Visual Flow Editor, Approval Inbox ✅
- Phase M.2: Infrastructure ✅
  - Event bus persistence + DLQ (TD-1) ✅
  - Schema migration engine (TD-2) ✅
  - Browser sync E2E tests (TD-6) ✅

### v1.2.0 — Enterprise Features (Target: June 2026)

- Phase J.3-J.6: Full Workflow & Automation UI ✅
- Phase K: Offline & Sync ✅
- Multi-tenancy data isolation ✅ Phase N.2
- OpenTelemetry integration ✅ Phase N.1

### v2.0.0 — Platform (Target: September 2026)

- Phase L: Polish & Performance ✅
- Phase M.3: Platform Hardening ✅
  - Plugin isolation (Worker Threads + Child Process) (TD-7) ✅
- @objectstack/\* v3.0.0 upgrade ✅ Phase N.3
- Phase O.1: Full GraphQL layer
- Phase O.2: Plugin Marketplace
- Phase O.3: AI Agent Framework
- Phase O.4: Analytics plugin
- Phase O.5: Dynamic Plugin Loading (Module Federation)

### v2.1.0 — Developer Experience: Documentation (Target: February 2026)

- Phase P.1: Documentation Accuracy
  - Updated CONTRIBUTING.md with correct structure and commands ✅
  - README.md added to all 20 packages ✅
  - Updated ROADMAP.md with Phase P ✅
  - Quickstart guide added to docs/ ✅
  - Troubleshooting guide added to docs/ ✅
  - API reference guide added to docs/ ✅

### v2.2.0 — Developer Experience: Tooling (Target: March 2026)

- Phase P.2: Code Quality Tooling
  - ESLint flat config (`eslint.config.mjs`) with TypeScript + Prettier ✅
  - Prettier config (`.prettierrc`) + `.prettierignore` ✅
  - `.editorconfig` for editor-agnostic defaults ✅
  - Pre-commit hooks (Husky + lint-staged) ✅
  - `lint`, `clean`, `type-check` scripts added to all 20 packages ✅

### v2.3.0 — Developer Experience: Testing (Target: March 2026)

- Phase P.3: Test Infrastructure Standardization
  - Framework unification decision: Vitest selected (ADR-001) ✅
  - Coverage reporting and CI integration ✅

### v2.4.0 — Developer Experience: Onboarding (Target: April 2026)

- Phase P.4: Developer Onboarding
  - DEVELOPMENT.md step-by-step local setup guide ✅
  - Plugin creation template improvements ✅
  - ADR directory with ADR-001 (Vitest standardization) ✅
  - GitHub issue templates (bug report, feature request, plugin proposal) ✅

### v3.0.0 — Mobile UX Optimization (Target: February 2026)

- Phase Q: Mobile UX Optimization
  - Shared component responsive padding (Card, Layouts) ✅
  - Responsive typography across all 31 pages ✅
  - Adaptive table columns — hide non-essential columns on mobile ✅
  - Header + action button stacking on mobile ✅
  - Compact mobile headers and content padding ✅

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
  ├── Phase N: Enterprise Features ─────────────┤              │
  │   (Telemetry, Multi-tenancy, SDK v3.0.0)   │              │
  │                                             ▼              │
  │                                      v1.2.0 Release       │
  │                                             │              │
  ├── Phase L: Polish & Performance ────────────┤              │
  ├── Phase M.3: Platform Hardening ────────────┤              │
  │   (Plugin isolation)                       │              │
  ├── Phase O: Platform Expansion ──────────────┤              │
  │   (GraphQL, Marketplace, AI, Analytics)    │              │
  │                                             ▼              │
  │                                      v2.0.0 Release       │
  │                                             │              │
  ├── Phase P: Developer Experience ────────────┤              │
  │   P.1 Docs accuracy (README, CONTRIBUTING) │              │
  │   P.2 Code quality (ESLint, Prettier)      │              │
  │   P.3 Test standardization                 │              │
  │   P.4 Onboarding (guides, templates, ADR)  │              │
  │                                      v2.1–2.4 Releases    │
  │                                             │              │
  ├── Phase Q: Mobile UX Optimization ─────────┤              │
  │   Q.1 Shared component responsive padding  │              │
  │   Q.2 Responsive typography (31 pages)     │              │
  │   Q.3 Adaptive table columns               │              │
  │   Q.4 Header + action stacking             │              │
  │   Q.5 Mobile-specific enhancements         │              │
  │                                      v3.0.0 Release       │
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

| Integration Point | File                                                   | Description                             |
| ----------------- | ------------------------------------------------------ | --------------------------------------- |
| Data Adapter      | `apps/web/src/lib/object-ui-adapter.ts`                | Bridges @object-ui with ObjectStack API |
| API Client        | `apps/web/src/lib/api.ts`                              | @objectstack/client singleton           |
| Schema Renderer   | `apps/web/src/components/objectui/ObjectUIExample.tsx` | Example integration                     |
| Object Page       | `apps/web/src/components/objectui/ObjectPage.tsx`      | Bridge: SchemaRenderer + permissions    |
| Object Toolbar    | `apps/web/src/components/objectui/ObjectToolbar.tsx`   | View switcher + actions                 |
| Filter Panel      | `apps/web/src/components/objectui/FilterPanel.tsx`     | Metadata-aware filtering                |
| Related List      | `apps/web/src/components/objectui/RelatedList.tsx`     | Child/lookup records                    |
| Business App Page | `apps/web/src/pages/apps/app.tsx`                      | App landing with object cards           |
| Object List       | `apps/web/src/pages/apps/object-list.tsx`              | SchemaRenderer grid/kanban/calendar     |
| Object Record     | `apps/web/src/pages/apps/object-record.tsx`            | SchemaRenderer detail view              |
| Record Create     | `apps/web/src/pages/apps/record-create.tsx`            | SchemaRenderer form (new)               |
| Record Edit       | `apps/web/src/pages/apps/record-edit.tsx`              | SchemaRenderer form (edit)              |
| Error Boundary    | `apps/web/src/components/ui/query-error-boundary.tsx`  | TanStack Query error handling           |
| Recent Items      | `apps/web/src/hooks/use-recent-items.ts`               | Navigation history tracking             |

---

## Technical Debt

> **Resolution Plan**: See [Technical Debt Resolution Guide](docs/guide/technical-debt-resolution.md) for detailed proposals.

| #   | Area                  | Details                                                              | Priority | Phase | Status |
| --- | --------------------- | -------------------------------------------------------------------- | :------: | :---: | :----: |
| 1   | Event bus persistence | `PersistentJobStorage` with DLQ and replay                           |    🟡    |  M.2  |   ✅   |
| 2   | Schema migrations     | `SchemaDiffer` + `MigrationRunnerImpl` + `MigrationCLI`              |    🟡    |  M.2  |   ✅   |
| 3   | Rate limiting         | Sliding-window counter on `/api/v1/*`                                |    🔴    |  M.1  |   ✅   |
| 4   | Input sanitization    | Body limit + XSS strip + content-type guard + Zod validate           |    🔴    |  M.1  |   ✅   |
| 5   | Realtime auth         | WebSocket auth enforced via cookie/protocol/query token              |    🟡    |  M.1  |   ✅   |
| 6   | Browser sync E2E      | 5 Playwright E2E test specs for sync lifecycle                       |    🟡    |  M.2  |   ✅   |
| 7   | Plugin isolation      | `WorkerThreadPluginHost`, `ChildProcessPluginHost`, `PluginWatchdog` |    🟢    |  M.3  |   ✅   |
| 8   | Mock data dependency  | DevDataProvider + tree-shaking via `__mocks__/`                      |    🟡    |  M.1  |   ✅   |

---

## External Dependencies

| Dependency                        | Version | Role                           |
| --------------------------------- | ------- | ------------------------------ |
| `@objectstack/runtime`            | 3.0.1   | Microkernel — plugin lifecycle |
| `@objectstack/spec`               | 3.0.1   | Protocol contracts             |
| `@objectstack/cli`                | 3.0.1   | Server bootstrap               |
| `@objectstack/client`             | 3.0.0   | Frontend SDK                   |
| `@objectstack/objectql`           | 3.0.1   | ObjectQL plugin                |
| `@objectstack/driver-memory`      | 3.0.1   | In-memory driver               |
| `@objectstack/plugin-hono-server` | 3.0.1   | Hono HTTP server               |
| `@objectstack/plugin-auth`        | 3.0.1   | Authentication                 |
| `@object-ui/core`                 | 2.0.0   | UI core logic                  |
| `@object-ui/react`                | 2.0.0   | React components               |
| `@object-ui/components`           | 2.0.0   | Standard controls              |
| `@object-ui/layout`               | 2.0.0   | App shell                      |
| `@object-ui/fields`               | 2.0.0   | Field renderers                |
| `@object-ui/data-objectstack`     | 2.0.0   | Data adapter                   |

---

## Quality Targets

| Metric                 | Target      |
| ---------------------- | ----------- |
| API Response Time      | P95 < 100ms |
| Test Coverage (Server) | ≥ 80%       |
| Test Coverage (UI)     | ≥ 70%       |
| TypeScript Errors      | 0           |
| Spec Compliance        | 100%        |
| Accessibility          | WCAG 2.1 AA |

---

## Links

- **Repository**: https://github.com/objectstack-ai/objectos
- **Spec Protocol**: https://github.com/objectstack-ai/spec
- **ObjectQL**: https://github.com/objectstack-ai/objectql
- **ObjectUI**: https://github.com/objectstack-ai/objectui
- **Issues**: https://github.com/objectstack-ai/objectos/issues

---

<div align="center">
<sub>ObjectOS v15.0.0 Roadmap — All Phases Complete | Built with @objectstack/spec@3.0.2</sub>
</div>
