/**
 * Event Bus Implementation
 * 
 * Provides event-based communication between plugins.
 */

import EventEmitter from 'eventemitter3';
import { EventBus, EventHandler } from '../types';

export class EventBusImpl implements EventBus {
  private emitter = new EventEmitter();

  /**
   * Subscribe to an event
   */
  on(event: string, handler: EventHandler): void {
    this.emitter.on(event, handler);
  }

  /**
   * Subscribe to an event (one-time)
   */
  once(event: string, handler: EventHandler): void {
    this.emitter.once(event, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: EventHandler): void {
    this.emitter.off(event, handler);
  }

  /**
   * Emit an event
   */
  emit(event: string, data?: any): void {
    this.emitter.emit(event, data);
  }

  /**
   * Emit an event and wait for all handlers
   */
  async emitAsync(event: string, data?: any): Promise<void> {
    const listeners = this.emitter.listeners(event);
    
    for (const listener of listeners) {
      await listener(data);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}
