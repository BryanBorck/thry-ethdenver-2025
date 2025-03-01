"use client";
// /app/chat/page.tsx

import React, { useEffect, useState } from "react";
import { executeAgentHandler } from "../../services/ViemAgentService";
import { createWalletClient, custom, http } from "viem";
import { hederaTestnet } from "viem/chains";
import { useAccount } from "wagmi";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<
    { type: string; message: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  //   const [walletClient, setWalletClient] = useState<any>(null);
  const { address } = useAccount();

  //   setClient(walletClient);

  // Decide if you want "chat" or "auto" mode:
  const mode = "chat"; // or "auto"

  const handleSend = async () => {
    setLoading(true);
    setResponses([]);
    try {
      const result = await executeAgentHandler({
        mode,
        userPrompt: prompt,
        address: address as `0x${string}`,
      });
      setResponses(result);
    } catch (err: any) {
      console.error("Error executing agent:", err);
      setResponses([{ type: "error", message: String(err?.message || err) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: "1rem" }}>
      <h2>Hedera Chat</h2>
      <p>Address: {address}</p>
      <div style={{ marginTop: "1rem" }}>
        <label>Prompt: </label>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: "360px" }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{ marginLeft: "8px" }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Response</h3>
        {responses.map((res, idx) => (
          <div key={idx} style={{ margin: "0.5rem 0" }}>
            <strong>{res.type.toUpperCase()}:</strong> {res.message}
          </div>
        ))}
      </div>
    </div>
  );
}
