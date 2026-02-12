/**
 * Agent Plugin Tests
 *
 * Tests for O.3.1 (plugin lifecycle), O.3.2 (tool registry),
 * O.3.3 (conversation manager), O.3.4 (orchestrator), and O.3.6 (audit).
 */

import { AgentPlugin } from '../src/plugin.js';
import { ToolRegistry } from '../src/tool-registry.js';
import { ConversationManager } from '../src/conversation.js';
import { AgentOrchestrator, MockLLMProvider } from '../src/orchestrator.js';
import { AgentAuditTracker } from '../src/audit-tracker.js';
import type { AgentTool, AgentResponse, AgentToolCall, AgentAuditEntry } from '../src/types.js';

// ─── Test Fixtures ─────────────────────────────────────────────────

function createMockContext() {
  const events: Array<{ event: string; payload: any }> = [];
  const services: Record<string, any> = {};

  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
    trigger: jest.fn(async (event: string, payload: any) => {
      events.push({ event, payload });
    }),
    registerService: jest.fn((name: string, service: any) => {
      services[name] = service;
    }),
    getService: jest.fn((name: string) => services[name] ?? null),
    broker: {
      call: jest.fn(async () => ({ id: '1', name: 'Test' })),
      getService: jest.fn(() => null),
    },
    _events: events,
    _services: services,
  };
}

function createTestTool(overrides: Partial<AgentTool> = {}): AgentTool {
  return {
    name: 'test.echo',
    description: 'Echo tool for testing',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string', description: 'Input to echo' },
      },
      required: ['input'],
    },
    handler: async (args) => ({ success: true, data: args.input }),
    ...overrides,
  };
}

// ─── O.3.1: Plugin Lifecycle Tests ──────────────────────────────

describe('O.3.1 — Agent Plugin Lifecycle', () => {
  let plugin: AgentPlugin;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    plugin = new AgentPlugin();
    ctx = createMockContext();
  });

  test('initializes and registers agent service', async () => {
    await plugin.init(ctx as any);

    expect(ctx.registerService).toHaveBeenCalledWith('agent', plugin);
    expect(ctx.trigger).toHaveBeenCalledWith('plugin.initialized', {
      pluginId: '@objectos/agent',
    });
  });

  test('starts and logs warning when no HTTP server', async () => {
    await plugin.init(ctx as any);
    await plugin.start(ctx as any);

    expect(ctx.logger.warn).toHaveBeenCalledWith(
      '[Agent] HTTP server not available — routes not registered',
    );
    expect(ctx.trigger).toHaveBeenCalledWith('plugin.started', {
      pluginId: '@objectos/agent',
    });
  });

  test('starts and registers routes when HTTP server available', async () => {
    const routes: string[] = [];
    const mockApp = {
      get: jest.fn((path: string) => routes.push(`GET ${path}`)),
      post: jest.fn((path: string) => routes.push(`POST ${path}`)),
      delete: jest.fn((path: string) => routes.push(`DELETE ${path}`)),
    };
    ctx._services['http.server'] = { getRawApp: () => mockApp };

    await plugin.init(ctx as any);
    await plugin.start(ctx as any);

    expect(routes).toContain('POST /api/v1/agent/chat');
    expect(routes).toContain('GET /api/v1/agent/conversations');
    expect(routes).toContain('GET /api/v1/agent/conversations/:id');
    expect(routes).toContain('DELETE /api/v1/agent/conversations/:id');
    expect(routes).toContain('GET /api/v1/agent/tools');
    expect(routes).toContain('GET /api/v1/agent/stats');
    expect(routes).toContain('GET /api/v1/agent/cost');
  });

  test('stops cleanly', async () => {
    await plugin.init(ctx as any);
    await plugin.stop();

    expect(ctx.logger.info).toHaveBeenCalledWith('[Agent] Stopped');
  });

  test('returns healthy health report', async () => {
    await plugin.init(ctx as any);

    const health = plugin.getHealthReport();
    expect(health.status).toBe('healthy');
    expect(health.details?.provider).toBe('mock');
    expect(health.details?.model).toBe('mock-model');
  });

  test('returns capability manifest', () => {
    const caps = plugin.getCapabilities();
    expect(caps.id).toBe('@objectos/agent');
    expect(caps.provides).toContain('agent');
    expect(caps.provides).toContain('agent.chat');
    expect(caps.provides).toContain('agent.tools');
    expect(caps.consumes).toContain('http.server');
    expect(caps.consumes).toContain('permissions');
  });

  test('returns security manifest', () => {
    const sec = plugin.getSecurityManifest();
    expect(sec.permissions).toContain('agent.chat');
    expect(sec.permissions).toContain('agent.tool.execute');
    expect(sec.dataAccess).toContain('read');
    expect(sec.dataAccess).toContain('create');
  });

  test('returns startup result', () => {
    const result = plugin.getStartupResult();
    expect(result.success).toBe(true);
    expect(result.message).toBe('Agent plugin started');
  });

  test('exposes sub-components via service API', async () => {
    await plugin.init(ctx as any);

    expect(plugin.getToolRegistry()).toBeInstanceOf(ToolRegistry);
    expect(plugin.getConversationManager()).toBeInstanceOf(ConversationManager);
    expect(plugin.getOrchestrator()).toBeInstanceOf(AgentOrchestrator);
    expect(plugin.getAuditTracker()).toBeInstanceOf(AgentAuditTracker);
  });

  test('accepts custom configuration', () => {
    const custom = new AgentPlugin({
      provider: 'openai',
      model: 'gpt-4o',
      maxTurns: 5,
      temperature: 0.3,
    });
    const health = custom.getHealthReport();
    expect(health.details?.provider).toBe('openai');
    expect(health.details?.model).toBe('gpt-4o');
  });
});

// ─── O.3.2: Tool Registry Tests ─────────────────────────────────

describe('O.3.2 — Tool Registry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  test('has built-in tools registered', () => {
    const tools = registry.list();
    const names = tools.map((t) => t.name);

    expect(names).toContain('data.find');
    expect(names).toContain('data.findOne');
    expect(names).toContain('data.create');
    expect(names).toContain('data.update');
    expect(names).toContain('data.delete');
    expect(names).toContain('workflow.start');
    expect(names).toContain('workflow.transition');
    expect(names).toContain('notification.send');
    expect(names).toContain('metadata.getObjects');
    expect(names).toContain('metadata.getObject');
  });

  test('registers a custom tool', () => {
    const tool = createTestTool();
    registry.register(tool);

    expect(registry.get('test.echo')).toBeDefined();
    expect(registry.get('test.echo')?.description).toBe('Echo tool for testing');
  });

  test('rejects duplicate tool registration', () => {
    const tool = createTestTool();
    registry.register(tool);

    expect(() => registry.register(tool)).toThrow('already registered');
  });

  test('rejects tool without name', () => {
    expect(() => registry.register({ name: '', description: 'x', parameters: {}, handler: async () => ({ success: true }) })).toThrow('name and description');
  });

  test('unregisters a tool', () => {
    const tool = createTestTool();
    registry.register(tool);

    expect(registry.unregister('test.echo')).toBe(true);
    expect(registry.get('test.echo')).toBeUndefined();
  });

  test('unregister returns false for unknown tool', () => {
    expect(registry.unregister('nonexistent')).toBe(false);
  });

  test('executes a custom tool', async () => {
    const tool = createTestTool();
    registry.register(tool);

    const result = await registry.execute(
      'test.echo',
      { input: 'hello' },
      { tenantId: 't1', userId: 'u1' },
    );

    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  test('returns error for unknown tool execution', async () => {
    const result = await registry.execute(
      'nonexistent',
      {},
      { tenantId: 't1', userId: 'u1' },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('enforces permission check on tool execution', async () => {
    const tool = createTestTool();
    registry.register(tool);

    const broker = {
      getService: jest.fn(() => ({
        check: jest.fn(async () => false),
      })),
    };

    const result = await registry.execute(
      'test.echo',
      { input: 'hello' },
      { tenantId: 't1', userId: 'u1', broker },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Permission denied');
  });

  test('allows execution when permission check passes', async () => {
    const tool = createTestTool();
    registry.register(tool);

    const broker = {
      getService: jest.fn(() => ({
        check: jest.fn(async () => true),
      })),
    };

    const result = await registry.execute(
      'test.echo',
      { input: 'hello' },
      { tenantId: 't1', userId: 'u1', broker },
    );

    expect(result.success).toBe(true);
  });

  test('getToolDefinitions returns LLM-compatible format', () => {
    const definitions = registry.getToolDefinitions();

    expect(definitions.length).toBeGreaterThan(0);
    for (const def of definitions) {
      expect(def).toHaveProperty('name');
      expect(def).toHaveProperty('description');
      expect(def).toHaveProperty('parameters');
      expect(def).not.toHaveProperty('handler');
    }
  });

  test('built-in tool calls broker', async () => {
    const broker = {
      call: jest.fn(async () => [{ id: '1' }]),
      getService: jest.fn(() => null),
    };

    const result = await registry.execute(
      'data.find',
      { object: 'accounts' },
      { tenantId: 't1', userId: 'u1', broker },
    );

    expect(result.success).toBe(true);
    expect(broker.call).toHaveBeenCalledWith('data.find', {
      object: 'accounts',
      _tenantId: 't1',
      _userId: 'u1',
    });
  });

  test('built-in tool returns error when broker unavailable', async () => {
    const result = await registry.execute(
      'data.find',
      { object: 'accounts' },
      { tenantId: 't1', userId: 'u1' },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('Broker not available');
  });
});

// ─── O.3.3: Conversation Manager Tests ──────────────────────────

describe('O.3.3 — Conversation Manager', () => {
  let manager: ConversationManager;

  beforeEach(() => {
    manager = new ConversationManager();
  });

  test('creates a conversation', () => {
    const conv = manager.create('user1', 'tenant1');

    expect(conv.id).toBeTruthy();
    expect(conv.userId).toBe('user1');
    expect(conv.tenantId).toBe('tenant1');
    expect(conv.messages).toHaveLength(0);
    expect(conv.createdAt).toBeTruthy();
    expect(conv.updatedAt).toBeTruthy();
  });

  test('creates conversation with metadata', () => {
    const conv = manager.create('user1', 'tenant1', { topic: 'sales' });

    expect(conv.metadata.topic).toBe('sales');
  });

  test('gets a conversation within the same tenant', () => {
    const conv = manager.create('user1', 'tenant1');

    const retrieved = manager.get(conv.id, 'tenant1');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(conv.id);
  });

  test('enforces tenant isolation on get', () => {
    const conv = manager.create('user1', 'tenant1');

    expect(manager.get(conv.id, 'tenant2')).toBeUndefined();
  });

  test('returns undefined for unknown conversation', () => {
    expect(manager.get('nonexistent', 'tenant1')).toBeUndefined();
  });

  test('adds message with tenant check', () => {
    const conv = manager.create('user1', 'tenant1');

    const updated = manager.addMessage(
      conv.id,
      { role: 'user', content: 'Hello' },
      'tenant1',
    );

    expect(updated?.messages).toHaveLength(1);
    expect(updated?.messages[0].content).toBe('Hello');
  });

  test('rejects message from wrong tenant', () => {
    const conv = manager.create('user1', 'tenant1');

    const result = manager.addMessage(
      conv.id,
      { role: 'user', content: 'Hello' },
      'tenant2',
    );

    expect(result).toBeUndefined();
  });

  test('gets message history', () => {
    const conv = manager.create('user1', 'tenant1');
    manager.addMessage(conv.id, { role: 'user', content: 'msg1' }, 'tenant1');
    manager.addMessage(conv.id, { role: 'assistant', content: 'msg2' }, 'tenant1');
    manager.addMessage(conv.id, { role: 'user', content: 'msg3' }, 'tenant1');

    const history = manager.getHistory(conv.id, 'tenant1');
    expect(history).toHaveLength(3);
  });

  test('gets limited message history', () => {
    const conv = manager.create('user1', 'tenant1');
    manager.addMessage(conv.id, { role: 'user', content: 'msg1' }, 'tenant1');
    manager.addMessage(conv.id, { role: 'assistant', content: 'msg2' }, 'tenant1');
    manager.addMessage(conv.id, { role: 'user', content: 'msg3' }, 'tenant1');

    const history = manager.getHistory(conv.id, 'tenant1', 2);
    expect(history).toHaveLength(2);
    expect(history![0].content).toBe('msg2');
    expect(history![1].content).toBe('msg3');
  });

  test('enforces tenant isolation on getHistory', () => {
    const conv = manager.create('user1', 'tenant1');
    manager.addMessage(conv.id, { role: 'user', content: 'msg1' }, 'tenant1');

    expect(manager.getHistory(conv.id, 'tenant2')).toBeUndefined();
  });

  test('deletes a conversation', () => {
    const conv = manager.create('user1', 'tenant1');

    expect(manager.delete(conv.id, 'tenant1')).toBe(true);
    expect(manager.get(conv.id, 'tenant1')).toBeUndefined();
  });

  test('delete fails for wrong tenant', () => {
    const conv = manager.create('user1', 'tenant1');

    expect(manager.delete(conv.id, 'tenant2')).toBe(false);
    expect(manager.get(conv.id, 'tenant1')).toBeDefined();
  });

  test('lists conversations by user within tenant', () => {
    manager.create('user1', 'tenant1');
    manager.create('user1', 'tenant1');
    manager.create('user2', 'tenant1');
    manager.create('user1', 'tenant2');

    const list = manager.listByUser('user1', 'tenant1');
    expect(list).toHaveLength(2);
  });

  test('prunes old conversations', () => {
    const conv = manager.create('user1', 'tenant1');
    // Manually backdate the conversation
    const storedConv = manager.get(conv.id, 'tenant1')!;
    storedConv.updatedAt = new Date(Date.now() - 100000).toISOString();

    manager.create('user1', 'tenant1'); // fresh one

    const pruned = manager.prune(50000);
    expect(pruned).toBe(1);
  });

  test('getStats returns correct statistics', () => {
    const conv1 = manager.create('user1', 'tenant1');
    manager.addMessage(conv1.id, { role: 'user', content: 'a' }, 'tenant1');
    manager.addMessage(conv1.id, { role: 'assistant', content: 'b' }, 'tenant1');
    manager.create('user2', 'tenant2');

    const stats = manager.getStats();
    expect(stats.totalConversations).toBe(2);
    expect(stats.totalMessages).toBe(2);
    expect(stats.byTenant['tenant1']).toBe(1);
    expect(stats.byTenant['tenant2']).toBe(1);
  });
});

// ─── O.3.4: Orchestrator Tests ──────────────────────────────────

describe('O.3.4 — Agent Orchestrator', () => {
  let provider: MockLLMProvider;
  let registry: ToolRegistry;
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    provider = new MockLLMProvider();
    registry = new ToolRegistry();
    orchestrator = new AgentOrchestrator(provider, registry);
  });

  test('executes single step (no tool calls)', async () => {
    const response = await orchestrator.executeSingleStep(
      [{ role: 'user', content: 'Hello' }],
      [],
      { model: 'mock', maxTokens: 100, temperature: 0.7, timeout: 5000 },
    );

    expect(response.message.role).toBe('assistant');
    expect(response.message.content).toBeTruthy();
    expect(response.usage.totalTokens).toBeGreaterThan(0);
  });

  test('returns final response when LLM gives text only', async () => {
    provider.enqueue({
      message: { role: 'assistant', content: 'The answer is 42.' },
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
    });

    const result = await orchestrator.execute(
      [{ role: 'user', content: 'What is the answer?' }],
      { tenantId: 't1', userId: 'u1' },
      { model: 'mock', maxTokens: 100, temperature: 0.7, maxTurns: 5, timeout: 10000 },
    );

    expect(result.finalResponse.content).toBe('The answer is 42.');
    expect(result.totalTokens).toBe(15);
    expect(result.steps.length).toBeGreaterThanOrEqual(2); // llm_call + final_response
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  test('executes tool calls and continues loop', async () => {
    // Register a custom tool
    registry.register({
      name: 'math.add',
      description: 'Add two numbers',
      parameters: {
        type: 'object',
        properties: {
          a: { type: 'number' },
          b: { type: 'number' },
        },
        required: ['a', 'b'],
      },
      handler: async (args) => ({ success: true, data: args.a + args.b }),
    });

    // First response: LLM wants to call a tool
    const toolCall: AgentToolCall = {
      id: 'call_1',
      name: 'math.add',
      arguments: { a: 3, b: 4 },
    };

    provider.enqueue({
      message: {
        role: 'assistant',
        content: '',
        toolCalls: [toolCall],
      },
      toolCalls: [toolCall],
      usage: { promptTokens: 20, completionTokens: 10, totalTokens: 30 },
    });

    // Second response: final text after seeing tool result
    provider.enqueue({
      message: { role: 'assistant', content: 'The result is 7.' },
      usage: { promptTokens: 30, completionTokens: 8, totalTokens: 38 },
    });

    const result = await orchestrator.execute(
      [{ role: 'user', content: 'What is 3 + 4?' }],
      { tenantId: 't1', userId: 'u1' },
      { model: 'mock', maxTokens: 100, temperature: 0.7, maxTurns: 5, timeout: 10000 },
    );

    expect(result.finalResponse.content).toBe('The result is 7.');
    expect(result.totalTokens).toBe(68);

    // Should have steps for: llm_call (tool), tool_execution, llm_call (final), final_response
    const actions = result.steps.map((s) => s.action);
    expect(actions).toContain('llm_call');
    expect(actions).toContain('tool_execution');
    expect(actions).toContain('final_response');
  });

  test('respects maxTurns limit', async () => {
    // Every response triggers another tool call — infinite loop
    const toolCall: AgentToolCall = {
      id: 'call_loop',
      name: 'data.find',
      arguments: { object: 'accounts' },
    };

    for (let i = 0; i < 5; i++) {
      provider.enqueue({
        message: {
          role: 'assistant',
          content: '',
          toolCalls: [toolCall],
        },
        toolCalls: [toolCall],
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      });
    }

    const result = await orchestrator.execute(
      [{ role: 'user', content: 'loop forever' }],
      {
        tenantId: 't1',
        userId: 'u1',
        broker: {
          call: jest.fn(async () => []),
          getService: jest.fn(() => null),
        },
      },
      { model: 'mock', maxTokens: 100, temperature: 0.7, maxTurns: 2, timeout: 10000 },
    );

    expect(result.finalResponse.content).toContain('maximum number of reasoning steps');
  });

  test('handles timeout', async () => {
    // Provider that takes too long
    const slowProvider: any = {
      name: 'slow',
      complete: async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          message: { role: 'assistant' as const, content: 'slow response' },
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        };
      },
    };

    orchestrator.setProvider(slowProvider);

    const result = await orchestrator.execute(
      [{ role: 'user', content: 'hurry up' }],
      { tenantId: 't1', userId: 'u1' },
      { model: 'mock', maxTokens: 100, temperature: 0.7, maxTurns: 5, timeout: 50 },
    );

    // Either times out or completes quickly — test that it doesn't hang
    expect(result.finalResponse).toBeDefined();
    expect(result.duration).toBeDefined();
  });

  test('setProvider switches the LLM provider', async () => {
    const newProvider = new MockLLMProvider();
    newProvider.enqueue({
      message: { role: 'assistant', content: 'From new provider' },
      usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
    });

    orchestrator.setProvider(newProvider);

    const result = await orchestrator.execute(
      [{ role: 'user', content: 'test' }],
      { tenantId: 't1', userId: 'u1' },
      { model: 'mock', maxTokens: 100, temperature: 0.7, maxTurns: 5, timeout: 10000 },
    );

    expect(result.finalResponse.content).toBe('From new provider');
  });
});

// ─── O.3.6: Audit Tracker Tests ─────────────────────────────────

describe('O.3.6 — Agent Audit Tracker', () => {
  let tracker: AgentAuditTracker;

  beforeEach(() => {
    tracker = new AgentAuditTracker({
      costPer1kPromptTokens: 0.01,
      costPer1kCompletionTokens: 0.03,
      currency: 'USD',
      budget: 100,
    });
  });

  function createEntry(overrides: Partial<AgentAuditEntry> = {}): AgentAuditEntry {
    return {
      agentId: 'gpt-4o',
      conversationId: 'conv_1',
      action: 'chat',
      toolCalls: [],
      tokenUsage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      cost: 0.0025,
      tenantId: 'tenant1',
      userId: 'user1',
      timestamp: new Date().toISOString(),
      ...overrides,
    };
  }

  test('logs an interaction', () => {
    tracker.logInteraction(createEntry());

    const stats = tracker.getStats();
    expect(stats.totalInteractions).toBe(1);
    expect(stats.totalTokens).toBe(150);
  });

  test('getByConversation returns matching entries', () => {
    tracker.logInteraction(createEntry({ conversationId: 'conv_1' }));
    tracker.logInteraction(createEntry({ conversationId: 'conv_2' }));
    tracker.logInteraction(createEntry({ conversationId: 'conv_1' }));

    const entries = tracker.getByConversation('conv_1');
    expect(entries).toHaveLength(2);
  });

  test('getByUser returns matching entries', () => {
    tracker.logInteraction(createEntry({ userId: 'user1', tenantId: 'tenant1' }));
    tracker.logInteraction(createEntry({ userId: 'user2', tenantId: 'tenant1' }));
    tracker.logInteraction(createEntry({ userId: 'user1', tenantId: 'tenant2' }));

    expect(tracker.getByUser('user1')).toHaveLength(2);
    expect(tracker.getByUser('user1', 'tenant1')).toHaveLength(1);
  });

  test('getCostSummary returns aggregate data', () => {
    tracker.logInteraction(createEntry({ cost: 0.01 }));
    tracker.logInteraction(createEntry({ cost: 0.02 }));

    const summary = tracker.getCostSummary();
    expect(summary.totalCost).toBeCloseTo(0.03);
    expect(summary.interactionCount).toBe(2);
    expect(summary.currency).toBe('USD');
    expect(summary.totalTokens).toBe(300);
  });

  test('getCostSummary filters by tenant', () => {
    tracker.logInteraction(createEntry({ tenantId: 'tenant1', cost: 0.01 }));
    tracker.logInteraction(createEntry({ tenantId: 'tenant2', cost: 0.02 }));

    const summary = tracker.getCostSummary('tenant1');
    expect(summary.totalCost).toBeCloseTo(0.01);
    expect(summary.interactionCount).toBe(1);
  });

  test('getCostSummary filters by time period', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 86400000);
    const twoDaysAgo = new Date(now.getTime() - 172800000);

    tracker.logInteraction(createEntry({ timestamp: twoDaysAgo.toISOString(), cost: 0.01 }));
    tracker.logInteraction(createEntry({ timestamp: now.toISOString(), cost: 0.02 }));

    const summary = tracker.getCostSummary(undefined, {
      start: yesterday.toISOString(),
      end: new Date(now.getTime() + 1000).toISOString(),
    });
    expect(summary.interactionCount).toBe(1);
    expect(summary.totalCost).toBeCloseTo(0.02);
  });

  test('getBudgetStatus reports usage against budget', () => {
    tracker.logInteraction(createEntry({ tenantId: 'tenant1', cost: 30 }));
    tracker.logInteraction(createEntry({ tenantId: 'tenant1', cost: 40 }));

    const status = tracker.getBudgetStatus('tenant1');
    expect(status.used).toBe(70);
    expect(status.budget).toBe(100);
    expect(status.remaining).toBe(30);
    expect(status.exceeded).toBe(false);
  });

  test('getBudgetStatus detects exceeded budget', () => {
    tracker.logInteraction(createEntry({ tenantId: 'tenant1', cost: 60 }));
    tracker.logInteraction(createEntry({ tenantId: 'tenant1', cost: 60 }));

    const status = tracker.getBudgetStatus('tenant1');
    expect(status.exceeded).toBe(true);
    expect(status.remaining).toBe(0);
  });

  test('setBudget overrides default budget per tenant', () => {
    tracker.setBudget('tenant1', 50);
    tracker.logInteraction(createEntry({ tenantId: 'tenant1', cost: 30 }));

    const status = tracker.getBudgetStatus('tenant1');
    expect(status.budget).toBe(50);
    expect(status.remaining).toBe(20);
  });

  test('calculateCost computes correct cost', () => {
    const cost = tracker.calculateCost(1000, 500);
    // 1000/1000 * 0.01 + 500/1000 * 0.03 = 0.01 + 0.015 = 0.025
    expect(cost).toBeCloseTo(0.025);
  });

  test('getStats returns aggregate statistics', () => {
    tracker.logInteraction(createEntry({ userId: 'u1', tenantId: 't1' }));
    tracker.logInteraction(createEntry({ userId: 'u2', tenantId: 't1' }));
    tracker.logInteraction(createEntry({ userId: 'u1', tenantId: 't2' }));

    const stats = tracker.getStats();
    expect(stats.totalInteractions).toBe(3);
    expect(stats.uniqueUsers).toBe(2);
    expect(stats.uniqueTenants).toBe(2);
  });

  test('byModel breakdown in cost summary', () => {
    tracker.logInteraction(createEntry({ agentId: 'gpt-4o', cost: 0.01 }));
    tracker.logInteraction(createEntry({ agentId: 'claude-3', cost: 0.02 }));

    const summary = tracker.getCostSummary();
    expect(summary.byModel['gpt-4o'].cost).toBeCloseTo(0.01);
    expect(summary.byModel['claude-3'].cost).toBeCloseTo(0.02);
  });
});
