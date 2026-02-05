/**
 * Notification Plugin for ObjectOS
 * 
 * Multi-channel notification system with Email, SMS, Push, and Webhook support
 * 
 * Features:
 * - Multiple notification channels (Email, SMS, Push, Webhook)
 * - Template rendering with Handlebars
 * - Async queue processing with retry logic
 * - Configurable SMTP, SMS providers, Push providers
 * - Extensible channel architecture
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { 
  NotificationConfig, 
  NotificationRequest, 
  NotificationResult,
  EmailOptions,
  SmsOptions,
  PushOptions,
  WebhookOptions,
  TemplateData
} from './types';
import { NotificationChannel } from './types';
import { TemplateEngine } from './template-engine';
import { NotificationQueue } from './queue';
import { EmailChannel } from './channels/email';
import { SmsChannel } from './channels/sms';
import { PushChannel } from './channels/push';
import { WebhookChannel } from './channels/webhook';

/**
 * Notification Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class NotificationPlugin implements Plugin {
  name = '@objectos/notification';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: NotificationConfig;
  private context?: PluginContext;
  private templateEngine: TemplateEngine;
  private queue?: NotificationQueue;
  
  private emailChannel?: EmailChannel;
  private smsChannel?: SmsChannel;
  private pushChannel?: PushChannel;
  private webhookChannel?: WebhookChannel;

  constructor(config: NotificationConfig = {}) {
    this.config = config;
    
    // Initialize template engine
    this.templateEngine = new TemplateEngine({
      cache: config.templates?.cache ?? true
    });

    // Initialize queue if enabled
    if (config.queue?.enabled !== false) {
      this.queue = new NotificationQueue({
        maxRetries: config.queue?.maxRetries ?? 3,
        retryDelay: config.queue?.retryDelay ?? 5000
      });
    }

    // Initialize channels
    this.initializeChannels();
  }

  /**
   * Initialize notification channels based on configuration
   */
  private initializeChannels(): void {
    // Email channel
    if (this.config.email) {
      this.emailChannel = new EmailChannel(this.config.email, this.templateEngine);
      this.queue?.registerChannel(NotificationChannel.Email, this.emailChannel);
    }

    // SMS channel
    if (this.config.sms) {
      this.smsChannel = new SmsChannel(this.config.sms, this.templateEngine);
      this.queue?.registerChannel(NotificationChannel.SMS, this.smsChannel);
    }

    // Push channel
    if (this.config.push) {
      this.pushChannel = new PushChannel(this.config.push);
      this.queue?.registerChannel(NotificationChannel.Push, this.pushChannel);
    }

    // Webhook channel (always available)
    this.webhookChannel = new WebhookChannel(this.config.webhook || {});
    this.queue?.registerChannel(NotificationChannel.Webhook, this.webhookChannel);
  }

  /**
   * Plugin lifecycle: Initialize
   */
  async init(context: PluginContext): Promise<void> {
    this.context = context;
    
    // Register notification service
    context.registerService('notification', {
      send: this.send.bind(this),
      sendEmail: this.sendEmail.bind(this),
      sendSMS: this.sendSMS.bind(this),
      sendPush: this.sendPush.bind(this),
      sendWebhook: this.sendWebhook.bind(this),
      renderTemplate: this.renderTemplate.bind(this),
      getQueueStatus: this.getQueueStatus.bind(this)
    });

    context.logger.info('[NotificationPlugin] Initialized successfully');
  }

  /**
   * Plugin lifecycle: Cleanup
   */
  async destroy(): Promise<void> {
    // Stop queue processing
    this.queue?.stop();
    
    this.context?.logger.info('[NotificationPlugin] Destroyed');
  }

  /**
   * Send a notification via specified channel
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      // Validate channel
      const channel = this.getChannel(request.channel);
      if (!channel) {
        throw new Error(`Channel ${request.channel} is not configured`);
      }

      // Queue if enabled, otherwise send immediately
      if (this.queue && this.config.queue?.enabled !== false) {
        const id = this.queue.enqueue(request);
        return {
          success: true,
          messageId: id,
          channel: request.channel,
          timestamp: new Date(),
          metadata: { queued: true }
        };
      } else {
        return await channel.send(request);
      }
    } catch (error) {
      return {
        success: false,
        channel: request.channel,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    options?: Partial<EmailOptions>
  ): Promise<NotificationResult> {
    if (!this.emailChannel) {
      return {
        success: false,
        channel: NotificationChannel.Email,
        error: 'Email channel is not configured',
        timestamp: new Date()
      };
    }

    const emailOptions: EmailOptions = {
      to,
      subject,
      body,
      ...options
    };

    return this.emailChannel.sendEmail(emailOptions);
  }

  /**
   * Send SMS notification
   */
  async sendSMS(
    to: string | string[],
    body: string,
    options?: Partial<SmsOptions>
  ): Promise<NotificationResult> {
    if (!this.smsChannel) {
      return {
        success: false,
        channel: NotificationChannel.SMS,
        error: 'SMS channel is not configured',
        timestamp: new Date()
      };
    }

    const smsOptions: SmsOptions = {
      to,
      body,
      ...options
    };

    return this.smsChannel.sendSMS(smsOptions);
  }

  /**
   * Send push notification
   */
  async sendPush(
    tokens: string | string[],
    title: string,
    body: string,
    options?: Partial<PushOptions>
  ): Promise<NotificationResult> {
    if (!this.pushChannel) {
      return {
        success: false,
        channel: NotificationChannel.Push,
        error: 'Push channel is not configured',
        timestamp: new Date()
      };
    }

    const pushOptions: PushOptions = {
      tokens,
      title,
      body,
      ...options
    };

    return this.pushChannel.sendPush(pushOptions);
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(
    url: string,
    data: any,
    options?: Partial<WebhookOptions>
  ): Promise<NotificationResult> {
    if (!this.webhookChannel) {
      return {
        success: false,
        channel: NotificationChannel.Webhook,
        error: 'Webhook channel is not configured',
        timestamp: new Date()
      };
    }

    const webhookOptions: WebhookOptions = {
      url,
      data,
      ...options
    };

    return this.webhookChannel.sendWebhook(webhookOptions);
  }

  /**
   * Render a template with data
   */
  renderTemplate(template: string, data: TemplateData): string {
    return this.templateEngine.render(template, data);
  }

  /**
   * Get queue status (if queue is enabled)
   */
  getQueueStatus(): any {
    if (!this.queue) {
      return { enabled: false };
    }
    return {
      enabled: true,
      ...this.queue.getStatus()
    };
  }

  /**
   * Get the appropriate channel for a notification type
   */
  private getChannel(channel: NotificationChannel): any {
    switch (channel) {
      case NotificationChannel.Email:
        return this.emailChannel;
      case NotificationChannel.SMS:
        return this.smsChannel;
      case NotificationChannel.Push:
        return this.pushChannel;
      case NotificationChannel.Webhook:
        return this.webhookChannel;
      default:
        return null;
    }
  }
}
