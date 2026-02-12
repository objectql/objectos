/**
 * Email Channel
 * 
 * Email notification channel using SMTP via nodemailer
 */

import type { 
  EmailConfig, 
  NotificationRequest, 
  NotificationResult,
  NotificationChannelInterface,
  EmailOptions
} from '../types.js';
import { NotificationChannel } from '../types.js';
import { TemplateEngine } from '../template-engine.js';

/**
 * Email channel implementation using nodemailer
 */
export class EmailChannel implements NotificationChannelInterface {
  private transporter: any;
  private config: EmailConfig;
  private templateEngine: TemplateEngine;

  constructor(config: EmailConfig, templateEngine: TemplateEngine) {
    this.config = config;
    this.templateEngine = templateEngine;
    this.transporter = null;
  }

  /**
   * Load nodemailer dynamically
   */
  private async loadTransporter(): Promise<any> {
    if (this.transporter) return this.transporter;
    try {
      const module = await import('nodemailer');
      const nodemailer = module.default || module;
      
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure ?? false,
        auth: this.config.auth
      });
      return this.transporter;
    } catch (error) {
      return null;
    }
  }

  /**
   * Send email notification
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      const transporter = await this.loadTransporter();
      if (!transporter) {
        throw new Error('nodemailer is not installed. Install with: npm install nodemailer');
      }

      const options = this.buildEmailOptions(request);
      
      // Send email
      const info = await this.transporter.sendMail(options);

      return {
        success: true,
        messageId: info.messageId,
        channel: NotificationChannel.Email,
        timestamp: new Date(),
        metadata: {
          accepted: info.accepted,
          rejected: info.rejected
        }
      };
    } catch (error) {
      return {
        success: false,
        channel: NotificationChannel.Email,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * Send email directly with full options
   */
  async sendEmail(options: EmailOptions): Promise<NotificationResult> {
    try {
      if (!this.transporter) {
        throw new Error('nodemailer is not installed. Install with: npm install nodemailer');
      }

      const body = options.body;
      let html = options.html;

      // Render template if provided
      if (options.template && options.data) {
        const rendered = this.templateEngine.render(options.template, options.data);
        html = rendered;
      }

      const mailOptions = {
        from: this.config.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        text: body,
        html: html,
        attachments: options.attachments,
        replyTo: this.config.replyTo
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        channel: NotificationChannel.Email,
        timestamp: new Date(),
        metadata: {
          accepted: info.accepted,
          rejected: info.rejected
        }
      };
    } catch (error) {
      return {
        success: false,
        channel: NotificationChannel.Email,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  /**
   * Build email options from notification request
   */
  private buildEmailOptions(request: NotificationRequest): any {
    const body = request.body || '';
    let html: string | undefined;

    // Render template if provided
    if (request.template && request.data) {
      html = this.templateEngine.render(request.template, request.data);
    }

    return {
      from: this.config.from,
      to: Array.isArray(request.recipient) ? request.recipient.join(', ') : request.recipient,
      subject: request.subject || 'Notification',
      text: body,
      html: html,
      replyTo: this.config.replyTo
    };
  }

  /**
   * Verify SMTP connection
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }
}
