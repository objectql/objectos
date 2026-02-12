/**
 * Agent Audit Tracker for ObjectOS Agent Framework (O.3.6)
 *
 * Tracks all agent interactions for compliance, cost monitoring,
 * and budget enforcement. Stores audit entries in memory with
 * query capabilities by conversation, user, and tenant.
 */

import type {
  AgentAuditEntry,
  CostSummary,
  CostConfig,
} from './types.js';

/**
 * In-memory audit tracker for agent interactions
 */
export class AgentAuditTracker {
  private entries: AgentAuditEntry[] = [];
  private costConfig: CostConfig;
  private budgets = new Map<string, number>();

  constructor(costConfig: CostConfig) {
    this.costConfig = costConfig;
  }

  /**
   * Log an agent interaction
   */
  logInteraction(entry: AgentAuditEntry): void {
    this.entries.push(entry);
  }

  /**
   * Get audit logs for a conversation
   */
  getByConversation(conversationId: string): AgentAuditEntry[] {
    return this.entries.filter((e) => e.conversationId === conversationId);
  }

  /**
   * Get audit logs for a user, optionally filtered by tenant
   */
  getByUser(userId: string, tenantId?: string): AgentAuditEntry[] {
    return this.entries.filter((e) => {
      if (e.userId !== userId) return false;
      if (tenantId !== undefined && e.tenantId !== tenantId) return false;
      return true;
    });
  }

  /**
   * Get cost summary, optionally filtered by tenant and time period
   */
  getCostSummary(tenantId?: string, period?: { start: string; end: string }): CostSummary {
    let filtered = this.entries;

    if (tenantId !== undefined) {
      filtered = filtered.filter((e) => e.tenantId === tenantId);
    }
    if (period) {
      const startTime = new Date(period.start).getTime();
      const endTime = new Date(period.end).getTime();
      filtered = filtered.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= startTime && t <= endTime;
      });
    }

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCost = 0;
    const byModel: Record<string, { tokens: number; cost: number }> = {};

    for (const entry of filtered) {
      totalPromptTokens += entry.tokenUsage.promptTokens;
      totalCompletionTokens += entry.tokenUsage.completionTokens;
      totalCost += entry.cost;

      const model = entry.agentId;
      if (!byModel[model]) {
        byModel[model] = { tokens: 0, cost: 0 };
      }
      byModel[model].tokens += entry.tokenUsage.totalTokens;
      byModel[model].cost += entry.cost;
    }

    return {
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalPromptTokens,
      totalCompletionTokens,
      totalCost,
      currency: this.costConfig.currency,
      byModel,
      interactionCount: filtered.length,
    };
  }

  /**
   * Check budget usage for a tenant
   */
  getBudgetStatus(tenantId: string): {
    used: number;
    budget: number | undefined;
    remaining: number | undefined;
    exceeded: boolean;
  } {
    const summary = this.getCostSummary(tenantId);
    const budget = this.budgets.get(tenantId) ?? this.costConfig.budget;

    return {
      used: summary.totalCost,
      budget,
      remaining: budget !== undefined ? Math.max(0, budget - summary.totalCost) : undefined,
      exceeded: budget !== undefined ? summary.totalCost > budget : false,
    };
  }

  /**
   * Set a budget for a specific tenant
   */
  setBudget(tenantId: string, budget: number): void {
    this.budgets.set(tenantId, budget);
  }

  /**
   * Get overall statistics
   */
  getStats(): {
    totalInteractions: number;
    totalTokens: number;
    totalCost: number;
    uniqueUsers: number;
    uniqueTenants: number;
  } {
    const users = new Set<string>();
    const tenants = new Set<string>();
    let totalTokens = 0;
    let totalCost = 0;

    for (const entry of this.entries) {
      users.add(entry.userId);
      tenants.add(entry.tenantId);
      totalTokens += entry.tokenUsage.totalTokens;
      totalCost += entry.cost;
    }

    return {
      totalInteractions: this.entries.length,
      totalTokens,
      totalCost,
      uniqueUsers: users.size,
      uniqueTenants: tenants.size,
    };
  }

  /**
   * Calculate cost for a given token usage
   */
  calculateCost(promptTokens: number, completionTokens: number): number {
    const promptCost = (promptTokens / 1000) * this.costConfig.costPer1kPromptTokens;
    const completionCost = (completionTokens / 1000) * this.costConfig.costPer1kCompletionTokens;
    return promptCost + completionCost;
  }
}
