# @objectos/plugin-ai-agent

AI Agent orchestration plugin for ObjectOS - provides agent management, code generation, data processing, and multi-agent coordination.

## Features

- **Agent Orchestration**: Manage and execute AI agents
- **Code Generation**: Generate code based on requirements
- **Data Processing**: Process and transform data
- **Session Management**: Maintain conversation context
- **Multi-Agent Coordination**: Orchestrate multiple agents (sequential/parallel)
- **State Management**: Track agent execution state

## Installation

```bash
pnpm add @objectos/plugin-ai-agent @objectos/plugin-ai-models
```

## Usage

```typescript
import { ObjectKernel } from '@objectstack/runtime';
import { AIModelsPlugin } from '@objectos/plugin-ai-models';
import { AIAgentPlugin } from '@objectos/plugin-ai-agent';

// Create kernel
const kernel = new ObjectKernel();

// Register plugins
await kernel.registerPlugin(new AIModelsPlugin({
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
  },
}));

await kernel.registerPlugin(new AIAgentPlugin({
  enableSessions: true,
}));

await kernel.start();

// Use the agent API
const agentAPI = kernel.getService('ai-agent');

// Execute a code generation agent
const result = await agentAPI.execute({
  agentId: 'code-generator',
  input: 'Create a TypeScript function that validates email addresses',
});

console.log('Generated code:');
console.log(result.output);

// Create a session for interactive conversation
const session = await agentAPI.createSession('code-generator', 'user-123');

// Send messages to session
const response1 = await agentAPI.sendToSession(
  session.sessionId,
  'Create a React component for a login form'
);

const response2 = await agentAPI.sendToSession(
  session.sessionId,
  'Add validation to the form'
);

// Multi-agent orchestration
const multiResult = await agentAPI.orchestrate({
  agents: ['code-generator', 'data-processor'],
  strategy: 'sequential',
  input: 'Generate code to process user data and save to database',
});

console.log(`Orchestrated ${multiResult.results.length} agents`);
console.log(multiResult.output);
```

## Configuration

```typescript
interface AIAgentPluginConfig {
  enabled?: boolean;
  agents?: AgentConfig[];
  enableSessions?: boolean;
}
```

## Default Agents

The plugin comes with default agents:

- **code-generator**: Generates code based on requirements
- **data-processor**: Processes and transforms data

## Custom Agents

You can register custom agents:

```typescript
await agentAPI.registerAgent({
  id: 'sql-generator',
  name: 'SQL Generator',
  type: 'code-generation',
  description: 'Generates SQL queries',
  modelId: 'gpt-4o',
  systemPrompt: 'You are an expert in SQL. Generate optimized SQL queries.',
  temperature: 0.3,
  maxTokens: 1000,
});
```

## API Reference

### `registerAgent(agent: AgentConfig): Promise<void>`

Register a new agent.

### `execute(request: AgentExecutionRequest): Promise<AgentExecutionResult>`

Execute an agent.

### `createSession(agentId: string, userId?): Promise<AgentSession>`

Create a conversational session.

### `sendToSession(sessionId: string, message: string): Promise<AgentExecutionResult>`

Send a message to a session.

### `orchestrate(request: MultiAgentRequest): Promise<MultiAgentResult>`

Orchestrate multiple agents.

### `listAgents(filter?): Promise<AgentConfig[]>`

List available agents.

### `listSessions(filter?): Promise<AgentSession[]>`

List sessions.

## Orchestration Strategies

- **sequential**: Agents execute in order, each using the previous output
- **parallel**: All agents execute simultaneously with the same input
- **conditional**: (Future) Conditional execution based on results

## License

AGPL-3.0
