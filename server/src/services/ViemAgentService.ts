// src/services/HederaAgentService.ts

import { ViemAgentKit } from '../viem-agentkit/agent'; // Adjust the path to your actual HederaAgentKit
import { createViemTools } from '../viem-agentkit/langchain'; // Adjust to your createHederaTools location
import { ChatOpenAI } from '@langchain/openai';
import { MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage } from '@langchain/core/messages';
// viem imports
import { createWalletClient, http } from 'viem';
import { hederaTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

import { ViemWalletProvider } from '../viem-agentkit/wallet-providers/viemWalletProvider';
// Optional gas config
import { ViemWalletProviderGasConfig } from '../viem-agentkit/wallet-providers/viemWalletProvider';

// 1. Initialize an agent (common to both chat and autonomous modes)
export async function initializeAgent() {
  // 1. Create your LLM
  const llm = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.7,
  });

  console.log('ETHEREUM_PRIVATE_KEY', process.env.ETHEREUM_PRIVATE_KEY);

  // 2. Create a viem WalletClient pointed at Hedera Testnet
  const account = privateKeyToAccount(
    process.env.ETHEREUM_PRIVATE_KEY! as `0x${string}`,
  );
  const walletClient = createWalletClient({
    account,
    chain: hederaTestnet,
    transport: http('https://testnet.hashio.io/api'),
  });

  // Optional: supply gas config for multipliers
  const gasConfig: ViemWalletProviderGasConfig = {
    gasLimitMultiplier: 1.2,
    feePerGasMultiplier: 1.1,
  };

  // 3. Create the ViemWalletProvider from the viem wallet client
  const walletProvider = new ViemWalletProvider(walletClient, gasConfig);

  // 4. Initialize the new ViemAgentKit (only needs the provider now)
  const viemKit = await ViemAgentKit.from({
    walletProvider,
    viemClient: walletClient,
  });

  // 5. Create the LangChain-compatible tools with your new ViemAgentKit
  const tools = createViemTools(viemKit);

  // 6. Prepare an in-memory checkpoint saver
  const memory = new MemorySaver();

  // 7. Additional configuration for the agent
  const config = { configurable: { thread_id: 'Hedera Agent Kit!' } };

  // 8. Create the React agent
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

  // Return the agent and any other config
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
