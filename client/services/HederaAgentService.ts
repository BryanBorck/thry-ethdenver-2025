"use client";


import { type Address } from "viem";
import { runHederaAgentKit } from "./hedera-agentkit/tests";
// import { privateKeyToAccount } from "viem/accounts";


export async function executeAgentHandler(options: {
  mode: "auto" | "chat";
  userPrompt?: string;
  hederaAccountId: string;
  hederaPrivateKey: string;
}) {
  return runHederaAgentKit(options);
}