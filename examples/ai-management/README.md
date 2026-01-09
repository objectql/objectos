# AI Management Example

This example demonstrates how to define and manage AI-related entities in ObjectQL, inspired by Zapier's AI capabilities.

## Overview

The AI Management example provides metadata definitions for three core AI entities:

1. **AI Tools** - Reusable AI functions and capabilities (similar to Zapier AI Actions)
2. **AI Chatbots** - Conversational AI interfaces for customer service and engagement
3. **AI Agents** - Autonomous AI entities that can execute complex tasks and workflows

## Features

### AI Tools (`ai_tool.object.yml`)

AI Tools represent reusable AI functions that can be configured and executed:

- **Categories**: Text processing, data analysis, code generation, translation, sentiment analysis, and more
- **Multi-Provider Support**: OpenAI, Anthropic, Google AI, AWS Bedrock, Azure OpenAI
- **Flexible Configuration**: Input/output schemas, system prompts, temperature, token limits
- **Cost Tracking**: Monitor usage and costs per execution
- **Rate Limiting**: Control API usage and costs

**Example Use Cases**:
- Text summarization
- Sentiment analysis
- Code generation
- Language translation
- Image generation
- Data extraction

### AI Chatbots (`ai_chatbot.object.yml`)

AI Chatbots provide conversational interfaces for user engagement:

- **Personality Customization**: Professional, friendly, casual, formal, empathetic styles
- **Multi-Language Support**: Deploy chatbots in multiple languages
- **Tool Integration**: Connect chatbots to AI tools for extended capabilities
- **Human Handoff**: Seamlessly transfer complex cases to human agents
- **Multi-Channel**: Deploy to web, mobile, Slack, Teams, WhatsApp, and more
- **Analytics**: Track conversations, messages, and satisfaction scores

**Example Use Cases**:
- Customer support automation
- Sales assistance
- HR onboarding
- FAQ answering
- Lead qualification

### AI Agents (`ai_agent.object.yml`)

AI Agents are autonomous entities that execute complex multi-step tasks:

- **Agent Types**: Task automation, data processing, workflow orchestration, research, code assistance
- **Reasoning Strategies**: Chain of Thought, Tree of Thought, ReAct (Reasoning + Acting), Reflexion
- **Memory Management**: Short-term, long-term, and hybrid memory systems
- **Tool Access**: Agents can use multiple AI tools to accomplish tasks
- **Approval Workflows**: Configure which actions require human approval
- **Triggers**: Manual, scheduled, event-based, API, or continuous execution
- **Error Handling**: Retry, skip, escalate, or abort strategies
- **Cost Controls**: Per-task and daily cost limits

**Example Use Cases**:
- Automated data analysis and reporting
- Content creation workflows
- Business process automation
- Code review and quality assurance
- Research and information gathering

## File Structure

```
examples/ai-management/src/
├── ai_tool.object.yml              # AI Tool metadata definition
├── ai_chatbot.object.yml           # AI Chatbot metadata definition
├── ai_agent.object.yml             # AI Agent metadata definition
├── ai.app.yml                      # AI Management application
├── ai_dashboard.page.yml           # Dashboard page
├── ai_tool.data.yml                # Sample AI tool data
├── ai_chatbot.data.yml             # Sample chatbot data
├── ai_agent.data.yml               # Sample agent data
├── ai_tools_by_category.chart.yml # Chart: Tools by category
├── ai_tools_by_status.chart.yml   # Chart: Tools by status
├── chatbot_conversations.chart.yml # Chart: Chatbot conversations
├── agent_success_rate.chart.yml   # Chart: Agent success rates
└── agent_tasks_by_status.chart.yml # Chart: Agent tasks by status
```

## Key Concepts

### Inspired by Zapier

This implementation draws inspiration from Zapier's AI features:

- **AI Actions (Tools)**: Reusable AI-powered functions that can be integrated into workflows
- **AI Chatbots**: Conversational interfaces with custom knowledge bases
- **AI Agents**: Autonomous automation that combines AI with business logic

### ObjectQL Advantages

1. **Unified Metadata**: All AI entities are defined using the same metadata format
2. **Type Safety**: Strong typing and validation through schemas
3. **Database Agnostic**: Works with both MongoDB and PostgreSQL
4. **Extensible**: Easy to add custom fields and behaviors
5. **UI Generation**: Automatic UI generation from metadata
6. **API First**: RESTful API automatically generated from definitions

## Usage Examples

### Creating an AI Tool

```yaml
name: sentiment_analyzer
display_name: Sentiment Analyzer
category: sentiment_analysis
provider: openai
model: gpt-3.5-turbo
status: active
input_schema:
  type: object
  properties:
    text:
      type: string
output_schema:
  type: object
  properties:
    sentiment:
      type: string
      enum: [positive, negative, neutral]
    confidence:
      type: number
```

### Creating a Chatbot

```yaml
name: support_bot
display_name: Customer Support Bot
personality: professional
language: en
provider: openai
model: gpt-4-turbo
status: active
channels:
  - web
  - slack
handoff_enabled: true
```

### Creating an Agent

```yaml
name: analyst_agent
display_name: Data Analysis Agent
agent_type: analysis_reporting
provider: openai
model: gpt-4
reasoning_strategy: react
trigger_type: manual
auto_approve: false
```

## Dashboard

The AI Management Dashboard (`ai_dashboard.page.yml`) provides:

- Overview charts showing distribution and status of AI entities
- Recent activity tables
- Performance metrics
- Quick access to all AI tools, chatbots, and agents

## Navigation

The AI Management App (`ai.app.yml`) includes:

- **Overview**: Dashboard and quick start guide
- **AI Entities**: Browse and manage tools, chatbots, and agents
- **Analytics**: Usage, cost, and performance metrics
- **Monitoring**: Active tasks, logs, and error reports
- **Configuration**: API keys, provider settings, rate limits

## Getting Started

1. Review the object definitions to understand the available fields
2. Customize the metadata to match your requirements
3. Add your own AI tools, chatbots, or agents using the data files
4. Access the dashboard to visualize and manage your AI entities
5. Use the API to integrate AI capabilities into your applications

## Integration with ObjectQL

These definitions follow ObjectQL's metadata specification:

- Standard field types (text, select, number, currency, etc.)
- Relationship fields (lookup to users and organizations)
- Custom actions for tool execution and agent tasks
- Support for both MongoDB and PostgreSQL backends
- Automatic API generation
- UI components generated from metadata

## Best Practices

1. **Start Small**: Begin with a few AI tools and gradually expand
2. **Monitor Costs**: Set appropriate cost limits to prevent overspending
3. **Test Thoroughly**: Use the test actions before deploying to production
4. **Version Control**: Track versions of your AI configurations
5. **Security**: Use proper authentication and authorization
6. **Human Oversight**: Require approval for sensitive operations
7. **Analytics**: Enable analytics to understand usage patterns

## Next Steps

- Extend the metadata with custom fields specific to your use case
- Create additional chart visualizations for your metrics
- Build custom pages for specific workflows
- Integrate with external AI providers
- Add webhook support for event-driven agents
- Implement cost tracking and optimization

## Resources

- [ObjectQL Documentation](https://docs.objectql.com)
- [Metadata Format Specification](../../docs/spec/metadata-format.md)
- [Zapier AI Documentation](https://zapier.com/ai)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Anthropic Claude Documentation](https://docs.anthropic.com)

## License

This example is part of the ObjectQL project and follows the same license.
