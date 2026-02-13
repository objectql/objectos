# @objectos/agent

LLM-powered AI Agent Framework plugin for ObjectOS with tool calling, conversation management, and multi-step orchestration.

## Features

- **Tool Registry** — Register CRUD, workflow, and notification actions as callable tools for LLM agents
- **Conversation Context** — Tenant-isolated conversation history with context window management
- **Agent Orchestration** — Multi-step reasoning with configurable planning strategies
- **Audit & Cost Tracking** — Automatic logging of agent actions, token usage, and cost per conversation
- **HTTP API** — RESTful endpoints for chat, conversations, tools, stats, and cost reporting

## API Endpoints

| Method | Path                          | Description                |
| ------ | ----------------------------- | -------------------------- |
| POST   | `/api/v1/agent/chat`          | Send a message to an agent |
| GET    | `/api/v1/agent/conversations` | List conversations         |
| GET    | `/api/v1/agent/tools`         | List available tools       |
| GET    | `/api/v1/agent/stats`         | Agent usage statistics     |
| GET    | `/api/v1/agent/cost`          | Cost tracking report       |

## Usage

```typescript
import { AgentPlugin } from '@objectos/agent';

const agent = new AgentPlugin({
  provider: 'openai',
  model: 'gpt-4',
  maxTokens: 4096,
});
```

## Testing

```bash
pnpm test
```

## License

AGPL-3.0 — Part of the [ObjectOS](https://github.com/objectstack-ai/objectos) ecosystem.
