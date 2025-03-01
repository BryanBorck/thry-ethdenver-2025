// hederaAgentClient.ts

"use client";

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { createWalletClient, http, type Address, custom } from "viem";
import { hederaTestnet } from "viem/chains";
// import { privateKeyToAccount } from "viem/accounts";

import { ViemAgentKit } from "./viem-agentkit/agent";
import { createViemTools } from "./viem-agentkit/langchain";
import { ViemWalletProvider } from "./viem-agentkit/wallet-providers/viemWalletProvider";
import { ViemWalletProviderGasConfig } from "./viem-agentkit/wallet-providers/viemWalletProvider";


// --------------------------------------
// 0) Initialize SQL.js database
// --------------------------------------
function openIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sqljs-store", 1);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("db")) {
        db.createObjectStore("db");
      }
    };
    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBRequest).result;
      resolve(db);
    };
    request.onerror = (event: Event) => {
      const target = event.target as IDBRequest;
      reject(target.error);
    };
  });
}

async function loadPersistedData() {
  const idb: any = await openIDB();
  return new Promise((resolve, reject) => {
    const transaction = idb.transaction("db", "readonly");
    const store = transaction.objectStore("db");
    const request = store.get("sqljs-db");
    request.onsuccess = (event: Event) => {
      const result = (event.target as IDBRequest).result;
      resolve(result ? new Uint8Array(result) : null);
    };
    request.onerror = (event: { target: { error: any; }; }) => {
      reject(event.target.error);
    };
  });
}

async function savePersistedData(data: Uint8Array) {
  const idb: any = await openIDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = idb.transaction("db", "readwrite");
    const store = transaction.objectStore("db");
    const request = store.put(data.buffer, "sqljs-db");
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = (event: { target: { error: any; }; }) => {
      reject(event.target.error);
    };
  });
}

export async function initSqlJsDatabase() {
  if (typeof window === "undefined") {
    throw new Error("SQL.js can only be used in the browser");
  }
  const initSqlJsModule = await import("sql.js");
  const SQL = await initSqlJsModule.default({
    locateFile: (file: string) => `/sql-wasm.wasm`,
  });
  let db;
  const persistedData: any = await loadPersistedData();
  if (persistedData) {
    db = new SQL.Database(new Uint8Array(persistedData));
  } else {
    db = new SQL.Database();
  }
  db.run(
    "CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id TEXT, type TEXT, content TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);"
  );
  return db;
}

export function loadMessages(db: any, threadId: string) {
  const stmt = db.prepare("SELECT type, content, timestamp FROM messages WHERE thread_id = :threadId ORDER BY id ASC;");
  stmt.bind({ ':threadId': threadId });
  const messages = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    messages.push(row);
  }
  stmt.free();
  return messages;
}

function saveMessage(db: any, threadId: string, type: string, content: string) {
  const timestamp = new Date().toISOString();
  const stmt = db.prepare("INSERT INTO messages (thread_id, type, content, timestamp) VALUES (:threadId, :type, :content, :timestamp);");
  stmt.bind({ ':threadId': threadId, ':type': type, ':content': content, ':timestamp': timestamp });
  stmt.step();
  stmt.free();
}


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

  const walletClient = createWalletClient({
    account: address,
    chain: hederaTestnet,
    transport: custom({
      ...window.ethereum,
      request: window.ethereum?.request ?? (() => Promise.reject("No request method available")),
    }),
  });


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
async function runChatMode(agent: any, config: any, userPrompt: string, db: any) {
  const historyRows = loadMessages(db, config.configurable.thread_id);
  const history = historyRows.map(row =>
    row.type === 'user' ? new HumanMessage(row.content) : new AIMessage(row.content)
  );
  const userMessage = new HumanMessage(userPrompt);
  const messagesForStream = [...history, userMessage];
  const stream = await agent.stream({ messages: messagesForStream }, config);

  const responses: { type: string; message: string }[] = [];
  let lastAgentResponse = null;
  for await (const chunk of stream) {
    if ("agent" in chunk) {
      const agentMsg = chunk.agent.messages[0];
      responses.push({
        type: "agent",
        message: agentMsg.content,
      });
      lastAgentResponse = agentMsg.content;
    } else if ("tools" in chunk) {
      responses.push({
        type: "tools",
        message: chunk.tools.messages[0].content,
      });
    }
  }

  saveMessage(db, config.configurable.thread_id, 'user', userPrompt);
  if (lastAgentResponse) {
    saveMessage(db, config.configurable.thread_id, 'agent', lastAgentResponse);
  }
  const binaryData = db.export();
  await savePersistedData(binaryData);

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
    const db = await initSqlJsDatabase();
    const { agent, config } = await initializeAgent(address as `0x${string}`);

    if (mode === "auto") {
      return await runAutonomousMode(agent, config);
    } else {
      // default to "chat" mode
      return await runChatMode(agent, config, userPrompt, db);
    }
  } catch (error: any) {
    console.error("Error in executeAgentHandler:", error?.message || error);
    throw error;
  }
}
