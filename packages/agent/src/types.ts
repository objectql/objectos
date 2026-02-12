/**
 * AI Agent Framework Types for ObjectOS
 *
 * Type definitions for the agent system:
 * - Agent configuration and resolved defaults
 * - Tool definitions and execution results
 * - Conversation messages and context
 * - Orchestration steps and results
 * - Audit logging and cost tracking
 */

// ─── Agent Configuration ──────────────────────────────────────────

/**
 * Agent configuration (user-provided, all optional)
 */
export interface AgentConfig {
  /** LLM provider identifier (e.g., 'openai', 'anthropic') */
  provider?: string;
  /** Model identifier (e.g., 'gpt-4o', 'claude-sonnet-4-20250514') */
  model?: string;
  /** API key for the LLM provider */
  apiKey?: string;
  /** Maximum tokens in a single completion */
  maxTokens?: number;
  /** Temperature for LLM sampling (0–2) */
  temperature?: number;
  /** System prompt prepended to every conversation */
  systemPrompt?: string;
  /** Maximum turns in a multi-step orchestration */
  maxTurns?: number;
  /** Timeout for a single LLM call (ms) */
  timeout?: number;
  /** Cost tracking configuration */
  cost?: CostConfig;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedAgentConfig {
  provider: string;
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  maxTurns: number;
  timeout: number;
  cost: CostConfig;
}

// ─── Cost Tracking ────────────────────────────────────────────────

/**
 * Cost tracking configuration for token usage billing
 */
export interface CostConfig {
  /** Cost per 1,000 prompt tokens (USD) */
  costPer1kPromptTokens: number;
  /** Cost per 1,000 completion tokens (USD) */
  costPer1kCompletionTokens: number;
  /** Currency code */
  currency: string;
  /** Optional budget limit per tenant */
  budget?: number;
}

// ─── Tool System ──────────────────────────────────────────────────

/**
 * Tool definition for LLM function calling
 */
export interface AgentTool {
  /** Unique tool name (e.g., 'data.find') */
  name: string;
  /** Human-readable description for the LLM */
  description: string;
  /** JSON Schema describing the tool's parameters */
  parameters: Record<string, any>;
  /** Handler function (receives parsed args and execution context) */
  handler: (args: Record<string, any>, context: ToolExecutionContext) => Promise<AgentToolResult>;
}

/**
 * Context passed to a tool handler during execution
 */
export interface ToolExecutionContext {
  /** ID of the current tenant */
  tenantId: string;
  /** ID of the current user */
  userId: string;
  /** Broker for calling other services (RBAC-enforced) */
  broker?: any;
}

/**
 * Result of a tool execution
 */
export interface AgentToolResult {
  /** Whether the tool execution succeeded */
  success: boolean;
  /** Result data (if success) */
  data?: any;
  /** Error message (if failure) */
  error?: string;
}

// ─── Conversation ─────────────────────────────────────────────────

/**
 * A single message in a conversation
 */
export interface AgentMessage {
  /** Message role */
  role: 'system' | 'user' | 'assistant' | 'tool';
  /** Text content */
  content: string;
  /** Tool calls requested by the assistant */
  toolCalls?: AgentToolCall[];
  /** ID of the tool call this message responds to */
  toolCallId?: string;
  /** Tool name (for tool role messages) */
  name?: string;
}

/**
 * A tool call requested by the LLM
 */
export interface AgentToolCall {
  /** Unique call ID */
  id: string;
  /** Tool name to invoke */
  name: string;
  /** Parsed arguments object */
  arguments: Record<string, any>;
}

/**
 * Conversation state with tenant isolation
 */
export interface ConversationContext {
  /** Unique conversation ID */
  id: string;
  /** Ordered list of messages */
  messages: AgentMessage[];
  /** Tenant that owns this conversation */
  tenantId: string;
  /** User that owns this conversation */
  userId: string;
  /** Arbitrary metadata */
  metadata: Record<string, any>;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last update */
  updatedAt: string;
}

// ─── LLM Response ─────────────────────────────────────────────────

/**
 * Response from the LLM provider
 */
export interface AgentResponse {
  /** The assistant message */
  message: AgentMessage;
  /** Tool calls in this response (convenience alias for message.toolCalls) */
  toolCalls?: AgentToolCall[];
  /** Token usage statistics */
  usage: TokenUsage;
}

/**
 * Token usage statistics for a single LLM call
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ─── Orchestration ────────────────────────────────────────────────

/**
 * A single step in multi-step agent reasoning
 */
export interface AgentOrchestrationStep {
  /** Step number (1-based) */
  stepNumber: number;
  /** Action taken: 'llm_call', 'tool_execution', 'final_response' */
  action: 'llm_call' | 'tool_execution' | 'final_response';
  /** Tool call details (if action is tool_execution) */
  toolCall?: AgentToolCall;
  /** Result of tool execution */
  result?: AgentToolResult;
  /** LLM reasoning (if available) */
  reasoning?: string;
}

/**
 * Final result of a multi-step orchestration
 */
export interface AgentOrchestrationResult {
  /** All steps taken during orchestration */
  steps: AgentOrchestrationStep[];
  /** Final assistant response */
  finalResponse: AgentMessage;
  /** Total tokens consumed across all steps */
  totalTokens: number;
  /** Wall-clock duration (ms) */
  duration: number;
}

// ─── Audit ────────────────────────────────────────────────────────

/**
 * Audit log entry for an agent interaction
 */
export interface AgentAuditEntry {
  /** Agent / plugin ID */
  agentId: string;
  /** Conversation ID */
  conversationId: string;
  /** Action performed (e.g., 'chat', 'tool_call') */
  action: string;
  /** Tool calls made during this interaction */
  toolCalls: AgentToolCall[];
  /** Token usage */
  tokenUsage: TokenUsage;
  /** Estimated cost (USD) */
  cost: number;
  /** Tenant ID */
  tenantId: string;
  /** User ID */
  userId: string;
  /** ISO timestamp */
  timestamp: string;
}

/**
 * Cost summary for a period
 */
export interface CostSummary {
  /** Total tokens consumed */
  totalTokens: number;
  /** Total prompt tokens */
  totalPromptTokens: number;
  /** Total completion tokens */
  totalCompletionTokens: number;
  /** Total estimated cost */
  totalCost: number;
  /** Currency code */
  currency: string;
  /** Breakdown by model */
  byModel: Record<string, { tokens: number; cost: number }>;
  /** Number of interactions */
  interactionCount: number;
}

// ─── Plugin Lifecycle Manifests ───────────────────────────────────

/**
 * Plugin health report
 */
export interface PluginHealthReport {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, any>;
}

/**
 * Plugin capability manifest
 */
export interface PluginCapabilityManifest {
  id: string;
  provides: string[];
  consumes: string[];
}

/**
 * Plugin security manifest
 */
export interface PluginSecurityManifest {
  permissions: string[];
  dataAccess: string[];
}

/**
 * Plugin startup result
 */
export interface PluginStartupResult {
  success: boolean;
  message?: string;
}

// ─── LLM Provider Interface ──────────────────────────────────────

/**
 * Interface for LLM provider implementations.
 * Real providers (OpenAI, Anthropic) implement this interface.
 */
export interface LLMProvider {
  /** Provider identifier */
  readonly name: string;

  /**
   * Send messages to the LLM and receive a response
   */
  complete(
    messages: AgentMessage[],
    tools: LLMToolDefinition[],
    options: LLMCompletionOptions,
  ): Promise<AgentResponse>;
}

/**
 * Tool definition in the format expected by LLM APIs
 */
export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * Options for a single LLM completion call
 */
export interface LLMCompletionOptions {
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}
