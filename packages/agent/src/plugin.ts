/**
 * Agent Plugin for ObjectOS (O.3.1)
 *
 * Main plugin that integrates the AI Agent Framework into the ObjectOS kernel:
 *
 * - O.3.1: Plugin lifecycle, service registration, HTTP routes
 * - O.3.2: Tool Registry (built-in CRUD, workflow, notification, metadata)
 * - O.3.3: Conversation Manager with tenant isolation
 * - O.3.4: Orchestrator for multi-step LLM ↔ Tool reasoning
 * - O.3.6: Audit logging and cost tracking
 *
 * @example
 * ```typescript
 * import { AgentPlugin } from '@objectos/agent';
 *
 * new AgentPlugin({ model: 'gpt-4o', maxTurns: 10 });
 * ```
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  AgentConfig,
  ResolvedAgentConfig,
  CostConfig,
  AgentMessage,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
import { ToolRegistry } from './tool-registry.js';
import { ConversationManager } from './conversation.js';
import { AgentOrchestrator, MockLLMProvider } from './orchestrator.js';
import { AgentAuditTracker } from './audit-tracker.js';

// ─── Default Configuration ───────────────────────────────────────

const DEFAULT_COST: CostConfig = {
  costPer1kPromptTokens: 0.005,
  costPer1kCompletionTokens: 0.015,
  currency: 'USD',
};

function resolveConfig(config: AgentConfig = {}): ResolvedAgentConfig {
  return {
    provider: config.provider ?? 'mock',
    model: config.model ?? 'mock-model',
    apiKey: config.apiKey ?? '',
    maxTokens: config.maxTokens ?? 4096,
    temperature: config.temperature ?? 0.7,
    systemPrompt: config.systemPrompt ?? 'You are a helpful AI assistant for ObjectOS.',
    maxTurns: config.maxTurns ?? 10,
    timeout: config.timeout ?? 30000,
    cost: config.cost ?? DEFAULT_COST,
  };
}

// ─── Agent Plugin ────────────────────────────────────────────────

/**
 * Agent Plugin — integrates LLM-powered agents into ObjectOS
 */
export class AgentPlugin implements Plugin {
  name = '@objectos/agent';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: ResolvedAgentConfig;
  private context?: PluginContext;
  private startedAt?: number;
  private requestCount = 0;
  private errorCount = 0;

  /** Tool registry for agent tools */
  private toolRegistry: ToolRegistry;
  /** Conversation manager with tenant isolation */
  private conversationManager: ConversationManager;
  /** Multi-step agent orchestrator */
  private orchestrator: AgentOrchestrator;
  /** Audit tracker for logging and cost */
  private auditTracker: AgentAuditTracker;

  constructor(config: AgentConfig = {}) {
    this.config = resolveConfig(config);
    this.toolRegistry = new ToolRegistry();
    this.conversationManager = new ConversationManager();
    this.orchestrator = new AgentOrchestrator(new MockLLMProvider(), this.toolRegistry);
    this.auditTracker = new AgentAuditTracker(this.config.cost);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────

  /**
   * Initialize plugin — register 'agent' service
   */
  init = async (context: PluginContext): Promise<void> => {
    this.context = context;
    this.startedAt = Date.now();

    // Register agent service
    context.registerService('agent', this);

    context.logger.info('[Agent] Initialized successfully');
    await context.trigger('plugin.initialized', { pluginId: this.name });
  };

  /**
   * Start plugin — register HTTP routes
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[Agent] Starting...');

    // Register HTTP routes
    const httpServer = context.getService('http.server') as any;
    const rawApp = httpServer?.getRawApp?.() ?? httpServer?.app;

    if (rawApp) {
      this.registerRoutes(rawApp, context);
      context.logger.info('[Agent] Routes registered at /api/v1/agent');
    } else {
      context.logger.warn('[Agent] HTTP server not available — routes not registered');
    }

    context.logger.info('[Agent] Started successfully');
    await context.trigger('plugin.started', { pluginId: this.name });
  }

  /**
   * Stop plugin — cleanup
   */
  async stop(): Promise<void> {
    this.context?.logger.info('[Agent] Stopped');
  }

  // ─── HTTP Route Registration ───────────────────────────────────

  private registerRoutes(app: any, context: PluginContext): void {
    const basePath = '/api/v1/agent';

    // POST /api/v1/agent/chat — send a message and get response
    app.post(`${basePath}/chat`, async (c: any) => {
      this.requestCount++;
      try {
        const user = c.get?.('user');
        const tenantId = user?.tenantId ?? 'default';
        const userId = user?.id ?? 'anonymous';
        const body = await c.req.json();
        const { message, conversationId } = body;

        if (!message) {
          return c.json({ error: 'message is required' }, 400);
        }

        // Get or create conversation
        let conversation = conversationId
          ? this.conversationManager.get(conversationId, tenantId)
          : undefined;

        if (!conversation) {
          conversation = this.conversationManager.create(userId, tenantId);
          // Add system prompt
          this.conversationManager.addMessage(
            conversation.id,
            { role: 'system', content: this.config.systemPrompt },
            tenantId,
          );
        }

        // Add user message
        this.conversationManager.addMessage(
          conversation.id,
          { role: 'user', content: message },
          tenantId,
        );

        // Get broker for tool execution context
        const broker = (context as any).broker;

        // Run orchestrator
        const result = await this.orchestrator.execute(
          conversation.messages,
          { tenantId, userId, broker },
          {
            model: this.config.model,
            maxTokens: this.config.maxTokens,
            temperature: this.config.temperature,
            maxTurns: this.config.maxTurns,
            timeout: this.config.timeout,
          },
        );

        // Add final response to conversation
        this.conversationManager.addMessage(conversation.id, result.finalResponse, tenantId);

        // Audit log
        const cost = this.auditTracker.calculateCost(
          result.totalTokens * 0.6,
          result.totalTokens * 0.4,
        );
        this.auditTracker.logInteraction({
          agentId: this.config.model,
          conversationId: conversation.id,
          action: 'chat',
          toolCalls: result.steps.filter((s) => s.toolCall).map((s) => s.toolCall!),
          tokenUsage: {
            promptTokens: Math.round(result.totalTokens * 0.6),
            completionTokens: Math.round(result.totalTokens * 0.4),
            totalTokens: result.totalTokens,
          },
          cost,
          tenantId,
          userId,
          timestamp: new Date().toISOString(),
        });

        await context.trigger('agent.chat', {
          conversationId: conversation.id,
          userId,
          tenantId,
        });

        return c.json({
          conversationId: conversation.id,
          response: result.finalResponse.content,
          steps: result.steps.length,
          totalTokens: result.totalTokens,
          duration: result.duration,
        });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/agent/conversations — list user's conversations
    app.get(`${basePath}/conversations`, async (c: any) => {
      this.requestCount++;
      try {
        const user = c.get?.('user');
        const tenantId = user?.tenantId ?? 'default';
        const userId = user?.id ?? 'anonymous';

        const conversations = this.conversationManager.listByUser(userId, tenantId);
        return c.json({
          conversations: conversations.map((conv) => ({
            id: conv.id,
            messageCount: conv.messages.length,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
          })),
          total: conversations.length,
        });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/agent/conversations/:id — get conversation history
    app.get(`${basePath}/conversations/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const user = c.get?.('user');
        const tenantId = user?.tenantId ?? 'default';
        const id = c.req.param('id');

        const conversation = this.conversationManager.get(id, tenantId);
        if (!conversation) {
          return c.json({ error: 'Conversation not found' }, 404);
        }
        return c.json(conversation);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // DELETE /api/v1/agent/conversations/:id — delete conversation
    app.delete(`${basePath}/conversations/:id`, async (c: any) => {
      this.requestCount++;
      try {
        const user = c.get?.('user');
        const tenantId = user?.tenantId ?? 'default';
        const id = c.req.param('id');

        const deleted = this.conversationManager.delete(id, tenantId);
        if (!deleted) {
          return c.json({ error: 'Conversation not found' }, 404);
        }
        return c.json({ success: true });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/agent/tools — list available tools
    app.get(`${basePath}/tools`, async (c: any) => {
      this.requestCount++;
      try {
        const definitions = this.toolRegistry.getToolDefinitions();
        return c.json({ tools: definitions, total: definitions.length });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/agent/stats — agent usage statistics (admin)
    app.get(`${basePath}/stats`, async (c: any) => {
      this.requestCount++;
      try {
        const auditStats = this.auditTracker.getStats();
        const convStats = this.conversationManager.getStats();
        return c.json({
          audit: auditStats,
          conversations: convStats,
          plugin: {
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            uptime: this.startedAt ? Date.now() - this.startedAt : 0,
          },
        });
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });

    // GET /api/v1/agent/cost — cost summary (admin)
    app.get(`${basePath}/cost`, async (c: any) => {
      this.requestCount++;
      try {
        const url = new URL(c.req.url, 'http://localhost');
        const tenantId = url.searchParams.get('tenantId') ?? undefined;
        const summary = this.auditTracker.getCostSummary(tenantId);
        return c.json(summary);
      } catch (error: any) {
        this.errorCount++;
        return c.json({ error: error.message }, 500);
      }
    });
  }

  // ─── Service API ───────────────────────────────────────────────

  /** Get the tool registry */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /** Get the conversation manager */
  getConversationManager(): ConversationManager {
    return this.conversationManager;
  }

  /** Get the orchestrator */
  getOrchestrator(): AgentOrchestrator {
    return this.orchestrator;
  }

  /** Get the audit tracker */
  getAuditTracker(): AgentAuditTracker {
    return this.auditTracker;
  }

  // ─── Lifecycle Inspection ──────────────────────────────────────

  /**
   * Health check
   */
  getHealthReport(): PluginHealthReport {
    const convStats = this.conversationManager.getStats();
    const auditStats = this.auditTracker.getStats();

    return {
      status: 'healthy',
      message: `Agent operational (${convStats.totalConversations} conversations, ${auditStats.totalInteractions} interactions, ${this.requestCount} requests)`,
      details: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        uptime: this.startedAt ? Date.now() - this.startedAt : 0,
        conversations: convStats.totalConversations,
        interactions: auditStats.totalInteractions,
        totalTokens: auditStats.totalTokens,
        totalCost: auditStats.totalCost,
        provider: this.config.provider,
        model: this.config.model,
      },
    };
  }

  /**
   * Capability manifest
   */
  getCapabilities(): PluginCapabilityManifest {
    return {
      id: this.name,
      provides: ['agent', 'agent.chat', 'agent.tools', 'agent.conversations', 'agent.audit'],
      consumes: ['http.server', 'permissions', 'data', 'workflow', 'notification', 'metadata'],
    };
  }

  /**
   * Security manifest
   */
  getSecurityManifest(): PluginSecurityManifest {
    return {
      permissions: [
        'agent.chat',
        'agent.tool.execute',
        'agent.conversations.read',
        'agent.conversations.delete',
        'agent.stats.read',
        'agent.cost.read',
      ],
      dataAccess: ['read', 'create', 'update', 'delete'],
    };
  }

  /**
   * Startup result
   */
  getStartupResult(): PluginStartupResult {
    return {
      success: true,
      message: 'Agent plugin started',
    };
  }
}
