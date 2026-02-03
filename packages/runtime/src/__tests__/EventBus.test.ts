/**
 * Tests for EventBus
 */

import { EventBusImpl } from '../core/EventBus';

describe('EventBus', () => {
  let eventBus: EventBusImpl;

  beforeEach(() => {
    eventBus = new EventBusImpl();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe('on', () => {
    it('should subscribe to an event', () => {
      const handler = jest.fn();
      eventBus.on('test', handler);
      eventBus.emit('test', { data: 'value' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'value' });
    });

    it('should allow multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      eventBus.on('test', handler1);
      eventBus.on('test', handler2);
      eventBus.emit('test', { data: 'value' });
      
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should subscribe to an event only once', () => {
      const handler = jest.fn();
      eventBus.once('test', handler);
      
      eventBus.emit('test', { data: 1 });
      eventBus.emit('test', { data: 2 });
      
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ data: 1 });
    });
  });

  describe('off', () => {
    it('should unsubscribe from an event', () => {
      const handler = jest.fn();
      eventBus.on('test', handler);
      eventBus.off('test', handler);
      eventBus.emit('test', { data: 'value' });
      
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('should emit event with data', () => {
      const handler = jest.fn();
      eventBus.on('test', handler);
      eventBus.emit('test', { foo: 'bar' });
      
      expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
    });

    it('should not throw if no handlers', () => {
      expect(() => {
        eventBus.emit('test', {});
      }).not.toThrow();
    });
  });

  describe('emitAsync', () => {
    it('should wait for all async handlers', async () => {
      const results: number[] = [];
      
      eventBus.on('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        results.push(1);
      });
      
      eventBus.on('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        results.push(2);
      });
      
      await eventBus.emitAsync('test');
      
      expect(results).toHaveLength(2);
      expect(results).toContain(1);
      expect(results).toContain(2);
    });
  });
});
