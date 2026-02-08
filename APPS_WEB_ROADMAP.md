# apps/web — Frontend Development Plan & Roadmap

> Complete plan for building the **ObjectOS Admin Console & Business App Shell** (`apps/web`).

## 1. Executive Summary

`apps/web` is a **Vite + React 19 SPA** that serves two purposes:

1. **Admin Console** (`/settings/*`) — System administration pages for managing organizations, users, permissions, plugins, jobs, metrics, and more.
2. **Business App Shell** (`/apps/:appId/*`) — A metadata-driven workspace that renders ObjectStack business applications (CRM, HRM, Finance, etc.) by assembling ObjectUI controls.

### Current State (Baseline)

| Area | Status |
|---|---|
| Auth (sign-in, sign-up, 2FA, OAuth) | ✅ Complete (6 pages) |
| Settings / Admin Console | ✅ Complete (16 pages) |
| Business App Shell | 🟡 Placeholder only — single `app.tsx` stub |
| Object List View | ❌ Not started |
| Object Record View | ❌ Not started |
| API Client Layer | ❌ Not started |
| Metadata-driven Navigation | ❌ Not started |
| ObjectUI Integration | ❌ Not started |

### Goal

Build the **Business App Shell** layer so that any ObjectStack app registered via the plugin manifest can be rendered in the browser with:

- Dynamic sidebar navigation derived from object metadata
- Object list pages with sortable/filterable tables
- Object record detail pages with form views
- Proper loading, empty, and error states
- API integration via TanStack Query → `/api/v1/*`

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    apps/web (SPA)                        │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth      │  │ Admin Console│  │ Business App Shell│  │
│  │ Pages     │  │ /settings/*  │  │ /apps/:appId/*   │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
│                                         │               │
│                                    ┌────┴────┐          │
│                                    │ AppLayout│          │
│                                    │ + Object │          │
│                                    │ Nav      │          │
│                                    └────┬────┘          │
│                              ┌──────────┼──────────┐    │
│                              │          │          │    │
│                         ObjectList ObjectRecord  AppHome│
│                         (table)   (form/detail)  (dash) │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Shared Infrastructure               │    │
│  │  api.ts │ use-metadata.ts │ use-records.ts      │    │
│  │  types/metadata.ts │ app-registry.ts             │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP (TanStack Query)
                       ▼
              ObjectStack Hono Server
              /api/v1/* (REST + GraphQL)
```

### Key Principles

1. **Metadata-Driven**: Object definitions (fields, labels, icons) drive the UI — no hardcoded business logic in the frontend.
2. **API-First**: All data flows through `/api/v1/*` endpoints via TanStack Query.
3. **Progressive Enhancement**: Start with basic table/form views, later integrate ObjectUI controls.
4. **Lazy Loading**: All page components are lazy-loaded for optimal code splitting.
5. **Type Safety**: Full TypeScript types for metadata, records, and API responses.

---

## 3. Type System

### Core Metadata Types (`src/types/metadata.ts`)

```typescript
// Object field definition — mirrors @objectstack/spec
interface FieldDefinition {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'datetime' | 'select' | 'reference' | 'textarea' | 'email' | 'url' | 'phone' | 'currency' | 'percent' | 'object';
  label: string;
  required?: boolean;
  readonly?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];    // for 'select' type
  referenceTo?: string;                             // for 'reference' type
  group?: string;                                   // field grouping
}

// Object definition — describes a business entity
interface ObjectDefinition {
  name: string;
  label: string;
  pluralLabel: string;
  icon?: string;
  description?: string;
  fields: Record<string, FieldDefinition>;
  primaryField?: string;      // which field is the "name" field
  listFields?: string[];      // which fields to show in list view
}

// App definition — describes a business application
interface AppDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
  objects: string[];           // object names belonging to this app
  defaultObject?: string;      // landing object
  status: 'active' | 'paused';
  category: 'system' | 'business' | 'custom';
}
```

---

## 4. Phase Roadmap

### Phase 1: Foundation (Current Sprint) ✅

**Goal**: Build the core infrastructure for metadata-driven business apps.

| Deliverable | File(s) | Description |
|---|---|---|
| API client | `src/lib/api.ts` | Typed fetch wrapper for `/api/v1/*` |
| Metadata types | `src/types/metadata.ts` | TypeScript interfaces for objects, fields, apps |
| Metadata hooks | `src/hooks/use-metadata.ts` | TanStack Query hooks: `useAppObjects`, `useObjectDefinition` |
| Record hooks | `src/hooks/use-records.ts` | TanStack Query hooks: `useRecords`, `useRecord`, mutations |
| Object list page | `src/pages/apps/object-list.tsx` | Table view with sorting, pagination |
| Object record page | `src/pages/apps/object-record.tsx` | Detail view with field rendering |
| App home page | `src/pages/apps/app.tsx` | Enhanced dashboard with object cards |
| Dynamic app navigation | `AppLayout.tsx` | Sidebar nav items from object metadata |
| Routing update | `App.tsx` | Add `/:objectName` and `/:objectName/:recordId` routes |

### Phase 2: Rich Data Views (Next Sprint)

| Deliverable | Description |
|---|---|
| Inline editing | Click-to-edit fields in record detail |
| Column configuration | Users choose which columns to display |
| Search & filters | Global search bar + field-level filters on list view |
| Bulk actions | Multi-select rows for batch operations |
| Related lists | Show child/related records on detail page |
| Pagination controls | Page size selector, prev/next, jump-to-page |

### Phase 3: ObjectUI Integration

| Deliverable | Description |
|---|---|
| `@objectui/form` | Metadata-driven form control |
| `@objectui/grid` | Advanced data grid with virtual scrolling |
| `@objectui/kanban` | Kanban board view for pipeline objects |
| `@objectui/chart` | Dashboard chart widgets |
| View switcher | Toggle between Table / Kanban / Calendar views |
| Layout builder | Drag-and-drop page layout configuration |

### Phase 4: Workflow & Automation UI

| Deliverable | Description |
|---|---|
| Workflow status badges | Show current workflow state on records |
| Approval buttons | Approve/reject actions on pending records |
| Workflow visualizer | BPMN-lite flow diagram for workflow definitions |
| Automation rules UI | Visual rule builder for triggers and actions |
| Activity timeline | Show audit log / activity feed on records |

### Phase 5: Offline & Sync

| Deliverable | Description |
|---|---|
| Service Worker | PWA support for offline access |
| Local SQLite (WASM) | Client-side data cache via `@objectos/browser` |
| Sync engine | Push mutations / pull deltas from server |
| Conflict resolution UI | Manual conflict resolution for sync conflicts |
| Optimistic updates | Instant UI feedback before server confirmation |

### Phase 6: Polish & Performance

| Deliverable | Description |
|---|---|
| Virtual scrolling | Handle 10K+ rows in list views |
| Keyboard navigation | Full keyboard shortcut support |
| Accessibility audit | WCAG 2.1 AA compliance |
| i18n integration | Multi-locale support via `@objectos/i18n` |
| Theme system | Light/dark mode + custom brand colors |
| Performance budget | Bundle size limits, Lighthouse CI |

---

## 5. API Contract

### Metadata Endpoints

```
GET /api/v1/metadata/objects                → { objects: ObjectDefinition[] }
GET /api/v1/metadata/objects/:name          → { object: ObjectDefinition }
GET /api/v1/metadata/apps                   → { apps: AppDefinition[] }
GET /api/v1/metadata/apps/:appId            → { app: AppDefinition }
```

### Data Endpoints

```
GET    /api/v1/data/:objectName             → { records: Record[], total: number, page: number }
GET    /api/v1/data/:objectName/:id         → { record: Record }
POST   /api/v1/data/:objectName             → { record: Record }
PATCH  /api/v1/data/:objectName/:id         → { record: Record }
DELETE /api/v1/data/:objectName/:id         → { success: true }
```

### Query Parameters (List)

```
?page=1&pageSize=20&sort=name&order=asc&search=keyword&filter[status]=active
```

> **Note**: Until the server implements these endpoints, the frontend uses mock data with the same interface. The API layer (`src/lib/api.ts`) abstracts this so switching to real endpoints requires zero page-level changes.

---

## 6. File Structure (Target)

```
apps/web/src/
├── App.tsx                          # Root router
├── main.tsx                         # Entry point
├── index.css                        # Global styles
│
├── types/
│   └── metadata.ts                  # Object, Field, App type definitions
│
├── lib/
│   ├── api.ts                       # Fetch wrapper for /api/v1/*
│   ├── auth-client.ts               # Better-Auth client
│   ├── app-registry.ts              # App registry (mock → API)
│   ├── mock-data.ts                 # Mock metadata & records for dev
│   └── utils.ts                     # cn() utility
│
├── hooks/
│   ├── use-metadata.ts              # Object/app metadata queries
│   ├── use-records.ts               # CRUD record queries & mutations
│   └── use-mobile.ts                # Mobile breakpoint detection
│
├── components/
│   ├── layouts/
│   │   ├── AppLayout.tsx            # Business app shell + dynamic nav
│   │   └── SettingsLayout.tsx       # Admin console layout
│   ├── auth/                        # Auth guards & layouts
│   ├── dashboard/                   # App switcher, nav user, org switcher
│   ├── records/
│   │   ├── RecordTable.tsx          # Reusable data table
│   │   ├── FieldRenderer.tsx        # Render field value by type
│   │   └── RecordForm.tsx           # (Phase 2) Editable record form
│   └── ui/                          # shadcn/ui primitives
│
├── pages/
│   ├── home.tsx
│   ├── sign-in.tsx / sign-up.tsx / ...
│   ├── settings/                    # 16 admin pages
│   └── apps/
│       ├── app.tsx                  # App home dashboard
│       ├── object-list.tsx          # Object list view (table)
│       └── object-record.tsx        # Object record detail
│
└── test/
    └── setup.ts
```

---

## 7. Development Workflow

```bash
# Terminal 1: ObjectStack API server
pnpm objectstack:serve          # → http://localhost:5320

# Terminal 2: Vite dev server (HMR)
pnpm web:dev                    # → http://localhost:5321

# Vite proxies /api/v1/* → localhost:5320 automatically
```

### Testing

```bash
# Unit tests (Vitest + jsdom)
cd apps/web && npx vitest run

# Type checking
cd apps/web && npx tsc --noEmit

# Build
pnpm web:build
```

---

## 8. Success Criteria

### Phase 1 (Foundation) — Definition of Done

- [ ] User can navigate to `/apps/crm` and see a sidebar with object links
- [ ] Clicking an object link navigates to `/apps/crm/leads` (object list)
- [ ] Object list page shows a table with columns derived from metadata
- [ ] Clicking a row navigates to `/apps/crm/leads/:id` (record detail)
- [ ] Record detail page renders field values by type (text, number, date, select, etc.)
- [ ] Loading spinners shown while data is fetching
- [ ] Empty states shown when no records exist
- [ ] Error states shown when API calls fail
- [ ] All existing tests continue to pass
- [ ] Build succeeds with no TypeScript errors
