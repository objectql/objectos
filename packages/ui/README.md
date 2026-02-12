# @objectos/ui

UI metadata service plugin for ObjectOS — manages view definitions, dashboard layouts, and UI configuration persisted via ObjectQL.

## Features

- **View Registry** — CRUD operations for view definitions (grid, detail, form, kanban, calendar)
- **Dashboard Manager** — Store and retrieve dashboard widget layouts
- **ObjectQL Backend** — Views and dashboards persisted as `sys_view` objects via ObjectQL
- **In-Memory Fallback** — Fast in-memory registries when ObjectQL is unavailable
- **IUIService Contract** — Implements the `@objectstack/spec` UI service contract

## Usage

```typescript
import { UIPlugin } from '@objectos/ui';

const ui = new UIPlugin();

// After initialization
const views = await ui.getViews('contacts');
const dashboard = await ui.getDashboard('sales-overview');
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
