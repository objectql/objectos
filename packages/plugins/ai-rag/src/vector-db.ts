/**
 * In-Memory Vector Database
 * 
 * Simple implementation for development and testing
 */

import type { VectorDatabase, IndexedDocument, SearchResult, Document } from './types';

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * In-memory vector database
 */
export class InMemoryVectorDB implements VectorDatabase {
  private documents: Map<string, IndexedDocument> = new Map();

  async index(document: IndexedDocument): Promise<void> {
    this.documents.set(document.id, document);
  }

  async indexBatch(documents: IndexedDocument[]): Promise<void> {
    for (const doc of documents) {
      await this.index(doc);
    }
  }

  async search(
    embedding: number[],
    topK: number,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    let docs = Array.from(this.documents.values());

    // Apply metadata filter
    if (filter) {
      docs = docs.filter((doc) => {
        if (!doc.metadata) return false;
        return Object.entries(filter).every(
          ([key, value]) => doc.metadata![key] === value
        );
      });
    }

    // Calculate similarities
    const results = docs.map((doc) => ({
      document: doc as Document,
      score: cosineSimilarity(embedding, doc.embedding),
      rank: 0,
    }));

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Take top K and set ranks
    return results.slice(0, topK).map((result, index) => ({
      ...result,
      rank: index + 1,
    }));
  }

  async delete(documentId: string): Promise<void> {
    this.documents.delete(documentId);
  }

  async get(documentId: string): Promise<IndexedDocument | null> {
    return this.documents.get(documentId) || null;
  }

  async count(filter?: Record<string, any>): Promise<number> {
    if (!filter) {
      return this.documents.size;
    }

    let count = 0;
    for (const doc of this.documents.values()) {
      if (!doc.metadata) continue;
      const matches = Object.entries(filter).every(
        ([key, value]) => doc.metadata![key] === value
      );
      if (matches) count++;
    }
    return count;
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }
}
