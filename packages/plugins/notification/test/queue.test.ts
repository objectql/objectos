/**
 * Notification Queue Tests
 */

import { NotificationQueue } from '../src/queue';
import { NotificationChannel, NotificationStatus } from '../src/types';
import type { 
  NotificationRequest, 
  NotificationResult,
  NotificationChannelInterface 
} from '../src/types';

// Mock channel implementation
class MockChannel implements NotificationChannelInterface {
  private shouldFail: boolean;
  private delay: number;
  public callCount = 0;

  constructor(shouldFail = false, delay = 0) {
    this.shouldFail = shouldFail;
    this.delay = delay;
  }

  async send(request: NotificationRequest): Promise<NotificationResult> {
    this.callCount++;

    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      return {
        success: false,
        channel: request.channel,
        error: 'Mock failure',
        timestamp: new Date()
      };
    }

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      channel: request.channel,
      timestamp: new Date()
    };
  }

  reset() {
    this.callCount = 0;
  }
}

describe('NotificationQueue', () => {
  let queue: NotificationQueue;
  let mockChannel: MockChannel;

  beforeEach(() => {
    queue = new NotificationQueue({
      maxRetries: 3,
      retryDelay: 100,
      processingInterval: 50
    });
    mockChannel = new MockChannel();
    queue.registerChannel(NotificationChannel.Email, mockChannel);
  });

  afterEach(() => {
    queue.stop();
  });

  describe('Basic Queue Operations', () => {
    it('should enqueue a notification', () => {
      const request: NotificationRequest = {
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        subject: 'Test',
        body: 'Test message'
      };

      const id = queue.enqueue(request);
      expect(id).toBeTruthy();
      expect(queue.size()).toBe(1);
    });

    it('should process queued notification', async () => {
      const request: NotificationRequest = {
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        subject: 'Test',
        body: 'Test message'
      };

      queue.enqueue(request);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(mockChannel.callCount).toBe(1);
      expect(queue.size()).toBe(0); // Should be removed after success
    });

    it('should maintain FIFO order', async () => {
      const results: string[] = [];
      
      const channel = {
        send: async (request: NotificationRequest) => {
          results.push(request.body!);
          return {
            success: true,
            messageId: 'test',
            channel: request.channel,
            timestamp: new Date()
          };
        }
      };

      queue.registerChannel(NotificationChannel.Email, channel);

      queue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'First'
      });

      queue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Second'
      });

      queue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Third'
      });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(results).toEqual(['First', 'Second', 'Third']);
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed notifications', async () => {
      const failingChannel = new MockChannel(true);
      queue.registerChannel(NotificationChannel.SMS, failingChannel);

      const request: NotificationRequest = {
        channel: NotificationChannel.SMS,
        recipient: '+1234567890',
        body: 'Test'
      };

      queue.enqueue(request);

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 500));

      // Should try 3 times (maxRetries)
      expect(failingChannel.callCount).toBeGreaterThanOrEqual(3);
    });

    it('should remove notification after max retries', async () => {
      const failingChannel = new MockChannel(true);
      queue.registerChannel(NotificationChannel.SMS, failingChannel);

      const request: NotificationRequest = {
        channel: NotificationChannel.SMS,
        recipient: '+1234567890',
        body: 'Test'
      };

      queue.enqueue(request);

      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(queue.size()).toBe(0); // Removed after max retries
    });

    it('should respect retry delay', async () => {
      const timestamps: number[] = [];
      
      const timingChannel = {
        send: async (request: NotificationRequest) => {
          timestamps.push(Date.now());
          return {
            success: false,
            channel: request.channel,
            error: 'Test failure',
            timestamp: new Date()
          };
        }
      };

      const retryQueue = new NotificationQueue({
        maxRetries: 3,
        retryDelay: 100,
        processingInterval: 10
      });

      retryQueue.registerChannel(NotificationChannel.Email, timingChannel);

      retryQueue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Test'
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      retryQueue.stop();

      // Check that retries were delayed
      if (timestamps.length >= 2) {
        const delay = timestamps[1] - timestamps[0];
        expect(delay).toBeGreaterThanOrEqual(90); // Allow some variance
      }
    });
  });

  describe('Queue Status', () => {
    it('should return queue status', () => {
      queue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Test'
      });

      const status = queue.getStatus();
      expect(status.total).toBe(1);
      expect(status.pending).toBeGreaterThanOrEqual(0);
    });

    it('should get notification by ID', () => {
      const id = queue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Test'
      });

      const notification = queue.getById(id);
      expect(notification).toBeDefined();
      expect(notification?.id).toBe(id);
    });

    it('should clear the queue', () => {
      queue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Test'
      });

      expect(queue.size()).toBe(1);
      queue.clear();
      expect(queue.size()).toBe(0);
    });
  });

  describe('Concurrent Processing', () => {
    it('should handle multiple channels', async () => {
      const emailChannel = new MockChannel();
      const smsChannel = new MockChannel();

      queue.registerChannel(NotificationChannel.Email, emailChannel);
      queue.registerChannel(NotificationChannel.SMS, smsChannel);

      queue.enqueue({
        channel: NotificationChannel.Email,
        recipient: 'test@example.com',
        body: 'Email'
      });

      queue.enqueue({
        channel: NotificationChannel.SMS,
        recipient: '+1234567890',
        body: 'SMS'
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      expect(emailChannel.callCount).toBe(1);
      expect(smsChannel.callCount).toBe(1);
    });

    it('should process multiple notifications', async () => {
      for (let i = 0; i < 5; i++) {
        queue.enqueue({
          channel: NotificationChannel.Email,
          recipient: `test${i}@example.com`,
          body: `Message ${i}`
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      expect(mockChannel.callCount).toBe(5);
      expect(queue.size()).toBe(0);
    });
  });
});
