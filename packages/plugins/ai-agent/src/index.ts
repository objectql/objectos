/**
 * @objectos/plugin-ai-agent
 * 
 * AI Agent orchestration plugin for ObjectOS
 */

// Main plugin
export {
  AIAgentPlugin,
  getAIAgentAPI,
} from './plugin';

// Storage
export { InMemoryAgentStorage } from './storage';

// Types
export type {
  Message,
  AgentType,
  AgentState,
  AgentConfig,
  AgentTool,
  AgentExecutionRequest,
  AgentExecutionResult,
  AgentStep,
  AgentSession,
  OrchestrationStrategy,
  MultiAgentRequest,
  MultiAgentResult,
  AIAgentPluginConfig,
  AgentStorage,
} from './types';
