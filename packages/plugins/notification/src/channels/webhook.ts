/**
 * Webhook Channel
 * 
 * Webhook notification channel with retry logic and authentication support
 */

import type { 
  WebhookConfig, 
  NotificationRequest, 
  NotificationResult,
  NotificationChannelInterface,
  WebhookOptions
} from '../types';
import { NotificationChannel } from '../types';

/**
 * Webhook channel implementation using HTTP POST
 */
export class WebhookChannel implements NotificationChannelInterface {
  private config: WebhookConfig;
  private axios: any;

  constructor(config: WebhookConfig) {
    this.config = {
      timeout: config.timeout ?? 10000,
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      headers: config.headers ?? {}
    };

    // Lazy load axios (optional dependency)
    try {
      this.axios = require('axios');
    } catch (error) {
      this.axios = null;
    }
  }

  /**
   * Send webhook notification
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      if (!this.axios) {
        throw new Error('axios is not installed. Install with: npm install axios');
      }

      const url = Array.isArray(request.recipient) 
        ? request.recipient[0] 
        : request.recipient;

      const payload = request.data || { 
        subject: request.subject,
        body: request.body 
      };

      const options = request.options as WebhookOptions | undefined;

      const result = await this.sendWithRetry(
        url,
        payload,
        options?.method || 'POST',
        options?.headers,
        options?.auth
      );

      return {
        success: true,
        messageId: `webhook_${Date.now()}`,
        channel: NotificationChannel.Webhook,
        timestamp: new Date(),
        metadata: {
          url,
          status: result.status,
          statusText: result.statusText
        }
      };
    } catch (error) {
      return {
        success: false,
        channel: NotificationChannel.Webhook,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * Send webhook directly with full options
   */
  async sendWebhook(options: WebhookOptions): Promise<NotificationResult> {
    try {
      if (!this.axios) {
        throw new Error('axios is not installed. Install with: npm install axios');
      }

      const result = await this.sendWithRetry(
        options.url,
        options.data,
        options.method || 'POST',
        options.headers,
        options.auth
      );

      return {
        success: true,
        messageId: `webhook_${Date.now()}`,
        channel: NotificationChannel.Webhook,
        timestamp: new Date(),
        metadata: {
          url: options.url,
          status: result.status,
          statusText: result.statusText
        }
      };
    } catch (error) {
      return {
        success: false,
        channel: NotificationChannel.Webhook,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * Send HTTP request with retry logic
   */
  private async sendWithRetry(
    url: string,
    data: any,
    method: string,
    customHeaders?: Record<string, string>,
    auth?: WebhookOptions['auth'],
    attempt: number = 1
  ): Promise<any> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.config.headers,
        ...customHeaders
      };

      // Add authentication
      if (auth) {
        if (auth.type === 'basic' && auth.username && auth.password) {
          const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
        } else if (auth.type === 'bearer' && auth.token) {
          headers['Authorization'] = `Bearer ${auth.token}`;
        }
      }

      const config = {
        method,
        url,
        data,
        headers,
        timeout: this.config.timeout
      };

      const response = await this.axios(config);
      return response;
    } catch (error) {
      // Retry logic
      if (attempt < this.config.retryAttempts!) {
        await this.sleep(this.config.retryDelay!);
        return this.sendWithRetry(url, data, method, customHeaders, auth, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Sleep utility for retry delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
