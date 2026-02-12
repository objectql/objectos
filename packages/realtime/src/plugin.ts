import type { Plugin, PluginContext } from '@objectstack/runtime';
import type { IRealtimeService, RealtimeEventPayload as SpecRealtimeEventPayload, RealtimeEventHandler as SpecRealtimeEventHandler, RealtimeSubscriptionOptions as SpecRealtimeSubscriptionOptions } from '@objectstack/spec/contracts';
import type { PluginHealthReport, PluginCapabilityManifest, PluginSecurityManifest, PluginStartupResult, CollaborationSession, WebSocketAuthConfig } from './types.js';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import type { IncomingMessage } from 'http';

export interface RealtimePluginOptions {
  port?: number;
  path?: string;
  /** Authentication configuration for WebSocket connections */
  auth?: WebSocketAuthConfig;
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
    /** Authenticated user ID (set during connection handshake) */
    userId?: string;
    /** Authenticated user roles */
    roles?: string[];
}

export const createRealtimePlugin = (options: RealtimePluginOptions = {}): Plugin & IRealtimeService => {
  let wss: WebSocketServer;
  const clientStates = new Map<WebSocket, ClientState>();
  let startedAt: number | undefined;
  let pluginCtx: PluginContext | undefined;
  const collaborationSessions = new Map<string, CollaborationSession>();
  const authConfig: WebSocketAuthConfig = options.auth ?? { required: true };

  // ── Auth: Token extraction from HTTP upgrade request ─────────────────────
  const extractToken = (req: IncomingMessage): string | null => {
    // 1. Check cookie (better-auth session token)
    const cookies = req.headers.cookie ?? '';
    const match = cookies.match(/better-auth\.session_token=([^;]+)/);
    if (match) return match[1];

    // 2. Check Sec-WebSocket-Protocol: auth, <token>
    const protocols = req.headers['sec-websocket-protocol'];
    if (protocols) {
      const parts = protocols.split(',').map((p) => p.trim());
      const tokenIdx = parts.indexOf('auth');
      if (tokenIdx >= 0 && parts[tokenIdx + 1]) {
        return parts[tokenIdx + 1];
      }
    }

    // 3. Check query parameter (fallback)
    try {
      const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
      return url.searchParams.get('token');
    } catch {
      return null;
    }
  };

  // ── Auth: Session heartbeat re-validation interval (5 minutes) ───────────
  let heartbeatInterval: ReturnType<typeof setInterval> | undefined;

  // In-memory handler registry for IRealtimeService.subscribe / unsubscribe
  const handlerRegistry = new Map<string, { channel: string; handler: SpecRealtimeEventHandler; options?: SpecRealtimeSubscriptionOptions }>();

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
      pluginCtx = ctx;

      // 1. Register the service so Adapters can find us
      ctx.registerService('realtime', {
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
        getServer: () => wss,

        // Collaboration session management
        createSession: (session: CollaborationSession) => {
            collaborationSessions.set(session.sessionId, session);
            return session;
        },
        getSession: (sessionId: string) => {
            return collaborationSessions.get(sessionId) || null;
        },
        listSessions: () => {
            return Array.from(collaborationSessions.values());
        },
        closeSession: (sessionId: string) => {
            return collaborationSessions.delete(sessionId);
        },
      });

      ctx.logger.info('[Realtime] Service registered as "realtime"');
      await ctx.trigger('plugin.initialized', { pluginId: '@objectos/realtime' });
    },

    async start(ctx: PluginContext) {
      const port = options.port || 3001; // Default to separate port for now
      
      ctx.logger.info(`[Realtime] Starting WebSocket Server on port ${port}...`);
      
      wss = new WebSocketServer({ port });

      wss.on('connection', async (ws, req) => {
        ctx.logger.debug('[Realtime] Client connecting...');

        // ── Auth handshake ─────────────────────────────────────────────────
        if (authConfig.required !== false) {
          const token = extractToken(req);

          if (!token) {
            ws.close(4401, 'Authentication required');
            ctx.logger.debug('[Realtime] Connection rejected: no token');
            return;
          }

          try {
            let userId: string | undefined;
            let roles: string[] | undefined;

            // Custom validator takes precedence
            if (authConfig.validator) {
              const result = await authConfig.validator(token);
              if (!result.authenticated || !result.userId) {
                ws.close(4401, result.error ?? 'Invalid session');
                return;
              }
              userId = result.userId;
              roles = result.roles;
            } else {
              // Use kernel auth service when available
              try {
                const authService = ctx.getService('auth') as any;
                const session = await authService.verify(token);
                if (!session?.userId) {
                  ws.close(4401, 'Invalid session');
                  return;
                }
                userId = session.userId;
                roles = session.roles;
              } catch {
                ws.close(4401, 'Authentication failed');
                return;
              }
            }

            clientStates.set(ws, { subscriptions: new Map(), userId, roles });
            ctx.logger.debug(`[Realtime] Authenticated client connected: ${userId}`);
          } catch {
            ws.close(4401, 'Authentication failed');
            return;
          }
        } else {
          // Auth not required (development mode)
          clientStates.set(ws, { subscriptions: new Map() });
          ctx.logger.debug('[Realtime] Client connected (auth disabled)');
        }

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

                // Handle OT operations (Operational Transform)
                if (data.type === 'ot-operation') {
                    wss.clients.forEach(c => {
                        if (c !== ws && c.readyState === WebSocket.OPEN) {
                            c.send(JSON.stringify({
                                ...data,
                                messageId: randomUUID(),
                                timestamp
                            }));
                        }
                    });

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

      // ── Heartbeat: re-validate sessions every 5 minutes ───────────────
      if (authConfig.required !== false) {
        heartbeatInterval = setInterval(async () => {
          for (const [ws, state] of clientStates) {
            if (!state.userId || ws.readyState !== WebSocket.OPEN) continue;
            try {
              if (authConfig.validator) {
                // Cannot re-validate without the original token — skip
                continue;
              }
              const authService = ctx.getService('auth') as any;
              if (authService?.verifySession) {
                const session = await authService.verifySession(state.userId);
                if (!session) {
                  ws.close(4401, 'Session expired');
                  clientStates.delete(ws);
                }
              }
            } catch {
              // Non-fatal: keep connection alive
            }
          }
        }, 300_000); // 5 minutes

        if (heartbeatInterval && typeof heartbeatInterval === 'object' && 'unref' in heartbeatInterval) {
          (heartbeatInterval as NodeJS.Timeout).unref();
        }
      }

      await ctx.trigger('plugin.started', { pluginId: '@objectos/realtime' });
    },

    async destroy() {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = undefined;
      }
      if (wss) {
        wss.clients.forEach(client => client.close());
        wss.close();
      }
      collaborationSessions.clear();
      await pluginCtx?.trigger('plugin.destroyed', { pluginId: '@objectos/realtime' });
    },

    async healthCheck(): Promise<PluginHealthReport> {
      const start = Date.now();
      const clientCount = wss ? wss.clients.size : 0;
      const status = wss ? 'healthy' : 'unhealthy';
      const message = `${clientCount} connected clients`;
      const latency = Date.now() - start;
      return {
        status,
        timestamp: new Date().toISOString(),
        message,
        metrics: {
          uptime: startedAt ? Date.now() - startedAt : 0,
          responseTime: latency,
        },
        checks: [{ name: 'realtime', status: wss ? 'passed' : 'failed', message }],
      };
    },

    getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
      return {
        capabilities: {
          provides: [{
            id: 'com.objectstack.service.realtime',
            name: 'realtime',
            version: { major: 0, minor: 1, patch: 0 },
            methods: [
              { name: 'broadcast', description: 'Broadcast event to subscribed clients', async: false },
              { name: 'updatePresence', description: 'Update user presence status', async: false },
              { name: 'getServer', description: 'Get the raw WebSocket server instance', async: false },
            ],
            stability: 'stable',
          }],
          requires: [],
        },
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

    // ── IRealtimeService contract methods ──

    async publish(event: SpecRealtimeEventPayload): Promise<void> {
      if (!wss) return;
      const timestamp = new Date().toISOString();

      // Broadcast to WebSocket clients via existing logic
      wss.clients.forEach(client => {
        if (client.readyState !== WebSocket.OPEN) return;
        const state = clientStates.get(client);
        if (!state) return;

        state.subscriptions.forEach(subscription => {
          if (subscription.objects && event.object) {
            if (!subscription.objects.includes(event.object)) return;
          }
          const isMatch = subscription.events.some(pattern => matchPattern(pattern, event.type));
          if (isMatch) {
            const message: EventMessage = {
              messageId: randomUUID(),
              timestamp,
              type: 'event',
              subscriptionId: subscription.subscriptionId,
              eventName: event.type,
              object: event.object,
              payload: event.payload,
            };
            client.send(JSON.stringify(message));
          }
        });
      });

      // Dispatch to in-memory handler subscriptions
      handlerRegistry.forEach(({ channel, handler, options }) => {
        const channelMatch = channel === '*' || channel === event.type || event.type.startsWith(channel + '.');
        if (!channelMatch) return;
        if (options?.object && event.object !== options.object) return;
        if (options?.eventTypes && !options.eventTypes.includes(event.type)) return;
        try { handler(event); } catch { /* swallow handler errors */ }
      });
    },

    async subscribe(channel: string, handler: SpecRealtimeEventHandler, options?: SpecRealtimeSubscriptionOptions): Promise<string> {
      const subscriptionId = randomUUID();
      handlerRegistry.set(subscriptionId, { channel, handler, options });
      return subscriptionId;
    },

    async unsubscribe(subscriptionId: string): Promise<void> {
      handlerRegistry.delete(subscriptionId);
    },
  } as Plugin & IRealtimeService;
};
