// hederaAgentClient.ts

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
// import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { createWalletClient, http, type Address } from "viem";
import { hederaTestnet } from "viem/chains";
// import { privateKeyToAccount } from "viem/accounts";

import { ViemAgentKit } from "./viem-agentkit/agent";
import { createViemTools } from "./viem-agentkit/langchain";
import { ViemWalletProvider } from "./viem-agentkit/wallet-providers/viemWalletProvider";
import { ViemWalletProviderGasConfig } from "./viem-agentkit/wallet-providers/viemWalletProvider";

// --------------------------------------
// 1) Initialize Agent
// --------------------------------------
async function initializeAgent(address: Address) {
  process.env.OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  // 1. Create your LLM
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.7,
  });

  const walletClient = await createWalletClient({
    account: address,
    chain: hederaTestnet,
    transport: http("https://testnet.hashio.io/api"),
  });

  console.log("@@@@@@@@", walletClient);

  // Optional: supply gas config for multipliers
  const gasConfig: ViemWalletProviderGasConfig = {
    gasLimitMultiplier: 1.2,
    feePerGasMultiplier: 1.1,
  };

  // 3. Create the ViemWalletProvider
  const walletProvider = new ViemWalletProvider(walletClient, gasConfig);

  // 4. Initialize the new ViemAgentKit
  const viemKit = await ViemAgentKit.from({
    walletProvider,
    viemClient: walletClient,
  });

  // 5. Create the LangChain-compatible tools
  const tools = createViemTools(viemKit);

  // 6. Prepare an in-memory checkpoint saver
  // const memory = new MemorySaver();

  // 7. Additional configuration for the agent
  const config = { configurable: { thread_id: "Hedera Agent Kit!" } };

  // 8. Create the React agent
  const agent = createReactAgent({
    llm,
    tools,
    // checkpointSaver: memory,
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

// --------------------------------------
// 2) "autonomous" demonstration
// --------------------------------------
async function runAutonomousMode(agent: any, config: any) {
  const thought =
    "Perform an interesting on-chain action on Hedera that showcases your capabilities.";
  const stream = await agent.stream(
    { messages: [new HumanMessage(thought)] },
    config
  );

  const responses: { type: string; message: string }[] = [];
  for await (const chunk of stream) {
    if ("agent" in chunk) {
      responses.push({
        type: "agent",
        message: chunk.agent.messages[0].content,
      });
    } else if ("tools" in chunk) {
      responses.push({
        type: "tools",
        message: chunk.tools.messages[0].content,
      });
    }
  }

  return responses;
}

// --------------------------------------
// 3) Chat mode for a single user prompt
// --------------------------------------
async function runChatMode(agent: any, config: any, userPrompt: string) {
  const stream = await agent.stream(
    { messages: [new HumanMessage(userPrompt)] },
    config
  );

  const responses: { type: string; message: string }[] = [];
  for await (const chunk of stream) {
    if ("agent" in chunk) {
      responses.push({
        type: "agent",
        message: chunk.agent.messages[0].content,
      });
    } else if ("tools" in chunk) {
      responses.push({
        type: "tools",
        message: chunk.tools.messages[0].content,
      });
    }
  }

  return responses;
}

// --------------------------------------
// 4) Export a single "execute" handler
// --------------------------------------
export async function executeAgentHandler(options: {
  mode: "auto" | "chat";
  userPrompt?: string;
  address: Address;
}) {
  try {
    const { mode, userPrompt = "", address = "" } = options;
    // Initialize the agent
    const { agent, config } = await initializeAgent(address as `0x${string}`);

    if (mode === "auto") {
      return await runAutonomousMode(agent, config);
    } else {
      // default to "chat" mode
      return await runChatMode(agent, config, userPrompt);
    }
  } catch (error: any) {
    console.error("Error in executeAgentHandler:", error?.message || error);
    throw error;
  }
}
