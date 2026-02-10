/**
 * UI Plugin — Public API
 *
 * Export all public interfaces and classes
 */

// Types
export type {
  UIServiceConfig,
  ViewRecord,
} from './types.js';

// Plugin
export { UIPlugin, getUIAPI } from './plugin.js';
