/**
 * SMS Channel
 * 
 * SMS notification channel (stub/mock implementation)
 * Ready for integration with Twilio, Aliyun SMS, or other providers
 */

import type { 
  SmsConfig, 
  NotificationRequest, 
  NotificationResult,
  NotificationChannelInterface,
  SmsOptions
} from '../types';
import { NotificationChannel } from '../types';
import { TemplateEngine } from '../template-engine';

/**
 * SMS channel implementation
 * Currently a mock/stub - ready for Twilio/Aliyun integration
 */
export class SmsChannel implements NotificationChannelInterface {
  private config: SmsConfig;
  private templateEngine: TemplateEngine;

  constructor(config: SmsConfig, templateEngine: TemplateEngine) {
    this.config = config;
    this.templateEngine = templateEngine;
  }

  /**
   * Send SMS notification
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      const recipients = Array.isArray(request.recipient) 
        ? request.recipient 
        : [request.recipient];

      let body = request.body || '';

      // Render template if provided
      if (request.template && request.data) {
        body = this.templateEngine.render(request.template, request.data);
      }

      // Mock implementation - log instead of actually sending
      if (this.config.provider === 'mock') {
        console.log('[SMS Mock] Sending SMS:', {
          to: recipients,
          from: this.config.from,
          body
        });

        return {
          success: true,
          messageId: `sms_mock_${Date.now()}`,
          channel: NotificationChannel.SMS,
          timestamp: new Date(),
          metadata: {
            provider: 'mock',
            recipients: recipients.length
          }
        };
      }

      // Twilio integration (placeholder)
      if (this.config.provider === 'twilio') {
        return await this.sendViaTwilio(recipients, body);
      }

      // Aliyun SMS integration (placeholder)
      if (this.config.provider === 'aliyun') {
        return await this.sendViaAliyun(recipients, body);
      }

      throw new Error(`Unsupported SMS provider: ${this.config.provider}`);
    } catch (error) {
      return {
        success: false,
        channel: NotificationChannel.SMS,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * Send SMS directly with full options
   */
  async sendSMS(options: SmsOptions): Promise<NotificationResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    let body = options.body;

    // Render template if provided
    if (options.template && options.data) {
      body = this.templateEngine.render(options.template, options.data);
    }

    const request: NotificationRequest = {
      channel: NotificationChannel.SMS,
      recipient: recipients,
      body
    };

    return this.send(request);
  }

  /**
   * Send via Twilio (placeholder for actual implementation)
   */
  private async sendViaTwilio(recipients: string[], body: string): Promise<NotificationResult> {
    // TODO: Implement Twilio integration
    // const twilio = require('twilio');
    // const client = twilio(this.config.accountSid, this.config.authToken);
    // 
    // const results = await Promise.all(
    //   recipients.map(to => 
    //     client.messages.create({
    //       body,
    //       from: this.config.from,
    //       to
    //     })
    //   )
    // );

    console.log('[SMS Twilio] Would send:', { recipients, body });

    return {
      success: true,
      messageId: `sms_twilio_${Date.now()}`,
      channel: NotificationChannel.SMS,
      timestamp: new Date(),
      metadata: {
        provider: 'twilio',
        recipients: recipients.length
      }
    };
  }

  /**
   * Send via Aliyun SMS (placeholder for actual implementation)
   */
  private async sendViaAliyun(recipients: string[], body: string): Promise<NotificationResult> {
    // TODO: Implement Aliyun SMS integration
    // const Core = require('@alicloud/pop-core');
    // const client = new Core({
    //   accessKeyId: this.config.apiKey,
    //   accessKeySecret: this.config.apiSecret,
    //   endpoint: 'https://dysmsapi.aliyuncs.com',
    //   apiVersion: '2017-05-25'
    // });

    console.log('[SMS Aliyun] Would send:', { recipients, body });

    return {
      success: true,
      messageId: `sms_aliyun_${Date.now()}`,
      channel: NotificationChannel.SMS,
      timestamp: new Date(),
      metadata: {
        provider: 'aliyun',
        recipients: recipients.length
      }
    };
  }
}
