/**
 * Tool Registry for ObjectOS Agent Framework (O.3.2)
 *
 * Manages tool registration, lookup, and execution for AI agents.
 * Built-in tools are registered automatically for common operations
 * (CRUD, workflow, notification, metadata). All tool execution goes
 * through the broker for RBAC enforcement.
 */

import type {
  AgentTool,
  AgentToolResult,
  ToolExecutionContext,
  LLMToolDefinition,
} from './types.js';

/**
 * Registry for agent tools.
 * Tools are callable functions that the LLM can invoke during conversation.
 */
export class ToolRegistry {
  private tools = new Map<string, AgentTool>();

  constructor() {
    this.registerBuiltinTools();
  }

  /**
   * Register a tool
   */
  register(tool: AgentTool): void {
    if (!tool.name || !tool.description) {
      throw new Error('Tool must have a name and description');
    }
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool by name
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Get a tool by name
   */
  get(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  /**
   * List all registered tools
   */
  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name with permission checking via broker
   */
  async execute(
    name: string,
    args: Record<string, any>,
    context: ToolExecutionContext,
  ): Promise<AgentToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool "${name}" not found` };
    }

    try {
      // Permission check via broker if available
      if (context.broker) {
        const permService = context.broker.getService?.('permissions');
        if (permService) {
          const allowed = await permService.check?.(context.userId, `agent.tool.${name}`);
          if (allowed === false) {
            return { success: false, error: `Permission denied for tool "${name}"` };
          }
        }
      }

      return await tool.handler(args, context);
    } catch (error: any) {
      return { success: false, error: error.message ?? String(error) };
    }
  }

  /**
   * Return tool definitions in LLM-compatible format
   */
  getToolDefinitions(): LLMToolDefinition[] {
    return this.list().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  // ─── Built-in Tools ───────────────────────────────────────────

  private registerBuiltinTools(): void {
    const builtins: AgentTool[] = [
      // Data operations
      {
        name: 'data.find',
        description: 'Find records matching a query',
        parameters: {
          type: 'object',
          properties: {
            object: { type: 'string', description: 'Object name (e.g., "accounts")' },
            filter: { type: 'object', description: 'Filter criteria' },
            limit: { type: 'number', description: 'Max records to return' },
          },
          required: ['object'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'data.find', args),
      },
      {
        name: 'data.findOne',
        description: 'Get a single record by ID',
        parameters: {
          type: 'object',
          properties: {
            object: { type: 'string', description: 'Object name' },
            id: { type: 'string', description: 'Record ID' },
          },
          required: ['object', 'id'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'data.findOne', args),
      },
      {
        name: 'data.create',
        description: 'Create a new record',
        parameters: {
          type: 'object',
          properties: {
            object: { type: 'string', description: 'Object name' },
            data: { type: 'object', description: 'Record data' },
          },
          required: ['object', 'data'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'data.create', args),
      },
      {
        name: 'data.update',
        description: 'Update an existing record',
        parameters: {
          type: 'object',
          properties: {
            object: { type: 'string', description: 'Object name' },
            id: { type: 'string', description: 'Record ID' },
            data: { type: 'object', description: 'Fields to update' },
          },
          required: ['object', 'id', 'data'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'data.update', args),
      },
      {
        name: 'data.delete',
        description: 'Delete a record',
        parameters: {
          type: 'object',
          properties: {
            object: { type: 'string', description: 'Object name' },
            id: { type: 'string', description: 'Record ID' },
          },
          required: ['object', 'id'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'data.delete', args),
      },

      // Workflow operations
      {
        name: 'workflow.start',
        description: 'Start a workflow instance',
        parameters: {
          type: 'object',
          properties: {
            workflowId: { type: 'string', description: 'Workflow definition ID' },
            objectName: { type: 'string', description: 'Object name' },
            recordId: { type: 'string', description: 'Record ID' },
          },
          required: ['workflowId', 'objectName', 'recordId'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'workflow.start', args),
      },
      {
        name: 'workflow.transition',
        description: 'Trigger a workflow transition',
        parameters: {
          type: 'object',
          properties: {
            instanceId: { type: 'string', description: 'Workflow instance ID' },
            transition: { type: 'string', description: 'Transition name' },
          },
          required: ['instanceId', 'transition'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'workflow.transition', args),
      },

      // Notification
      {
        name: 'notification.send',
        description: 'Send a notification (email, SMS, push, or webhook)',
        parameters: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Channel: email, sms, push, webhook' },
            to: { type: 'string', description: 'Recipient identifier' },
            subject: { type: 'string', description: 'Notification subject' },
            body: { type: 'string', description: 'Notification body' },
          },
          required: ['channel', 'to', 'body'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'notification.send', args),
      },

      // Metadata
      {
        name: 'metadata.getObjects',
        description: 'List available object definitions',
        parameters: {
          type: 'object',
          properties: {},
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'metadata.getObjects', args),
      },
      {
        name: 'metadata.getObject',
        description: 'Get the schema of a specific object',
        parameters: {
          type: 'object',
          properties: {
            objectName: { type: 'string', description: 'Object name' },
          },
          required: ['objectName'],
        },
        handler: async (args, ctx) => this.brokerCall(ctx, 'metadata.getObject', args),
      },
    ];

    for (const tool of builtins) {
      this.tools.set(tool.name, tool);
    }
  }

  /**
   * Call a service action via broker with RBAC enforcement
   */
  private async brokerCall(
    ctx: ToolExecutionContext,
    action: string,
    params: Record<string, any>,
  ): Promise<AgentToolResult> {
    if (!ctx.broker) {
      return { success: false, error: 'Broker not available' };
    }
    try {
      const result = await ctx.broker.call(action, {
        ...params,
        _tenantId: ctx.tenantId,
        _userId: ctx.userId,
      });
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message ?? String(error) };
    }
  }
}
