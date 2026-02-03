import type { Plugin, PluginContext } from '@objectstack/runtime';
import { WebSocketServer, WebSocket } from 'ws';

export interface RealtimePluginOptions {
  port?: number;
  path?: string;
}

export const createRealtimePlugin = (options: RealtimePluginOptions = {}): Plugin => {
  let wss: WebSocketServer;

  return {
    name: 'com.objectos.realtime',
    version: '0.1.0',
    description: 'Provides WebSocket capabilities',
    
    async init(ctx: PluginContext) {
      ctx.logger.info('[Realtime] Initializing WebSocket Server...');

      // 1. Register the service so Adapters can find us
      ctx.registerService('websocket-server', {
        broadcast: (event: string, payload: any) => {
          if (!wss) return;
          const message = JSON.stringify({ type: 'event', event, payload });
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
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

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                // Handle incoming messages (e.g. subscribe)
                if (data.type === 'subscribe') {
                    // Logic to subscribe to events
                    ctx.logger.debug(`[Realtime] Client subscribed to ${data.topic}`);
                }
            } catch (e) {
                // Ignore invalid JSON
            }
        });

        ws.send(JSON.stringify({ type: 'connected', message: 'Welcome to ObjectOS Realtime' }));
      });

      ctx.logger.info('[Realtime] WebSocket Server started');
    },

    async stop(ctx: PluginContext) {
      if (wss) {
        wss.close();
      }
    }
  };
};
