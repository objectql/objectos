/**
 * AI-Powered Customer Support Agent Example
 * 
 * This example demonstrates how to use all three AI plugins together:
 * - @objectos/plugin-ai-models: LLM provider abstraction
 * - @objectos/plugin-ai-rag: Document indexing and semantic search
 * - @objectos/plugin-ai-agent: Agent orchestration
 * 
 * The example creates a customer support agent that can:
 * 1. Answer questions based on a knowledge base (RAG)
 * 2. Generate code examples
 * 3. Process customer data
 */

import { ObjectKernel } from '@objectstack/runtime';
import { AIModelsPlugin } from '@objectos/plugin-ai-models';
import { AIRAGPlugin } from '@objectos/plugin-ai-rag';
import { AIAgentPlugin } from '@objectos/plugin-ai-agent';

async function main() {
  console.log('🤖 AI-Powered Customer Support Agent Example\n');

  // Step 1: Create kernel
  const kernel = new ObjectKernel();

  // Step 2: Register AI plugins
  console.log('Registering AI plugins...');
  
  const aiModels = new AIModelsPlugin({
    enabled: true,
    trackUsage: true,
    defaultModelId: 'gpt-4o',
  });
  
  const aiRAG = new AIRAGPlugin({
    enabled: true,
    defaultEmbeddingModel: 'text-embedding-3-small',
    chunking: {
      strategy: 'sentence',
      chunkSize: 500,
      overlap: 50,
    },
  });
  
  const aiAgent = new AIAgentPlugin({
    enabled: true,
    enableSessions: true,
  });

  await kernel.registerPlugin(aiModels);
  await kernel.registerPlugin(aiRAG);
  await kernel.registerPlugin(aiAgent);
  
  await kernel.start();
  
  console.log('✅ All AI plugins registered and started\n');

  // Step 3: Get service APIs
  const modelsAPI = kernel.getService('ai-models');
  const ragAPI = kernel.getService('ai-rag');
  const agentAPI = kernel.getService('ai-agent');

  // Step 4: Build knowledge base
  console.log('📚 Building knowledge base...');
  
  const knowledgeBase = [
    {
      id: 'doc-1',
      content: 'ObjectOS is a metadata-driven low-code platform for building enterprise applications. It provides a declarative approach to defining objects, fields, permissions, and workflows using YAML configuration files.',
      metadata: { category: 'overview', topic: 'introduction' },
    },
    {
      id: 'doc-2',
      content: 'ObjectOS includes three core AI plugins: ai-models for LLM provider abstraction, ai-rag for document indexing and semantic search, and ai-agent for agent orchestration. These plugins work together to enable AI-native applications.',
      metadata: { category: 'features', topic: 'ai-plugins' },
    },
    {
      id: 'doc-3',
      content: 'To create an object in ObjectOS, define a YAML file with the object name, label, fields, and permissions. Example: name: contact, label: Contact, fields: [name, email, phone].',
      metadata: { category: 'tutorial', topic: 'objects' },
    },
    {
      id: 'doc-4',
      content: 'The RAG plugin uses vector embeddings to enable semantic search. Documents are chunked, embedded using an LLM, and stored in a vector database. When querying, the system finds the most relevant documents using cosine similarity.',
      metadata: { category: 'features', topic: 'rag' },
    },
  ];

  for (const doc of knowledgeBase) {
    await ragAPI.indexDocument(doc, { chunkDocument: true });
  }
  
  console.log(`✅ Indexed ${knowledgeBase.length} documents\n`);

  // Step 5: Register a custom customer support agent
  console.log('🎯 Registering customer support agent...');
  
  await agentAPI.registerAgent({
    id: 'customer-support',
    name: 'Customer Support Agent',
    type: 'conversation',
    description: 'Answers customer questions using RAG and LLM',
    modelId: 'gpt-4o',
    systemPrompt: `You are a helpful customer support agent for ObjectOS. 
Answer questions based on the provided context from the knowledge base. 
Be concise, friendly, and accurate. If you don't know the answer, say so.`,
    temperature: 0.7,
    maxTokens: 500,
  });
  
  console.log('✅ Customer support agent registered\n');

  // Step 6: Simulate customer queries
  console.log('💬 Simulating customer queries...\n');
  
  const queries = [
    'What is ObjectOS?',
    'How do I create an object?',
    'What are the AI plugins available?',
  ];

  for (const query of queries) {
    console.log(`\n📝 Customer: "${query}"\n`);
    
    // Step 6a: Retrieve relevant context from knowledge base
    const context = await ragAPI.retrieveContext(query, {
      topK: 2,
      minScore: 0.5,
    });
    
    console.log(`   📖 Retrieved ${context.documents.length} relevant documents`);
    
    // Step 6b: Build augmented prompt with context
    const augmentedPrompt = `Context from knowledge base:\n${context.documents.map((d, i) => `[${i + 1}] ${d.content}`).join('\n\n')}\n\nQuestion: ${query}`;
    
    // Step 6c: Execute support agent with RAG context
    const response = await agentAPI.execute({
      agentId: 'customer-support',
      input: augmentedPrompt,
    });
    
    console.log(`   🤖 Agent: ${response.output}`);
    console.log(`   📊 Tokens used: ${response.tokensUsed}`);
  }

  // Step 7: Multi-agent orchestration example
  console.log('\n\n🔄 Multi-Agent Orchestration Example\n');
  console.log('Task: Generate code to process customer data\n');
  
  const orchestrationResult = await agentAPI.orchestrate({
    agents: ['code-generator', 'data-processor'],
    strategy: 'sequential',
    input: 'Generate TypeScript code to validate and process customer contact information (name, email, phone)',
  });
  
  console.log('✅ Orchestration completed:');
  console.log(`   Agents executed: ${orchestrationResult.results.length}`);
  console.log(`   Total tokens: ${orchestrationResult.totalTokensUsed}`);
  console.log(`\n   Final output:\n${orchestrationResult.output}\n`);

  // Step 8: Show usage statistics
  console.log('\n📊 Usage Statistics\n');
  
  const usageSummary = await modelsAPI.getUsageSummary();
  console.log(`   Total requests: ${usageSummary.totalRequests}`);
  console.log(`   Total tokens: ${usageSummary.totalTokens}`);
  console.log(`   Estimated cost: $${usageSummary.totalCost.toFixed(4)}`);
  
  console.log('\n   By model:');
  for (const [modelId, stats] of Object.entries(usageSummary.byModel)) {
    console.log(`   - ${modelId}: ${stats.requests} requests, ${stats.tokens} tokens`);
  }

  // Step 9: Cleanup
  console.log('\n\n🧹 Cleaning up...');
  await kernel.destroy();
  
  console.log('✅ Example completed successfully!\n');
}

// Run the example
main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
