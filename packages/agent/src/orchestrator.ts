/**
 * Agent Orchestrator for ObjectOS Agent Framework (O.3.4)
 *
 * Implements multi-step reasoning by running an LLM ↔ Tool loop:
 * 1. Send messages to LLM
 * 2. If LLM returns tool calls → execute them
 * 3. Append results → send back to LLM
 * 4. Repeat until final text response or maxTurns reached
 *
 * Uses a pluggable LLMProvider interface so real providers (OpenAI,
 * Anthropic) can be injected. Ships with a MockLLMProvider for testing.
 */

import type {
  AgentMessage,
  AgentResponse,
  AgentOrchestrationStep,
  AgentOrchestrationResult,
  LLMProvider,
  LLMToolDefinition,
  LLMCompletionOptions,
  TokenUsage,
} from './types.js';
import type { ToolRegistry } from './tool-registry.js';
import type { ToolExecutionContext } from './types.js';

// ─── Orchestration Options ───────────────────────────────────────

export interface OrchestratorOptions {
  model: string;
  maxTokens: number;
  temperature: number;
  maxTurns: number;
  timeout: number;
}

// ─── Mock LLM Provider ──────────────────────────────────────────

/**
 * Mock LLM provider for testing.
 * Returns canned responses, and can simulate tool calls.
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';

  /** Queue of responses to return (FIFO) */
  private responseQueue: AgentResponse[] = [];

  /**
   * Enqueue a canned response
   */
  enqueue(response: AgentResponse): void {
    this.responseQueue.push(response);
  }

  /**
   * Complete a conversation (returns next queued response or a default)
   */
  async complete(
    _messages: AgentMessage[],
    _tools: LLMToolDefinition[],
    _options: LLMCompletionOptions,
  ): Promise<AgentResponse> {
    if (this.responseQueue.length > 0) {
      return this.responseQueue.shift()!;
    }

    // Default: return a simple text response
    return {
      message: {
        role: 'assistant',
        content: 'I am a mock assistant. No further actions needed.',
      },
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    };
  }
}

// ─── Agent Orchestrator ─────────────────────────────────────────

/**
 * Multi-step agent orchestrator
 */
export class AgentOrchestrator {
  private provider: LLMProvider;
  private toolRegistry: ToolRegistry;

  constructor(provider: LLMProvider, toolRegistry: ToolRegistry) {
    this.provider = provider;
    this.toolRegistry = toolRegistry;
  }

  /**
   * Set the LLM provider
   */
  setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }

  /**
   * Execute a single step of reasoning (one LLM call)
   */
  async executeSingleStep(
    messages: AgentMessage[],
    tools: LLMToolDefinition[],
    options: LLMCompletionOptions,
  ): Promise<AgentResponse> {
    return this.provider.complete(messages, tools, options);
  }

  /**
   * Run the full agent loop:
   * LLM call → tool execution → LLM call → ... → final response
   */
  async execute(
    messages: AgentMessage[],
    toolContext: ToolExecutionContext,
    options: OrchestratorOptions,
  ): Promise<AgentOrchestrationResult> {
    const startTime = Date.now();
    const steps: AgentOrchestrationStep[] = [];
    const tools = this.toolRegistry.getToolDefinitions();
    let totalTokens = 0;
    let currentMessages = [...messages];
    let turn = 0;

    const completionOptions: LLMCompletionOptions = {
      model: options.model,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
      timeout: options.timeout,
    };

    while (turn < options.maxTurns) {
      turn++;

      // Check timeout
      if (Date.now() - startTime > options.timeout) {
        const timeoutMessage: AgentMessage = {
          role: 'assistant',
          content: 'I ran out of time processing your request. Please try again.',
        };
        steps.push({
          stepNumber: steps.length + 1,
          action: 'final_response',
          reasoning: 'Timeout reached',
        });
        return {
          steps,
          finalResponse: timeoutMessage,
          totalTokens,
          duration: Date.now() - startTime,
        };
      }

      // Step 1: Call LLM
      const response = await this.provider.complete(currentMessages, tools, completionOptions);
      totalTokens += response.usage.totalTokens;

      steps.push({
        stepNumber: steps.length + 1,
        action: 'llm_call',
        reasoning: response.message.content,
      });

      const toolCalls = response.message.toolCalls ?? response.toolCalls;

      // Step 2: If no tool calls, this is the final response
      if (!toolCalls || toolCalls.length === 0) {
        steps.push({
          stepNumber: steps.length + 1,
          action: 'final_response',
          reasoning: response.message.content,
        });
        return {
          steps,
          finalResponse: response.message,
          totalTokens,
          duration: Date.now() - startTime,
        };
      }

      // Step 3: Execute each tool call
      currentMessages.push(response.message);

      for (const toolCall of toolCalls) {
        const result = await this.toolRegistry.execute(
          toolCall.name,
          toolCall.arguments,
          toolContext,
        );

        steps.push({
          stepNumber: steps.length + 1,
          action: 'tool_execution',
          toolCall,
          result,
        });

        // Append tool result as a tool message
        currentMessages.push({
          role: 'tool',
          content: JSON.stringify(result),
          toolCallId: toolCall.id,
          name: toolCall.name,
        });
      }
    }

    // Max turns reached — return the last assistant message or a fallback
    const fallbackMessage: AgentMessage = {
      role: 'assistant',
      content: 'I reached the maximum number of reasoning steps. Here is what I have so far.',
    };

    steps.push({
      stepNumber: steps.length + 1,
      action: 'final_response',
      reasoning: 'Max turns reached',
    });

    return {
      steps,
      finalResponse: fallbackMessage,
      totalTokens,
      duration: Date.now() - startTime,
    };
  }
}
