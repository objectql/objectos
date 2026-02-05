/**
 * ObjectStack Configuration
 * 
 * Configuration file for @objectstack/cli serve command.
 * This defines the kernel configuration, plugins, and metadata sources.
 */

import { AuditLogPlugin } from '@objectos/audit';
import { BetterAuthPlugin } from '@objectos/auth';
import { AutomationPlugin } from '@objectos/automation';
import { CachePlugin } from '@objectos/cache';
import { I18nPlugin } from '@objectos/i18n';
import { JobsPlugin } from '@objectos/jobs';
import { MetricsPlugin } from '@objectos/metrics';
import { NotificationPlugin } from '@objectos/notification';
import { PermissionsPlugin } from '@objectos/permissions';
import { createRealtimePlugin } from '@objectos/realtime';
import { StoragePlugin } from '@objectos/storage';
import { WorkflowPlugin } from '@objectos/workflow';
import { resolve } from 'path';

export default {
  /**
   * Metadata sources
   * Define where to load object schemas, permissions, workflows, etc.
   */
  metadata: {
    baseDir: resolve(__dirname),
    patterns: [
      'packages/*/objects/*.object.yml',
      'packages/*/workflows/*.workflow.yml',
      'packages/*/permissions/*.permission.yml',
    ]
  },

  /**
   * Objects configuration
   * Can define objects inline or reference external files
   */
  objects: {},

  /**
   * Plugins to check/load
   * These are initialized in order during kernel bootstrap
   */
  plugins: [
    // Foundation
    new MetricsPlugin(),
    new CachePlugin(), 
    new StoragePlugin(),

    // Core
    new BetterAuthPlugin(),
    new PermissionsPlugin(),
    new AuditLogPlugin(),

    // Logic
    new WorkflowPlugin(),
    new AutomationPlugin(),
    new JobsPlugin(),
    
    // Services
    new NotificationPlugin(),
    new I18nPlugin(),
    createRealtimePlugin(),
  ],

  /**
   * Server configuration
   */
  server: {
    port: process.env.PORT || 3000,
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    }
  },

  /**
   * Kernel Configuration
   */
  kernel: {
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    }
  }
};
