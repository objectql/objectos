/**
 * UI Plugin for ObjectOS
 *
 * Manages view-related metadata persisted in a database via ObjectQL.
 * On init the plugin registers a `sys_view` object in ObjectQL and exposes
 * CRUD helpers that other plugins and the Admin Console can call through
 * the kernel service registry (`kernel.getService('ui')`).
 *
 * Architecture reference:
 *   @objectstack/spec  examples/metadata-objectql
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  UIServiceConfig,
  ViewRecord,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';

/**
 * UI Plugin
 * Implements the Plugin interface for @objectstack/runtime
 */
export class UIPlugin implements Plugin {
  name = '@objectos/ui';
  version = '0.1.0';
  dependencies: string[] = [];

  private context?: PluginContext;
  private objectql: any;
  private startedAt?: number;
  private viewObjectName: string;

  constructor(config: UIServiceConfig = {}) {
    this.viewObjectName = config.viewObjectName ?? 'sys_view';
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Initialize plugin – register the UI service and define the sys_view object.
   */
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();

    // Register as "ui" service (CoreServiceName)
    context.registerService('ui', this);

    // Obtain ObjectQL service for database access
    try {
      this.objectql = context.getService('objectql') ?? context.getService('data');
    } catch {
      // ObjectQL might not be available yet; will try again in start()
    }

    context.logger.info('[UI] Initialized successfully');
  };

  /**
   * Start plugin – ensure ObjectQL is available and register the sys_view object.
   */
  async start(context: PluginContext): Promise<void> {
    // Re-try ObjectQL lookup if it wasn't available during init
    if (!this.objectql) {
      try {
        this.objectql = context.getService('objectql') ?? context.getService('data');
      } catch {
        context.logger.warn('[UI] ObjectQL service not available – view persistence disabled');
      }
    }

    if (this.objectql) {
      await this.registerViewObject();
    }

    context.logger.info('[UI] Started successfully');
  }

  // ─── View CRUD ─────────────────────────────────────────────────────────────

  /**
   * Save (upsert) a view definition to the database.
   */
  async saveView(viewName: string, objectName: string, definition: Record<string, unknown>): Promise<ViewRecord> {
    this.ensureObjectQL();

    const record: Omit<ViewRecord, '_id'> = {
      name: viewName,
      object_name: objectName,
      label: (definition as any).label ?? viewName,
      type: (definition as any).type ?? 'grid',
      definition,
      is_default: false,
      is_public: true,
    };

    const existing = await this.objectql.findOne(this.viewObjectName, {
      filters: [['name', '=', viewName]],
    });

    if (existing) {
      return await this.objectql.update(this.viewObjectName, existing._id, record);
    }
    return await this.objectql.insert(this.viewObjectName, record);
  }

  /**
   * Load a single view definition by name.
   */
  async loadView(viewName: string): Promise<ViewRecord | null> {
    this.ensureObjectQL();

    return await this.objectql.findOne(this.viewObjectName, {
      filters: [['name', '=', viewName]],
    });
  }

  /**
   * List all views for a given object.
   */
  async listViews(objectName: string): Promise<ViewRecord[]> {
    this.ensureObjectQL();

    return await this.objectql.find(this.viewObjectName, {
      filters: [['object_name', '=', objectName]],
      sort: [{ field: 'name', order: 'asc' }],
    });
  }

  /**
   * Delete a view by name.
   */
  async deleteView(viewName: string): Promise<boolean> {
    this.ensureObjectQL();

    const existing = await this.objectql.findOne(this.viewObjectName, {
      filters: [['name', '=', viewName]],
    });

    if (!existing) return false;

    await this.objectql.delete(this.viewObjectName, existing._id);
    return true;
  }

  // ─── Kernel Compliance ─────────────────────────────────────────────────────

  /**
   * Health check
   */
  async healthCheck(): Promise<PluginHealthReport> {
    let checkStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'UI service operational';

    if (!this.objectql) {
      checkStatus = 'degraded';
      message = 'ObjectQL service not available';
    }

    return {
      status: checkStatus,
      timestamp: new Date().toISOString(),
      message,
      metrics: {
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
      },
      checks: [
        {
          name: 'objectql-backend',
          status: checkStatus === 'healthy' ? 'passed' : 'warning',
          message,
        },
      ],
    };
  }

  /**
   * Capability manifest
   */
  getManifest(): { capabilities: PluginCapabilityManifest; security: PluginSecurityManifest } {
    return {
      capabilities: {},
      security: {
        pluginId: 'ui',
        trustLevel: 'trusted',
        permissions: { permissions: [], defaultGrant: 'deny' },
        sandbox: { enabled: false, level: 'none' },
      },
    };
  }

  /**
   * Startup result
   */
  getStartupResult(): PluginStartupResult {
    return {
      plugin: { name: this.name, version: this.version },
      success: !!this.context,
      duration: 0,
    };
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    this.objectql = undefined;
    this.context?.logger.info('[UI] Destroyed');
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  /**
   * Register the sys_view metadata object in ObjectQL.
   */
  private async registerViewObject(): Promise<void> {
    if (!this.objectql) return;

    // Only attempt if ObjectQL exposes registerObject (engine instance)
    if (typeof this.objectql.registerObject !== 'function') return;

    try {
      const { ObjectSchema, Field } = await import('@objectstack/spec/data');

      const SysView = ObjectSchema.create({
        name: this.viewObjectName,
        label: 'View Metadata',
        description: 'Stores UI view definitions',
        fields: {
          name: Field.text({ label: 'View Name', required: true, unique: true }),
          object_name: Field.text({ label: 'Object Name', required: true }),
          label: Field.text({ label: 'Label' }),
          type: Field.select(['grid', 'kanban', 'calendar', 'timeline', 'gantt'], {
            label: 'View Type',
            required: true,
          }),
          definition: Field.textarea({ label: 'View Definition', required: true }),
          is_default: Field.boolean({ label: 'Is Default' }),
          is_public: Field.boolean({ label: 'Is Public' }),
        },
        indexes: [
          { fields: ['name'], unique: true },
          { fields: ['object_name'], unique: false },
        ],
      });

      this.objectql.registerObject(SysView);
      this.context?.logger.info(`[UI] Registered object: ${this.viewObjectName}`);
    } catch (err) {
      this.context?.logger.warn(`[UI] Could not register ${this.viewObjectName}: ${(err as Error).message}`);
    }
  }

  /**
   * Guard ensuring ObjectQL is available before data operations.
   */
  private ensureObjectQL(): void {
    if (!this.objectql) {
      throw new Error('[UI] ObjectQL service not available. Cannot perform view operations.');
    }
  }
}

/**
 * Helper to access the UI API from the kernel.
 */
export function getUIAPI(kernel: any): UIPlugin | null {
  try {
    return kernel.getService('ui');
  } catch {
    return null;
  }
}
