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
import type { INotificationService, NotificationMessage as SpecNotificationMessage, NotificationResult as SpecNotificationResult, NotificationChannel as SpecNotificationChannel } from '@objectstack/spec/contracts';
import type { 
  NotificationConfig, 
  NotificationRequest, 
  NotificationResult,
  NotificationTemplate,
  NotificationPreference,
  NotificationLog,
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
export class NotificationPlugin implements Plugin, INotificationService {
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

  private templates: Map<string, NotificationTemplate> = new Map();
  private preferences: Map<string, NotificationPreference> = new Map();
  private logs: NotificationLog[] = [];

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
      getQueueStatus: this.getQueueStatus.bind(this),
      saveTemplate: this.saveTemplate.bind(this),
      getTemplate: this.getTemplate.bind(this),
      listTemplates: this.listTemplates.bind(this),
      deleteTemplate: this.deleteTemplate.bind(this),
      savePreference: this.savePreference.bind(this),
      getPreference: this.getPreference.bind(this),
      getNotificationLogs: this.getNotificationLogs.bind(this),
    });

    context.logger.info('[NotificationPlugin] Initialized successfully');
    await context.trigger('plugin.initialized', { plugin: this.name });
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
    await context.trigger('plugin.started', { plugin: this.name });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<PluginHealthReport> {
    const start = Date.now();
    const channels: string[] = [];
    if (this.emailChannel) channels.push('email');
    if (this.smsChannel) channels.push('sms');
    if (this.pushChannel) channels.push('push');
    if (this.webhookChannel) channels.push('webhook');
    const status = channels.length > 0 ? 'healthy' : 'degraded';
    const message = `Active channels: ${channels.join(', ') || 'none'}`;
    return {
      status,
      timestamp: new Date().toISOString(),
      message,
      metrics: {
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        responseTime: Date.now() - start,
      },
      checks: [{ name: 'notification-channels', status: status === 'healthy' ? 'passed' : 'warning', message }],
    };
  }

  /**
   * Capability manifest
   */
  getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
    return {
      capabilities: {
        provides: [{
          id: 'com.objectstack.service.notification',
          name: 'notification',
          version: { major: 0, minor: 1, patch: 0 },
          methods: [
            { name: 'send', description: 'Send a notification via specified channel', returnType: 'Promise<NotificationResult>', async: true },
            { name: 'sendEmail', description: 'Send email notification', async: true },
            { name: 'sendSMS', description: 'Send SMS notification', async: true },
            { name: 'sendPush', description: 'Send push notification', async: true },
            { name: 'sendWebhook', description: 'Send webhook notification', async: true },
            { name: 'renderTemplate', description: 'Render a template with data', returnType: 'string', async: false },
            { name: 'getQueueStatus', description: 'Get notification queue status', async: false },
          ],
          stability: 'stable',
        }],
        requires: [],
      },
      security: {
        pluginId: 'notification',
        trustLevel: 'trusted',
        permissions: { permissions: [], defaultGrant: 'deny' },
        sandbox: { enabled: false, level: 'none' },
      },
    };
  }

  /**
   * Startup result
   */
  getStartupResult(): PluginStartupResult {
    return { plugin: { name: this.name, version: this.version }, success: !!this.context, duration: 0 };
  }

  /**
   * Plugin lifecycle: Cleanup
   */
  async destroy(): Promise<void> {
    // Stop queue processing
    this.queue?.stop();
    
    this.context?.logger.info('[NotificationPlugin] Destroyed');
    await this.context?.trigger('plugin.destroyed', { plugin: this.name });
  }

  /**
   * Send a notification via specified channel
   * Supports both local NotificationRequest and spec NotificationMessage
   */
  async send(request: NotificationRequest): Promise<NotificationResult>;
  async send(message: SpecNotificationMessage): Promise<SpecNotificationResult>;
  async send(input: NotificationRequest | SpecNotificationMessage): Promise<NotificationResult | SpecNotificationResult> {
    // Adapt spec NotificationMessage to local NotificationRequest if needed
    const request: NotificationRequest = 'recipient' in input
      ? input as NotificationRequest
      : {
          channel: (input as SpecNotificationMessage).channel as unknown as NotificationChannel,
          recipient: (input as SpecNotificationMessage).to,
          subject: (input as SpecNotificationMessage).subject,
          body: (input as SpecNotificationMessage).body,
          template: (input as SpecNotificationMessage).templateId,
          data: (input as SpecNotificationMessage).templateData as TemplateData | undefined,
        };

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
   * Send a batch of notifications (INotificationService contract)
   */
  async sendBatch(messages: SpecNotificationMessage[]): Promise<SpecNotificationResult[]> {
    return Promise.all(messages.map(msg => this.send(msg)));
  }

  /**
   * Get configured notification channels (INotificationService contract)
   */
  getChannels(): SpecNotificationChannel[] {
    const channels: SpecNotificationChannel[] = [];
    if (this.emailChannel) channels.push('email');
    if (this.smsChannel) channels.push('sms');
    if (this.pushChannel) channels.push('push');
    if (this.webhookChannel) channels.push('webhook');
    return channels;
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
   * Save a notification template
   */
  async saveTemplate(template: NotificationTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  /**
   * Get a notification template by ID
   */
  async getTemplate(id: string): Promise<NotificationTemplate | undefined> {
    return this.templates.get(id);
  }

  /**
   * List all notification templates
   */
  async listTemplates(): Promise<NotificationTemplate[]> {
    return Array.from(this.templates.values());
  }

  /**
   * Delete a notification template by ID
   */
  async deleteTemplate(id: string): Promise<void> {
    this.templates.delete(id);
  }

  /**
   * Save a user's notification preference
   */
  async savePreference(pref: NotificationPreference): Promise<void> {
    this.preferences.set(pref.userId, pref);
  }

  /**
   * Get a user's notification preference
   */
  async getPreference(userId: string): Promise<NotificationPreference | undefined> {
    return this.preferences.get(userId);
  }

  /**
   * Get notification delivery logs
   */
  async getNotificationLogs(limit = 100): Promise<NotificationLog[]> {
    return this.logs.slice(-limit);
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
