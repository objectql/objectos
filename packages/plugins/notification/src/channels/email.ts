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
} from '../types';
import { NotificationChannel } from '../types';
import { TemplateEngine } from '../template-engine';

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
    
    // Lazy load nodemailer (optional dependency)
    try {
      const nodemailer = require('nodemailer');
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure ?? false,
        auth: config.auth
      });
    } catch (error) {
      // nodemailer not installed
      this.transporter = null;
    }
  }

  /**
   * Send email notification
   */
  async send(request: NotificationRequest): Promise<NotificationResult> {
    try {
      if (!this.transporter) {
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

      let body = options.body;
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
    let body = request.body || '';
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
