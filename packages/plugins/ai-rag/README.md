# @objectos/plugin-ai-rag

RAG (Retrieval-Augmented Generation) plugin for ObjectOS - provides document indexing, semantic search, and context retrieval for AI applications.

## Features

- **Document Indexing**: Index documents with vector embeddings
- **Semantic Search**: Find documents based on semantic similarity
- **Context Retrieval**: Retrieve relevant context for AI queries
- **Document Chunking**: Multiple strategies (fixed, sentence, paragraph, custom)
- **Vector Database**: Pluggable vector database interface

## Installation

```bash
pnpm add @objectos/plugin-ai-rag @objectos/plugin-ai-models
```

## Usage

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { AIModelsPlugin } from '@objectos/plugin-ai-models';
import { AIRAGPlugin } from '@objectos/plugin-ai-rag';

// Create kernel
const kernel = new ObjectKernel();

// Register plugins
await kernel.registerPlugin(new AIModelsPlugin({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
  },
}));

await kernel.registerPlugin(new AIRAGPlugin({
  defaultEmbeddingModel: 'text-embedding-3-small',
  chunking: {
    strategy: 'sentence',
    chunkSize: 500,
    overlap: 50,
  },
}));

await kernel.start();

// Use the RAG API
const ragAPI = kernel.getService('ai-rag');

// Index a document
await ragAPI.indexDocument({
  id: 'doc-1',
  content: 'ObjectOS is an AI-native low-code platform...',
  metadata: { category: 'documentation' },
});

// Search for relevant documents
const results = await ragAPI.search({
  query: 'What is ObjectOS?',
  topK: 3,
  minScore: 0.7,
});

console.log(`Found ${results.length} relevant documents`);
results.forEach((result) => {
  console.log(`[${result.score.toFixed(2)}] ${result.document.content}`);
});

// Retrieve context for AI query
const context = await ragAPI.retrieveContext('How to use ObjectOS?', {
  topK: 5,
});

console.log(`Retrieved ${context.documents.length} documents for context`);
```

## Configuration

```typescript
interface AIRAGPluginConfig {
  enabled?: boolean;
  defaultEmbeddingModel?: string;
  chunking?: {
    strategy: 'fixed' | 'sentence' | 'paragraph' | 'custom';
    chunkSize?: number;
    overlap?: number;
    customChunker?: (text: string) => string[];
  };
  vectorDatabase?: VectorDatabase;
}
```

## API Reference

### `indexDocument(document: Document, options?): Promise<void>`

Index a single document with vector embeddings.

### `indexDocuments(documents: Document[], options?): Promise<void>`

Index multiple documents.

### `search(query: SearchQuery): Promise<SearchResult[]>`

Search for similar documents using semantic search.

### `retrieveContext(query: string, options?): Promise<ContextRetrievalResult>`

Retrieve context for AI queries.

### `deleteDocument(documentId: string): Promise<void>`

Delete a document from the index.

### `countDocuments(filter?): Promise<number>`

Count indexed documents.

### `clearAll(): Promise<void>`

Clear all indexed documents.

## Document Chunking

The plugin supports multiple chunking strategies:

- **fixed**: Fixed-size chunks with overlap
- **sentence**: Sentence-based chunking
- **paragraph**: Paragraph-based chunking
- **custom**: Custom chunking function

## Vector Database

The plugin includes an in-memory vector database for development and testing. For production use, you can implement the `VectorDatabase` interface to use external vector databases like Pinecone, Weaviate, or Qdrant.

## License

AGPL-3.0
