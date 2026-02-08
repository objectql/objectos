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
  TemplateData,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
import { NotificationChannel } from './types.js';
import { TemplateEngine } from './template-engine.js';
import { NotificationQueue } from './queue.js';
import { EmailChannel } from './channels/email.js';
import { SmsChannel } from './channels/sms.js';
import { PushChannel } from './channels/push.js';
import { WebhookChannel } from './channels/webhook.js';

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
  private startedAt?: number;
  
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
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();
    
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
   * Plugin lifecycle: Start
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[NotificationPlugin] Starting...');
    
    // Register HTTP routes for Notification API
    try {
      const httpServer = context.getService('http.server') as any;
      const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;
      if (rawApp) {
        // GET /api/v1/notifications/channels - List configured channels
        rawApp.get('/api/v1/notifications/channels', async (c: any) => {
          try {
            const channels: any[] = [];
            if (this.emailChannel) {
              channels.push({ 
                name: 'email', 
                type: NotificationChannel.Email,
                enabled: true,
                config: { 
                  from: this.config.email?.from,
                  host: this.config.email?.host ? 'configured' : 'not configured'
                }
              });
            }
            if (this.smsChannel) {
              channels.push({ 
                name: 'sms', 
                type: NotificationChannel.SMS,
                enabled: true,
                config: { provider: this.config.sms?.provider || 'default' }
              });
            }
            if (this.pushChannel) {
              channels.push({ 
                name: 'push', 
                type: NotificationChannel.Push,
                enabled: true,
                config: { provider: this.config.push?.provider || 'default' }
              });
            }
            if (this.webhookChannel) {
              channels.push({ 
                name: 'webhook', 
                type: NotificationChannel.Webhook,
                enabled: true,
                config: {}
              });
            }
            return c.json({ success: true, data: channels });
          } catch (error: any) {
            context.logger.error('[Notification API] Channels error:', error);
            return c.json({ success: false, error: error.message }, 500);
          }
        });

        // GET /api/v1/notifications/queue/status - Get queue status
        rawApp.get('/api/v1/notifications/queue/status', async (c: any) => {
          try {
            const status = this.getQueueStatus();
            return c.json({ success: true, data: status });
          } catch (error: any) {
            context.logger.error('[Notification API] Queue status error:', error);
            return c.json({ success: false, error: error.message }, 500);
          }
        });

        // POST /api/v1/notifications/send - Send notification
        rawApp.post('/api/v1/notifications/send', async (c: any) => {
          try {
            const request = await c.req.json();
            const result = await this.send(request);
            return c.json({ success: true, data: result });
          } catch (error: any) {
            context.logger.error('[Notification API] Send error:', error);
            return c.json({ success: false, error: error.message }, 500);
          }
        });

        context.logger.info('[NotificationPlugin] HTTP routes registered');
      }
    } catch (e: any) {
      context.logger.warn(`[NotificationPlugin] Could not register HTTP routes: ${e?.message}`);
    }
    
    context.logger.info('[NotificationPlugin] Started successfully');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<PluginHealthReport> {
    const channels: string[] = [];
    if (this.emailChannel) channels.push('email');
    if (this.smsChannel) channels.push('sms');
    if (this.pushChannel) channels.push('push');
    if (this.webhookChannel) channels.push('webhook');
    const status = channels.length > 0 ? 'healthy' : 'degraded';
    return {
      pluginName: this.name,
      pluginVersion: this.version,
      status,
      uptime: this.startedAt ? Date.now() - this.startedAt : 0,
      checks: [{ name: 'notification-channels', status, message: `Active channels: ${channels.join(', ') || 'none'}`, latency: 0, timestamp: new Date().toISOString() }],
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Capability manifest
   */
  getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
    return {
      capabilities: { services: ['notification'], emits: [], listens: [], routes: [], objects: [] },
      security: { requiredPermissions: [], handlesSensitiveData: true, makesExternalCalls: true, allowedDomains: ['*'] },
    };
  }

  /**
   * Startup result
   */
  getStartupResult(): PluginStartupResult {
    return { pluginName: this.name, success: !!this.context, duration: 0, servicesRegistered: ['notification'] };
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
