/**
 * @objectstack/runtime - Main Entry Point
 * 
 * Exports the micro-kernel architecture components.
 */

// Core kernel
export { ObjectKernel } from './kernel';

// Plugin types and interfaces
export type { Plugin, PluginContext, Logger } from './types';

// Plugin context implementation
export { PluginContextImpl } from './plugin-context';

// Logger
export { ConsoleLogger, createLogger } from './logger';

// Built-in plugins
export { ObjectQLPlugin } from './plugins/objectql-plugin';
export { DriverPlugin } from './plugins/driver-plugin';
