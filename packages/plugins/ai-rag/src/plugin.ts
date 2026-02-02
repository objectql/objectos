/**
 * AI RAG Plugin for ObjectOS
 * 
 * This plugin provides:
 * - Document indexing with vector embeddings
 * - Semantic search capabilities
 * - Context retrieval for AI queries
 * - Document chunking strategies
 */

import type { Plugin, PluginContext } from '@objectstack/runtime';
import type {
  AIRAGPluginConfig,
  Document,
  IndexedDocument,
  SearchQuery,
  SearchResult,
  ContextRetrievalResult,
  VectorDatabase,
} from './types';
import { InMemoryVectorDB } from './vector-db';
import { DocumentChunker } from './chunker';

/**
 * AI RAG Plugin
 */
export class AIRAGPlugin implements Plugin {
  name = 'com.objectos.ai.rag';
  version = '0.1.0';
  dependencies: string[] = ['com.objectos.ai.models'];

  private config: AIRAGPluginConfig;
  private vectorDB: VectorDatabase;
  private chunker: DocumentChunker;
  private context?: PluginContext;

  constructor(config: AIRAGPluginConfig = {}) {
    this.config = {
      enabled: true,
      defaultEmbeddingModel: 'text-embedding-3-small',
      chunking: {
        strategy: 'fixed',
        chunkSize: 500,
        overlap: 50,
      },
      ...config,
    };

    this.vectorDB = config.vectorDatabase || new InMemoryVectorDB();
    this.chunker = new DocumentChunker(this.config.chunking!);
  }

  /**
   * Initialize plugin
   */
  async init(context: PluginContext): Promise<void> {
    this.context = context;

    // Register service
    context.registerService('ai-rag', this);

    context.logger.info('[AI RAG Plugin] Initialized successfully');
  }

  /**
   * Start plugin
   */
  async start(context: PluginContext): Promise<void> {
    context.logger.info('[AI RAG Plugin] Starting...');

    // Check if ai-models service is available
    if (!context.hasService('ai-models')) {
      context.logger.warn('[AI RAG Plugin] ai-models service not found, RAG features may be limited');
    }

    context.logger.info('[AI RAG Plugin] Started successfully');
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
   * Index a document
   */
  async indexDocument(document: Document, options?: {
    chunkDocument?: boolean;
    embeddingModel?: string;
  }): Promise<void> {
    const embeddingModel = options?.embeddingModel || this.config.defaultEmbeddingModel!;
    const shouldChunk = options?.chunkDocument !== false;

    let documentsToIndex: Document[];

    if (shouldChunk) {
      // Chunk the document
      documentsToIndex = this.chunker.chunk(document);
      this.context?.logger.debug(
        `[AI RAG Plugin] Chunked document ${document.id} into ${documentsToIndex.length} pieces`
      );
    } else {
      documentsToIndex = [document];
    }

    // Generate embeddings and index
    const aiModels = this.getAIModelsService();

    for (const doc of documentsToIndex) {
      // Generate embedding
      const embeddingResponse = await aiModels.embed({
        modelId: embeddingModel,
        text: doc.content,
      });

      // Index the document
      const indexedDoc: IndexedDocument = {
        ...doc,
        embedding: embeddingResponse.embedding,
        embeddingModel,
      };

      await this.vectorDB.index(indexedDoc);
    }

    this.context?.logger.info(
      `[AI RAG Plugin] Indexed ${documentsToIndex.length} document(s) from ${document.id}`
    );

    // Emit event
    await this.context?.trigger('ai.rag.indexed', {
      documentId: document.id,
      chunksIndexed: documentsToIndex.length,
      embeddingModel,
    });
  }

  /**
   * Index multiple documents
   */
  async indexDocuments(documents: Document[], options?: {
    chunkDocuments?: boolean;
    embeddingModel?: string;
  }): Promise<void> {
    for (const doc of documents) {
      await this.indexDocument(doc, options);
    }
  }

  /**
   * Search for documents
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const embeddingModel = query.embeddingModel || this.config.defaultEmbeddingModel!;
    const topK = query.topK || 5;
    const minScore = query.minScore || 0.0;

    // Generate embedding for query
    const aiModels = this.getAIModelsService();
    const embeddingResponse = await aiModels.embed({
      modelId: embeddingModel,
      text: query.query,
    });

    // Search vector database
    const results = await this.vectorDB.search(
      embeddingResponse.embedding,
      topK,
      query.filter
    );

    // Filter by minimum score
    const filteredResults = results.filter((r) => r.score >= minScore);

    this.context?.logger.debug(
      `[AI RAG Plugin] Search found ${filteredResults.length} results for query: "${query.query}"`
    );

    // Emit event
    await this.context?.trigger('ai.rag.searched', {
      query: query.query,
      resultsCount: filteredResults.length,
      embeddingModel,
    });

    return filteredResults;
  }

  /**
   * Retrieve context for AI queries
   */
  async retrieveContext(query: string, options?: {
    topK?: number;
    minScore?: number;
    embeddingModel?: string;
  }): Promise<ContextRetrievalResult> {
    const results = await this.search({
      query,
      topK: options?.topK,
      minScore: options?.minScore,
      embeddingModel: options?.embeddingModel,
    });

    return {
      documents: results.map((r) => r.document),
      totalMatches: results.length,
      query,
      embeddingModel: options?.embeddingModel || this.config.defaultEmbeddingModel!,
    };
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.vectorDB.delete(documentId);
    this.context?.logger.info(`[AI RAG Plugin] Deleted document ${documentId}`);

    await this.context?.trigger('ai.rag.deleted', { documentId });
  }

  /**
   * Get a document
   */
  async getDocument(documentId: string): Promise<IndexedDocument | null> {
    return this.vectorDB.get(documentId);
  }

  /**
   * Count documents
   */
  async countDocuments(filter?: Record<string, any>): Promise<number> {
    return this.vectorDB.count(filter);
  }

  /**
   * Clear all documents
   */
  async clearAll(): Promise<void> {
    await this.vectorDB.clear();
    this.context?.logger.info('[AI RAG Plugin] Cleared all documents');

    await this.context?.trigger('ai.rag.cleared', {});
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    this.context?.logger.info('[AI RAG Plugin] Destroyed');
  }
}

/**
 * Helper function to access the AI RAG API from kernel
 */
export function getAIRAGAPI(kernel: any): AIRAGPlugin | null {
  try {
    return kernel.getService('ai-rag');
  } catch {
    return null;
  }
}
