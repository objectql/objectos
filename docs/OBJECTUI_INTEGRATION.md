# ObjectUI Integration

This document describes the @object-ui integration in ObjectOS console application.

## Overview

ObjectOS now integrates with @object-ui packages to provide metadata-driven UI components. This enables developers to build data-centric interfaces without writing repetitive UI code.

## Installed Packages

The following @object-ui packages have been installed:

- **@object-ui/core@2.0.0** - Core logic, types, and validation (zero React dependencies)
- **@object-ui/react@2.0.0** - React bindings and SchemaRenderer component
- **@object-ui/components@2.0.0** - Standard UI component library (Shadcn-based)
- **@object-ui/layout@2.0.0** - Application shell components
- **@object-ui/fields@2.0.0** - Field renderers and registry
- **@object-ui/data-objectstack@2.0.0** - ObjectStack data adapter

## Integration Points

### 1. ObjectStack Data Adapter

Location: `apps/web/src/lib/object-ui-adapter.ts`

This adapter bridges ObjectUI components with the ObjectStack backend API:

```typescript
import { createObjectStackAdapter } from '@object-ui/data-objectstack';

export const objectUIAdapter = createObjectStackAdapter({
  baseUrl: '/api/v1',
});
```

### 2. Example Component

Location: `apps/web/src/components/objectui/ObjectUIExample.tsx`

Demonstrates how to use the SchemaRenderer:

```typescript
import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';

<SchemaRenderer
  adapter={objectUIAdapter}
  objectName="contacts"
  view="grid"
/>
```

### 3. Demo Page

Location: `apps/web/src/pages/settings/objectui-demo.tsx`

Interactive demonstration page accessible at `/settings/objectui-demo` showing:
- Package installation status
- Interactive object/view selector
- Usage examples and documentation

## Usage

### Basic Grid View

```typescript
import { SchemaRenderer } from '@object-ui/react';
import { objectUIAdapter } from '@/lib/object-ui-adapter';

function ContactsGrid() {
  return (
    <SchemaRenderer
      adapter={objectUIAdapter}
      objectName="contacts"
      view="grid"
    />
  );
}
```

### Form View

```typescript
<SchemaRenderer
  adapter={objectUIAdapter}
  objectName="contacts"
  view="form"
  recordId="123" // For editing existing record
/>
```

### Kanban View

```typescript
<SchemaRenderer
  adapter={objectUIAdapter}
  objectName="opportunities"
  view="kanban"
/>
```

## Development

### Running the Demo

1. Start the ObjectStack server:
   ```bash
   npm run objectstack:serve
   ```

2. In a separate terminal, start the web app:
   ```bash
   npm run web:dev
   ```

3. Navigate to http://localhost:5321/settings/objectui-demo

### Adding New Views

ObjectUI supports multiple view types:
- `grid` - Data table with sorting, filtering, pagination
- `form` - Create/edit forms with validation
- `detail` - Read-only detail view
- `kanban` - Kanban board (requires status field)
- `calendar` - Calendar view (requires date field)
- `timeline` - Timeline view
- `chart` - Chart visualization

## Architecture

```
┌─────────────────────────────────────────┐
│  apps/web (React SPA)                   │
│  ┌───────────────────────────────────┐  │
│  │ @object-ui/react                  │  │
│  │   SchemaRenderer Component        │  │
│  └───────────┬───────────────────────┘  │
│              │                           │
│  ┌───────────▼───────────────────────┐  │
│  │ @object-ui/data-objectstack       │  │
│  │   ObjectStack Data Adapter        │  │
│  └───────────┬───────────────────────┘  │
└──────────────┼───────────────────────────┘
               │
               │ HTTP (REST/GraphQL)
               │
┌──────────────▼───────────────────────────┐
│  ObjectStack Server (Hono)               │
│  - ObjectQL (Data Layer)                 │
│  - Auth, Permissions, Workflow           │
│  - Plugins: CRM, HRM, etc.               │
└──────────────────────────────────────────┘
```

## Next Steps

> See [ROADMAP.md](../../ROADMAP.md) for the full Phase H breakdown.

1. **Replace hand-built views** - Use SchemaRenderer for grid/form/detail in business pages
2. **Metadata-driven navigation** - Generate sidebar from API metadata
3. **API client completion** - Connect to live ObjectStack API
4. **Bridge components** - ObjectPage (permissions), ObjectToolbar, RelatedList, FilterPanel
5. **Module Federation** - Load plugin UIs dynamically

## References

- ObjectUI Repository: https://github.com/objectstack-ai/objectui
- ObjectUI Documentation: https://www.objectui.org
- ObjectStack Spec: https://github.com/objectstack-ai/spec

## Upgrade Notes

### ObjectStack 2.0.6 → 3.0.0

All @objectstack packages have been upgraded to version 3.0.0:
- @objectstack/cli
- @objectstack/runtime
- @objectstack/spec
- @objectstack/plugin-auth
- @objectstack/driver-memory
- @objectstack/objectql
- @objectstack/plugin-hono-server
- @objectstack/client

No breaking changes detected. All packages continue to use spec protocol 2.0.x.
