/**
 * Tests for InMemoryAuditStorage
 */

import { InMemoryAuditStorage } from '../src/storage.js';
import type { AuditLogEntry, AuditTrailEntry } from '../src/types.js';

describe('InMemoryAuditStorage', () => {
  let storage: InMemoryAuditStorage;

  beforeEach(() => {
    storage = new InMemoryAuditStorage();
  });

  describe('Event Storage', () => {
    it('should store audit events', async () => {
      const entry: AuditLogEntry = {
        id: 'test-1',
        timestamp: '2026-01-29T00:00:00Z',
        eventType: 'data.create',
        resource: 'users/123',
        action: 'create',
        success: true,
        userId: 'user123',
      };

      await storage.logEvent(entry);
      expect(storage.getEventCount()).toBe(1);
    });

    it('should auto-generate timestamp if not provided', async () => {
      const entry: AuditLogEntry = {
        id: 'test-1',
        timestamp: '',
        eventType: 'data.create',
        resource: 'users/123',
        action: 'create',
        success: true,
      };

      await storage.logEvent(entry);
      const events = await storage.queryEvents({});
      expect(events[0].timestamp).toBeTruthy();
    });

    it('should clear all events', async () => {
      await storage.logEvent({
        id: 'test-1',
        timestamp: '2026-01-29T00:00:00Z',
        eventType: 'data.create',
        resource: 'users/123',
        action: 'create',
        success: true,
      });

      storage.clear();
      expect(storage.getEventCount()).toBe(0);
    });
  });

  describe('Event Querying', () => {
    beforeEach(async () => {
      // Add test data
      const testEvents: AuditTrailEntry[] = [
        {
          id: 'event-1',
          timestamp: '2026-01-29T10:00:00Z',
          eventType: 'data.create',
          resource: 'orders/1',
          action: 'create',
          success: true,
          objectName: 'orders',
          recordId: '1',
          userId: 'user123',
        },
        {
          id: 'event-2',
          timestamp: '2026-01-29T11:00:00Z',
          eventType: 'data.update',
          resource: 'orders/1',
          action: 'update',
          success: true,
          objectName: 'orders',
          recordId: '1',
          userId: 'user456',
          changes: [{ field: 'status', oldValue: 'new', newValue: 'processing' }],
        },
        {
          id: 'event-3',
          timestamp: '2026-01-29T12:00:00Z',
          eventType: 'data.update',
          resource: 'orders/1',
          action: 'update',
          success: true,
          objectName: 'orders',
          recordId: '1',
          userId: 'user123',
          changes: [{ field: 'status', oldValue: 'processing', newValue: 'completed' }],
        },
        {
          id: 'event-4',
          timestamp: '2026-01-29T13:00:00Z',
          eventType: 'data.create',
          resource: 'users/2',
          action: 'create',
          success: true,
          objectName: 'users',
          recordId: '2',
          userId: 'admin',
        },
      ];

      for (const event of testEvents) {
        await storage.logEvent(event);
      }
    });

    it('should query all events', async () => {
      const events = await storage.queryEvents({});
      expect(events.length).toBe(4);
    });

    it('should filter by object name', async () => {
      const events = await storage.queryEvents({ objectName: 'orders' });
      expect(events.length).toBe(3);
      expect(events.every((e) => 'objectName' in e && e.objectName === 'orders')).toBe(true);
    });

    it('should filter by record ID', async () => {
      const events = await storage.queryEvents({ recordId: '1' });
      expect(events.length).toBe(3);
    });

    it('should filter by user ID', async () => {
      const events = await storage.queryEvents({ userId: 'user123' });
      expect(events.length).toBe(2);
    });

    it('should filter by event type', async () => {
      const events = await storage.queryEvents({ eventType: 'data.update' });
      expect(events.length).toBe(2);
      expect(events.every((e) => e.eventType === 'data.update')).toBe(true);
    });

    it('should filter by date range', async () => {
      const events = await storage.queryEvents({
        startDate: '2026-01-29T10:30:00Z',
        endDate: '2026-01-29T12:30:00Z',
      });
      expect(events.length).toBe(2);
    });

    it('should sort in ascending order', async () => {
      const events = await storage.queryEvents({ sortOrder: 'asc' });
      expect(events[0].id).toBe('event-1');
      expect(events[events.length - 1].id).toBe('event-4');
    });

    it('should sort in descending order by default', async () => {
      const events = await storage.queryEvents({});
      expect(events[0].id).toBe('event-4');
      expect(events[events.length - 1].id).toBe('event-1');
    });

    it('should paginate results', async () => {
      const page1 = await storage.queryEvents({ limit: 2, offset: 0 });
      const page2 = await storage.queryEvents({ limit: 2, offset: 2 });

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('Field History', () => {
    beforeEach(async () => {
      const testEvents: AuditTrailEntry[] = [
        {
          id: 'event-1',
          timestamp: '2026-01-29T10:00:00Z',
          eventType: 'data.update',
          resource: 'orders/1',
          action: 'update',
          success: true,
          objectName: 'orders',
          recordId: '1',
          changes: [
            { field: 'status', oldValue: 'new', newValue: 'processing' },
            { field: 'amount', oldValue: 100, newValue: 150 },
          ],
        },
        {
          id: 'event-2',
          timestamp: '2026-01-29T11:00:00Z',
          eventType: 'data.update',
          resource: 'orders/1',
          action: 'update',
          success: true,
          objectName: 'orders',
          recordId: '1',
          changes: [{ field: 'status', oldValue: 'processing', newValue: 'completed' }],
        },
      ];

      for (const event of testEvents) {
        await storage.logEvent(event);
      }
    });

    it('should get field history', async () => {
      const history = await storage.getFieldHistory('orders', '1', 'status');
      expect(history.length).toBe(2);
      expect(history[0].field).toBe('status');
      expect(history[0].oldValue).toBe('new');
      expect(history[0].newValue).toBe('processing');
      expect(history[1].oldValue).toBe('processing');
      expect(history[1].newValue).toBe('completed');
    });

    it('should return empty array for non-existent field', async () => {
      const history = await storage.getFieldHistory('orders', '1', 'nonexistent');
      expect(history.length).toBe(0);
    });
  });

  describe('Audit Trail', () => {
    beforeEach(async () => {
      const testEvents: AuditTrailEntry[] = [
        {
          id: 'event-1',
          timestamp: '2026-01-29T10:00:00Z',
          eventType: 'data.create',
          resource: 'orders/1',
          action: 'create',
          success: true,
          objectName: 'orders',
          recordId: '1',
        },
        {
          id: 'event-2',
          timestamp: '2026-01-29T11:00:00Z',
          eventType: 'data.update',
          resource: 'orders/1',
          action: 'update',
          success: true,
          objectName: 'orders',
          recordId: '1',
        },
        {
          id: 'event-3',
          timestamp: '2026-01-29T12:00:00Z',
          eventType: 'data.update',
          resource: 'orders/2',
          action: 'update',
          success: true,
          objectName: 'orders',
          recordId: '2',
        },
      ];

      for (const event of testEvents) {
        await storage.logEvent(event);
      }
    });

    it('should get audit trail for a record', async () => {
      const trail = await storage.getAuditTrail('orders', '1');
      expect(trail.length).toBe(2);
      expect(trail.every((e) => e.recordId === '1')).toBe(true);
    });

    it('should return empty array for non-existent record', async () => {
      const trail = await storage.getAuditTrail('orders', '999');
      expect(trail.length).toBe(0);
    });
  });
});
