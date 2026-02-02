# @objectos/plugin-ai-models

AI Model Registry plugin for ObjectOS - provides LLM provider abstraction, model versioning, and cost tracking.

## Features

- **Multi-Provider Support**: Abstract interface for OpenAI, Anthropic, Ollama, and custom providers
- **Model Registry**: Centralized management of AI models with versioning
- **Cost Tracking**: Track token usage and costs per model/user
- **Usage Analytics**: Comprehensive usage statistics and summaries

## Installation

```bash
pnpm add @objectos/plugin-ai-models
```

## Usage

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { AIModelsPlugin } from '@objectos/plugin-ai-models';

// Create kernel
const kernel = new ObjectKernel();

// Register AI models plugin
const aiModels = new AIModelsPlugin({
  enabled: true,
  trackUsage: true,
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
  },
});

await kernel.registerPlugin(aiModels);
await kernel.start();

// Use the API
const modelsAPI = kernel.getService('ai-models');

// Generate completion
const response = await modelsAPI.complete({
  modelId: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Hello, how are you?' },
  ],
  temperature: 0.7,
  maxTokens: 100,
});

console.log(response.text);

// Get usage statistics
const usage = await modelsAPI.getUsageSummary({
  startDate: new Date('2026-01-01'),
  endDate: new Date(),
});

console.log(`Total cost: $${usage.totalCost.toFixed(4)}`);
```

## Configuration

```typescript
interface AIModelsPluginConfig {
  enabled?: boolean;
  defaultModelId?: string;
  trackUsage?: boolean;
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
  models?: ModelConfig[];
}
```

## Default Models

The plugin comes pre-configured with these models:

- **gpt-4o** - GPT-4 Optimized (OpenAI)
- **claude-3-5-sonnet** - Claude 3.5 Sonnet (Anthropic)
- **text-embedding-3-small** - Text Embedding Small (OpenAI)

## API Reference

### `complete(request: CompletionRequest): Promise<CompletionResponse>`

Generate text completion using an AI model.

### `embed(request: EmbeddingRequest): Promise<EmbeddingResponse>`

Generate embeddings for text.

### `registerModel(model: ModelConfig): Promise<void>`

Register a new AI model.

### `listModels(filter?: { provider?: string; active?: boolean }): Promise<ModelConfig[]>`

List available models.

### `getUsage(filter?: UsageFilter): Promise<UsageEntry[]>`

Get usage entries.

### `getUsageSummary(filter?: UsageFilter): Promise<UsageSummary>`

Get aggregated usage statistics.

## License

AGPL-3.0
