/**
 * @objectos/plugin-ai-rag
 * 
 * RAG (Retrieval-Augmented Generation) plugin for ObjectOS
 */

// Main plugin
export {
  AIRAGPlugin,
  getAIRAGAPI,
} from './plugin';

// Vector database
export { InMemoryVectorDB } from './vector-db';

// Document chunker
export { DocumentChunker } from './chunker';

// Types
export type {
  Document,
  IndexedDocument,
  SearchQuery,
  SearchResult,
  VectorDatabase,
  ChunkingStrategy,
  ChunkerConfig,
  AIRAGPluginConfig,
  ContextRetrievalResult,
} from './types';
