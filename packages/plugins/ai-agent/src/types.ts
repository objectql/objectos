/**
 * AI Agent Types
 */

/**
 * Message in a conversation
 */
export interface Message {
  /** Message role */
  role: 'system' | 'user' | 'assistant' | 'function';
  /** Message content */
  content: string;
  /** Function name (for function role) */
  name?: string;
}

/**
 * Agent type
 */
export type AgentType = 'code-generation' | 'data-processing' | 'conversation' | 'custom';

/**
 * Agent state
 */
export type AgentState = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Unique agent ID */
  id: string;
  /** Agent name */
  name: string;
  /** Agent type */
  type: AgentType;
  /** Agent description */
  description?: string;
  /** Model to use */
  modelId: string;
  /** System prompt */
  systemPrompt?: string;
  /** Temperature */
  temperature?: number;
  /** Max tokens */
  maxTokens?: number;
  /** Tools/functions available to the agent */
  tools?: AgentTool[];
  /** Agent metadata */
  metadata?: Record<string, any>;
}

/**
 * Agent tool/function
 */
export interface AgentTool {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Parameters schema */
  parameters?: Record<string, any>;
  /** Tool implementation */
  execute: (args: any) => Promise<any>;
}

/**
 * Agent execution request
 */
export interface AgentExecutionRequest {
  /** Agent ID */
  agentId: string;
  /** Input message or prompt */
  input: string;
  /** Conversation context (previous messages) */
  context?: Message[];
  /** User ID for tracking */
  userId?: string;
  /** Additional parameters */
  parameters?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  /** Execution ID */
  executionId: string;
  /** Agent ID */
  agentId: string;
  /** Output/result */
  output: string;
  /** Final state */
  state: AgentState;
  /** Steps taken during execution */
  steps: AgentStep[];
  /** Total tokens used */
  tokensUsed: number;
  /** Execution cost */
  cost?: number;
  /** Execution metadata */
  metadata?: Record<string, any>;
}

/**
 * Agent execution step
 */
export interface AgentStep {
  /** Step number */
  stepNumber: number;
  /** Step type */
  type: 'thinking' | 'tool-call' | 'response';
  /** Step content */
  content: string;
  /** Tool used (if applicable) */
  tool?: string;
  /** Tool arguments (if applicable) */
  toolArgs?: any;
  /** Tool result (if applicable) */
  toolResult?: any;
  /** Timestamp */
  timestamp: Date;
}

/**
 * Agent session
 */
export interface AgentSession {
  /** Session ID */
  sessionId: string;
  /** Agent ID */
  agentId: string;
  /** User ID */
  userId?: string;
  /** Conversation history */
  messages: Message[];
  /** Session state */
  state: AgentState;
  /** Created at */
  createdAt: Date;
  /** Updated at */
  updatedAt: Date;
  /** Session metadata */
  metadata?: Record<string, any>;
}

/**
 * Agent orchestration strategy
 */
export type OrchestrationStrategy = 'sequential' | 'parallel' | 'conditional';

/**
 * Multi-agent orchestration request
 */
export interface MultiAgentRequest {
  /** Agents to orchestrate */
  agents: string[];
  /** Orchestration strategy */
  strategy: OrchestrationStrategy;
  /** Input for the orchestration */
  input: string;
  /** User ID */
  userId?: string;
}

/**
 * Multi-agent result
 */
export interface MultiAgentResult {
  /** Orchestration ID */
  orchestrationId: string;
  /** Agent results */
  results: AgentExecutionResult[];
  /** Final output */
  output: string;
  /** Total tokens used */
  totalTokensUsed: number;
  /** Total cost */
  totalCost?: number;
}

/**
 * AI Agent plugin configuration
 */
export interface AIAgentPluginConfig {
  /** Enable the plugin */
  enabled?: boolean;
  /** Pre-configured agents */
  agents?: AgentConfig[];
  /** Enable session management */
  enableSessions?: boolean;
}

/**
 * Agent storage interface
 */
export interface AgentStorage {
  /** Save agent configuration */
  saveAgent(agent: AgentConfig): Promise<void>;

  /** Get agent configuration */
  getAgent(agentId: string): Promise<AgentConfig | null>;

  /** List agents */
  listAgents(filter?: { type?: AgentType }): Promise<AgentConfig[]>;

  /** Delete agent */
  deleteAgent(agentId: string): Promise<void>;

  /** Save session */
  saveSession(session: AgentSession): Promise<void>;

  /** Get session */
  getSession(sessionId: string): Promise<AgentSession | null>;

  /** List sessions */
  listSessions(filter?: { agentId?: string; userId?: string }): Promise<AgentSession[]>;

  /** Delete session */
  deleteSession(sessionId: string): Promise<void>;
}
