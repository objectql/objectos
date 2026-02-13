/**
 * Tests for Realtime WebSocket Plugin
 */

import { createRealtimePlugin } from '../src/plugin.js';
import type { PluginContext, Plugin } from '@objectstack/runtime';
import { WebSocket, WebSocketServer } from 'ws';

// ─── Mock Context ──────────────────────────────────────────────────────────────

const createMockContext = (): { context: PluginContext; kernel: any } => {
  const kernel = {
    getService: jest.fn(),
    services: new Map(),
  };

  const context: PluginContext = {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    registerService: jest.fn((name: string, service: any) => {
      kernel.services.set(name, service);
      kernel.getService.mockImplementation((n: string) => {
        if (kernel.services.has(n)) return kernel.services.get(n);
        throw new Error(`Service ${n} not found`);
      });
    }),
    getService: jest.fn((name: string) => {
      if (kernel.services.has(name)) return kernel.services.get(name);
      throw new Error(`Service ${name} not found`);
    }),
    hasService: jest.fn((name: string) => kernel.services.has(name)),
    getServices: jest.fn(() => kernel.services),
    hook: jest.fn(),
    trigger: jest.fn(),
    getKernel: jest.fn(() => kernel),
  } as any;

  return { context, kernel };
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Wait for a WebSocket client to receive a message */
const waitForMessage = (ws: WebSocket, timeout = 2000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Message timeout')), timeout);
    ws.once('message', (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
  });
};

/** Wait for a WebSocket client to open */
const waitForOpen = (ws: WebSocket): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSocket.OPEN) return resolve();
    ws.once('open', () => resolve());
    ws.once('error', reject);
  });
};

// Use a unique port range to avoid conflicts
let portCounter = 19100;
const getPort = () => portCounter++;

/** Connect a WebSocket client and consume the welcome ack */
const connectClient = async (port: number): Promise<WebSocket> => {
  const ws = new WebSocket(`ws://localhost:${port}`);
  // Set up message listener BEFORE open to avoid missing the welcome ack
  const welcomePromise = waitForMessage(ws);
  await waitForOpen(ws);
  await welcomePromise; // consume the welcome ack
  return ws;
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Realtime Plugin', () => {
  let plugin: any;
  let mockContext: PluginContext;
  let mockKernel: any;
  let testPort: number;

  beforeEach(() => {
    const mock = createMockContext();
    mockContext = mock.context;
    mockKernel = mock.kernel;
    testPort = getPort();
    plugin = createRealtimePlugin({ port: testPort, auth: { required: false } });
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  describe('Plugin Metadata', () => {
    it('should have correct plugin name and version', () => {
      expect(plugin.name).toBe('@objectos/realtime');
      expect(plugin.version).toBe('0.1.0');
    });
  });

  describe('Plugin Lifecycle', () => {
    it('should initialize and register websocket-server service', async () => {
      await plugin.init(mockContext);

      expect(mockContext.registerService).toHaveBeenCalledWith(
        'realtime',
        expect.objectContaining({
          broadcast: expect.any(Function),
          updatePresence: expect.any(Function),
          getServer: expect.any(Function),
        }),
      );
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Service registered'),
      );
    });

    it('should start WebSocket server', async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);

      expect(mockContext.logger.info).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket Server started'),
      );

      // Verify server is accessible via the registered service
      const service = mockKernel.services.get('realtime');
      expect(service.getServer()).toBeDefined();
    });

    it('should destroy gracefully', async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
      await plugin.destroy();

      // Server should be closed - attempting to connect should fail
      await expect(
        new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(`ws://localhost:${testPort}`);
          ws.on('error', reject);
          ws.on('open', () => {
            ws.close();
            resolve();
          });
        }),
      ).rejects.toThrow();
    });
  });

  describe('WebSocket Connection', () => {
    let client: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should accept client connections', async () => {
      client = new WebSocket(`ws://localhost:${testPort}`);
      await waitForOpen(client);

      expect(client.readyState).toBe(WebSocket.OPEN);
    });

    it('should send welcome ack on connection', async () => {
      client = new WebSocket(`ws://localhost:${testPort}`);
      // Set up listener BEFORE open to capture the welcome ack
      const msgPromise = waitForMessage(client);
      await waitForOpen(client);
      const msg = await msgPromise;

      expect(msg.type).toBe('ack');
      expect(msg.ackMessageId).toBe('init');
      expect(msg.success).toBe(true);
      expect(msg.messageId).toBeDefined();
      expect(msg.timestamp).toBeDefined();
    });

    it('should clean up client state on disconnect', async () => {
      client = await connectClient(testPort);

      client.close();
      // Wait for the close event to propagate
      await new Promise((resolve) => setTimeout(resolve, 100));

      const service = mockKernel.services.get('realtime');
      const wss = service.getServer() as WebSocketServer;
      expect(wss.clients.size).toBe(0);
    });
  });

  describe('Subscribe / Unsubscribe Protocol', () => {
    let client: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
      client = await connectClient(testPort);
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should acknowledge subscribe requests', async () => {
      const subscribeMsg = {
        messageId: 'msg-001',
        timestamp: new Date().toISOString(),
        type: 'subscribe',
        subscription: {
          subscriptionId: 'sub-001',
          events: ['user.*'],
        },
      };

      client.send(JSON.stringify(subscribeMsg));
      const ack = await waitForMessage(client);

      expect(ack.type).toBe('ack');
      expect(ack.ackMessageId).toBe('msg-001');
      expect(ack.success).toBe(true);
    });

    it('should acknowledge unsubscribe by subscription IDs', async () => {
      // First subscribe
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-001', events: ['user.*'] },
        }),
      );
      await waitForMessage(client);

      // Then unsubscribe
      client.send(
        JSON.stringify({
          messageId: 'msg-002',
          timestamp: new Date().toISOString(),
          type: 'unsubscribe',
          request: { subscriptionIds: ['sub-001'] },
        }),
      );
      const ack = await waitForMessage(client);

      expect(ack.type).toBe('ack');
      expect(ack.ackMessageId).toBe('msg-002');
      expect(ack.success).toBe(true);
    });

    it('should acknowledge unsubscribe all', async () => {
      // Subscribe to two
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-001', events: ['user.*'] },
        }),
      );
      await waitForMessage(client);
      client.send(
        JSON.stringify({
          messageId: 'msg-002',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-002', events: ['order.*'] },
        }),
      );
      await waitForMessage(client);

      // Unsubscribe all
      client.send(
        JSON.stringify({
          messageId: 'msg-003',
          timestamp: new Date().toISOString(),
          type: 'unsubscribe',
          request: { all: true },
        }),
      );
      const ack = await waitForMessage(client);

      expect(ack.type).toBe('ack');
      expect(ack.ackMessageId).toBe('msg-003');
      expect(ack.success).toBe(true);
    });
  });

  describe('Event Broadcasting', () => {
    let client: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
      client = await connectClient(testPort);
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should broadcast events to subscribed clients', async () => {
      // Subscribe to user events
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-001', events: ['user.created'] },
        }),
      );
      await waitForMessage(client); // ack

      // Broadcast via service
      const service = mockKernel.services.get('realtime');
      service.broadcast('user.created', { name: 'John', email: 'john@test.com' });

      const event = await waitForMessage(client);
      expect(event.type).toBe('event');
      expect(event.subscriptionId).toBe('sub-001');
      expect(event.eventName).toBe('user.created');
      expect(event.payload).toEqual({ name: 'John', email: 'john@test.com' });
    });

    it('should NOT broadcast events to non-matching subscriptions', async () => {
      // Subscribe to user events only
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-001', events: ['user.created'] },
        }),
      );
      await waitForMessage(client); // ack

      // Broadcast an order event
      const service = mockKernel.services.get('realtime');
      service.broadcast('order.created', { orderId: '123' });

      // Should NOT receive anything (use timeout to verify)
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });

    it('should support wildcard pattern matching', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-001', events: ['user.*'] },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');
      service.broadcast('user.updated', { id: '1', name: 'Jane' });

      const event = await waitForMessage(client);
      expect(event.eventName).toBe('user.updated');
      expect(event.payload).toEqual({ id: '1', name: 'Jane' });
    });

    it('should support global wildcard subscription', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-001', events: ['*'] },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');
      service.broadcast('anything.goes', { data: true });

      const event = await waitForMessage(client);
      expect(event.eventName).toBe('anything.goes');
    });

    it('should filter events by object type', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: {
            subscriptionId: 'sub-001',
            events: ['record.*'],
            objects: ['Account'],
          },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');

      // Should match
      service.broadcast('record.updated', { name: 'Acme' }, { object: 'Account' });
      const event = await waitForMessage(client);
      expect(event.eventName).toBe('record.updated');

      // Should NOT match (different object)
      service.broadcast('record.updated', { name: 'John' }, { object: 'Contact' });
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });

    it('should not broadcast after unsubscribe', async () => {
      // Subscribe
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: { subscriptionId: 'sub-001', events: ['user.*'] },
        }),
      );
      await waitForMessage(client); // ack

      // Unsubscribe
      client.send(
        JSON.stringify({
          messageId: 'msg-002',
          timestamp: new Date().toISOString(),
          type: 'unsubscribe',
          request: { subscriptionIds: ['sub-001'] },
        }),
      );
      await waitForMessage(client); // ack

      // Broadcast should not reach client
      const service = mockKernel.services.get('realtime');
      service.broadcast('user.created', { name: 'Test' });

      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });
  });

  describe('Complex Filters', () => {
    let client: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
      client = await connectClient(testPort);
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    it('should filter with eq operator', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: {
            subscriptionId: 'sub-001',
            events: ['order.*'],
            filters: { conditions: [{ field: 'status', operator: 'eq', value: 'paid' }] },
          },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');

      // Should match
      service.broadcast('order.updated', { status: 'paid', amount: 100 });
      const event = await waitForMessage(client);
      expect(event.payload.status).toBe('paid');

      // Should NOT match
      service.broadcast('order.updated', { status: 'pending', amount: 50 });
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });

    it('should filter with gt operator', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: {
            subscriptionId: 'sub-001',
            events: ['order.*'],
            filters: { conditions: [{ field: 'amount', operator: 'gt', value: 100 }] },
          },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');

      // Should match (amount > 100)
      service.broadcast('order.created', { amount: 200 });
      const event = await waitForMessage(client);
      expect(event.payload.amount).toBe(200);

      // Should NOT match (amount <= 100)
      service.broadcast('order.created', { amount: 50 });
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });

    it('should filter with in operator', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: {
            subscriptionId: 'sub-001',
            events: ['user.*'],
            filters: {
              conditions: [{ field: 'role', operator: 'in', value: ['admin', 'manager'] }],
            },
          },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');

      service.broadcast('user.login', { role: 'admin' });
      const event = await waitForMessage(client);
      expect(event.payload.role).toBe('admin');

      service.broadcast('user.login', { role: 'viewer' });
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });

    it('should filter with contains operator', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: {
            subscriptionId: 'sub-001',
            events: ['log.*'],
            filters: { conditions: [{ field: 'message', operator: 'contains', value: 'error' }] },
          },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');

      service.broadcast('log.entry', { message: 'Critical error occurred' });
      const event = await waitForMessage(client);
      expect(event.payload.message).toContain('error');

      service.broadcast('log.entry', { message: 'All systems normal' });
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });

    it('should filter with regex operator', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: {
            subscriptionId: 'sub-001',
            events: ['email.*'],
            filters: { conditions: [{ field: 'to', operator: 'regex', value: '@company\\.com$' }] },
          },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');

      service.broadcast('email.sent', { to: 'user@company.com' });
      const event = await waitForMessage(client);
      expect(event.payload.to).toBe('user@company.com');

      service.broadcast('email.sent', { to: 'user@other.com' });
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });

    it('should require all conditions to match (AND logic)', async () => {
      client.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'subscribe',
          subscription: {
            subscriptionId: 'sub-001',
            events: ['order.*'],
            filters: {
              conditions: [
                { field: 'status', operator: 'eq', value: 'paid' },
                { field: 'amount', operator: 'gte', value: 100 },
              ],
            },
          },
        }),
      );
      await waitForMessage(client); // ack

      const service = mockKernel.services.get('realtime');

      // Both conditions met
      service.broadcast('order.updated', { status: 'paid', amount: 150 });
      const event = await waitForMessage(client);
      expect(event.payload.status).toBe('paid');

      // Only one condition met
      service.broadcast('order.updated', { status: 'paid', amount: 50 });
      await expect(waitForMessage(client, 300)).rejects.toThrow('Message timeout');
    });
  });

  describe('Presence Protocol', () => {
    let client1: WebSocket;
    let client2: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);

      [client1, client2] = await Promise.all([connectClient(testPort), connectClient(testPort)]);
    });

    afterEach(() => {
      [client1, client2].forEach((c) => {
        if (c && c.readyState === WebSocket.OPEN) c.close();
      });
    });

    it('should broadcast presence updates from client to others', async () => {
      const presenceMsg = {
        messageId: 'msg-001',
        timestamp: new Date().toISOString(),
        type: 'presence',
        presence: {
          userId: 'user-1',
          status: 'online',
          lastActive: new Date().toISOString(),
        },
      };

      client1.send(JSON.stringify(presenceMsg));
      const received = await waitForMessage(client2);

      expect(received.type).toBe('presence');
      expect(received.presence.userId).toBe('user-1');
      expect(received.presence.status).toBe('online');
    });

    it('should NOT echo presence back to sender', async () => {
      const presenceMsg = {
        messageId: 'msg-001',
        timestamp: new Date().toISOString(),
        type: 'presence',
        presence: {
          userId: 'user-1',
          status: 'away',
          lastActive: new Date().toISOString(),
        },
      };

      client1.send(JSON.stringify(presenceMsg));

      // client2 should get it
      await waitForMessage(client2);

      // client1 should NOT get it back
      await expect(waitForMessage(client1, 300)).rejects.toThrow('Message timeout');
    });

    it('should broadcast presence via service API', async () => {
      const service = mockKernel.services.get('realtime');
      service.updatePresence('user-99', { status: 'busy' }, { page: '/dashboard' });

      // Both clients should receive presence update
      const [msg1, msg2] = await Promise.all([waitForMessage(client1), waitForMessage(client2)]);

      expect(msg1.type).toBe('presence');
      expect(msg1.presence.userId).toBe('user-99');
      expect(msg2.type).toBe('presence');
      expect(msg2.presence.userId).toBe('user-99');
    });
  });

  describe('Awareness: Cursor & Edit Collaboration', () => {
    let client1: WebSocket;
    let client2: WebSocket;
    let client3: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);

      [client1, client2, client3] = await Promise.all([
        connectClient(testPort),
        connectClient(testPort),
        connectClient(testPort),
      ]);
    });

    afterEach(() => {
      [client1, client2, client3].forEach((c) => {
        if (c && c.readyState === WebSocket.OPEN) c.close();
      });
    });

    it('should relay cursor awareness to other clients', async () => {
      const cursorMsg = {
        messageId: 'msg-001',
        timestamp: new Date().toISOString(),
        type: 'cursor',
        userId: 'user-1',
        object: 'Account',
        recordId: 'acc-001',
        field: 'description',
        offset: 42,
        line: 3,
        column: 10,
      };

      client1.send(JSON.stringify(cursorMsg));

      const [msg2, msg3] = await Promise.all([waitForMessage(client2), waitForMessage(client3)]);

      // Both should receive cursor update
      expect(msg2.type).toBe('cursor');
      expect(msg2.userId).toBe('user-1');
      expect(msg2.field).toBe('description');
      expect(msg2.offset).toBe(42);

      expect(msg3.type).toBe('cursor');
      expect(msg3.userId).toBe('user-1');
    });

    it('should relay edit awareness to other clients', async () => {
      const editMsg = {
        messageId: 'msg-001',
        timestamp: new Date().toISOString(),
        type: 'edit',
        userId: 'user-2',
        object: 'Account',
        recordId: 'acc-001',
        field: 'name',
        operation: 'insert',
        value: 'Acme Corp',
        offset: 0,
      };

      client2.send(JSON.stringify(editMsg));

      const [msg1, msg3] = await Promise.all([waitForMessage(client1), waitForMessage(client3)]);

      expect(msg1.type).toBe('edit');
      expect(msg1.userId).toBe('user-2');
      expect(msg1.operation).toBe('insert');
      expect(msg1.value).toBe('Acme Corp');

      expect(msg3.type).toBe('edit');
      expect(msg3.userId).toBe('user-2');
    });

    it('should NOT echo cursor/edit back to sender', async () => {
      client1.send(
        JSON.stringify({
          messageId: 'msg-001',
          timestamp: new Date().toISOString(),
          type: 'cursor',
          userId: 'user-1',
          offset: 10,
        }),
      );

      // Others get it
      await Promise.all([waitForMessage(client2), waitForMessage(client3)]);

      // Sender should NOT
      await expect(waitForMessage(client1, 300)).rejects.toThrow('Message timeout');
    });
  });

  describe('Ping / Pong Heartbeat', () => {
    let client: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
      client = await connectClient(testPort);
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) client.close();
    });

    it('should respond to ping with pong', async () => {
      client.send(
        JSON.stringify({
          type: 'ping',
          messageId: 'ping-001',
          timestamp: new Date().toISOString(),
        }),
      );

      const pong = await waitForMessage(client);
      expect(pong.type).toBe('pong');
      expect(pong.messageId).toBeDefined();
      expect(pong.timestamp).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    let client: WebSocket;

    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
      client = await connectClient(testPort);
    });

    afterEach(() => {
      if (client && client.readyState === WebSocket.OPEN) client.close();
    });

    it('should return error for invalid JSON', async () => {
      client.send('not valid json!!!');

      const error = await waitForMessage(client);
      expect(error.type).toBe('error');
      expect(error.code).toBe('INVALID_MESSAGE');
      expect(error.message).toBeDefined();
    });
  });
});

// ─── Kernel Compliance Tests ───────────────────────────────────────────────────

describe('Kernel Compliance', () => {
  let plugin: any;
  let context: PluginContext;

  beforeEach(async () => {
    const mock = createMockContext();
    context = mock.context;
    plugin = createRealtimePlugin({ port: getPort() });
    await plugin.init(context);
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  describe('healthCheck()', () => {
    it('should return healthy status when server is not started', async () => {
      const report = await plugin.healthCheck!();
      // WSS not started yet, should report unhealthy
      expect(report.status).toBe('unhealthy');
    });

    it('should return healthy status when server is running', async () => {
      await plugin.start(context);

      const report = await plugin.healthCheck!();
      expect(report.status).toBe('healthy');
      expect(report.metrics?.uptime).toBeGreaterThanOrEqual(0);
      expect(report.checks).toHaveLength(1);
      expect(report.checks![0].name).toBe('realtime');
      expect(report.timestamp).toBeDefined();
    });
  });

  describe('getManifest()', () => {
    it('should return capability and security manifests', () => {
      const manifest = (plugin as any).getManifest();
      expect(manifest.capabilities).toBeDefined();
      expect(manifest.security).toBeDefined();
    });
  });

  describe('getStartupResult()', () => {
    it('should return startup result before server start', () => {
      const result = (plugin as any).getStartupResult();
      expect(result.plugin.name).toBe('@objectos/realtime');
      expect(result.success).toBe(false);
    });

    it('should return successful startup result after server start', async () => {
      await plugin.start(context);
      const result = (plugin as any).getStartupResult();
      expect(result.plugin.name).toBe('@objectos/realtime');
      expect(result.success).toBe(true);
    });
  });
});

// ─── Contract Compliance (IRealtimeService) ────────────────────────────────────

describe('Contract Compliance (IRealtimeService)', () => {
  let plugin: any;
  let context: PluginContext;

  beforeEach(async () => {
    const mock = createMockContext();
    context = mock.context;
    plugin = createRealtimePlugin({ port: getPort() });
    await plugin.init(context);
  });

  afterEach(async () => {
    await plugin.destroy();
  });

  describe('subscribe()', () => {
    it('should return a subscription ID string', async () => {
      const handler = jest.fn();
      const subId = await plugin.subscribe('test-channel', handler);
      expect(typeof subId).toBe('string');
      expect(subId.length).toBeGreaterThan(0);
    });
  });

  describe('unsubscribe()', () => {
    it('should remove a subscription without error', async () => {
      const handler = jest.fn();
      const subId = await plugin.subscribe('test-channel', handler);
      await expect(plugin.unsubscribe(subId)).resolves.toBeUndefined();
    });
  });

  describe('publish()', () => {
    it('should exist as a function', () => {
      expect(typeof plugin.publish).toBe('function');
    });

    it('should accept a spec RealtimeEventPayload', async () => {
      await expect(
        plugin.publish({
          type: 'test.event',
          data: { foo: 'bar' },
        }),
      ).resolves.toBeUndefined();
    });
  });
});

// ─── WebSocket Auth Enforcement Tests (TD-5 / M.1.3) ─────────────────────────

describe('Realtime Plugin — Auth Enforcement', () => {
  let authPlugin: any;
  let mockContext: PluginContext;
  let testPort: number;

  beforeEach(() => {
    const mock = createMockContext();
    mockContext = mock.context;
    testPort = getPort();
  });

  afterEach(async () => {
    if (authPlugin) await authPlugin.destroy();
  });

  it('should reject connections when auth is required and no token is provided', async () => {
    authPlugin = createRealtimePlugin({ port: testPort, auth: { required: true } });
    await authPlugin.init(mockContext);
    await authPlugin.start(mockContext);

    const client = new WebSocket(`ws://localhost:${testPort}`);
    const closePromise = new Promise<{ code: number; reason: string }>((resolve) => {
      client.on('close', (code, reason) => resolve({ code, reason: reason.toString() }));
    });

    const result = await closePromise;
    expect(result.code).toBe(4401);
    expect(result.reason).toContain('Authentication required');
  });

  it('should reject connections when auth service fails verification', async () => {
    // Register a mock auth service that rejects
    mockContext.registerService('auth', {
      verify: jest.fn().mockResolvedValue(null),
    });

    authPlugin = createRealtimePlugin({ port: testPort, auth: { required: true } });
    await authPlugin.init(mockContext);
    await authPlugin.start(mockContext);

    const client = new WebSocket(`ws://localhost:${testPort}?token=bad-token`);
    const closePromise = new Promise<{ code: number; reason: string }>((resolve) => {
      client.on('close', (code, reason) => resolve({ code, reason: reason.toString() }));
    });

    const result = await closePromise;
    expect(result.code).toBe(4401);
  });

  it('should accept connections when auth is disabled', async () => {
    authPlugin = createRealtimePlugin({ port: testPort, auth: { required: false } });
    await authPlugin.init(mockContext);
    await authPlugin.start(mockContext);

    const client = new WebSocket(`ws://localhost:${testPort}`);
    await waitForOpen(client);
    expect(client.readyState).toBe(WebSocket.OPEN);
    client.close();
  });

  it('should accept connections with valid custom validator', async () => {
    const validator = jest.fn().mockResolvedValue({
      authenticated: true,
      userId: 'user-123',
      roles: ['admin'],
    });

    authPlugin = createRealtimePlugin({
      port: testPort,
      auth: { required: true, validator },
    });
    await authPlugin.init(mockContext);
    await authPlugin.start(mockContext);

    const client = new WebSocket(`ws://localhost:${testPort}?token=valid-token`);

    // Set up message listener BEFORE open, then wait for both
    const welcomePromise = waitForMessage(client, 5000);
    await waitForOpen(client);
    const welcome = await welcomePromise;

    expect(welcome.type).toBe('ack');
    expect(welcome.success).toBe(true);
    expect(client.readyState).toBe(WebSocket.OPEN);
    expect(validator).toHaveBeenCalledWith('valid-token');
    client.close();
  }, 10000);

  it('should reject connections when custom validator returns unauthenticated', async () => {
    const validator = jest.fn().mockResolvedValue({
      authenticated: false,
      error: 'Token expired',
    });

    authPlugin = createRealtimePlugin({
      port: testPort,
      auth: { required: true, validator },
    });
    await authPlugin.init(mockContext);
    await authPlugin.start(mockContext);

    const client = new WebSocket(`ws://localhost:${testPort}?token=expired-token`);
    const closePromise = new Promise<{ code: number; reason: string }>((resolve) => {
      client.on('close', (code, reason) => resolve({ code, reason: reason.toString() }));
    });

    const result = await closePromise;
    expect(result.code).toBe(4401);
    expect(result.reason).toContain('Token expired');
  });
});
