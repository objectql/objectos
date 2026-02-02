/**
 * AI Agent Plugin for ObjectOS
 * 
 * This plugin provides:
 * - Agent orchestration engine
 * - Code generation agents
 * - Data processing agents
 * - Agent state management
 * - Multi-agent coordination
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  Message,
  AIAgentPluginConfig,
  AgentConfig,
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentSession,
  AgentState,
  AgentStep,
  MultiAgentRequest,
  MultiAgentResult,
} from './types';
import { InMemoryAgentStorage } from './storage';

/**
 * AI Agent Plugin
 */
export class AIAgentPlugin implements Plugin {
  name = 'com.objectos.ai.agent';
  version = '0.1.0';
  dependencies: string[] = ['com.objectos.ai.models'];

  private config: AIAgentPluginConfig;
  private storage: any;
  private context?: PluginContext;

  constructor(config: AIAgentPluginConfig = {}) {
    this.config = {
      enabled: true,
      enableSessions: true,
      ...config,
    };

    this.storage = new InMemoryAgentStorage();
  }

  /**
   * Initialize plugin
   */
  async init(context: PluginContext): Promise<void> {
    this.context = context;

    // Register service
    context.registerService('ai-agent', this);

    // Initialize default agents
    await this.initializeDefaultAgents();

    context.logger.info('[AI Agent Plugin] Initialized successfully');
  }

  /**
   * Start plugin
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[AI Agent Plugin] Starting...');

    // Check if ai-models service is available
    if (!context.hasService('ai-models')) {
      throw new Error('AI Agent Plugin requires ai-models service');
    }

    context.logger.info('[AI Agent Plugin] Started successfully');
  }

  /**
   * Initialize default agents
   */
  private async initializeDefaultAgents(): Promise<void> {
    const defaultAgents: AgentConfig[] = this.config.agents || [
      {
        id: 'code-generator',
        name: 'Code Generator',
        type: 'code-generation',
        description: 'Generates code based on requirements',
        modelId: 'gpt-4o',
        systemPrompt: 'You are an expert software developer. Generate clean, well-documented code based on user requirements.',
        temperature: 0.7,
        maxTokens: 2000,
      },
      {
        id: 'data-processor',
        name: 'Data Processor',
        type: 'data-processing',
        description: 'Processes and transforms data',
        modelId: 'gpt-4o',
        systemPrompt: 'You are a data processing expert. Analyze and transform data as requested.',
        temperature: 0.3,
        maxTokens: 1500,
      },
    ];

    for (const agent of defaultAgents) {
      await this.storage.saveAgent(agent);
    }

    this.context?.logger.info(
      `[AI Agent Plugin] Initialized ${defaultAgents.length} default agents`
    );
  }

  /**
   * Get AI models service
   */
  private getAIModelsService(): any {
    if (!this.context?.hasService('ai-models')) {
      throw new Error('AI models service not available');
    }
    return this.context.getService('ai-models');
  }

  /**
   * Register an agent
   */
  async registerAgent(agent: AgentConfig): Promise<void> {
    await this.storage.saveAgent(agent);
    this.context?.logger.info(`[AI Agent Plugin] Registered agent: ${agent.name}`);
  }

  /**
   * Get an agent
   */
  async getAgent(agentId: string): Promise<AgentConfig | null> {
    return this.storage.getAgent(agentId);
  }

  /**
   * List agents
   */
  async listAgents(filter?: { type?: string }): Promise<AgentConfig[]> {
    return this.storage.listAgents(filter);
  }

  /**
   * Execute an agent
   */
  async execute(request: AgentExecutionRequest): Promise<AgentExecutionResult> {
    const agent = await this.storage.getAgent(request.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${request.agentId}`);
    }

    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const steps: AgentStep[] = [];
    let totalTokensUsed = 0;
    let totalCost = 0;

    // Build messages
    const messages: Message[] = [
      ...(request.context || []),
      { role: 'user', content: request.input },
    ];

    // Add system prompt if configured
    if (agent.systemPrompt) {
      messages.unshift({ role: 'system', content: agent.systemPrompt });
    }

    // Get AI models service
    const aiModels = this.getAIModelsService();

    // Execute with LLM
    const response = await aiModels.complete({
      modelId: agent.modelId,
      messages,
      temperature: agent.temperature || 0.7,
      maxTokens: agent.maxTokens || 1500,
      userId: request.userId,
    });

    totalTokensUsed += response.usage.totalTokens;
    totalCost += response.cost || 0;

    // Record step
    steps.push({
      stepNumber: 1,
      type: 'response',
      content: response.text,
      timestamp: new Date(),
    });

    const result: AgentExecutionResult = {
      executionId,
      agentId: request.agentId,
      output: response.text,
      state: 'completed',
      steps,
      tokensUsed: totalTokensUsed,
      cost: totalCost,
      metadata: {
        finishReason: response.finishReason,
      },
    };

    // Emit event
    await this.context?.trigger('ai.agent.executed', {
      executionId,
      agentId: request.agentId,
      tokensUsed: totalTokensUsed,
      cost: totalCost,
    });

    return result;
  }

  /**
   * Create a session
   */
  async createSession(agentId: string, userId?: string): Promise<AgentSession> {
    const agent = await this.storage.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const session: AgentSession = {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      userId,
      messages: [],
      state: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.storage.saveSession(session);

    this.context?.logger.info(
      `[AI Agent Plugin] Created session ${session.sessionId} for agent ${agentId}`
    );

    return session;
  }

  /**
   * Send message to session
   */
  async sendToSession(sessionId: string, message: string): Promise<AgentExecutionResult> {
    const session = await this.storage.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Execute agent with session context
    const result = await this.execute({
      agentId: session.agentId,
      input: message,
      context: session.messages,
    });

    // Update session
    session.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: result.output }
    );
    session.updatedAt = new Date();
    session.state = result.state;

    await this.storage.saveSession(session);

    return result;
  }

  /**
   * Get session
   */
  async getSession(sessionId: string): Promise<AgentSession | null> {
    return this.storage.getSession(sessionId);
  }

  /**
   * List sessions
   */
  async listSessions(filter?: { agentId?: string; userId?: string }): Promise<AgentSession[]> {
    return this.storage.listSessions(filter);
  }

  /**
   * Orchestrate multiple agents
   */
  async orchestrate(request: MultiAgentRequest): Promise<MultiAgentResult> {
    const orchestrationId = `orch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const results: AgentExecutionResult[] = [];
    let totalTokensUsed = 0;
    let totalCost = 0;

    if (request.strategy === 'sequential') {
      // Execute agents sequentially, passing output to next
      let currentInput = request.input;

      for (const agentId of request.agents) {
        const result = await this.execute({
          agentId,
          input: currentInput,
          userId: request.userId,
        });

        results.push(result);
        totalTokensUsed += result.tokensUsed;
        totalCost += result.cost || 0;

        // Use output as input for next agent
        currentInput = result.output;
      }
    } else if (request.strategy === 'parallel') {
      // Execute all agents in parallel with same input
      const promises = request.agents.map((agentId) =>
        this.execute({
          agentId,
          input: request.input,
          userId: request.userId,
        })
      );

      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);

      totalTokensUsed = parallelResults.reduce((sum, r) => sum + r.tokensUsed, 0);
      totalCost = parallelResults.reduce((sum, r) => sum + (r.cost || 0), 0);
    }

    // Combine results
    const finalOutput = results.map((r) => r.output).join('\n\n');

    const multiResult: MultiAgentResult = {
      orchestrationId,
      results,
      output: finalOutput,
      totalTokensUsed,
      totalCost,
    };

    // Emit event
    await this.context?.trigger('ai.agent.orchestrated', {
      orchestrationId,
      agentsCount: request.agents.length,
      strategy: request.strategy,
      totalTokensUsed,
      totalCost,
    });

    return multiResult;
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    this.context?.logger.info('[AI Agent Plugin] Destroyed');
  }
}

/**
 * Helper function to access the AI agent API from kernel
 */
export function getAIAgentAPI(kernel: any): AIAgentPlugin | null {
  try {
    return kernel.getService('ai-agent');
  } catch {
    return null;
  }
}
