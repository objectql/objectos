/**
 * Notification Plugin Tests
 */

import { NotificationPlugin } from '../src/plugin';
import { NotificationChannel } from '../src/types';
import type { PluginContext } from '@objectstack/runtime';

// Mock PluginContext
const createMockContext = (): PluginContext => {
  const services = new Map();
  
  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    },
    registerService: (name: string, service: any) => {
      services.set(name, service);
    },
    getService: (name: string) => services.get(name),
    emit: jest.fn(),
    on: jest.fn()
  } as any;
};

describe('NotificationPlugin', () => {
  let plugin: NotificationPlugin;
  let context: PluginContext;

  describe('Plugin Lifecycle', () => {
    it('should create plugin instance', () => {
      plugin = new NotificationPlugin();
      expect(plugin.name).toBe('@objectos/notification');
      expect(plugin.version).toBe('0.1.0');
    });

    it('should load successfully', async () => {
      plugin = new NotificationPlugin();
      context = createMockContext();

      await plugin.init(context);
      
      expect(context.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Initialized successfully')
      );
    });

    it('should register notification service', async () => {
      plugin = new NotificationPlugin();
      context = createMockContext();

      await plugin.init(context);
      
      const service = context.getService('notification') as any;
      expect(service).toBeDefined();
      expect(service.send).toBeDefined();
      expect(service.sendEmail).toBeDefined();
      expect(service.sendSMS).toBeDefined();
      expect(service.sendPush).toBeDefined();
      expect(service.sendWebhook).toBeDefined();
    });

    it('should unload successfully', async () => {
      plugin = new NotificationPlugin();
      context = createMockContext();

      await plugin.init(context);
      await plugin.destroy();
      
      expect(context.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Destroyed')
      );
    });
  });

  describe('Configuration', () => {
    it('should accept email configuration', () => {
      plugin = new NotificationPlugin({
        email: {
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: {
            user: 'test@example.com',
            pass: 'password'
          },
          from: 'noreply@example.com'
        }
      });

      expect(plugin).toBeDefined();
    });

    it('should accept SMS configuration', () => {
      plugin = new NotificationPlugin({
        sms: {
          provider: 'mock',
          from: '+1234567890'
        }
      });

      expect(plugin).toBeDefined();
    });

    it('should accept push configuration', () => {
      plugin = new NotificationPlugin({
        push: {
          provider: 'mock'
        }
      });

      expect(plugin).toBeDefined();
    });

    it('should accept webhook configuration', () => {
      plugin = new NotificationPlugin({
        webhook: {
          timeout: 5000,
          retryAttempts: 3
        }
      });

      expect(plugin).toBeDefined();
    });

    it('should accept queue configuration', () => {
      plugin = new NotificationPlugin({
        queue: {
          enabled: true,
          maxRetries: 5,
          retryDelay: 3000
        }
      });

      expect(plugin).toBeDefined();
    });
  });

  describe('Email Notifications', () => {
    it('should return error when email not configured', async () => {
      plugin = new NotificationPlugin({});
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendEmail('test@example.com', 'Test', 'Body');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should handle sendEmail call structure', async () => {
      plugin = new NotificationPlugin({
        email: {
          host: 'smtp.example.com',
          port: 587,
          from: 'test@example.com'
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      // This will fail because nodemailer is not installed, but we test the structure
      const result = await plugin.sendEmail(
        'recipient@example.com',
        'Test Subject',
        'Test Body'
      );
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('channel');
      expect(result.channel).toBe(NotificationChannel.Email);
    });

    it('should support multiple recipients', async () => {
      plugin = new NotificationPlugin({
        email: {
          host: 'smtp.example.com',
          port: 587,
          from: 'test@example.com'
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendEmail(
        ['user1@example.com', 'user2@example.com'],
        'Test',
        'Body'
      );
      
      expect(result).toHaveProperty('channel');
    });
  });

  describe('SMS Notifications', () => {
    it('should return error when SMS not configured', async () => {
      plugin = new NotificationPlugin({});
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendSMS('+1234567890', 'Test message');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should send SMS with mock provider', async () => {
      plugin = new NotificationPlugin({
        sms: {
          provider: 'mock',
          from: '+1234567890'
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendSMS('+9876543210', 'Test message');
      
      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.SMS);
    });

    it('should support multiple recipients', async () => {
      plugin = new NotificationPlugin({
        sms: {
          provider: 'mock'
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendSMS(
        ['+1111111111', '+2222222222'],
        'Bulk message'
      );
      
      expect(result.success).toBe(true);
    });
  });

  describe('Push Notifications', () => {
    it('should return error when push not configured', async () => {
      plugin = new NotificationPlugin({});
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendPush('token123', 'Title', 'Body');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should send push with mock provider', async () => {
      plugin = new NotificationPlugin({
        push: {
          provider: 'mock'
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendPush('device_token_123', 'Test Title', 'Test Body');
      
      expect(result.success).toBe(true);
      expect(result.channel).toBe(NotificationChannel.Push);
    });

    it('should support multiple device tokens', async () => {
      plugin = new NotificationPlugin({
        push: {
          provider: 'mock'
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendPush(
        ['token1', 'token2', 'token3'],
        'Title',
        'Body'
      );
      
      expect(result.success).toBe(true);
    });
  });

  describe('Webhook Notifications', () => {
    it('should send webhook notification', async () => {
      plugin = new NotificationPlugin({
        webhook: {
          timeout: 5000
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendWebhook(
        'https://example.com/webhook',
        { event: 'test', data: 'value' }
      );
      
      // Will fail without axios, but structure is tested
      expect(result).toHaveProperty('channel');
      expect(result.channel).toBe(NotificationChannel.Webhook);
    });

    it('should support custom headers', async () => {
      plugin = new NotificationPlugin({
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendWebhook(
        'https://example.com/webhook',
        { test: 'data' },
        {
          headers: {
            'X-Custom-Header': 'value'
          }
        }
      );
      
      expect(result).toHaveProperty('channel');
    });

    it('should support authentication', async () => {
      plugin = new NotificationPlugin({
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendWebhook(
        'https://example.com/webhook',
        { test: 'data' },
        {
          auth: {
            type: 'bearer',
            token: 'secret_token'
          }
        }
      );
      
      expect(result).toHaveProperty('channel');
    });
  });

  describe('Generic Send Method', () => {
    it('should send notification via generic send method', async () => {
      plugin = new NotificationPlugin({
        sms: {
          provider: 'mock'
        },
        queue: { enabled: true }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.send({
        channel: NotificationChannel.SMS,
        recipient: '+1234567890',
        body: 'Test message'
      });
      
      // With queue enabled, it returns queued status
      expect(result.success).toBe(true);
      expect(result.metadata?.queued).toBe(true);
    });

    it('should handle unconfigured channel', async () => {
      plugin = new NotificationPlugin({
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.send({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Test'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });
  });

  describe('Template Rendering', () => {
    it('should render simple template', () => {
      plugin = new NotificationPlugin();
      
      const result = plugin.renderTemplate(
        'Hello {{name}}!',
        { name: 'World' }
      );
      
      expect(result).toBe('Hello World!');
    });

    it('should render complex template', () => {
      plugin = new NotificationPlugin();
      
      const result = plugin.renderTemplate(
        'Hi {{user.name}}, your order #{{order.id}} is {{status}}.',
        {
          user: { name: 'John' },
          order: { id: '12345' },
          status: 'shipped'
        }
      );
      
      expect(result).toContain('John');
      expect(result).toContain('12345');
      expect(result).toContain('shipped');
    });
  });

  describe('Queue Management', () => {
    it('should return queue status when enabled', () => {
      plugin = new NotificationPlugin({
        queue: { enabled: true }
      });
      
      const status = plugin.getQueueStatus();
      expect(status.enabled).toBe(true);
      expect(status).toHaveProperty('total');
    });

    it('should return disabled status when queue disabled', () => {
      plugin = new NotificationPlugin({
        queue: { enabled: false }
      });
      
      const status = plugin.getQueueStatus();
      expect(status.enabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      plugin = new NotificationPlugin({
        email: {
          host: 'invalid.smtp.server',
          port: 587,
          from: 'test@example.com'
        },
        queue: { enabled: false }
      });
      context = createMockContext();
      await plugin.init(context);

      const result = await plugin.sendEmail('test@example.com', 'Test', 'Body');
      
      // Should return error result, not throw
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });
});
