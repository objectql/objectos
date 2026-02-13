/**
 * Notification Plugin - Public API
 *
 * Export all public types and classes
 */

export { NotificationPlugin } from './plugin.js';
export { TemplateEngine } from './template-engine.js';
export { NotificationQueue } from './queue.js';

// Export channel implementations
export { EmailChannel } from './channels/email.js';
export { SmsChannel } from './channels/sms.js';
export { PushChannel } from './channels/push.js';
export { WebhookChannel } from './channels/webhook.js';

// Export all types
export type {
  NotificationConfig,
  NotificationRequest,
  NotificationResult,
  NotificationTemplate,
  NotificationPreference,
  NotificationLog,
  EmailConfig,
  SmsConfig,
  PushConfig,
  WebhookConfig,
  EmailOptions,
  SmsOptions,
  PushOptions,
  WebhookOptions,
  TemplateData,
  TemplateEngine as ITemplateEngine,
  QueuedNotification,
  NotificationChannelInterface,
} from './types.js';

export { NotificationChannel, NotificationStatus } from './types.js';
