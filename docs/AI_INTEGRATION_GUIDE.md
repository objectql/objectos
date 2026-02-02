# AI Protocol Integration Guide

## Overview

This guide explains how to integrate and use the AI Protocol plugins in ObjectOS. The AI Protocol consists of three core plugins that work together to enable AI-native applications:

1. **@objectos/plugin-ai-models** - LLM provider abstraction and cost tracking
2. **@objectos/plugin-ai-rag** - Document indexing and semantic search  
3. **@objectos/plugin-ai-agent** - Agent orchestration and multi-agent coordination

## Quick Start

### Installation

```bash
pnpm add @objectos/plugin-ai-models @objectos/plugin-ai-rag @objectos/plugin-ai-agent
```

### Basic Setup

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { AIModelsPlugin } from '@objectos/plugin-ai-models';
import { AIRAGPlugin } from '@objectos/plugin-ai-rag';
import { AIAgentPlugin } from '@objectos/plugin-ai-agent';

// Create kernel
const kernel = new ObjectKernel();

// Register plugins
await kernel.registerPlugin(new AIModelsPlugin({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
  },
}));

await kernel.registerPlugin(new AIRAGPlugin());
await kernel.registerPlugin(new AIAgentPlugin());

await kernel.start();

// Get service APIs
const modelsAPI = kernel.getService('ai-models');
const ragAPI = kernel.getService('ai-rag');
const agentAPI = kernel.getService('ai-agent');
```

## Plugin Details

### @objectos/plugin-ai-models

#### Purpose
Provides a unified interface for working with different LLM providers (OpenAI, Anthropic, Ollama).

#### Key Features
- Multi-provider support
- Cost tracking per model/user
- Usage analytics
- Model versioning

#### Example Usage

```typescript
// Generate completion
const response = await modelsAPI.complete({
  modelId: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Explain ObjectOS' },
  ],
  temperature: 0.7,
});

console.log(response.text);

// Generate embeddings
const embedding = await modelsAPI.embed({
  modelId: 'text-embedding-3-small',
  text: 'Document to embed',
});

// Track usage
const usage = await modelsAPI.getUsageSummary({
  userId: 'user-123',
  startDate: new Date('2026-01-01'),
});
```

### @objectos/plugin-ai-rag

#### Purpose
Enables semantic search and context retrieval using vector embeddings.

#### Key Features
- Document indexing
- Vector embeddings
- Semantic search
- Multiple chunking strategies
- Context retrieval for AI queries

#### Example Usage

```typescript
// Index a document
await ragAPI.indexDocument({
  id: 'doc-1',
  content: 'Your document content here...',
  metadata: { category: 'documentation' },
});

// Search for similar documents
const results = await ragAPI.search({
  query: 'How to use ObjectOS?',
  topK: 5,
  minScore: 0.7,
});

// Retrieve context for AI
const context = await ragAPI.retrieveContext('What is ObjectOS?', {
  topK: 3,
});

// Use context with LLM
const augmentedPrompt = `Context: ${context.documents.map(d => d.content).join('\n\n')}\n\nQuestion: What is ObjectOS?`;
```

### @objectos/plugin-ai-agent

#### Purpose
Orchestrates AI agents for complex tasks like code generation and data processing.

#### Key Features
- Agent management
- Session-based conversations
- Multi-agent orchestration (sequential/parallel)
- Pre-configured agents (code generator, data processor)
- Agent state management

#### Example Usage

```typescript
// Execute an agent
const result = await agentAPI.execute({
  agentId: 'code-generator',
  input: 'Create a function to validate email addresses',
});

console.log(result.output);

// Create a conversational session
const session = await agentAPI.createSession('code-generator');

const response1 = await agentAPI.sendToSession(
  session.sessionId,
  'Create a React login form'
);

const response2 = await agentAPI.sendToSession(
  session.sessionId,
  'Add validation'
);

// Multi-agent orchestration
const multiResult = await agentAPI.orchestrate({
  agents: ['code-generator', 'data-processor'],
  strategy: 'sequential',
  input: 'Generate and validate user data processing code',
});
```

## Common Use Cases

### 1. RAG-Powered Q&A System

```typescript
// Build knowledge base
const docs = [
  { id: '1', content: 'Documentation content...' },
  { id: '2', content: 'Tutorial content...' },
];

for (const doc of docs) {
  await ragAPI.indexDocument(doc);
}

// Answer questions
async function answerQuestion(question: string) {
  // Get relevant context
  const context = await ragAPI.retrieveContext(question, { topK: 3 });
  
  // Generate answer with context
  const response = await modelsAPI.complete({
    modelId: 'gpt-4o',
    messages: [
      { 
        role: 'system', 
        content: 'Answer based on the provided context.' 
      },
      { 
        role: 'user', 
        content: `Context: ${context.documents.map(d => d.content).join('\n\n')}\n\nQuestion: ${question}` 
      },
    ],
  });
  
  return response.text;
}
```

### 2. Code Generation Agent

```typescript
// Register custom code generator
await agentAPI.registerAgent({
  id: 'api-generator',
  name: 'API Generator',
  type: 'code-generation',
  modelId: 'gpt-4o',
  systemPrompt: 'Generate REST API endpoints with proper error handling and documentation.',
  temperature: 0.3,
});

// Use the agent
const result = await agentAPI.execute({
  agentId: 'api-generator',
  input: 'Create CRUD endpoints for a User resource',
});
```

### 3. Multi-Agent Workflow

```typescript
// Sequential processing
const result = await agentAPI.orchestrate({
  agents: [
    'data-processor',  // First: validate and clean data
    'code-generator',  // Then: generate code based on processed data
  ],
  strategy: 'sequential',
  input: 'Process user data and generate TypeScript interfaces',
});

// Parallel processing
const parallelResult = await agentAPI.orchestrate({
  agents: ['code-generator', 'data-processor'],
  strategy: 'parallel',
  input: 'Analyze this codebase',
});
```

## Configuration

### Environment Variables

```bash
# LLM Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Ollama URL
OLLAMA_BASE_URL=http://localhost:11434
```

### Plugin Configuration

```typescript
// AI Models Plugin
const aiModels = new AIModelsPlugin({
  enabled: true,
  trackUsage: true,
  defaultModelId: 'gpt-4o',
  providers: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    ollama: {
      baseURL: process.env.OLLAMA_BASE_URL,
    },
  },
});

// RAG Plugin
const aiRAG = new AIRAGPlugin({
  enabled: true,
  defaultEmbeddingModel: 'text-embedding-3-small',
  chunking: {
    strategy: 'sentence',  // 'fixed' | 'sentence' | 'paragraph' | 'custom'
    chunkSize: 500,
    overlap: 50,
  },
});

// Agent Plugin
const aiAgent = new AIAgentPlugin({
  enabled: true,
  enableSessions: true,
  agents: [
    // Custom agents configuration
  ],
});
```

## Best Practices

### 1. Cost Management

```typescript
// Track usage by user
const usage = await modelsAPI.getUsage({ userId: 'user-123' });

// Get cost summary
const summary = await modelsAPI.getUsageSummary();
console.log(`Total cost: $${summary.totalCost}`);
```

### 2. Document Chunking

Choose the right chunking strategy:
- **fixed**: Best for consistent chunk sizes
- **sentence**: Best for natural language documents
- **paragraph**: Best for structured documents
- **custom**: Full control over chunking logic

### 3. Agent Temperature Settings

- **Code Generation**: Use low temperature (0.1-0.3) for deterministic output
- **Creative Writing**: Use high temperature (0.7-1.0) for varied output
- **Q&A**: Use medium temperature (0.5-0.7) for balanced responses

### 4. Error Handling

```typescript
try {
  const result = await agentAPI.execute({
    agentId: 'code-generator',
    input: 'Generate code',
  });
} catch (error) {
  if (error.message.includes('Model not found')) {
    // Handle missing model
  } else if (error.message.includes('Provider not initialized')) {
    // Handle provider issue
  }
}
```

## Performance Tips

1. **Batch Operations**: Use `indexDocuments()` for multiple documents
2. **Caching**: Cache frequently accessed context
3. **Chunk Size**: Optimize chunk size for your use case
4. **Model Selection**: Use appropriate models (smaller for embeddings, larger for reasoning)

## See Also

- [AI Models Plugin README](../ai-models/README.md)
- [RAG Plugin README](../ai-rag/README.md)
- [Agent Plugin README](../ai-agent/README.md)
- [Customer Support Example](../ai-agent/examples/customer-support.ts)

## License

AGPL-3.0
