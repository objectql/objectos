# ObjectOS Plugin Development Guide

> Comprehensive guide for developing plugins for the ObjectOS microkernel

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Structure](#plugin-structure)
3. [Plugin Manifest](#plugin-manifest)
4. [Lifecycle Hooks](#lifecycle-hooks)
5. [Service Registry](#service-registry)
6. [Event System](#event-system)
7. [Storage](#storage)
8. [Best Practices](#best-practices)
9. [Testing](#testing)
10. [Publishing](#publishing)

---

## Getting Started

### Prerequisites

- Node.js 18+ (LTS)
- pnpm (recommended) or npm
- TypeScript 5.0+
- Basic understanding of async/await

### Create a New Plugin

```bash
# Create plugin directory
mkdir my-plugin && cd my-plugin

# Initialize package.json
pnpm init

# Install runtime
pnpm add @objectstack/runtime

# Install dev dependencies
pnpm add -D typescript @types/node
```

---

## Plugin Structure

A typical plugin structure:

```
my-plugin/
├── src/
│   ├── index.ts           # Main plugin entry
│   ├── manifest.ts        # Plugin manifest
│   ├── services/          # Service implementations
│   │   └── MyService.ts
│   ├── handlers/          # Event handlers
│   │   └── UserHandler.ts
│   └── __tests__/         # Tests
│       └── index.test.ts
├── package.json
└── tsconfig.json
```

---

## Plugin Manifest

The manifest defines plugin metadata and capabilities:

```typescript
// src/manifest.ts
import { PluginManifest } from '@objectstack/runtime';

export const manifest: PluginManifest = {
  // Required fields
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  
  // Optional metadata
  description: 'A sample plugin for ObjectOS',
  author: {
    name: 'Your Name',
    email: 'your.email@example.com',
    url: 'https://example.com'
  },
  license: 'MIT',
  
  // Dependencies
  dependencies: {
    '@objectos/plugin-auth': '^1.0.0',
    '@objectos/plugin-storage': '^1.0.0'
  },
  
  // Optional peer dependencies
  peerDependencies: {
    '@objectos/plugin-cache': '^1.0.0'
  },
  
  // Capabilities provided
  provides: {
    services: ['my-service'],
    objects: ['./objects/*.yml'],
    workflows: ['./workflows/*.yml'],
    apis: ['./apis/*.yml']
  },
  
  // Configuration schema
  config: {
    apiKey: '',
    timeout: 5000,
    retries: 3
  }
};
```

---

## Lifecycle Hooks

Plugins can implement lifecycle hooks to execute code at specific points:

### onInstall

Called when the plugin is first installed:

```typescript
async onInstall(ctx: PluginContext): Promise<void> {
  // Initialize database schema
  await ctx.services.get('database').createTables([
    'my_plugin_users',
    'my_plugin_settings'
  ]);
  
  // Set default configuration
  await ctx.storage.set('initialized', true);
  
  ctx.logger.info('Plugin installed successfully');
}
```

### onLoad

Called when the plugin manifest is loaded:

```typescript
async onLoad(ctx: PluginContext): Promise<void> {
  // Register services
  ctx.services.register('my-service', new MyService(ctx));
  
  // Subscribe to events
  ctx.events.on('user.created', async (data) => {
    await this.handleUserCreated(data);
  });
  
  ctx.logger.info('Plugin loaded successfully');
}
```

### onEnable

Called when the plugin is enabled:

```typescript
async onEnable(ctx: PluginContext): Promise<void> {
  // Start background tasks
  this.startPollingJob(ctx);
  
  // Connect to external services
  await this.connectToAPI(ctx.config.apiKey);
  
  ctx.logger.info('Plugin enabled');
}
```

### onDisable

Called when the plugin is disabled:

```typescript
async onDisable(ctx: PluginContext): Promise<void> {
  // Stop background tasks
  this.stopPollingJob();
  
  // Disconnect from external services
  await this.disconnectFromAPI();
  
  ctx.logger.info('Plugin disabled');
}
```

### onUninstall

Called when the plugin is uninstalled:

```typescript
async onUninstall(ctx: PluginContext): Promise<void> {
  // Clean up resources
  await ctx.storage.clear();
  
  // Drop database tables
  await ctx.services.get('database').dropTables([
    'my_plugin_users',
    'my_plugin_settings'
  ]);
  
  ctx.logger.info('Plugin uninstalled');
}
```

### Complete Example

```typescript
// src/index.ts
import { PluginContext, PluginHooks } from '@objectstack/runtime';
import { manifest } from './manifest';
import { MyService } from './services/MyService';

export class MyPlugin implements PluginHooks {
  private service?: MyService;
  
  async onLoad(ctx: PluginContext): Promise<void> {
    // Create and register service
    this.service = new MyService(ctx);
    ctx.services.register('my-service', this.service);
    
    // Subscribe to events
    ctx.events.on('user.created', async (data) => {
      await this.service?.onUserCreated(data);
    });
  }
  
  async onEnable(ctx: PluginContext): Promise<void> {
    await this.service?.start();
  }
  
  async onDisable(ctx: PluginContext): Promise<void> {
    await this.service?.stop();
  }
}

export { manifest };
```

---

## Service Registry

Share functionality between plugins using the service registry:

### Registering a Service

```typescript
// In your plugin
async onLoad(ctx: PluginContext): Promise<void> {
  ctx.services.register('calculator', {
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b,
    divide: (a: number, b: number) => a / b
  });
}
```

### Using a Service

```typescript
// In another plugin
async onEnable(ctx: PluginContext): Promise<void> {
  const calc = ctx.services.get('calculator');
  
  if (calc) {
    const result = calc.add(5, 3);
    ctx.logger.info(`5 + 3 = ${result}`);
  } else {
    ctx.logger.warn('Calculator service not available');
  }
}
```

### Service with TypeScript Types

```typescript
// Define service interface
interface CalculatorService {
  add(a: number, b: number): number;
  subtract(a: number, b: number): number;
}

// Register with type
ctx.services.register<CalculatorService>('calculator', {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b
});

// Get with type
const calc = ctx.services.get<CalculatorService>('calculator');
```

---

## Event System

Use events for loosely-coupled communication:

### Publishing Events

```typescript
// Emit an event
ctx.events.emit('user.created', {
  userId: '123',
  email: 'user@example.com',
  timestamp: new Date()
});

// Emit and wait for all handlers
await ctx.events.emitAsync('order.placed', {
  orderId: '456',
  total: 99.99
});
```

### Subscribing to Events

```typescript
// Subscribe to an event
ctx.events.on('user.created', async (data) => {
  ctx.logger.info(`New user: ${data.email}`);
  
  // Send welcome email
  await sendWelcomeEmail(data.email);
});

// Subscribe once (one-time handler)
ctx.events.once('system.ready', async () => {
  ctx.logger.info('System is ready!');
});
```

### Event Patterns

#### Domain Events

```typescript
// User domain events
ctx.events.emit('user.created', { userId: '123' });
ctx.events.emit('user.updated', { userId: '123', fields: ['email'] });
ctx.events.emit('user.deleted', { userId: '123' });
```

#### System Events

```typescript
// Runtime lifecycle events
ctx.events.on('runtime:started', () => {
  // Runtime has started
});

ctx.events.on('runtime:stopped', () => {
  // Runtime is stopping
});

// Plugin lifecycle events
ctx.events.on('plugin:loaded', ({ plugin }) => {
  // A plugin was loaded
});

ctx.events.on('plugin:enabled', ({ plugin }) => {
  // A plugin was enabled
});
```

#### Error Events

```typescript
ctx.events.on('error', ({ error, context }) => {
  // Log error
  ctx.logger.error('Error occurred', error);
  
  // Send to monitoring service
  monitoringService.captureError(error, context);
});
```

---

## Storage

Each plugin has isolated storage:

### Basic Operations

```typescript
// Save data
await ctx.storage.set('user-count', 42);
await ctx.storage.set('settings', {
  theme: 'dark',
  language: 'en'
});

// Load data
const count = await ctx.storage.get<number>('user-count');
const settings = await ctx.storage.get<Settings>('settings');

// Check if key exists
if (await ctx.storage.has('user-count')) {
  // Key exists
}

// Delete data
await ctx.storage.delete('user-count');

// Get all keys
const keys = await ctx.storage.keys();

// Clear all data
await ctx.storage.clear();
```

### Storage Patterns

#### Configuration Storage

```typescript
interface PluginConfig {
  apiKey: string;
  endpoint: string;
  timeout: number;
}

async function loadConfig(ctx: PluginContext): Promise<PluginConfig> {
  const config = await ctx.storage.get<PluginConfig>('config');
  return config || {
    apiKey: '',
    endpoint: 'https://api.example.com',
    timeout: 5000
  };
}

async function saveConfig(ctx: PluginContext, config: PluginConfig): Promise<void> {
  await ctx.storage.set('config', config);
}
```

#### Cache Pattern

```typescript
async function getCachedData<T>(
  ctx: PluginContext,
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  // Check cache
  const cached = await ctx.storage.get<{ data: T; expires: number }>(key);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Store in cache
  await ctx.storage.set(key, {
    data,
    expires: Date.now() + (ttl * 1000)
  });
  
  return data;
}
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
async onLoad(ctx: PluginContext): Promise<void> {
  try {
    await this.initialize(ctx);
  } catch (error) {
    ctx.logger.error('Failed to initialize', error as Error);
    // Emit error event for monitoring
    ctx.events.emit('plugin:error', {
      plugin: 'my-plugin',
      error
    });
    throw error; // Re-throw to mark plugin as ERROR state
  }
}
```

### 2. Dependency Management

Declare dependencies explicitly:

```typescript
export const manifest: PluginManifest = {
  id: 'my-plugin',
  // ...
  dependencies: {
    '@objectos/plugin-auth': '^1.0.0',
    '@objectos/plugin-database': '^1.0.0'
  }
};
```

Check dependencies before use:

```typescript
async onLoad(ctx: PluginContext): Promise<void> {
  const auth = ctx.services.get('auth');
  if (!auth) {
    throw new Error('Auth service is required but not available');
  }
  
  this.auth = auth;
}
```

### 3. Graceful Shutdown

Clean up resources properly:

```typescript
async onDisable(ctx: PluginContext): Promise<void> {
  // Stop timers
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
  
  // Close connections
  if (this.connection) {
    await this.connection.close();
  }
  
  // Unsubscribe from events
  ctx.events.off('user.created', this.userCreatedHandler);
  
  ctx.logger.info('Cleanup complete');
}
```

### 4. Logging

Use appropriate log levels:

```typescript
// Debug: Detailed diagnostic information
ctx.logger.debug('Processing user', { userId: '123' });

// Info: General informational messages
ctx.logger.info('Service started successfully');

// Warn: Warning messages
ctx.logger.warn('API rate limit approaching');

// Error: Error messages
ctx.logger.error('Failed to connect to database', error);
```

### 5. Configuration

Make plugins configurable:

```typescript
export const manifest: PluginManifest = {
  id: 'my-plugin',
  // ...
  config: {
    apiKey: process.env.MY_PLUGIN_API_KEY || '',
    endpoint: process.env.MY_PLUGIN_ENDPOINT || 'https://api.example.com',
    timeout: parseInt(process.env.MY_PLUGIN_TIMEOUT || '5000'),
    debug: process.env.MY_PLUGIN_DEBUG === 'true'
  }
};
```

---

## Testing

### Unit Testing

```typescript
// src/__tests__/MyService.test.ts
import { MyService } from '../services/MyService';
import { PluginContext } from '@objectstack/runtime';

describe('MyService', () => {
  let service: MyService;
  let mockContext: PluginContext;
  
  beforeEach(() => {
    mockContext = createMockContext();
    service = new MyService(mockContext);
  });
  
  it('should perform calculation', () => {
    const result = service.calculate(5, 3);
    expect(result).toBe(8);
  });
});

function createMockContext(): PluginContext {
  return {
    runtime: {} as any,
    services: new Map(),
    events: new EventEmitter(),
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    },
    config: {},
    storage: createMockStorage()
  };
}
```

### Integration Testing

```typescript
// src/__tests__/integration.test.ts
import { ObjectStackRuntime } from '@objectstack/runtime';
import { manifest, MyPlugin } from '../index';

describe('MyPlugin Integration', () => {
  let runtime: ObjectStackRuntime;
  
  beforeEach(async () => {
    runtime = new ObjectStackRuntime({
      plugins: [manifest]
    });
    await runtime.start();
  });
  
  afterEach(async () => {
    await runtime.stop();
  });
  
  it('should register service', () => {
    const service = runtime.services.get('my-service');
    expect(service).toBeDefined();
  });
});
```

---

## Publishing

### Prepare for Publishing

1. Update version in `package.json`
2. Build the package
3. Run tests
4. Update CHANGELOG.md

```bash
# Build
pnpm build

# Test
pnpm test

# Publish
pnpm publish
```

### NPM Package Configuration

```json
{
  "name": "@my-org/my-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "pnpm build && pnpm test"
  },
  "peerDependencies": {
    "@objectstack/runtime": "^0.1.0"
  }
}
```

---

## Complete Example

Here's a complete plugin example:

```typescript
// src/manifest.ts
import { PluginManifest } from '@objectstack/runtime';

export const manifest: PluginManifest = {
  id: 'email-sender',
  name: 'Email Sender Plugin',
  version: '1.0.0',
  description: 'Send emails via SMTP',
  dependencies: {
    '@objectos/plugin-storage': '^1.0.0'
  },
  config: {
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || ''
  }
};

// src/EmailService.ts
import { PluginContext } from '@objectstack/runtime';
import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: any;
  
  constructor(private ctx: PluginContext) {}
  
  async initialize(): Promise<void> {
    this.transporter = nodemailer.createTransport({
      host: this.ctx.config.smtpHost,
      port: this.ctx.config.smtpPort,
      auth: {
        user: this.ctx.config.smtpUser,
        pass: this.ctx.config.smtpPass
      }
    });
    
    this.ctx.logger.info('Email service initialized');
  }
  
  async sendEmail(options: {
    to: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.ctx.config.smtpUser,
        ...options
      });
      
      this.ctx.logger.info(`Email sent to ${options.to}`);
      
      // Track in storage
      const sent = await this.ctx.storage.get<number>('emails-sent') || 0;
      await this.ctx.storage.set('emails-sent', sent + 1);
      
    } catch (error) {
      this.ctx.logger.error('Failed to send email', error as Error);
      throw error;
    }
  }
}

// src/index.ts
import { PluginContext, PluginHooks } from '@objectstack/runtime';
import { manifest } from './manifest';
import { EmailService } from './EmailService';

export class EmailSenderPlugin implements PluginHooks {
  private emailService?: EmailService;
  
  async onLoad(ctx: PluginContext): Promise<void> {
    // Create service
    this.emailService = new EmailService(ctx);
    await this.emailService.initialize();
    
    // Register service
    ctx.services.register('email', this.emailService);
    
    // Subscribe to user.created event
    ctx.events.on('user.created', async (data) => {
      await this.emailService!.sendEmail({
        to: data.email,
        subject: 'Welcome!',
        text: `Welcome ${data.name}!`
      });
    });
    
    ctx.logger.info('Email sender plugin loaded');
  }
  
  async onDisable(ctx: PluginContext): Promise<void> {
    // Clean up
    ctx.logger.info('Email sender plugin disabled');
  }
}

export { manifest };
```

---

## Resources

- [ObjectOS Documentation](https://objectos.dev)
- [@objectstack/spec Protocol](https://github.com/objectstack-ai/spec)
- [Example Plugins](https://github.com/objectstack-ai/objectos/tree/main/examples)
- [Community Discord](https://discord.gg/objectos)

---

*This guide is continuously updated. Check the [GitHub repository](https://github.com/objectstack-ai/objectos) for the latest version.*
