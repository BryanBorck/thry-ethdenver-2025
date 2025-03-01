// src/services/HederaAgentService.ts

import HederaAgentKit from '../hedera-agentkit/agent'; // Adjust the path to your actual HederaAgentKit
import { createHederaTools } from '../hedera-agentkit'; // Adjust to your createHederaTools location
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';

// 1. Initialize an agent (common to both chat and autonomous modes)
export async function initializeAgent() {
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  // Initialize HederaAgentKit
  const hederaKit = new HederaAgentKit(
    process.env.HEDERA_ACCOUNT_ID!,
    process.env.HEDERA_PRIVATE_KEY!,
    (process.env.HEDERA_NETWORK as 'mainnet' | 'testnet' | 'previewnet') ||
      'testnet',
  );

  // Create the LangChain-compatible tools
  const tools = createHederaTools(hederaKit);

  // Prepare an in-memory checkpoint saver
  const memory = new MemorySaver();

  // Additional configuration for the agent
  const config = { configurable: { thread_id: 'Hedera Agent Kit!' } };

  // Create the React agent
  const agent = createReactAgent({
    llm,
    tools,
    checkpointSaver: memory,
    messageModifier: `
      You are a helpful agent that can interact on-chain using the Hedera Agent Kit. 
      You are empowered to interact on-chain using your tools. If you ever need funds,
      you can request them from a faucet or from the user. 
      If there is a 5XX (internal) HTTP error code, ask the user to try again later. 
      If someone asks you to do something you can't do with your available tools, you 
      must say so, and encourage them to implement it themselves with the Hedera Agent Kit. 
      Keep your responses concise and helpful.
    `,
  });

  return { agent, config };
}

// 2. Single-iteration "autonomous" demonstration
export async function runAutonomousMode(agent: any, config: any) {
  console.log('Running autonomous mode for one iteration...');

  const thought =
    'Perform an interesting on-chain action on Hedera that showcases your capabilities.';
  const stream = await agent.stream(
    { messages: [new HumanMessage(thought)] },
    config,
  );

  const responses: { type: string; message: string }[] = [];
  for await (const chunk of stream) {
    if ('agent' in chunk) {
      responses.push({
        type: 'agent',
        message: chunk.agent.messages[0].content,
      });
    } else if ('tools' in chunk) {
      responses.push({
        type: 'tools',
        message: chunk.tools.messages[0].content,
      });
    }
  }

  return responses;
}

// 3. Chat mode for a single user prompt
export async function runChatMode(agent: any, config: any, userPrompt: string) {
  console.log('Running chat mode with prompt:', userPrompt);

  const stream = await agent.stream(
    { messages: [new HumanMessage(userPrompt)] },
    config,
  );
  const responses: { type: string; message: string }[] = [];
  for await (const chunk of stream) {
    if ('agent' in chunk) {
      responses.push({
        type: 'agent',
        message: chunk.agent.messages[0].content,
      });
    } else if ('tools' in chunk) {
      responses.push({
        type: 'tools',
        message: chunk.tools.messages[0].content,
      });
    }
  }

  return responses;
}
