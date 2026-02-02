/**
 * Base LLM Provider Implementation
 */

import type {
  LLMProvider,
  LLMProviderInterface,
  CompletionRequest,
  CompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
} from './types';

/**
 * Mock/Stub provider for testing and development
 */
export class StubProvider implements LLMProviderInterface {
  readonly name: LLMProvider = 'custom';

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    // Mock response
    const lastMessage = request.messages[request.messages.length - 1];
    const text = `[STUB] Response to: ${lastMessage?.content || ''}`;

    return {
      text,
      model: request.modelId,
      usage: {
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      },
      cost: 0.0001,
      finishReason: 'stop',
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Mock embedding (384 dimensions, typical for smaller models)
    const embedding = new Array(384).fill(0).map(() => Math.random());

    return {
      embedding,
      model: request.modelId,
      usage: {
        tokens: 10,
      },
      cost: 0.00001,
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

/**
 * Provider factory - creates provider instances based on configuration
 */
export class ProviderFactory {
  /**
   * Create a provider instance
   */
  static createProvider(
    providerName: LLMProvider,
    config?: any
  ): LLMProviderInterface {
    switch (providerName) {
      case 'openai':
        // TODO: Implement OpenAI provider when API keys are available
        return new StubProvider();
      
      case 'anthropic':
        // TODO: Implement Anthropic provider when API keys are available
        return new StubProvider();
      
      case 'ollama':
        // TODO: Implement Ollama provider
        return new StubProvider();
      
      case 'custom':
      default:
        return new StubProvider();
    }
  }
}
