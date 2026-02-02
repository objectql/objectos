/**
 * In-Memory Storage for Model Registry
 */

import type {
  ModelConfig,
  ModelRegistryStorage,
  UsageEntry,
  LLMProvider,
} from './types';

export class InMemoryModelStorage implements ModelRegistryStorage {
  private models: Map<string, ModelConfig> = new Map();
  private usage: UsageEntry[] = [];

  async saveModel(model: ModelConfig): Promise<void> {
    this.models.set(model.id, model);
  }

  async getModel(modelId: string): Promise<ModelConfig | null> {
    return this.models.get(modelId) || null;
  }

  async listModels(filter?: { provider?: LLMProvider; active?: boolean }): Promise<ModelConfig[]> {
    let models = Array.from(this.models.values());

    if (filter?.provider) {
      models = models.filter((m) => m.provider === filter.provider);
    }

    if (filter?.active !== undefined) {
      models = models.filter((m) => m.active === filter.active);
    }

    return models;
  }

  async deleteModel(modelId: string): Promise<void> {
    this.models.delete(modelId);
  }

  async saveUsage(entry: UsageEntry): Promise<void> {
    this.usage.push(entry);
  }

  async getUsage(filter?: {
    userId?: string;
    modelId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<UsageEntry[]> {
    let entries = this.usage;

    if (filter?.userId) {
      entries = entries.filter((e) => e.userId === filter.userId);
    }

    if (filter?.modelId) {
      entries = entries.filter((e) => e.modelId === filter.modelId);
    }

    if (filter?.startDate) {
      entries = entries.filter((e) => e.timestamp >= filter.startDate!);
    }

    if (filter?.endDate) {
      entries = entries.filter((e) => e.timestamp <= filter.endDate!);
    }

    return entries;
  }
}
