# @objectos/analytics

Metadata-driven analytics engine plugin for ObjectOS with aggregation pipelines, report definitions, and dashboard widgets.

## Features

- **Aggregation Engine** — Build data pipelines with group-by, sum, count, avg, min, max operations
- **Report Manager** — Define reports in YAML/JSON with filters, sorting, and scheduled generation
- **Dashboard Manager** — Compose widget-based dashboards from report data
- **Report Scheduler** — Automatic report generation via the Jobs plugin
- **HTTP API** — RESTful endpoints for aggregation, reports, dashboards, and schedules

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/analytics/aggregate` | Run an aggregation query |
| GET | `/api/v1/analytics/reports` | List report definitions |
| POST | `/api/v1/analytics/reports` | Create a report |
| GET | `/api/v1/analytics/dashboards` | List dashboards |
| GET | `/api/v1/analytics/schedules` | List scheduled reports |

## Usage

```typescript
import { AnalyticsPlugin } from '@objectos/analytics';

const analytics = new AnalyticsPlugin();
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
