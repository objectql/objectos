/**
 * Conversation Context Manager for ObjectOS Agent Framework (O.3.3)
 *
 * Manages conversation state with strict tenant isolation.
 * Every read/write operation enforces that the requesting tenant
 * matches the conversation's owning tenant.
 */

import type { AgentMessage, ConversationContext } from './types.js';

let idCounter = 0;

function generateId(): string {
  idCounter++;
  return `conv_${Date.now()}_${idCounter}`;
}

/**
 * In-memory conversation manager with tenant isolation
 */
export class ConversationManager {
  private conversations = new Map<string, ConversationContext>();

  /**
   * Create a new conversation
   */
  create(
    userId: string,
    tenantId: string,
    metadata: Record<string, any> = {},
  ): ConversationContext {
    const now = new Date().toISOString();
    const conversation: ConversationContext = {
      id: generateId(),
      messages: [],
      tenantId,
      userId,
      metadata,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  /**
   * Get a conversation (enforces tenant isolation)
   */
  get(conversationId: string, tenantId: string): ConversationContext | undefined {
    const conv = this.conversations.get(conversationId);
    if (!conv) return undefined;
    if (conv.tenantId !== tenantId) return undefined;
    return conv;
  }

  /**
   * Add a message to a conversation (enforces tenant isolation)
   */
  addMessage(
    conversationId: string,
    message: AgentMessage,
    tenantId: string,
  ): ConversationContext | undefined {
    const conv = this.get(conversationId, tenantId);
    if (!conv) return undefined;
    conv.messages.push(message);
    conv.updatedAt = new Date().toISOString();
    return conv;
  }

  /**
   * Get message history for a conversation (enforces tenant isolation)
   */
  getHistory(conversationId: string, tenantId: string, limit?: number): AgentMessage[] | undefined {
    const conv = this.get(conversationId, tenantId);
    if (!conv) return undefined;
    if (limit !== undefined && limit > 0) {
      return conv.messages.slice(-limit);
    }
    return [...conv.messages];
  }

  /**
   * Delete a conversation (enforces tenant isolation)
   */
  delete(conversationId: string, tenantId: string): boolean {
    const conv = this.get(conversationId, tenantId);
    if (!conv) return false;
    return this.conversations.delete(conversationId);
  }

  /**
   * List conversations for a user within a tenant
   */
  listByUser(userId: string, tenantId: string): ConversationContext[] {
    const results: ConversationContext[] = [];
    for (const conv of this.conversations.values()) {
      if (conv.userId === userId && conv.tenantId === tenantId) {
        results.push(conv);
      }
    }
    return results;
  }

  /**
   * Prune conversations older than maxAge (in milliseconds)
   */
  prune(maxAge: number): number {
    const cutoff = Date.now() - maxAge;
    let pruned = 0;
    for (const [id, conv] of this.conversations.entries()) {
      if (new Date(conv.updatedAt).getTime() < cutoff) {
        this.conversations.delete(id);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Get conversation statistics
   */
  getStats(): {
    totalConversations: number;
    totalMessages: number;
    byTenant: Record<string, number>;
  } {
    let totalMessages = 0;
    const byTenant: Record<string, number> = {};
    for (const conv of this.conversations.values()) {
      totalMessages += conv.messages.length;
      byTenant[conv.tenantId] = (byTenant[conv.tenantId] ?? 0) + 1;
    }
    return {
      totalConversations: this.conversations.size,
      totalMessages,
      byTenant,
    };
  }
}
