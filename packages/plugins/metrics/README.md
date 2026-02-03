# @objectos/plugin-metrics

System monitoring and metrics collection for ObjectOS with Prometheus support.

## Features

- **Three Metric Types**
  - **Counter**: Monotonically increasing values (e.g., total requests, errors)
  - **Gauge**: Arbitrary values that can go up or down (e.g., memory usage, active connections)
  - **Histogram**: Distribution tracking with percentiles (e.g., request latency, response times)

- **Labels Support**: Add dimensions to metrics for fine-grained tracking
- **Prometheus Export**: Export all metrics in Prometheus text format for monitoring
- **Built-in Kernel Metrics**: Automatic tracking of ObjectOS internal events
  - `plugin.load.duration` - Plugin loading time (Histogram)
  - `plugin.enable.duration` - Plugin enabling time (Histogram)
  - `service.calls.total` - Total service calls (Counter)
  - `hook.execution.duration` - Hook execution time (Histogram)

## Installation

```bash
npm install @objectos/plugin-metrics
```

## Usage

### Basic Setup

```typescript
import { ObjectOS } from '@objectstack/runtime';
import { MetricsPlugin } from '@objectos/plugin-metrics';

const os = new ObjectOS({
  plugins: [
    new MetricsPlugin()
  ]
});

await os.start();
```

### Custom Configuration

```typescript
const metricsPlugin = new MetricsPlugin({
  enabled: true,
  prefix: 'objectos_',
  defaultLabels: {
    environment: 'production',
    region: 'us-east-1'
  },
  trackBuiltInMetrics: true,
  maxHistogramObservations: 10000
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable metrics collection |
| `prefix` | string | `''` | Prefix for all metric names |
| `defaultLabels` | Record<string, string> | `{}` | Default labels attached to all metrics |
| `trackBuiltInMetrics` | boolean | `true` | Track kernel lifecycle metrics |
| `maxHistogramObservations` | number | `10000` | Max observations per histogram |

## API Reference

### Accessing the Metrics API

```typescript
import { getMetricsAPI } from '@objectos/plugin-metrics';

const metricsAPI = getMetricsAPI(kernel);
```

### Counter Metrics

Counters are for values that only increase (never decrease).

```typescript
// Increment counter by 1 (default)
metricsAPI.incrementCounter('api.requests.total');

// Increment by custom amount
metricsAPI.incrementCounter('bytes.sent', 1024);

// With labels
metricsAPI.incrementCounter('http.requests', 1, {
  method: 'POST',
  endpoint: '/api/users',
  status: '201'
});
```

**Use Cases:**
- Total requests served
- Total errors encountered
- Items processed
- Events triggered

### Gauge Metrics

Gauges are for values that can increase or decrease.

```typescript
// Set gauge to specific value
metricsAPI.setGauge('memory.heap.used', process.memoryUsage().heapUsed);

// Increment gauge
metricsAPI.incrementGauge('active.connections', 1);

// Decrement gauge
metricsAPI.decrementGauge('active.connections', 1);

// With labels
metricsAPI.setGauge('queue.size', queueLength, {
  queue: 'email',
  priority: 'high'
});
```

**Use Cases:**
- Memory usage
- Active connections
- Queue size
- Temperature readings
- CPU usage

### Histogram Metrics

Histograms track distributions and calculate percentiles.

```typescript
// Record a value
const startTime = Date.now();
await processRequest();
const duration = Date.now() - startTime;
metricsAPI.recordHistogram('request.duration', duration);

// With labels
metricsAPI.recordHistogram('api.latency', latency, {
  endpoint: '/api/orders',
  method: 'GET'
});
```

**Use Cases:**
- Request/response latency
- Database query duration
- File upload size
- Processing time

### Retrieving Metrics

```typescript
// Get all metrics
const allMetrics = metricsAPI.getMetrics();

// Get metrics by type
const counters = metricsAPI.getMetricsByType(MetricType.Counter);
const gauges = metricsAPI.getMetricsByType(MetricType.Gauge);
const histograms = metricsAPI.getMetricsByType(MetricType.Histogram);

// Get specific metric by name and labels
const metric = metricsAPI.getMetric('http.requests', {
  method: 'GET',
  status: '200'
});
```

### Resetting Metrics

```typescript
// Reset all metrics
metricsAPI.resetAllMetrics();

// Reset specific metric
metricsAPI.resetMetric('test.counter');

// Reset specific metric with labels
metricsAPI.resetMetric('http.requests', { method: 'GET' });
```

## Prometheus Integration

### Export Metrics

```typescript
// Get Prometheus text format
const prometheusText = metricsAPI.exportPrometheus();
console.log(prometheusText);
```

**Example Output:**

```prometheus
# HELP http_requests_total Counter: http_requests_total
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1547 1705234567890

# HELP memory_usage Gauge: memory_usage
# TYPE memory_usage gauge
memory_usage{type="heap"} 104857600 1705234567891

# HELP request_duration Histogram: request_duration
# TYPE request_duration histogram
request_duration_sum{endpoint="/api/users"} 5420 1705234567892
request_duration_count{endpoint="/api/users"} 100 1705234567892
request_duration_p50{endpoint="/api/users"} 45 1705234567892
request_duration_p90{endpoint="/api/users"} 89 1705234567892
request_duration_p95{endpoint="/api/users"} 105 1705234567892
request_duration_p99{endpoint="/api/users"} 142 1705234567892
```

### HTTP Endpoint for Prometheus

```typescript
import { RestServer } from '@objectstack/runtime';
import { getMetricsAPI } from '@objectos/plugin-metrics';

// In your server plugin
const server = context.getService<RestServer>('http-server');

server.route({
  method: 'GET',
  path: '/metrics',
  handler: async (req, res) => {
    const metricsAPI = getMetricsAPI(context.getKernel());
    const prometheusText = metricsAPI.exportPrometheus();
    
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(prometheusText);
  }
});
```

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'objectos'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

## Built-in Metrics

When `trackBuiltInMetrics` is enabled, the following metrics are automatically collected:

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `plugin.load.duration` | Histogram | `plugin` | Time to load a plugin (ms) |
| `plugin.enable.duration` | Histogram | `plugin` | Time to enable a plugin (ms) |
| `service.calls.total` | Counter | `service`, `method` | Total service calls |
| `hook.execution.duration` | Histogram | `hook` | Hook execution time (ms) |

## Examples

### Track API Request Metrics

```typescript
import { getMetricsAPI } from '@objectos/plugin-metrics';

class APIHandler {
  async handleRequest(req: Request, res: Response) {
    const metricsAPI = getMetricsAPI(kernel);
    const startTime = Date.now();
    
    try {
      const result = await processRequest(req);
      
      // Record success
      metricsAPI.incrementCounter('api.requests.total', 1, {
        method: req.method,
        endpoint: req.path,
        status: '200'
      });
      
      // Record latency
      const duration = Date.now() - startTime;
      metricsAPI.recordHistogram('api.request.duration', duration, {
        method: req.method,
        endpoint: req.path
      });
      
      return result;
    } catch (error) {
      // Record error
      metricsAPI.incrementCounter('api.errors.total', 1, {
        method: req.method,
        endpoint: req.path,
        error: error.name
      });
      
      throw error;
    }
  }
}
```

### Monitor System Resources

```typescript
import { getMetricsAPI } from '@objectos/plugin-metrics';

function startResourceMonitoring(kernel: any) {
  const metricsAPI = getMetricsAPI(kernel);
  
  // Update every 10 seconds
  setInterval(() => {
    const mem = process.memoryUsage();
    
    metricsAPI.setGauge('process.memory.heap.used', mem.heapUsed);
    metricsAPI.setGauge('process.memory.heap.total', mem.heapTotal);
    metricsAPI.setGauge('process.memory.external', mem.external);
    metricsAPI.setGauge('process.memory.rss', mem.rss);
    
    const cpuUsage = process.cpuUsage();
    metricsAPI.setGauge('process.cpu.user', cpuUsage.user);
    metricsAPI.setGauge('process.cpu.system', cpuUsage.system);
  }, 10000);
}
```

### Track Business Metrics

```typescript
import { getMetricsAPI } from '@objectos/plugin-metrics';

class OrderService {
  async createOrder(order: Order) {
    const metricsAPI = getMetricsAPI(kernel);
    
    // Track order creation
    metricsAPI.incrementCounter('orders.created.total', 1, {
      product: order.productType,
      region: order.region
    });
    
    // Track order value
    metricsAPI.recordHistogram('order.value', order.totalAmount, {
      currency: order.currency
    });
    
    // Update active orders gauge
    metricsAPI.incrementGauge('orders.active', 1, {
      status: 'pending'
    });
    
    return await this.saveOrder(order);
  }
  
  async completeOrder(orderId: string) {
    const metricsAPI = getMetricsAPI(kernel);
    
    // Update gauges
    metricsAPI.decrementGauge('orders.active', 1, { status: 'pending' });
    metricsAPI.incrementGauge('orders.active', 1, { status: 'completed' });
    
    // Track completion
    metricsAPI.incrementCounter('orders.completed.total', 1);
  }
}
```

## Best Practices

1. **Use Labels Wisely**: Don't create too many unique label combinations (high cardinality)
   ```typescript
   // Good: Limited label values
   metricsAPI.incrementCounter('requests', 1, { 
     method: 'GET',  // ~10 possible values
     status: '200'    // ~50 possible values
   });
   
   // Bad: Unlimited label values (user IDs, timestamps, etc.)
   metricsAPI.incrementCounter('requests', 1, {
     user_id: '12345',  // Millions of possible values
     timestamp: Date.now().toString()
   });
   ```

2. **Name Conventions**: Follow Prometheus naming conventions
   - Use snake_case: `http_requests_total`
   - Include unit suffix: `request_duration_seconds`, `memory_bytes`
   - Counter suffix: `_total`, `_count`

3. **Metric Types**: Choose the right type
   - **Counter**: Things that only increase
   - **Gauge**: Current state/value
   - **Histogram**: Distribution and percentiles

4. **Performance**: Metrics collection is fast but not free
   - Don't track in tight loops
   - Use sampling for very high-frequency events
   - Consider disabling in development: `enabled: false`

## TypeScript Types

```typescript
import type {
  MetricsConfig,
  Labels,
  Metric,
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  Percentiles,
  MetricType,
} from '@objectos/plugin-metrics';
```

## License

AGPL-3.0

---

**Part of ObjectOS** - The Business Operating System for ObjectStack
