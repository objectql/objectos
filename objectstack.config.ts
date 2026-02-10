/**
 * ObjectStack Configuration
 *
 * Configuration file for @objectstack/cli serve command.
 * This defines the kernel configuration, plugins, and metadata sources.
 */

import { defineStack } from '@objectstack/spec';
import { AppPlugin, DriverPlugin } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { AuditLogPlugin } from '@objectos/audit';
import { AuthPlugin } from '@objectstack/plugin-auth';
import { AutomationPlugin } from '@objectos/automation';
import { CachePlugin } from '@objectos/cache';
import { I18nPlugin } from '@objectos/i18n';
import { JobsPlugin } from '@objectos/jobs';
import { MetricsPlugin } from '@objectos/metrics';
import { NotificationPlugin } from '@objectos/notification';
import { PermissionsPlugin } from '@objectos/permissions';
import { createRealtimePlugin } from '@objectos/realtime';
import { StoragePlugin } from '@objectos/storage';
import { UIPlugin } from '@objectos/ui';
import { WorkflowPlugin } from '@objectos/workflow';
import { resolve } from 'path';

// ─── Example App Bundles ─────────────────────────────────────────
import CrmApp from './examples/crm/objectstack.config';
import TodoApp from './examples/todo/objectstack.config';

export default defineStack({
  manifest: {
    id: 'com.objectos.platform',
    name: 'ObjectOS',
    namespace: 'objectos',
    version: '0.1.0',
    type: 'app',
    description: 'ObjectOS Business Operating System',
  },

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
   * Plugins to check/load
   * These are initialized in order during kernel bootstrap
   */
  plugins: [
    // ObjectQL Engine & Driver
    new ObjectQLPlugin(),
    new DriverPlugin(new InMemoryDriver()),

    // Foundation
    new MetricsPlugin(),
    new CachePlugin(),
    new StoragePlugin(),

    // Core
    new AuthPlugin(),
    new PermissionsPlugin(),
    new AuditLogPlugin(),

    // Logic
    new WorkflowPlugin(),
    new AutomationPlugin(),
    new JobsPlugin(),

    // Services
    new NotificationPlugin(),
    new I18nPlugin(),
    new UIPlugin(),
    // createRealtimePlugin(),

    // Example Apps
    new AppPlugin(CrmApp),
    new AppPlugin(TodoApp),
  ],

  /**
   * Server configuration
   */
  server: {
    port: process.env.PORT || 5320,
    /**
     * Static mounts for production single-process deployment.
     * - /console/* → apps/web/dist (Vite SPA)
     * - /docs/*    → apps/site/out (Next.js static export)
     */
    staticMounts: [
      { root: './apps/web/dist', path: '/console', spa: true, rewrite: true },
      { root: './apps/site/out', path: '/docs', rewrite: true },
    ],
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5321', 'http://localhost:5320'],
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
} as any);
