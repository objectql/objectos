# @objectos/plugin-notification

Multi-channel notification system plugin for ObjectOS with support for Email, SMS, Push Notifications, and Webhooks.

## Features

- **Multi-Channel Support**: Email (SMTP), SMS, Push Notifications, and Webhooks
- **Template Engine**: Handlebars-based template rendering with caching
- **Async Queue**: Background processing with retry logic and FIFO ordering
- **Extensible Architecture**: Easy to add new notification channels
- **Type-Safe**: Full TypeScript support with strict typing
- **Configurable**: Flexible configuration for each channel
- **Production Ready**: Error handling, logging, and monitoring built-in

## Installation

```bash
npm install @objectos/plugin-notification
```

### Optional Dependencies

Install based on the channels you plan to use:

```bash
# For Email support
npm install nodemailer

# For template rendering
npm install handlebars

# For Webhook support
npm install axios
```

## Quick Start

```typescript
import { NotificationPlugin } from '@objectos/plugin-notification';

// Create plugin instance
const notificationPlugin = new NotificationPlugin({
  email: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password'
    },
    from: 'noreply@yourapp.com'
  },
  queue: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 5000
  }
});

// Load in ObjectOS kernel
await kernel.loadPlugin(notificationPlugin);

// Use the service
const notificationService = kernel.getService('notification');

// Send email
await notificationService.sendEmail(
  'user@example.com',
  'Welcome!',
  'Thank you for signing up.'
);
```

## Configuration

### Email Configuration (SMTP)

```typescript
{
  email: {
    host: 'smtp.gmail.com',        // SMTP server hostname
    port: 587,                      // SMTP port (587 for TLS, 465 for SSL)
    secure: false,                  // true for SSL, false for TLS
    auth: {
      user: 'your-email@gmail.com', // SMTP username
      pass: 'your-password'          // SMTP password
    },
    from: 'noreply@yourapp.com',   // Default sender address
    replyTo: 'support@yourapp.com' // Optional reply-to address
  }
}
```

#### Popular SMTP Providers

**Gmail:**
```typescript
{
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'you@gmail.com', pass: 'app-password' }
}
```

**SendGrid:**
```typescript
{
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  auth: { user: 'apikey', pass: 'your-api-key' }
}
```

**Mailgun:**
```typescript
{
  host: 'smtp.mailgun.org',
  port: 587,
  secure: false,
  auth: { user: 'postmaster@your-domain', pass: 'your-password' }
}
```

### SMS Configuration

```typescript
{
  sms: {
    provider: 'mock',              // 'mock', 'twilio', or 'aliyun'
    from: '+1234567890',           // Sender phone number
    
    // Twilio-specific
    accountSid: 'AC...',
    authToken: 'your-auth-token',
    
    // Aliyun-specific
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret'
  }
}
```

> **Note:** SMS integration with Twilio and Aliyun is currently a stub. You'll need to implement the actual API calls in `src/channels/sms.ts`.

### Push Notification Configuration

```typescript
{
  push: {
    provider: 'mock',              // 'mock', 'firebase', or 'apns'
    
    // Firebase-specific
    serverKey: 'your-server-key',
    
    // APNs-specific
    certificatePath: '/path/to/cert.p8',
    keyId: 'your-key-id',
    teamId: 'your-team-id',
    bundleId: 'com.yourapp.bundle'
  }
}
```

> **Note:** Push notification integration is currently a stub. Implement actual integrations in `src/channels/push.ts`.

### Webhook Configuration

```typescript
{
  webhook: {
    timeout: 10000,                // Request timeout in ms
    retryAttempts: 3,              // Number of retry attempts
    retryDelay: 1000,              // Delay between retries in ms
    headers: {                     // Default headers for all webhooks
      'X-App-Name': 'YourApp'
    }
  }
}
```

### Queue Configuration

```typescript
{
  queue: {
    enabled: true,                 // Enable/disable queue
    maxRetries: 3,                 // Max retry attempts for failed notifications
    retryDelay: 5000              // Delay between retries in ms
  }
}
```

### Template Configuration

```typescript
{
  templates: {
    directory: './templates',      // Template directory path
    cache: true                    // Enable template caching
  }
}
```

## API Reference

### Service Methods

#### `send(request: NotificationRequest): Promise<NotificationResult>`

Generic send method for any notification channel.

```typescript
await notificationService.send({
  channel: NotificationChannel.Email,
  recipient: 'user@example.com',
  subject: 'Test',
  body: 'Test message',
  template: 'Hello {{name}}!',
  data: { name: 'John' }
});
```

#### `sendEmail(to, subject, body, options?): Promise<NotificationResult>`

Send email notification.

```typescript
// Simple email
await notificationService.sendEmail(
  'user@example.com',
  'Welcome',
  'Thank you for signing up!'
);

// With template
await notificationService.sendEmail(
  'user@example.com',
  'Welcome {{userName}}',
  '',
  {
    template: '<h1>Welcome {{userName}}!</h1>',
    data: { userName: 'John Doe' }
  }
);

// With attachments
await notificationService.sendEmail(
  'user@example.com',
  'Invoice',
  'Please find attached invoice.',
  {
    attachments: [
      {
        filename: 'invoice.pdf',
        path: '/path/to/invoice.pdf'
      }
    ]
  }
);

// Multiple recipients
await notificationService.sendEmail(
  ['user1@example.com', 'user2@example.com'],
  'Announcement',
  'Important update'
);
```

#### `sendSMS(to, body, options?): Promise<NotificationResult>`

Send SMS notification.

```typescript
// Simple SMS
await notificationService.sendSMS(
  '+1234567890',
  'Your verification code is 123456'
);

// With template
await notificationService.sendSMS(
  '+1234567890',
  '',
  {
    template: 'Hi {{name}}, your code is {{code}}',
    data: { name: 'John', code: '123456' }
  }
);

// Multiple recipients
await notificationService.sendSMS(
  ['+1111111111', '+2222222222'],
  'Broadcast message'
);
```

#### `sendPush(tokens, title, body, options?): Promise<NotificationResult>`

Send push notification.

```typescript
// Simple push
await notificationService.sendPush(
  'device_token_123',
  'New Message',
  'You have a new message from John'
);

// With custom data
await notificationService.sendPush(
  'device_token_123',
  'Order Update',
  'Your order has shipped',
  {
    data: {
      orderId: '12345',
      status: 'shipped'
    },
    badge: 1,
    sound: 'default'
  }
);

// Multiple devices
await notificationService.sendPush(
  ['token1', 'token2', 'token3'],
  'Announcement',
  'New feature available!'
);
```

#### `sendWebhook(url, data, options?): Promise<NotificationResult>`

Send webhook notification.

```typescript
// Simple webhook
await notificationService.sendWebhook(
  'https://example.com/webhook',
  {
    event: 'user.created',
    userId: '123',
    timestamp: new Date()
  }
);

// With custom headers
await notificationService.sendWebhook(
  'https://example.com/webhook',
  { event: 'test' },
  {
    headers: {
      'X-Custom-Header': 'value'
    }
  }
);

// With authentication
await notificationService.sendWebhook(
  'https://example.com/webhook',
  { event: 'test' },
  {
    auth: {
      type: 'bearer',
      token: 'your-secret-token'
    }
  }
);

// Basic auth
await notificationService.sendWebhook(
  'https://example.com/webhook',
  { event: 'test' },
  {
    auth: {
      type: 'basic',
      username: 'user',
      password: 'pass'
    }
  }
);
```

#### `renderTemplate(template, data): string`

Render a template with data.

```typescript
const html = notificationService.renderTemplate(
  '<h1>Hello {{userName}}!</h1><p>Welcome to {{appName}}</p>',
  {
    userName: 'John Doe',
    appName: 'MyApp'
  }
);
```

#### `getQueueStatus(): QueueStatus`

Get current queue status.

```typescript
const status = notificationService.getQueueStatus();
console.log(status);
// {
//   enabled: true,
//   total: 5,
//   pending: 2,
//   sending: 1,
//   retrying: 2,
//   items: [...]
// }
```

## Template System

The plugin uses Handlebars for template rendering.

### Basic Variables

```handlebars
Hello {{userName}}!
Your email is {{userEmail}}.
```

### Nested Data

```handlebars
User: {{user.name}}
Email: {{user.email}}
Order: {{order.id}}
```

### Conditionals

```handlebars
{{#if isPremium}}
  Premium features enabled!
{{else}}
  Upgrade to premium!
{{/if}}
```

### Loops

```handlebars
{{#each items}}
  - {{this.name}}: ${{this.price}}
{{/each}}
```

### Built-in Helpers

```handlebars
{{upper userName}}           <!-- Uppercase -->
{{lower email}}              <!-- Lowercase -->
{{formatDate createdAt 'short'}}  <!-- Date formatting -->
{{#if (eq status 'active')}} <!-- Equality check -->
  Active
{{/if}}
```

### Example Templates

**Welcome Email:**
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Welcome {{userName}}!</h1>
  <p>Thank you for joining {{appName}}.</p>
  <p>Your account email: {{userEmail}}</p>
</body>
</html>
```

**Password Reset:**
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Password Reset</h1>
  <p>Hi {{userName}},</p>
  <p>Click below to reset your password:</p>
  <a href="{{resetLink}}">Reset Password</a>
  <p>Link expires in {{expiryHours}} hours.</p>
</body>
</html>
```

**SMS Template:**
```handlebars
Hi {{userName}}, your verification code is {{code}}. Valid for {{minutes}} minutes.
```

## Queue System

The notification queue provides async processing with retry logic.

### How It Works

1. **Enqueue**: Notifications are added to an in-memory FIFO queue
2. **Process**: Background worker processes notifications sequentially
3. **Retry**: Failed notifications are retried with configurable delay
4. **Remove**: Successfully sent or max-retried notifications are removed

### Queue vs Direct Send

**With Queue (Default):**
```typescript
// Returns immediately with queue ID
const result = await notificationService.send({
  channel: NotificationChannel.Email,
  recipient: 'user@example.com',
  body: 'Message'
});
// result.metadata.queued === true
```

**Without Queue:**
```typescript
const plugin = new NotificationPlugin({
  queue: { enabled: false }
});

// Waits for actual send completion
const result = await notificationService.sendEmail(...);
// result.success indicates actual send status
```

### Monitoring Queue

```typescript
const status = notificationService.getQueueStatus();

console.log(`Total in queue: ${status.total}`);
console.log(`Pending: ${status.pending}`);
console.log(`Sending: ${status.sending}`);
console.log(`Retrying: ${status.retrying}`);

// Inspect individual items
status.items.forEach(item => {
  console.log(`${item.id}: ${item.status} (${item.attempts} attempts)`);
});
```

## Best Practices

### 1. Use Environment Variables

```typescript
const notificationPlugin = new NotificationPlugin({
  email: {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    },
    from: process.env.EMAIL_FROM!
  }
});
```

### 2. Template Organization

Store templates in files:

```typescript
import fs from 'fs';

const welcomeTemplate = fs.readFileSync(
  './templates/welcome-email.hbs',
  'utf-8'
);

await notificationService.sendEmail(
  user.email,
  'Welcome!',
  '',
  {
    template: welcomeTemplate,
    data: { userName: user.name }
  }
);
```

### 3. Error Handling

```typescript
try {
  const result = await notificationService.sendEmail(...);
  
  if (!result.success) {
    logger.error('Email failed:', result.error);
    // Handle failure (e.g., retry, alert admin)
  }
} catch (error) {
  logger.error('Notification error:', error);
}
```

### 4. Batch Notifications

```typescript
// Good: Single call with multiple recipients
await notificationService.sendEmail(
  ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  'Announcement',
  'Important update'
);

// Avoid: Multiple individual calls in a loop
```

### 5. Use Queue for Non-Critical Notifications

```typescript
// Critical: Disable queue for immediate feedback
const plugin = new NotificationPlugin({
  email: { ... },
  queue: { enabled: false }
});

await notificationService.sendEmail('user@example.com', 'OTP', code);

// Non-critical: Use queue for async processing
const plugin = new NotificationPlugin({
  email: { ... },
  queue: { enabled: true }
});

await notificationService.sendEmail('user@example.com', 'Newsletter', content);
```

## Security Considerations

### 1. Protect Credentials

- Never commit SMTP passwords or API keys to version control
- Use environment variables or secret management systems
- Rotate credentials regularly

### 2. Validate Recipients

```typescript
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

if (!isValidEmail(recipient)) {
  throw new Error('Invalid email address');
}

await notificationService.sendEmail(recipient, ...);
```

### 3. Rate Limiting

```typescript
// Implement rate limiting for user-triggered notifications
const rateLimit = new Map<string, number>();

function checkRateLimit(userId: string): boolean {
  const lastSent = rateLimit.get(userId) || 0;
  const now = Date.now();
  
  if (now - lastSent < 60000) { // 1 minute
    return false;
  }
  
  rateLimit.set(userId, now);
  return true;
}
```

### 4. Sanitize User Input

```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

const body = sanitizeInput(userInput);
await notificationService.sendSMS(phoneNumber, body);
```

### 5. Use TLS/SSL

```typescript
{
  email: {
    host: 'smtp.example.com',
    port: 587,
    secure: false,  // Use TLS (STARTTLS)
    // OR
    port: 465,
    secure: true,   // Use SSL
  }
}
```

## Extending the Plugin

### Adding a New Channel

1. **Create channel class** in `src/channels/`:

```typescript
// src/channels/slack.ts
import type { NotificationChannelInterface, NotificationRequest, NotificationResult } from '../types';

export class SlackChannel implements NotificationChannelInterface {
  async send(request: NotificationRequest): Promise<NotificationResult> {
    // Implement Slack API call
    return {
      success: true,
      messageId: 'slack_123',
      channel: 'slack' as any,
      timestamp: new Date()
    };
  }
}
```

2. **Register in plugin**:

```typescript
// In src/plugin.ts
import { SlackChannel } from './channels/slack';

this.slackChannel = new SlackChannel(this.config.slack);
this.queue?.registerChannel('slack' as any, this.slackChannel);
```

3. **Add configuration type**:

```typescript
// In src/types.ts
export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
}

export interface NotificationConfig {
  // ... existing
  slack?: SlackConfig;
}
```

## Troubleshooting

### Email Not Sending

1. Check SMTP credentials
2. Verify `nodemailer` is installed
3. Check firewall/network settings
4. Enable debug logging

```typescript
// Add to email config
{
  email: {
    // ... other config
    debug: true,
    logger: true
  }
}
```

### Queue Not Processing

1. Ensure queue is enabled
2. Check that channels are registered
3. Verify no unhandled exceptions

```typescript
const status = notificationService.getQueueStatus();
console.log('Queue status:', status);
```

### Templates Not Rendering

1. Verify `handlebars` is installed
2. Check template syntax
3. Ensure data matches template variables

```typescript
// Test template directly
const result = notificationService.renderTemplate(
  'Hello {{name}}!',
  { name: 'Test' }
);
console.log(result); // Should be: "Hello Test!"
```

## License

AGPL-3.0

## Contributing

Contributions are welcome! Please follow the ObjectOS contribution guidelines.

## Support

For issues and questions, please open an issue on the ObjectOS repository.
