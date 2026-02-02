/**
 * Tests for AI Models Plugin
 */

import { AIModelsPlugin } from '../src/plugin';
import { PluginContext } from '@objectstack/runtime';

describe('AIModelsPlugin', () => {
  let plugin: AIModelsPlugin;
  let mockContext: PluginContext;

  beforeEach(() => {
    // Create mock plugin context
    mockContext = {
      registerService: jest.fn(),
      getService: jest.fn(),
      hasService: jest.fn(),
      getServices: jest.fn(),
      hook: jest.fn(),
      trigger: jest.fn(),
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
      getKernel: jest.fn(),
    };

    plugin = new AIModelsPlugin({
      enabled: true,
      trackUsage: true,
    });
  });

  describe('Plugin Lifecycle', () => {
    test('should initialize successfully', async () => {
      await plugin.init(mockContext);
      expect(mockContext.registerService).toHaveBeenCalledWith('ai-models', plugin);
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        '[AI Models Plugin] Initialized successfully'
      );
    });

    test('should start successfully', async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
      expect(mockContext.logger.info).toHaveBeenCalledWith(
        '[AI Models Plugin] Started successfully'
      );
    });

    test('should destroy successfully', async () => {
      await plugin.init(mockContext);
      await plugin.destroy();
      expect(mockContext.logger.info).toHaveBeenCalledWith('[AI Models Plugin] Destroyed');
    });
  });

  describe('Model Management', () => {
    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
    });

    test('should list default models', async () => {
      const models = await plugin.listModels();
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('id');
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('provider');
    });

    test('should get a specific model', async () => {
      const model = await plugin.getModel('gpt-4o');
      expect(model).not.toBeNull();
      expect(model?.id).toBe('gpt-4o');
      expect(model?.provider).toBe('openai');
    });

    test('should register a new model', async () => {
      await plugin.registerModel({
        id: 'custom-model',
        name: 'Custom Model',
        provider: 'custom',
        modelIdentifier: 'custom-1',
        capabilities: {
          textGeneration: true,
          codeGeneration: false,
          embeddings: false,
          functionCalling: false,
          vision: false,
          contextWindow: 4096,
          maxOutputTokens: 2048,
        },
        active: true,
      });

      const model = await plugin.getModel('custom-model');
      expect(model).not.toBeNull();
      expect(model?.name).toBe('Custom Model');
    });

    test('should filter models by provider', async () => {
      const openaiModels = await plugin.listModels({ provider: 'openai' });
      expect(openaiModels.every((m) => m.provider === 'openai')).toBe(true);
    });

    test('should filter models by active status', async () => {
      const activeModels = await plugin.listModels({ active: true });
      expect(activeModels.every((m) => m.active === true)).toBe(true);
    });
  });

  describe('Completion Generation', () => {
    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
    });

    test('should generate completion with stub provider', async () => {
      const response = await plugin.complete({
        modelId: 'gpt-4o',
        messages: [
          { role: 'user', content: 'Hello!' },
        ],
      });

      expect(response).toHaveProperty('text');
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('inputTokens');
      expect(response.usage).toHaveProperty('outputTokens');
      expect(response.usage).toHaveProperty('totalTokens');
    });

    test('should track usage when generating completion', async () => {
      await plugin.complete({
        modelId: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test' }],
        userId: 'user-123',
      });

      const usage = await plugin.getUsage({ userId: 'user-123' });
      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0].userId).toBe('user-123');
      expect(usage[0].modelId).toBe('gpt-4o');
    });

    test('should emit event on completion', async () => {
      await plugin.complete({
        modelId: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test' }],
      });

      expect(mockContext.trigger).toHaveBeenCalledWith('ai.completion', expect.any(Object));
    });

    test('should throw error for non-existent model', async () => {
      await expect(
        plugin.complete({
          modelId: 'non-existent-model',
          messages: [{ role: 'user', content: 'Test' }],
        })
      ).rejects.toThrow('Model not found');
    });
  });

  describe('Embedding Generation', () => {
    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
    });

    test('should generate embeddings with stub provider', async () => {
      const response = await plugin.embed({
        modelId: 'text-embedding-3-small',
        text: 'Test text for embedding',
      });

      expect(response).toHaveProperty('embedding');
      expect(Array.isArray(response.embedding)).toBe(true);
      expect(response.embedding.length).toBeGreaterThan(0);
      expect(response).toHaveProperty('usage');
    });

    test('should track usage when generating embeddings', async () => {
      await plugin.embed({
        modelId: 'text-embedding-3-small',
        text: 'Test',
        userId: 'user-456',
      });

      const usage = await plugin.getUsage({ userId: 'user-456' });
      expect(usage.length).toBeGreaterThan(0);
      expect(usage[0].operation).toBe('embedding');
    });

    test('should emit event on embedding', async () => {
      await plugin.embed({
        modelId: 'text-embedding-3-small',
        text: 'Test',
      });

      expect(mockContext.trigger).toHaveBeenCalledWith('ai.embedding', expect.any(Object));
    });
  });

  describe('Usage Tracking', () => {
    beforeEach(async () => {
      await plugin.init(mockContext);
      await plugin.start(mockContext);
    });

    test('should get usage summary', async () => {
      // Generate some usage
      await plugin.complete({
        modelId: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test 1' }],
        userId: 'user-1',
      });
      await plugin.complete({
        modelId: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test 2' }],
        userId: 'user-1',
      });

      const summary = await plugin.getUsageSummary({ userId: 'user-1' });
      expect(summary.totalRequests).toBe(2);
      expect(summary.totalTokens).toBeGreaterThan(0);
      expect(summary.byModel['gpt-4o']).toBeDefined();
      expect(summary.byModel['gpt-4o'].requests).toBe(2);
    });

    test('should filter usage by date range', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const usage = await plugin.getUsage({ startDate, endDate });
      expect(Array.isArray(usage)).toBe(true);
    });

    test('should filter usage by model', async () => {
      await plugin.complete({
        modelId: 'gpt-4o',
        messages: [{ role: 'user', content: 'Test' }],
      });

      const usage = await plugin.getUsage({ modelId: 'gpt-4o' });
      expect(usage.every((e) => e.modelId === 'gpt-4o')).toBe(true);
    });
  });
});
