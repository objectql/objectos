# @objectos/telemetry

OpenTelemetry-compatible distributed tracing plugin for ObjectOS with W3C Trace Context propagation, automatic instrumentation, and multiple exporters.

## Features

- **Span Management** — Create, annotate, and complete spans for any operation
- **W3C Trace Context** — Propagate `traceparent`/`tracestate` headers across service boundaries
- **Auto HTTP Instrumentation** — Hono middleware automatically traces all HTTP requests
- **Data Operation Tracing** — Automatic span creation for CRUD operations via data hooks
- **Plugin Lifecycle Tracing** — Trace plugin load/enable hooks for boot-time visibility
- **OTLP HTTP Exporter** — Export traces to Jaeger, Zipkin, or Grafana Tempo
- **Console Exporter** — Pretty-printed trace output for development
- **Probabilistic Sampling** — Configurable sampling rate to control trace volume

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/telemetry/stats` | Telemetry statistics and span counts |
| GET | `/api/v1/telemetry/spans` | Recent span data |

## Usage

```typescript
import { TelemetryPlugin } from '@objectos/telemetry';

const telemetry = new TelemetryPlugin({
  serviceName: 'objectos',
  exporter: 'otlp',
  otlpEndpoint: 'http://localhost:4318/v1/traces',
  samplingRate: 0.1, // Sample 10% of traces
});
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
