/**
 * AI Model Registry Types
 * 
 * Type definitions for the AI model registry system
 */

/**
 * Supported LLM providers
 */
export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'custom';

/**
 * Model capabilities
 */
export interface ModelCapabilities {
  /** Supports text generation */
  textGeneration: boolean;
  /** Supports code generation */
  codeGeneration: boolean;
  /** Supports embeddings */
  embeddings: boolean;
  /** Supports function calling */
  functionCalling: boolean;
  /** Supports vision/image understanding */
  vision: boolean;
  /** Context window size */
  contextWindow: number;
  /** Max output tokens */
  maxOutputTokens: number;
}

/**
 * Model configuration
 */
export interface ModelConfig {
  /** Unique model ID */
  id: string;
  /** Model name */
  name: string;
  /** LLM provider */
  provider: LLMProvider;
  /** Provider-specific model identifier */
  modelIdentifier: string;
  /** Model version */
  version?: string;
  /** Model capabilities */
  capabilities: ModelCapabilities;
  /** Cost per 1M input tokens (USD) */
  costPerMillionInputTokens?: number;
  /** Cost per 1M output tokens (USD) */
  costPerMillionOutputTokens?: number;
  /** Is this model active? */
  active: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * LLM completion request
 */
export interface CompletionRequest {
  /** Model ID to use */
  modelId: string;
  /** Messages/prompt */
  messages: Message[];
  /** System prompt */
  systemPrompt?: string;
  /** Temperature (0-2) */
  temperature?: number;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Top P sampling */
  topP?: number;
  /** Stop sequences */
  stop?: string[];
  /** User ID for tracking */
  userId?: string;
  /** Additional provider-specific options */
  options?: Record<string, any>;
}

/**
 * Message in a conversation
 */
export interface Message {
  /** Message role */
  role: 'system' | 'user' | 'assistant' | 'function';
  /** Message content */
  content: string;
  /** Function name (for function role) */
  name?: string;
}

/**
 * LLM completion response
 */
export interface CompletionResponse {
  /** Generated text */
  text: string;
  /** Model used */
  model: string;
  /** Usage statistics */
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  /** Cost in USD */
  cost?: number;
  /** Finish reason */
  finishReason?: 'stop' | 'length' | 'content_filter' | 'function_call';
  /** Raw provider response */
  raw?: any;
}

/**
 * Embedding request
 */
export interface EmbeddingRequest {
  /** Model ID to use */
  modelId: string;
  /** Text to embed */
  text: string;
  /** User ID for tracking */
  userId?: string;
}

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  /** Embedding vector */
  embedding: number[];
  /** Model used */
  model: string;
  /** Usage statistics */
  usage: {
    tokens: number;
  };
  /** Cost in USD */
  cost?: number;
}

/**
 * LLM Provider interface
 */
export interface LLMProviderInterface {
  /** Provider name */
  readonly name: LLMProvider;

  /**
   * Generate completion
   */
  complete(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * Generate embeddings
   */
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * Check if provider is available
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Usage tracking entry
 */
export interface UsageEntry {
  /** Entry ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** User ID */
  userId?: string;
  /** Model ID */
  modelId: string;
  /** Operation type */
  operation: 'completion' | 'embedding';
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens?: number;
  /** Total tokens */
  totalTokens: number;
  /** Cost in USD */
  cost?: number;
  /** Request metadata */
  metadata?: Record<string, any>;
}

/**
 * Plugin configuration
 */
export interface AIModelsPluginConfig {
  /** Enable the plugin */
  enabled?: boolean;
  /** Default model ID */
  defaultModelId?: string;
  /** Track usage */
  trackUsage?: boolean;
  /** Provider configurations */
  providers?: {
    openai?: {
      apiKey?: string;
      baseURL?: string;
    };
    anthropic?: {
      apiKey?: string;
      baseURL?: string;
    };
    ollama?: {
      baseURL?: string;
    };
  };
  /** Pre-configured models */
  models?: ModelConfig[];
}

/**
 * Model registry storage interface
 */
export interface ModelRegistryStorage {
  /** Save a model configuration */
  saveModel(model: ModelConfig): Promise<void>;

  /** Get a model by ID */
  getModel(modelId: string): Promise<ModelConfig | null>;

  /** List all models */
  listModels(filter?: { provider?: LLMProvider; active?: boolean }): Promise<ModelConfig[]>;

  /** Delete a model */
  deleteModel(modelId: string): Promise<void>;

  /** Save usage entry */
  saveUsage(entry: UsageEntry): Promise<void>;

  /** Get usage entries */
  getUsage(filter?: {
    userId?: string;
    modelId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UsageEntry[]>;
}
