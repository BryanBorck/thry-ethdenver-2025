"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { Send } from "lucide-react";
import { Particles } from "@/components/magicui/particles";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { executeAgentHandler } from "../../services/ViemAgentService";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<
    { type: string; message: string; timestamp: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Decide if you want "chat" or "auto" mode:
  const mode = "chat"; // or "auto"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    // Add user message to responses
    const userMessage = {
      type: "user",
      message: prompt,
      timestamp: Date.now(),
    };
    setResponses((prev) => [...prev, userMessage]);

    const currentPrompt = prompt;
    setPrompt("");
    setLoading(true);

    console.log("@@@@@@@@", responses);

    try {
      const result = await executeAgentHandler({
        mode,
        userPrompt: currentPrompt,
        address: address as `0x${string}`,
      });

      // Add timestamps to the responses
      const timestampedResults = result.map((res: any) => ({
        ...res,
        timestamp: Date.now(),
      }));

      setResponses((prev) => [...prev, ...timestampedResults]);
    } catch (err: any) {
      console.error("Error executing agent:", err);
      setResponses((prev) => [
        ...prev,
        {
          type: "error",
          message: String(err?.message || err),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative h-screen pt-24 w-full">
      {/* Particles background */}
      <Particles
        className="absolute inset-0 z-0 pointer-events-none w-full"
        quantity={150}
        ease={80}
        size={0.6}
        color={"#4169e1"}
        refresh
      />

      {/* Main container */}
      <div className="relative z-10 bg-transparent bg-blue-100 max-w-6xl mx-auto w-full h-[80vh] px-4 flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-start justify-start p-4 shadow-lg rounded-lg flex bg-background/30 backdrop-blur-sm items-center justify-between">
          <div className="flex flex-col items-start justify-start px-4 py-1">
            <AnimatedShinyText>
              <p className="text-xl font-bold">Hedera Chat</p>
            </AnimatedShinyText>
          </div>
          <div className="flex flex-col items-start justify-start">
            <p className="text-xs text-muted-foreground truncate px-4">
              {address ? `${address}` : "Not connected"}
            </p>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-4">
          {responses.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                Start a conversation by sending a message below.
              </p>
            </div>
          ) : (
            responses.map((res, idx) => (
              <div
                key={idx}
                className={`max-w-md transition-all duration-500 transform-gpu ${
                  res.type === "user" ? "ml-auto" : "mr-auto"
                }`}
                style={{ animation: "fadeIn 0.4s ease-in-out" }}
              >
                <div
                  className={`max-w-md ${
                    res.type === "user"
                      ? "ml-auto bg-gray-200/70"
                      : res.type === "error"
                      ? "mr-auto bg-red-100/70"
                      : "mr-auto bg-background/70"
                  } backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn`}
                  style={{ animation: "fadeInUp 0.5s forwards" }}
                >
                  <p>{res.message}</p>
                  <p className="text-right text-xs opacity-70 mt-1">
                    {formatTime(res.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex flex-col items-start justify-start">
              <AnimatedShinyText className="py-1 transition ease-out hover:text-neutral-700 hover:duration-500">
                <span className="text-gray-400 font-light">Thinking...</span>
              </AnimatedShinyText>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSend}
          className="p-4 border rounded-lg flex space-x-4 bg-white"
        >
          <input
            type="text"
            className="flex-1 outline-none"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button
            type="submit"
            className="p-2 border border-gray-400 text-gray-400 rounded-md aspect-square hover:text-primary hover:border-primary hover:bg-gray-100 transition-all ease-in-out duration-500 disabled:opacity-50"
            disabled={loading || !prompt.trim()}
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
