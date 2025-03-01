import HederaAgentKit from "../src/agent";
import { createHederaTools } from "../src";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import * as dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

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

export async function savePersistedData(data: Uint8Array) {
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


async function initializeAgent(hederaAccountId: string, hederaPrivateKey: string) {
  process.env.HEDERA_ACCOUNT_ID = hederaAccountId;
  process.env.HEDERA_PRIVATE_KEY = hederaPrivateKey;
  process.env.OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  process.env.HEDERA_NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";

  try {
    const llm = new ChatOpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
    });

    // Initialize HederaAgentKit
    const hederaKit = new HederaAgentKit(
      process.env.HEDERA_ACCOUNT_ID!,
      process.env.HEDERA_PRIVATE_KEY!,
      // Pass your network of choice. Default is "mainnet".
      // You can specify 'testnet', 'previewnet', or 'mainnet'.
      process.env.HEDERA_NETWORK as "mainnet" | "testnet" | "previewnet" || "testnet"
    );

    // Create the LangChain-compatible tools
    const tools = createHederaTools(hederaKit);

    // Prepare an in-memory checkpoint saver

    // Additional configuration for the agent
    const config = { configurable: { thread_id: "Hedera Agent Kit!" } };

    // Create the React agent
    const agent = createReactAgent({
      llm,
      tools,
      // You can adjust this message for your scenario:
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
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

async function runAutonomousMode(agent: any, config: any, interval = 10) {
  console.log("Starting autonomous mode...");

  while (true) {
    try {
      // The agent's "thought" is just a prompt you provide
      const thought =
        "Perform an interesting on-chain action on Hedera that showcases your capabilities.";

      // You can stream or await the entire call
      const stream = await agent.stream({ messages: [new HumanMessage(thought)] }, config);

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      // Sleep for `interval` seconds between each iteration
      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

async function runChatMode(agent: any, config: any, userPrompt: string, db: any) {
  const historyRows = loadMessages(db, config.configurable.thread_id);
  const history = historyRows.map(row =>
    row.type === 'user' ? new HumanMessage(row.content) : new AIMessage(row.content)
  );
  const userMessage = new HumanMessage(userPrompt);
  const messagesForStream = [...history, userMessage];
  const stream = await agent.stream({ messages: messagesForStream }, config);

  const responses: { type: string; message: string, tool_calls?: any[] }[] = [];
  let lastAgentResponse = null;
  for await (const chunk of stream) {
    if ("agent" in chunk) {
      const agentMsg = chunk.agent.messages[0];
      responses.push({
        type: "agent",
        message: agentMsg.content,
        tool_calls: agentMsg.tool_calls,
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


export async function runHederaAgentKit(options: {
  mode: "auto" | "chat";
  userPrompt?: string;
  hederaAccountId: string;
  hederaPrivateKey: string;
}) {
  try {
    const { mode, userPrompt = "", hederaAccountId, hederaPrivateKey } = options;
    console.log("Starting Agent...");
    const db = await initSqlJsDatabase();
    const { agent, config } = await initializeAgent(hederaAccountId, hederaPrivateKey);

    if (mode === "chat") {
      return await runChatMode(agent, config, userPrompt, db);
    } else {
      return await runChatMode(agent, config, userPrompt, db);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

