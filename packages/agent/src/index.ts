/**
 * @objectos/agent — AI Agent Framework for ObjectOS
 *
 * LLM-powered agents with tool calling, conversation context,
 * and tenant isolation:
 * - O.3.1: Agent Plugin (lifecycle, service registration, HTTP routes)
 * - O.3.2: Tool Registry (built-in CRUD, workflow, notification, metadata)
 * - O.3.3: Conversation Manager (tenant-isolated message history)
 * - O.3.4: Agent Orchestrator (multi-step LLM ↔ Tool reasoning)
 * - O.3.6: Audit Tracker (logging, cost tracking, budgets)
 */

export { AgentPlugin } from './plugin.js';
export { ToolRegistry } from './tool-registry.js';
export { ConversationManager } from './conversation.js';
export { AgentOrchestrator, MockLLMProvider } from './orchestrator.js';
export type { OrchestratorOptions } from './orchestrator.js';
export { AgentAuditTracker } from './audit-tracker.js';
export type {
  AgentConfig,
  ResolvedAgentConfig,
  AgentTool,
  AgentToolResult,
  ToolExecutionContext,
  AgentMessage,
  AgentToolCall,
  ConversationContext,
  AgentResponse,
  TokenUsage,
  AgentOrchestrationStep,
  AgentOrchestrationResult,
  AgentAuditEntry,
  CostConfig,
  CostSummary,
  LLMProvider,
  LLMToolDefinition,
  LLMCompletionOptions,
  PluginHealthReport,
  PluginCapabilityManifest,
  PluginSecurityManifest,
  PluginStartupResult,
} from './types.js';
