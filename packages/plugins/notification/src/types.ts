/**
 * Notification System Types
 * 
 * Core type definitions for multi-channel notification system
 */

/**
 * Supported notification channels
 */
export enum NotificationChannel {
  Email = 'email',
  SMS = 'sms',
  Push = 'push',
  Webhook = 'webhook'
}

/**
 * Notification status
 */
export enum NotificationStatus {
  Pending = 'pending',
  Sending = 'sending',
  Sent = 'sent',
  Failed = 'failed',
  Retrying = 'retrying'
}

/**
 * Email configuration
 */
export interface EmailConfig {
  host: string;
  port: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
  replyTo?: string;
}

/**
 * SMS configuration (for future integration with Twilio/Aliyun)
 */
export interface SmsConfig {
  provider: 'twilio' | 'aliyun' | 'mock';
  accountSid?: string;
  authToken?: string;
  from?: string;
  apiKey?: string;
  apiSecret?: string;
}

/**
 * Push notification configuration (for future integration with Firebase/APNs)
 */
export interface PushConfig {
  provider: 'firebase' | 'apns' | 'mock';
  serverKey?: string;
  certificatePath?: string;
  keyId?: string;
  teamId?: string;
  bundleId?: string;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

/**
 * Template data for rendering
 */
export interface TemplateData {
  [key: string]: any;
}

/**
 * Template engine interface
 */
export interface TemplateEngine {
  compile(template: string): (data: TemplateData) => string;
  render(template: string, data: TemplateData): string;
}

/**
 * Complete notification plugin configuration
 */
export interface NotificationConfig {
  email?: EmailConfig;
  sms?: SmsConfig;
  push?: PushConfig;
  webhook?: WebhookConfig;
  templates?: {
    directory?: string;
    cache?: boolean;
  };
  queue?: {
    enabled?: boolean;
    maxRetries?: number;
    retryDelay?: number;
  };
}

/**
 * Email notification options
 */
export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
  template?: string;
  data?: TemplateData;
}

/**
 * SMS notification options
 */
export interface SmsOptions {
  to: string | string[];
  body: string;
  template?: string;
  data?: TemplateData;
}

/**
 * Push notification options
 */
export interface PushOptions {
  tokens: string | string[];
  title: string;
  body: string;
  data?: TemplateData;
  badge?: number;
  sound?: string;
}

/**
 * Webhook notification options
 */
export interface WebhookOptions {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  data: any;
  auth?: {
    type: 'basic' | 'bearer';
    username?: string;
    password?: string;
    token?: string;
  };
}

/**
 * Generic notification request
 */
export interface NotificationRequest {
  channel: NotificationChannel;
  recipient: string | string[];
  subject?: string;
  body?: string;
  template?: string;
  data?: TemplateData;
  options?: any;
}

/**
 * Notification result
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channel: NotificationChannel;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Queued notification item
 */
export interface QueuedNotification {
  id: string;
  request: NotificationRequest;
  status: NotificationStatus;
  attempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: string;
}

/**
 * Channel interface that all channels must implement
 */
export interface NotificationChannelInterface {
  send(request: NotificationRequest): Promise<NotificationResult>;
}
