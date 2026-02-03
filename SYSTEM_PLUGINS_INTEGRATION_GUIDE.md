# System Plugins Integration Guide

This guide shows how to use the new ObjectOS system plugins together to build powerful features.

## Plugin Overview

ObjectOS now includes 5 core system plugins:

1. **@objectos/plugin-storage** - Persistent key-value storage
2. **@objectos/plugin-cache** - High-performance caching
3. **@objectos/plugin-metrics** - Monitoring and metrics
4. **@objectos/plugin-i18n** - Internationalization
5. **@objectos/plugin-notification** - Multi-channel notifications

## Installation

```bash
# Install all system plugins
pnpm add @objectos/plugin-storage
pnpm add @objectos/plugin-cache
pnpm add @objectos/plugin-metrics
pnpm add @objectos/plugin-i18n
pnpm add @objectos/plugin-notification

# Optional backend dependencies
pnpm add better-sqlite3  # For SQLite storage
pnpm add ioredis         # For Redis storage/cache
pnpm add nodemailer      # For email notifications
```

## Basic Setup

```typescript
import { ObjectOS } from '@objectstack/runtime';
import { StoragePlugin } from '@objectos/plugin-storage';
import { CachePlugin } from '@objectos/plugin-cache';
import { MetricsPlugin } from '@objectos/plugin-metrics';
import { I18nPlugin } from '@objectos/plugin-i18n';
import { NotificationPlugin } from '@objectos/plugin-notification';

// Create ObjectOS instance
const os = new ObjectOS();

// Register plugins
await os.registerPlugin(new StoragePlugin({ backend: 'memory' }));
await os.registerPlugin(new CachePlugin({ backend: 'lru', options: { maxSize: 1000 } }));
await os.registerPlugin(new MetricsPlugin({ enabled: true }));
await os.registerPlugin(new I18nPlugin({ defaultLocale: 'en' }));
await os.registerPlugin(new NotificationPlugin({ /* config */ }));

// Start the system
await os.start();
```

## Integration Examples

### Example 1: Cached Translations

Use cache to optimize i18n lookups:

```typescript
import type { Plugin, PluginContext } from '@objectstack/runtime';

class MyAppPlugin implements Plugin {
  name = 'my-app';
  version = '1.0.0';
  
  private cache: any;
  private i18n: any;
  
  async init(context: PluginContext) {
    this.cache = context.getService('cache');
    this.i18n = context.getService('i18n');
  }
  
  async getTranslation(key: string, locale: string): Promise<string> {
    // Try cache first
    const cacheKey = `i18n:${locale}:${key}`;
    let translation = await this.cache.get(cacheKey);
    
    if (!translation) {
      // Cache miss - get from i18n
      this.i18n.setLocale(locale);
      translation = this.i18n.t(key);
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, translation, 3600);
    }
    
    return translation;
  }
}
```

### Example 2: Metrics + Notifications

Send alerts when metrics exceed thresholds:

```typescript
class MonitoringPlugin implements Plugin {
  name = 'monitoring';
  version = '1.0.0';
  
  private metrics: any;
  private notification: any;
  
  async init(context: PluginContext) {
    this.metrics = context.getService('metrics');
    this.notification = context.getService('notification');
    
    // Monitor error rate every minute
    setInterval(() => this.checkErrorRate(), 60000);
  }
  
  private async checkErrorRate() {
    const errorMetric = this.metrics.getMetric('app.errors.total');
    
    if (errorMetric && errorMetric.value > 100) {
      // Alert via email
      await this.notification.sendEmail(
        'admin@example.com',
        'High Error Rate Alert',
        `Error count: ${errorMetric.value}`
      );
      
      // Also send webhook to Slack
      await this.notification.sendWebhook(
        'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        {
          text: `⚠️ High error rate detected: ${errorMetric.value} errors`
        }
      );
    }
  }
}
```

### Example 3: Multi-Language Notifications

Combine i18n + notifications for localized emails:

```typescript
class UserNotificationPlugin implements Plugin {
  name = 'user-notifications';
  version = '1.0.0';
  
  private i18n: any;
  private notification: any;
  private storage: any;
  
  async init(context: PluginContext) {
    this.i18n = context.getService('i18n');
    this.notification = context.getService('notification');
    this.storage = context.getService('storage').getScopedStorage(this.name);
    
    // Load translations
    this.i18n.loadTranslations('en', {
      welcome: {
        subject: 'Welcome to {{appName}}!',
        body: 'Hello {{name}}, thanks for joining us!'
      }
    });
    
    this.i18n.loadTranslations('zh', {
      welcome: {
        subject: '欢迎来到 {{appName}}！',
        body: '您好 {{name}}，感谢您的加入！'
      }
    });
  }
  
  async sendWelcomeEmail(user: { email: string; name: string; locale: string }) {
    // Get user's preferred locale from storage or use default
    const userLocale = await this.storage.get(`user:${user.email}:locale`) || user.locale || 'en';
    
    // Set locale for translations
    this.i18n.setLocale(userLocale);
    
    // Get localized content
    const subject = this.i18n.t('welcome.subject', { appName: 'ObjectOS' });
    const body = this.i18n.t('welcome.body', { name: user.name });
    
    // Send email
    await this.notification.sendEmail(user.email, subject, body);
  }
}
```

### Example 4: Rate-Limited API with Metrics

Use storage for rate limiting and metrics for tracking:

```typescript
class RateLimitPlugin implements Plugin {
  name = 'rate-limit';
  version = '1.0.0';
  
  private storage: any;
  private metrics: any;
  
  async init(context: PluginContext) {
    this.storage = context.getService('storage').getScopedStorage(this.name);
    this.metrics = context.getService('metrics');
  }
  
  async checkRateLimit(userId: string, limit: number = 100): Promise<boolean> {
    const key = `rate:${userId}:${Date.now() / 60000 | 0}`; // Per minute
    
    // Get current count
    const count = await this.storage.get(key) || 0;
    
    if (count >= limit) {
      // Track rate limit hits
      this.metrics.incrementCounter('api.rate_limit.exceeded', 1, { userId });
      return false;
    }
    
    // Increment counter with 60s TTL
    await this.storage.set(key, count + 1, 60);
    
    // Track successful requests
    this.metrics.incrementCounter('api.requests.total', 1, { userId });
    
    return true;
  }
}
```

### Example 5: Feature Flags with Cache

Use storage for feature flags with cache layer:

```typescript
class FeatureFlagPlugin implements Plugin {
  name = 'feature-flags';
  version = '1.0.0';
  
  private storage: any;
  private cache: any;
  
  async init(context: PluginContext) {
    this.storage = context.getService('storage').getScopedStorage(this.name);
    this.cache = context.getService('cache').getScopedCache(this.name);
  }
  
  async isEnabled(feature: string, userId?: string): Promise<boolean> {
    const cacheKey = userId ? `flag:${feature}:${userId}` : `flag:${feature}`;
    
    // Check cache first
    let enabled = await this.cache.get(cacheKey);
    
    if (enabled === undefined) {
      // Check storage
      const globalFlag = await this.storage.get(`flag:${feature}`);
      
      if (userId) {
        // Check user-specific override
        const userFlag = await this.storage.get(`flag:${feature}:user:${userId}`);
        enabled = userFlag !== undefined ? userFlag : globalFlag;
      } else {
        enabled = globalFlag;
      }
      
      // Cache for 5 minutes
      await this.cache.set(cacheKey, enabled ?? false, 300);
    }
    
    return enabled ?? false;
  }
  
  async setFlag(feature: string, enabled: boolean, userId?: string): Promise<void> {
    const key = userId ? `flag:${feature}:user:${userId}` : `flag:${feature}`;
    await this.storage.set(key, enabled);
    
    // Invalidate cache
    const cacheKey = userId ? `flag:${feature}:${userId}` : `flag:${feature}`;
    await this.cache.delete(cacheKey);
  }
}
```

### Example 6: Session Management

Complete session management using storage, cache, and metrics:

```typescript
interface Session {
  userId: string;
  data: any;
  createdAt: number;
  lastAccess: number;
}

class SessionPlugin implements Plugin {
  name = 'sessions';
  version = '1.0.0';
  
  private storage: any;
  private cache: any;
  private metrics: any;
  
  async init(context: PluginContext) {
    this.storage = context.getService('storage').getScopedStorage(this.name);
    this.cache = context.getService('cache').getScopedCache(this.name);
    this.metrics = context.getService('metrics');
  }
  
  async createSession(userId: string, data: any): Promise<string> {
    const sessionId = this.generateSessionId();
    const session: Session = {
      userId,
      data,
      createdAt: Date.now(),
      lastAccess: Date.now()
    };
    
    // Store in both storage (persistent) and cache (fast access)
    await this.storage.set(`session:${sessionId}`, session, 86400); // 24 hours
    await this.cache.set(`session:${sessionId}`, session, 3600); // 1 hour cache
    
    // Track metric
    this.metrics.incrementCounter('sessions.created', 1, { userId });
    
    return sessionId;
  }
  
  async getSession(sessionId: string): Promise<Session | null> {
    // Try cache first
    let session = await this.cache.get(`session:${sessionId}`);
    
    if (!session) {
      // Cache miss - get from storage
      session = await this.storage.get(`session:${sessionId}`);
      
      if (session) {
        // Refresh cache
        await this.cache.set(`session:${sessionId}`, session, 3600);
        this.metrics.incrementCounter('sessions.cache.miss', 1);
      }
    } else {
      this.metrics.incrementCounter('sessions.cache.hit', 1);
    }
    
    if (session) {
      // Update last access
      session.lastAccess = Date.now();
      await this.storage.set(`session:${sessionId}`, session, 86400);
    }
    
    return session;
  }
  
  async destroySession(sessionId: string): Promise<void> {
    await this.storage.delete(`session:${sessionId}`);
    await this.cache.delete(`session:${sessionId}`);
    this.metrics.incrementCounter('sessions.destroyed', 1);
  }
  
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
```

## Best Practices

### 1. Use Scoped Storage/Cache
Always use scoped instances to avoid conflicts:

```typescript
const storage = context.getService('storage').getScopedStorage('my-plugin');
const cache = context.getService('cache').getScopedCache('my-plugin');
```

### 2. Cache Invalidation
Always invalidate cache when data changes:

```typescript
await storage.set('user:123', userData);
await cache.delete('user:123'); // Invalidate cache
```

### 3. Metrics for Everything
Track important operations:

```typescript
metrics.incrementCounter('operation.success', 1, { operation: 'login' });
metrics.recordHistogram('operation.duration', duration, { operation: 'login' });
```

### 4. Graceful Fallbacks
Handle missing services gracefully:

```typescript
const i18n = context.hasService('i18n') ? context.getService('i18n') : null;
const text = i18n ? i18n.t('key') : 'Default text';
```

### 5. Error Handling
Always wrap service calls in try-catch:

```typescript
try {
  await notification.sendEmail(...);
} catch (error) {
  context.logger.error('Failed to send email:', error);
  metrics.incrementCounter('notification.errors', 1);
}
```

## Production Configuration

### Storage (PostgreSQL + Redis)

```typescript
new StoragePlugin({
  backend: 'redis',
  options: {
    host: process.env.REDIS_HOST,
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'objectos:storage:'
  }
})
```

### Cache (Redis)

```typescript
new CachePlugin({
  backend: 'redis',
  options: {
    host: process.env.REDIS_HOST,
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'objectos:cache:'
  }
})
```

### Metrics (Prometheus)

```typescript
new MetricsPlugin({
  enabled: true,
  prefix: 'objectos_',
  defaultLabels: {
    app: 'my-app',
    env: process.env.NODE_ENV
  }
})
```

### Notifications (Production)

```typescript
new NotificationPlugin({
  email: {
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    from: 'noreply@example.com'
  },
  sms: {
    provider: 'twilio',
    accountSid: process.env.TWILIO_SID,
    authToken: process.env.TWILIO_TOKEN,
    from: process.env.TWILIO_PHONE
  },
  queue: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 5000
  }
})
```

## Monitoring

### Expose Prometheus Metrics

```typescript
// In your HTTP server
app.get('/metrics', (req, res) => {
  const metrics = kernel.getService('metrics');
  res.set('Content-Type', 'text/plain');
  res.send(metrics.exportPrometheus());
});
```

### Health Check

```typescript
app.get('/health', async (req, res) => {
  const storage = kernel.getService('storage');
  const cache = kernel.getService('cache');
  
  try {
    await storage.get('health-check');
    await cache.get('health-check');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});
```

## Next Steps

- See individual plugin READMEs for detailed API documentation
- Check [PHASE_3_IMPLEMENTATION_SUMMARY.md](./PHASE_3_IMPLEMENTATION_SUMMARY.md) for complete feature list
- Review test files for more usage examples
