/**
 * Server Plugin for ObjectOS
 * 
 * This plugin provides HTTP server capabilities using NestJS.
 * It replaces the deprecated @objectos/server package.
 * 
 * Features:
 * - REST API endpoints
 * - GraphQL support
 * - WebSocket support
 * - Authentication middleware
 * - CORS configuration
 * - Static file serving
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export interface ServerPluginOptions {
  port?: number;
  cors?: {
    origins?: string[];
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
  };
  objectql?: any;
}

/**
 * Create Server Plugin
 * Factory function to create the plugin with custom configuration
 */
export const createServerPlugin = (options: ServerPluginOptions = {}): Plugin => {
  let app: any;
  
  return {
    name: 'com.objectos.server',
    version: '0.1.0',
    dependencies: ['com.objectstack.engine.objectql'],

    /**
     * Initialize plugin - Create NestJS app instance
     */
    async init(ctx: PluginContext): Promise<void> {
      ctx.logger.info('[Server Plugin] Initializing NestJS application...');
      
      try {
        // Create NestJS application
        app = await NestFactory.create(AppModule, {
          logger: ['log', 'error', 'warn', 'debug'],
        });
        
        // Configure CORS
        const allowedOrigins = options.cors?.origins || 
          (process.env.OBJECTQL_CORS_ORIGINS
            ? process.env.OBJECTQL_CORS_ORIGINS.split(',').map(origin => origin.trim())
            : ['http://localhost:5173', 'http://localhost:3000']);

        app.enableCors({
          origin: allowedOrigins,
          credentials: options.cors?.credentials ?? true,
          methods: options.cors?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
          allowedHeaders: options.cors?.allowedHeaders || ['Content-Type', 'Authorization', 'X-Requested-With'],
        });
        
        // Register the NestJS app in service registry
        ctx.registerService('nestjs.app', app);
        
        // Get ObjectQL instance from service registry if available
        try {
          const objectql = ctx.getService('objectql');
          ctx.logger.debug('[Server Plugin] ObjectQL instance found in registry');
          // You could inject ObjectQL into the app here if needed
        } catch (error) {
          // ObjectQL service not available
        }
        
        ctx.logger.info('[Server Plugin] NestJS application initialized');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorObj = error instanceof Error ? error : undefined;
        ctx.logger.error(`[Server Plugin] Failed to initialize: ${errorMessage}`, errorObj);
        throw new Error(`Server Plugin initialization failed: ${errorMessage}`);
      }
    },

    /**
     * Start plugin - Start the HTTP server
     */
    async start(ctx: PluginContext): Promise<void> {
      ctx.logger.info('[Server Plugin] Starting HTTP server...');
      
      try {
        const port = options.port || Number(process.env.OBJECTQL_PORT) || 3000;
        
        await app.listen(port);
        const url = await app.getUrl();
        
        ctx.logger.info(`[Server Plugin] Server started at ${url}`);
        console.log(`Application is running on: ${url}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorObj = error instanceof Error ? error : undefined;
        ctx.logger.error(`[Server Plugin] Failed to start server: ${errorMessage}`, errorObj);
        throw new Error(`Server Plugin start failed: ${errorMessage}`);
      }
    },

    /**
     * Destroy plugin - Shutdown the HTTP server
     */
    async destroy(): Promise<void> {
      if (app) {
        await app.close();
        console.log('[Server Plugin] HTTP server stopped');
      }
    },
  };
};

/**
 * Default server plugin instance
 */
export const ServerPlugin = createServerPlugin();
