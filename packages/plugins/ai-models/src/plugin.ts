/**
 * AI Models Plugin for ObjectOS
 * 
 * This plugin provides:
 * - LLM provider abstraction (OpenAI, Anthropic, Ollama)
 * - Model registry and versioning
 * - Cost tracking per model/user
 * - Usage analytics
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  AIModelsPluginConfig,
  ModelConfig,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  UsageEntry,
  LLMProviderInterface,
  LLMProvider,
} from './types';
import { InMemoryModelStorage } from './storage';
import { ProviderFactory } from './providers';

/**
 * AI Models Plugin
 */
export class AIModelsPlugin implements Plugin {
  name = 'com.objectos.ai.models';
  version = '0.1.0';
  dependencies: string[] = [];

  private config: AIModelsPluginConfig;
  private storage: any;
  private providers: Map<LLMProvider, LLMProviderInterface> = new Map();
  private context?: PluginContext;

  constructor(config: AIModelsPluginConfig = {}) {
    this.config = {
      enabled: true,
      trackUsage: true,
      ...config,
    };

    this.storage = new InMemoryModelStorage();
  }

  /**
   * Initialize plugin
   */
  async init(context: PluginContext): Promise<void> {
    this.context = context;

    // Register service
    context.registerService('ai-models', this);

    // Initialize default models
    await this.initializeDefaultModels();

    context.logger.info('[AI Models Plugin] Initialized successfully');
  }

  /**
   * Start plugin
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[AI Models Plugin] Starting...');

    // Initialize providers
    await this.initializeProviders();

    context.logger.info('[AI Models Plugin] Started successfully');
  }

  /**
   * Initialize default models from configuration
   */
  private async initializeDefaultModels(): Promise<void> {
    const defaultModels: ModelConfig[] = this.config.models || [
      {
        id: 'gpt-4o',
        name: 'GPT-4 Optimized',
        provider: 'openai',
        modelIdentifier: 'gpt-4o',
        version: '2024-11',
        capabilities: {
          textGeneration: true,
          codeGeneration: true,
          embeddings: false,
          functionCalling: true,
          vision: true,
          contextWindow: 128000,
          maxOutputTokens: 16384,
        },
        costPerMillionInputTokens: 2.50,
        costPerMillionOutputTokens: 10.00,
        active: true,
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        modelIdentifier: 'claude-3-5-sonnet-20241022',
        capabilities: {
          textGeneration: true,
          codeGeneration: true,
          embeddings: false,
          functionCalling: true,
          vision: true,
          contextWindow: 200000,
          maxOutputTokens: 8192,
        },
        costPerMillionInputTokens: 3.00,
        costPerMillionOutputTokens: 15.00,
        active: true,
      },
      {
        id: 'text-embedding-3-small',
        name: 'OpenAI Text Embedding Small',
        provider: 'openai',
        modelIdentifier: 'text-embedding-3-small',
        capabilities: {
          textGeneration: false,
          codeGeneration: false,
          embeddings: true,
          functionCalling: false,
          vision: false,
          contextWindow: 8192,
          maxOutputTokens: 0,
        },
        costPerMillionInputTokens: 0.02,
        costPerMillionOutputTokens: 0,
        active: true,
      },
    ];

    for (const model of defaultModels) {
      await this.storage.saveModel(model);
    }

    this.context?.logger.info(
      `[AI Models Plugin] Initialized ${defaultModels.length} default models`
    );
  }

  /**
   * Initialize LLM providers
   */
  private async initializeProviders(): Promise<void> {
    // Initialize OpenAI provider
    if (this.config.providers?.openai) {
      const provider = ProviderFactory.createProvider('openai', this.config.providers.openai);
      this.providers.set('openai', provider);
    }

    // Initialize Anthropic provider
    if (this.config.providers?.anthropic) {
      const provider = ProviderFactory.createProvider('anthropic', this.config.providers.anthropic);
      this.providers.set('anthropic', provider);
    }

    // Initialize Ollama provider
    if (this.config.providers?.ollama) {
      const provider = ProviderFactory.createProvider('ollama', this.config.providers.ollama);
      this.providers.set('ollama', provider);
    }

    // Always have a stub provider
    const stubProvider = ProviderFactory.createProvider('custom');
    this.providers.set('custom', stubProvider);

    this.context?.logger.info(
      `[AI Models Plugin] Initialized ${this.providers.size} providers`
    );
  }

  /**
   * Get a provider for a model
   */
  private async getProviderForModel(modelId: string): Promise<LLMProviderInterface> {
    const model = await this.storage.getModel(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    if (!model.active) {
      throw new Error(`Model is not active: ${modelId}`);
    }

    const provider = this.providers.get(model.provider);
    if (!provider) {
      throw new Error(`Provider not initialized: ${model.provider}`);
    }

    return provider;
  }

  /**
   * Generate completion using a model
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const provider = await this.getProviderForModel(request.modelId);
    const response = await provider.complete(request);

    // Track usage
    if (this.config.trackUsage) {
      await this.trackUsage({
        modelId: request.modelId,
        userId: request.userId,
        operation: 'completion',
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
        cost: response.cost,
      });
    }

    // Emit event
    await this.context?.trigger('ai.completion', {
      modelId: request.modelId,
      usage: response.usage,
      cost: response.cost,
    });

    return response;
  }

  /**
   * Generate embeddings using a model
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const provider = await this.getProviderForModel(request.modelId);
    const response = await provider.embed(request);

    // Track usage
    if (this.config.trackUsage) {
      await this.trackUsage({
        modelId: request.modelId,
        userId: request.userId,
        operation: 'embedding',
        inputTokens: response.usage.tokens,
        totalTokens: response.usage.tokens,
        cost: response.cost,
      });
    }

    // Emit event
    await this.context?.trigger('ai.embedding', {
      modelId: request.modelId,
      usage: response.usage,
      cost: response.cost,
    });

    return response;
  }

  /**
   * Track usage
   */
  private async trackUsage(data: {
    modelId: string;
    userId?: string;
    operation: 'completion' | 'embedding';
    inputTokens: number;
    outputTokens?: number;
    totalTokens: number;
    cost?: number;
  }): Promise<void> {
    const entry: UsageEntry = {
      id: `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...data,
    };

    await this.storage.saveUsage(entry);
  }

  /**
   * Register a model
   */
  async registerModel(model: ModelConfig): Promise<void> {
    await this.storage.saveModel(model);
    this.context?.logger.info(`[AI Models Plugin] Registered model: ${model.name}`);
  }

  /**
   * Get a model
   */
  async getModel(modelId: string): Promise<ModelConfig | null> {
    return this.storage.getModel(modelId);
  }

  /**
   * List models
   */
  async listModels(filter?: { provider?: LLMProvider; active?: boolean }): Promise<ModelConfig[]> {
    return this.storage.listModels(filter);
  }

  /**
   * Get usage statistics
   */
  async getUsage(filter?: {
    userId?: string;
    modelId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UsageEntry[]> {
    return this.storage.getUsage(filter);
  }

  /**
   * Get usage summary
   */
  async getUsageSummary(filter?: {
    userId?: string;
    modelId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    byModel: Record<string, { requests: number; tokens: number; cost: number }>;
  }> {
    const entries = await this.storage.getUsage(filter);

    const summary = {
      totalRequests: entries.length,
      totalTokens: entries.reduce((sum, e) => sum + e.totalTokens, 0),
      totalCost: entries.reduce((sum, e) => sum + (e.cost || 0), 0),
      byModel: {} as Record<string, { requests: number; tokens: number; cost: number }>,
    };

    for (const entry of entries) {
      if (!summary.byModel[entry.modelId]) {
        summary.byModel[entry.modelId] = { requests: 0, tokens: 0, cost: 0 };
      }
      summary.byModel[entry.modelId].requests++;
      summary.byModel[entry.modelId].tokens += entry.totalTokens;
      summary.byModel[entry.modelId].cost += entry.cost || 0;
    }

    return summary;
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    this.providers.clear();
    this.context?.logger.info('[AI Models Plugin] Destroyed');
  }
}

/**
 * Helper function to access the AI models API from kernel
 */
export function getAIModelsAPI(kernel: any): AIModelsPlugin | null {
  try {
    return kernel.getService('ai-models');
  } catch {
    return null;
  }
}
