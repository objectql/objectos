/**
 * Notification Plugin - Public API
 * 
 * Export all public types and classes
 */

export { NotificationPlugin } from './plugin';
export { TemplateEngine } from './template-engine';
export { NotificationQueue } from './queue';

// Export channel implementations
export { EmailChannel } from './channels/email';
export { SmsChannel } from './channels/sms';
export { PushChannel } from './channels/push';
export { WebhookChannel } from './channels/webhook';

// Export all types
export type {
  NotificationConfig,
  NotificationRequest,
  NotificationResult,
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
  NotificationChannelInterface
} from './types';

export { 
  NotificationChannel,
  NotificationStatus
} from './types';
