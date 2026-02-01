/**
 * Server Plugin for ObjectOS Runtime
 * 
 * This plugin provides HTTP server capabilities using NestJS.
 * It exports all necessary components for the runtime.
 */

export { createServerPlugin, ServerPlugin } from './plugin';
export type { ServerPluginOptions } from './plugin';

// Re-export NestJS components for direct use if needed
export { AppModule } from './app.module';
export { AppController } from './app.controller';
export { AppService } from './app.service';
