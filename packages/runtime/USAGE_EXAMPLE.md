# @objectstack/runtime - Usage Example

This example demonstrates how to use `@objectstack/runtime` to create a micro-kernel application with plugin-based architecture.

## Basic Example

```typescript
import { ObjectKernel, ObjectQLPlugin, DriverPlugin } from '@objectstack/runtime';
import { KnexDriver } from '@objectql/driver-sql';

// Create the kernel
const kernel = new ObjectKernel();

// Create a database driver
const driver = new KnexDriver({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});

// Register plugins
kernel
  .use(new ObjectQLPlugin())
  .use(new DriverPlugin(driver, 'default'));

// Bootstrap the kernel
await kernel.bootstrap();

// Access services
const ql = kernel.getService('objectql');

// Use ObjectQL to query data
const results = await ql.query('contacts', {
  filters: [],
  fields: ['name', 'email']
});

console.log('Query results:', results);

// Shutdown when done
await kernel.shutdown();
```

## Creating a Custom Plugin

```typescript
import { Plugin, PluginContext } from '@objectstack/runtime';

export class AnalyticsPlugin implements Plugin {
  name = 'com.mycompany.analytics';
  version = '1.0.0';
  dependencies = ['com.objectstack.engine.objectql'];

  async init(ctx: PluginContext): Promise<void> {
    ctx.logger.info('Analytics plugin initializing...');
    
    // Register analytics service
    const analyticsService = {
      trackEvent: (event: string, data: any) => {
        console.log('Event tracked:', event, data);
      }
    };
    
    ctx.registerService('analytics', analyticsService);
    
    // Subscribe to data events
    ctx.hook('kernel:ready', async () => {
      ctx.logger.info('Analytics ready to track events');
    });
  }

  async start(ctx: PluginContext): Promise<void> {
    ctx.logger.info('Analytics plugin started');
    
    // Get other services
    const ql = ctx.getService('objectql');
    
    // Track startup event
    const analytics = ctx.getService('analytics');
    analytics.trackEvent('app:started', { timestamp: Date.now() });
  }

  async destroy(): Promise<void> {
    console.log('Analytics plugin cleanup');
  }
}

// Use the custom plugin
kernel.use(new AnalyticsPlugin());
await kernel.bootstrap();
```

## Complete Application Example

```typescript
import { ObjectKernel, ObjectQLPlugin, DriverPlugin } from '@objectstack/runtime';
import { KnexDriver } from '@objectql/driver-sql';

// 1. Create kernel
const kernel = new ObjectKernel();

// 2. Setup database
const driver = new KnexDriver({
  client: 'pg',
  connection: process.env.DATABASE_URL
});

// 3. Register core plugins
kernel
  .use(new ObjectQLPlugin())
  .use(new DriverPlugin(driver, 'postgres'));

// 4. Register custom plugins
kernel.use(new AnalyticsPlugin());

// 5. Bootstrap
try {
  await kernel.bootstrap();
  console.log('✓ Kernel bootstrapped successfully');
  
  // Application is now ready to use
  const ql = kernel.getService('objectql');
  const analytics = kernel.getService('analytics');
  
  // Your application logic here...
  
} catch (error) {
  console.error('Failed to bootstrap kernel:', error);
  process.exit(1);
}

// 6. Graceful shutdown
process.on('SIGTERM', async () => {
  await kernel.shutdown();
  process.exit(0);
});
```

## Plugin Lifecycle

The kernel executes plugins in this order:

1. **Registration** (`kernel.use()`)
   - Plugins are registered with the kernel
   - Dependencies are declared

2. **Initialization** (`kernel.bootstrap()`)
   - Plugins are sorted by dependencies (topological sort)
   - `init()` is called on each plugin in order
   - Services are registered
   - Event hooks are subscribed

3. **Start**
   - `start()` is called on each plugin
   - Databases are connected
   - Servers are started

4. **Running**
   - Application is operational
   - Services can be accessed via `kernel.getService()`

5. **Shutdown** (`kernel.shutdown()`)
   - `destroy()` is called on each plugin in reverse order
   - Cleanup and resource release

## Events

Standard kernel events:

- `kernel:init` - Before plugins initialize
- `kernel:ready` - After all plugins start
- `kernel:shutdown` - Before shutdown

Custom events can be emitted using:

```typescript
await ctx.trigger('my:custom:event', { data: 'value' });
```

## Testing

```typescript
import { ObjectKernel } from '@objectstack/runtime';

describe('MyPlugin', () => {
  let kernel: ObjectKernel;

  beforeEach(() => {
    kernel = new ObjectKernel();
  });

  afterEach(async () => {
    await kernel.shutdown();
  });

  it('should register service', async () => {
    kernel.use(new MyPlugin());
    await kernel.bootstrap();
    
    expect(kernel.hasService('my-service')).toBe(true);
  });
});
```
