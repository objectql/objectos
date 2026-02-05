/**
 * Notification Queue
 * 
 * Simple in-memory queue for async notification processing with retry logic
 */

import type { 
  NotificationRequest, 
  NotificationResult, 
  QueuedNotification,
  NotificationChannelInterface 
} from './types.js';
import { NotificationStatus } from './types.js';

export interface QueueConfig {
  maxRetries?: number;
  retryDelay?: number;
  processingInterval?: number;
}

/**
 * In-memory notification queue with FIFO processing and retry logic
 */
export class NotificationQueue {
  private queue: QueuedNotification[] = [];
  private processing = false;
  private config: Required<QueueConfig>;
  private idCounter = 0;
  private processingTimer?: NodeJS.Timeout;
  private channelMap: Map<string, NotificationChannelInterface> = new Map();

  constructor(config: QueueConfig = {}) {
    this.config = {
      maxRetries: config.maxRetries ?? 3,
      retryDelay: config.retryDelay ?? 5000,
      processingInterval: config.processingInterval ?? 1000
    };
  }

  /**
   * Register a channel for processing
   */
  registerChannel(channelName: string, channel: NotificationChannelInterface): void {
    this.channelMap.set(channelName, channel);
  }

  /**
   * Add a notification to the queue
   */
  enqueue(request: NotificationRequest): string {
    const id = `notif_${++this.idCounter}_${Date.now()}`;
    
    const notification: QueuedNotification = {
      id,
      request,
      status: NotificationStatus.Pending,
      attempts: 0,
      createdAt: new Date()
    };

    this.queue.push(notification);
    
    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return id;
  }

  /**
   * Start processing the queue
   */
  private startProcessing(): void {
    if (this.processing) return;
    
    this.processing = true;
    this.processingTimer = setInterval(() => {
      this.processNext();
    }, this.config.processingInterval);
  }

  /**
   * Stop processing the queue
   */
  stop(): void {
    this.processing = false;
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }
  }

  /**
   * Process the next item in the queue
   */
  private async processNext(): Promise<void> {
    // Find next pending or retrying notification
    const index = this.queue.findIndex(
      n => n.status === NotificationStatus.Pending || 
           (n.status === NotificationStatus.Retrying && 
            n.lastAttemptAt && 
            Date.now() - n.lastAttemptAt.getTime() >= this.config.retryDelay)
    );

    if (index === -1) {
      // No items to process
      if (this.queue.length === 0) {
        this.stop();
      }
      return;
    }

    const notification = this.queue[index];
    
    // Check if max retries exceeded
    if (notification.attempts >= this.config.maxRetries) {
      notification.status = NotificationStatus.Failed;
      notification.error = `Max retry attempts (${this.config.maxRetries}) exceeded`;
      // Remove from queue
      this.queue.splice(index, 1);
      return;
    }

    // Update status
    notification.status = NotificationStatus.Sending;
    notification.attempts++;
    notification.lastAttemptAt = new Date();

    try {
      // Get the appropriate channel
      const channel = this.channelMap.get(notification.request.channel);
      
      if (!channel) {
        throw new Error(`Channel ${notification.request.channel} not registered`);
      }

      // Send the notification
      const result = await channel.send(notification.request);

      if (result.success) {
        notification.status = NotificationStatus.Sent;
        // Remove from queue
        this.queue.splice(index, 1);
      } else {
        // Retry
        notification.status = NotificationStatus.Retrying;
        notification.error = result.error;
      }
    } catch (error) {
      // Handle error - retry
      notification.status = NotificationStatus.Retrying;
      notification.error = error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Get queue status
   */
  getStatus(): {
    total: number;
    pending: number;
    sending: number;
    retrying: number;
    items: QueuedNotification[];
  } {
    const pending = this.queue.filter(n => n.status === NotificationStatus.Pending).length;
    const sending = this.queue.filter(n => n.status === NotificationStatus.Sending).length;
    const retrying = this.queue.filter(n => n.status === NotificationStatus.Retrying).length;

    return {
      total: this.queue.length,
      pending,
      sending,
      retrying,
      items: [...this.queue]
    };
  }

  /**
   * Get notification by ID
   */
  getById(id: string): QueuedNotification | undefined {
    return this.queue.find(n => n.id === id);
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
}
