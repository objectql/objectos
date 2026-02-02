/**
 * Document Chunker
 * 
 * Splits documents into smaller chunks for better embedding quality
 */

import type { ChunkerConfig, Document } from './types';

/**
 * Document chunker
 */
export class DocumentChunker {
  private config: ChunkerConfig;

  constructor(config: ChunkerConfig) {
    this.config = {
      chunkSize: 500,
      overlap: 50,
      ...config,
      strategy: config.strategy || 'fixed',
    };
  }

  /**
   * Chunk a document into smaller pieces
   */
  chunk(document: Document): Document[] {
    const chunks: string[] = this.chunkText(document.content);

    return chunks.map((chunk, index) => ({
      id: `${document.id}-chunk-${index}`,
      content: chunk,
      metadata: {
        ...document.metadata,
        originalDocId: document.id,
        chunkIndex: index,
        totalChunks: chunks.length,
      },
      source: document.source,
      timestamp: document.timestamp,
    }));
  }

  /**
   * Chunk text based on configured strategy
   */
  private chunkText(text: string): string[] {
    switch (this.config.strategy) {
      case 'fixed':
        return this.fixedSizeChunking(text);
      case 'sentence':
        return this.sentenceChunking(text);
      case 'paragraph':
        return this.paragraphChunking(text);
      case 'custom':
        return this.config.customChunker?.(text) || [text];
      default:
        return [text];
    }
  }

  /**
   * Fixed-size chunking with overlap
   */
  private fixedSizeChunking(text: string): string[] {
    const chunkSize = this.config.chunkSize || 500;
    const overlap = this.config.overlap || 50;
    const chunks: string[] = [];

    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start += chunkSize - overlap;
    }

    return chunks.filter((chunk) => chunk.trim().length > 0);
  }

  /**
   * Sentence-based chunking
   */
  private sentenceChunking(text: string): string[] {
    // Simple sentence splitting (can be improved with NLP libraries)
    const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 0);
    const chunkSize = this.config.chunkSize || 500;
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += sentence + '. ';
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Paragraph-based chunking
   */
  private paragraphChunking(text: string): string[] {
    const paragraphs = text
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    return paragraphs;
  }
}
