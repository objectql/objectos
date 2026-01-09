/**
 * AI Management Example
 * 
 * This module provides type definitions and enums for AI-related metadata.
 * Inspired by Zapier's AI capabilities, these definitions provide a foundation for
 * building AI-powered applications with ObjectQL.
 * 
 * Note: YAML metadata files should be loaded using ObjectQL's metadata loader,
 * not directly imported in TypeScript.
 * 
 * @module ai-management
 */

/**
 * AI Tool Categories
 */
export enum AIToolCategory {
  TextProcessing = 'text_processing',
  DataAnalysis = 'data_analysis',
  ImageGeneration = 'image_generation',
  CodeGeneration = 'code_generation',
  Translation = 'translation',
  SentimentAnalysis = 'sentiment_analysis',
  Summarization = 'summarization',
  QuestionAnswering = 'question_answering',
  Custom = 'custom',
}

/**
 * AI Providers
 */
export enum AIProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  GoogleAI = 'google_ai',
  AWSBedrock = 'aws_bedrock',
  AzureOpenAI = 'azure_openai',
  Custom = 'custom',
}

/**
 * Chatbot Personalities
 */
export enum ChatbotPersonality {
  Professional = 'professional',
  Friendly = 'friendly',
  Casual = 'casual',
  Formal = 'formal',
  Humorous = 'humorous',
  Empathetic = 'empathetic',
  Custom = 'custom',
}

/**
 * Agent Types
 */
export enum AgentType {
  TaskAutomation = 'task_automation',
  DataProcessing = 'data_processing',
  WorkflowOrchestration = 'workflow_orchestration',
  ResearchAssistant = 'research_assistant',
  CodeAssistant = 'code_assistant',
  CustomerService = 'customer_service',
  ContentCreation = 'content_creation',
  AnalysisReporting = 'analysis_reporting',
  Custom = 'custom',
}

/**
 * Reasoning Strategies
 */
export enum ReasoningStrategy {
  ChainOfThought = 'chain_of_thought',
  TreeOfThought = 'tree_of_thought',
  ReAct = 'react',
  Reflexion = 'reflexion',
  Custom = 'custom',
}

/**
 * Entity Status
 */
export enum Status {
  Draft = 'draft',
  Training = 'training',
  Testing = 'testing',
  Active = 'active',
  Paused = 'paused',
  Failed = 'failed',
  Deprecated = 'deprecated',
  Archived = 'archived',
}

/**
 * Trigger Types for Agents
 */
export enum TriggerType {
  Manual = 'manual',
  Scheduled = 'scheduled',
  EventBased = 'event_based',
  APICall = 'api_call',
  Continuous = 'continuous',
}

/**
 * Error Handling Strategies
 */
export enum ErrorHandling {
  Retry = 'retry',
  Skip = 'skip',
  Escalate = 'escalate',
  Abort = 'abort',
}
