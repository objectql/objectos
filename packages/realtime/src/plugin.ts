import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { PluginHealthReport, PluginCapabilityManifest, PluginSecurityManifest, PluginStartupResult } from './types.js';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

export interface RealtimePluginOptions {
  port?: number;
  path?: string;
}

// Interfaces based on @objectstack/spec/api/websocket.zod
interface BaseMessage {
    messageId: string;
    timestamp: string;
}

interface SubscribeMessage extends BaseMessage {
    type: 'subscribe';
    subscription: {
        subscriptionId: string;
        events: string[];
        objects?: string[];
        filters?: {
            conditions?: Array<{
                field: string;
                operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith' | 'exists' | 'regex';
                value?: any;
            }>;
        };
    };
}

interface UnsubscribeMessage extends BaseMessage {
    type: 'unsubscribe';
    request: {
        subscriptionIds?: string[];
        all?: boolean;
    };
}

interface EventMessage extends BaseMessage {
    type: 'event';
    subscriptionId: string;
    eventName: string;
    object?: string;
    payload: any;
    userId?: string;
}

interface AckMessage extends BaseMessage {
    type: 'ack';
    ackMessageId: string;
    success: boolean;
    error?: string;
}

interface PresenceMessage extends BaseMessage {
    type: 'presence';
    presence: {
        userId: string;
        status: 'online' | 'offline' | 'away' | 'busy';
        context?: any;
        lastActive: string;
    };
}

interface ClientState {
    subscriptions: Map<string, SubscribeMessage['subscription']>;
}

export const createRealtimePlugin = (options: RealtimePluginOptions = {}): Plugin => {
  let wss: WebSocketServer;
  const clientStates = new Map<WebSocket, ClientState>();
  let startedAt: number | undefined;

  // Helper: Simple Wildcard Matcher (e.g. "user.*" matches "user.created")
  const matchPattern = (pattern: string, event: string): boolean => {
      if (pattern === '*') return true;
      if (pattern === event) return true;
      if (pattern.endsWith('*')) {
          const prefix = pattern.slice(0, -1);
          return event.startsWith(prefix);
      }
      return false;
  };

  // Helper: Filter Logic
  const checkFilter = (payload: any, condition: any): boolean => {
      const value = payload?.[condition.field];
      const target = condition.value;
      
      switch (condition.operator) {
          case 'eq': return value === target;
          case 'ne': return value !== target;
          case 'gt': return value > target;
          case 'gte': return value >= target;
          case 'lt': return value < target;
          case 'lte': return value <= target;
          case 'in': return Array.isArray(target) && target.includes(value);
          case 'nin': return Array.isArray(target) && !target.includes(value);
          case 'contains': return typeof value === 'string' && value.includes(target);
          case 'startsWith': return typeof value === 'string' && value.startsWith(target);
          case 'endsWith': return typeof value === 'string' && value.endsWith(target);
          case 'exists': return value !== undefined && value !== null;
          case 'regex': return new RegExp(target).test(value);
          default: return false;
      }
  };

  return {
    name: '@objectos/realtime',
    version: '0.1.0',
    // description: 'Provides WebSocket capabilities compliant with @objectstack/spec',
    
    async init(ctx: PluginContext) {
      ctx.logger.info('[Realtime] Initializing WebSocket Server...');
      startedAt = Date.now();

      // 1. Register the service so Adapters can find us
      ctx.registerService('websocket-server', {
        broadcast: (eventName: string, payload: any, meta?: { object?: string, userId?: string }) => {
          if (!wss) return;

          const timestamp = new Date().toISOString();
          
          wss.clients.forEach(client => {
            if (client.readyState !== WebSocket.OPEN) return;
            
            const state = clientStates.get(client);
            if (!state) return;

            // Check all subscriptions for this client
            state.subscriptions.forEach(subscription => {
                // 1. Check Object filter
                if (subscription.objects && meta?.object) {
                    if (!subscription.objects.includes(meta.object)) return;
                }

                // 2. Check Event Pattern
                const isMatch = subscription.events.some(pattern => matchPattern(pattern, eventName));
                
                if (isMatch) {
                    // 3. Check Complex Filters
                    if (subscription.filters?.conditions) {
                        const pass = subscription.filters.conditions.every((c: any) => checkFilter(payload, c));
                        if (!pass) return;
                    }

                    // Send Event
                    const message: EventMessage = {
                        messageId: randomUUID(),
                        timestamp,
                        type: 'event',
                        subscriptionId: subscription.subscriptionId,
                        eventName,
                        object: meta?.object,
                        payload,
                        userId: meta?.userId
                    };
                    client.send(JSON.stringify(message));
                }
            });
          });
        },
        
        // Presence API
        updatePresence: (userId: string, status: any, context?: any) => {
            if (!wss) return;
            const message: PresenceMessage = {
                messageId: randomUUID(),
                timestamp: new Date().toISOString(),
                type: 'presence',
                presence: {
                    userId,
                    status: status.status || 'online',
                    context,
                    lastActive: new Date().toISOString()
                }
            };
            const msgStr = JSON.stringify(message);
            wss.clients.forEach(c => {
                 if (c.readyState === WebSocket.OPEN) c.send(msgStr);
            });
        },

        // Allow adapters to get the raw WSS if needed
        getServer: () => wss
      });

      ctx.logger.info('[Realtime] Service registered as "websocket-server"');
    },

    async start(ctx: PluginContext) {
      const port = options.port || 3001; // Default to separate port for now
      
      ctx.logger.info(`[Realtime] Starting WebSocket Server on port ${port}...`);
      
      wss = new WebSocketServer({ port });

      wss.on('connection', (ws) => {
        ctx.logger.debug('[Realtime] Client connected');
        
        // Initialize State
        clientStates.set(ws, { subscriptions: new Map() });

        ws.on('message', (rawMessage) => {
            try {
                const data = JSON.parse(rawMessage.toString()) as any;
                const messageId = data.messageId || randomUUID();
                const timestamp = new Date().toISOString();

                // Handle Subscriptions
                if (data.type === 'subscribe') {
                    const msg = data as SubscribeMessage;
                    const state = clientStates.get(ws);
                    if (state && msg.subscription) {
                        state.subscriptions.set(msg.subscription.subscriptionId, msg.subscription);
                        
                        // Send ACK
                        const ack: AckMessage = {
                            messageId: randomUUID(),
                            timestamp,
                            type: 'ack',
                            ackMessageId: messageId,
                            success: true
                        };
                        ws.send(JSON.stringify(ack));
                        ctx.logger.debug(`[Realtime] Subscribed: ${msg.subscription.subscriptionId}`);
                    }
                }

                // Handle Unsubscribe
                if (data.type === 'unsubscribe') {
                    const msg = data as UnsubscribeMessage;
                    const state = clientStates.get(ws);
                    if (state && msg.request) {
                        if (msg.request.all) {
                            state.subscriptions.clear();
                        } else if (msg.request.subscriptionIds) {
                            msg.request.subscriptionIds.forEach(id => state.subscriptions.delete(id));
                        }
                        
                         // Send ACK
                        const ack: AckMessage = {
                            messageId: randomUUID(),
                            timestamp,
                            type: 'ack',
                            ackMessageId: messageId,
                            success: true
                        };
                        ws.send(JSON.stringify(ack));
                    }
                }
                
                // Handle Presence Update from Client
                if (data.type === 'presence') {
                    // Broadcast presence to others (simplified)
                    // In real impl, we should filter by channel/context
                     wss.clients.forEach(c => {
                        if (c !== ws && c.readyState === WebSocket.OPEN) {
                             c.send(JSON.stringify({
                                ...data,
                                messageId: randomUUID(),
                                timestamp
                             }));
                        }
                    });
                }

                // Handle Cursor/Edit (Pass-through for collaboration)
                if (data.type === 'cursor' || data.type === 'edit') {
                     // Broadcast to others in same context (simplified as global broadcast here)
                     wss.clients.forEach(c => {
                        if (c !== ws && c.readyState === WebSocket.OPEN) {
                             c.send(JSON.stringify({
                                ...data,
                                messageId: randomUUID(),
                                timestamp
                             }));
                        }
                    });
                }
                
                // Handle Ping
                if (data.type === 'ping') {
                    ws.send(JSON.stringify({
                        type: 'pong',
                        messageId: randomUUID(),
                        timestamp
                    }));
                }

            } catch (e) {
                // Send Error
                ws.send(JSON.stringify({
                    type: 'error',
                    messageId: randomUUID(),
                    timestamp: new Date().toISOString(),
                    code: 'INVALID_MESSAGE',
                    message: e instanceof Error ? e.message : 'Invalid JSON'
                }));
            }
        });
        
        ws.on('close', () => {
            clientStates.delete(ws);
        });

        // Send Welcome Message (Optional, standardized as generic event or ignored in strict spec, 
        // but useful for debugging connectivity)
         ws.send(JSON.stringify({
            type: 'ack', 
            messageId: randomUUID(), 
            timestamp: new Date().toISOString(),
            ackMessageId: 'init',
            success: true 
        }));
      });

      ctx.logger.info('[Realtime] WebSocket Server started');
    },

    async destroy() {
      if (wss) {
        wss.clients.forEach(client => client.close());
        wss.close();
      }
    },

    async healthCheck(): Promise<PluginHealthReport> {
      const clientCount = wss ? wss.clients.size : 0;
      const status = wss ? 'healthy' : 'unhealthy';
      const message = `${clientCount} connected clients`;
      return {
        status,
        timestamp: new Date().toISOString(),
        message,
        metrics: {
          uptime: startedAt ? Date.now() - startedAt : 0,
        },
        checks: [{ name: 'websocket-server', status: wss ? 'passed' : 'failed', message }],
      };
    },

    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
      return {
        capabilities: {},
        security: {
          pluginId: 'realtime',
          trustLevel: 'trusted',
          permissions: { permissions: [], defaultGrant: 'deny' },
          sandbox: { enabled: false, level: 'none' },
        },
      };
    },

    getStartupResult(): PluginStartupResult {
      return { plugin: { name: '@objectos/realtime', version: '0.1.0' }, success: !!wss, duration: 0 };
    },
  } as Plugin;
};
