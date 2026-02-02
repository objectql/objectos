/**
 * @objectos/plugin-ai-models
 * 
 * AI Model Registry plugin for ObjectOS
 */

// Main plugin
export {
  AIModelsPlugin,
  getAIModelsAPI,
} from './plugin';

// Providers
export { StubProvider, ProviderFactory } from './providers';

// Storage
export { InMemoryModelStorage } from './storage';

// Types
export type {
  LLMProvider,
  ModelCapabilities,
  ModelConfig,
  CompletionRequest,
  Message,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  LLMProviderInterface,
  UsageEntry,
  AIModelsPluginConfig,
  ModelRegistryStorage,
} from './types';
