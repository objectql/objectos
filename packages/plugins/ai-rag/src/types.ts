/**
 * AI RAG (Retrieval-Augmented Generation) Types
 */

/**
 * Document to be indexed
 */
export interface Document {
  /** Unique document ID */
  id: string;
  /** Document content/text */
  content: string;
  /** Document metadata */
  metadata?: Record<string, any>;
  /** Source of the document */
  source?: string;
  /** Timestamp */
  timestamp?: Date;
}

/**
 * Document with embedding
 */
export interface IndexedDocument extends Document {
  /** Embedding vector */
  embedding: number[];
  /** Embedding model used */
  embeddingModel: string;
}

/**
 * Search query
 */
export interface SearchQuery {
  /** Query text */
  query: string;
  /** Number of results to return */
  topK?: number;
  /** Minimum similarity score (0-1) */
  minScore?: number;
  /** Filter by metadata */
  filter?: Record<string, any>;
  /** Embedding model to use */
  embeddingModel?: string;
}

/**
 * Search result
 */
export interface SearchResult {
  /** Matched document */
  document: Document;
  /** Similarity score (0-1) */
  score: number;
  /** Rank in results */
  rank: number;
}

/**
 * Vector database interface
 */
export interface VectorDatabase {
  /** Index a document */
  index(document: IndexedDocument): Promise<void>;

  /** Index multiple documents */
  indexBatch(documents: IndexedDocument[]): Promise<void>;

  /** Search for similar documents */
  search(embedding: number[], topK: number, filter?: Record<string, any>): Promise<SearchResult[]>;

  /** Delete a document */
  delete(documentId: string): Promise<void>;

  /** Get a document by ID */
  get(documentId: string): Promise<IndexedDocument | null>;

  /** Count documents */
  count(filter?: Record<string, any>): Promise<number>;

  /** Clear all documents */
  clear(): Promise<void>;
}

/**
 * Chunking strategy
 */
export type ChunkingStrategy = 'fixed' | 'sentence' | 'paragraph' | 'custom';

/**
 * Document chunker configuration
 */
export interface ChunkerConfig {
  /** Chunking strategy */
  strategy: ChunkingStrategy;
  /** Chunk size (for fixed strategy) */
  chunkSize?: number;
  /** Chunk overlap */
  overlap?: number;
  /** Custom chunker function */
  customChunker?: (text: string) => string[];
}

/**
 * RAG plugin configuration
 */
export interface AIRAGPluginConfig {
  /** Enable the plugin */
  enabled?: boolean;
  /** Default embedding model ID */
  defaultEmbeddingModel?: string;
  /** Default chunking strategy */
  chunking?: ChunkerConfig;
  /** Vector database implementation */
  vectorDatabase?: VectorDatabase;
}

/**
 * Context retrieval result
 */
export interface ContextRetrievalResult {
  /** Retrieved documents */
  documents: Document[];
  /** Total matches */
  totalMatches: number;
  /** Query used */
  query: string;
  /** Embedding model used */
  embeddingModel: string;
}
