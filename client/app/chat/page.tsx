"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { Send, Trash2 } from "lucide-react";
import { Particles } from "@/components/magicui/particles";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { executeAgentHandler, initSqlJsDatabase, loadMessages, savePersistedData, THREAD_ID } from "../../services/ViemAgentService";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<
    { type: string; message: string; timestamp: number; tool_calls?: any[] }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Decide if you want "chat" or "auto" mode:
  const mode = "chat"; // or "auto"

  useEffect(() => {
    if (address) {
      async function init() {
        const db = await initSqlJsDatabase();
        const historyRows = loadMessages(db, THREAD_ID);
        const newResponses = historyRows.map((row) => ({
          type: row.type === "user" ? "user" : "agent",
          message: row.content,
          timestamp: row.timestamp,
        }));
        setResponses(newResponses);
      }
      init();
    }
  }, [address]);

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
    <div className="relative h-screen pt-14 w-full">
      {/* Particles background */}
      <Particles
        className="absolute inset-0 z-0 pointer-events-none w-full"
        quantity={150}
        ease={80}
        size={0.6}
        color={"#ff2158"}
        refresh
      />

      {/* Main container */}
      <div className="relative z-10 bg-transparent bg-blue-100 max-w-6xl mx-auto w-full h-[90vh] px-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between  p-4 shadow-lg rounded-lg flex bg-background/30 backdrop-blur-[1px] items-center justify-between">
          <div className="flex flex-col items-start justify-start">
            <div className="flex flex-col items-start justify-start px-4 py-1">
              <AnimatedShinyText>
                <p className="text-xl font-bold">Hedera DeFi Agent</p>
              </AnimatedShinyText>
            </div>
            <div className="flex flex-col items-start justify-start">
              <p className="text-xs text-[#ff2158] truncate px-4">
                {address ? `${address}` : "Not connected"}
              </p>
            </div>
          </div>
          {address && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const db = await initSqlJsDatabase();
                  const stmt = db.prepare(
                    "DELETE FROM messages WHERE thread_id = :threadId;"
                  );
                  stmt.bind({ ":threadId": THREAD_ID });
                  stmt.step();
                  stmt.free();
                  await savePersistedData(new Uint8Array(db.export()));
                  setResponses([]);
                } catch (error) {
                  console.error("Error clearing chat:", error);
                }
              }}
              className="p-2 border border-[#ff2158] text-[#ff2158] rounded-md aspect-square hover:text-primary hover:border-primary hover:bg-gray-100 transition-all ease-in-out duration-500 cursor-pointer"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div >

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-4">
          {responses.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                Start a conversation by sending a message below.
              </p>
            </div>
          ) : (
            responses.map((res, idx) => {
              // Set the alignment based on whether it's a user message or not.
              const alignment = res.type === "user" ? "ml-auto" : "mr-auto";
              // Base container for the bubble
              const baseContainer = `max-w-md transition-all duration-500 transform-gpu ${alignment}`;
              let bubbleContent = null;

              if (res.type === "user") {
                // User messages keep the same styling.
                bubbleContent = (
                  <div
                    className="max-w-md ml-auto bg-gray-100/70 backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn"
                    style={{ animation: "fadeInUp 0.5s forwards" }}
                  >
                    <p>
                      <strong>User</strong>
                    </p>
                    <div className="mt-2" />
                    <p>{res.message}</p>
                    <p className="text-right text-xs opacity-70 mt-1">{formatTime(res.timestamp)}</p>
                  </div>
                );
              } else if (res.type === "agent") {
                // For agent type, render message if it exists...
                if (res.message) {
                  bubbleContent = (

                    <div
                      className="max-w-md mr-auto bg-background/70 backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn"
                      style={{ animation: "fadeInUp 0.5s forwards" }}
                    >
                      <p>
                        <strong>Agent</strong>
                      </p>
                      <div className="mt-2" />
                      <p>{res.message}</p>
                      <p className="text-right text-xs opacity-70 mt-1">{formatTime(res.timestamp)}</p>
                    </div>
                  );
                }
                // ...otherwise check for tool_calls.
                else if (res.tool_calls) {
                  bubbleContent = (
                    <div
                      className="max-w-md mr-auto bg-indigo-100/70 backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn"
                      style={{ animation: "fadeInUp 0.5s forwards" }}
                    >
                      {Object.entries(res.tool_calls).map(([key, tool_call], index) => (
                        <div key={index} className="mb-2">
                          <p>
                            <strong>Agent</strong> (a tool call was made)
                          </p>
                          {res.message && (
                            <>
                              <div className="mt-2" />
                              <p>{res.message}</p>
                            </>
                          )}
                          <div className="mt-2" />
                          <p>
                            Tool Name: <span className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">{tool_call.name}</span>
                          </p>
                          <div className="mt-2" />
                          <p>
                            Tool Args:
                          </p>
                          <div className="mt-1" />
                          <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                            {(() => {
                              let args = tool_call.args;
                              try {
                                if (typeof args === "string") {
                                  args = JSON.parse(args);
                                }
                              } catch (e) {
                                // Parsing failed; keep args as is.
                              }
                              if (args && typeof args.input === "string") {
                                try {
                                  args.input = JSON.parse(args.input);
                                } catch (e) {
                                  // Parsing failed; leave input as-is.
                                }
                              }
                              return JSON.stringify(args, null, 2);
                            })()}
                          </pre>
                        </div>
                      ))}
                      <p className="text-right text-xs opacity-70 mt-1">{formatTime(res.timestamp)}</p>
                    </div>
                  );
                }
              } else if (res.type === "tools") {
                let parsedMessage;
                try {
                  parsedMessage = JSON.parse(res.message);
                } catch (error) {
                  // Fallback if JSON parsing fails
                  parsedMessage = res.message;
                }

                // Choose background based on status.
                const bgClass =
                  parsedMessage.status === "error"
                    ? "bg-red-100/70"
                    : parsedMessage.status === "success"
                      ? "bg-green-100/70"
                      : "bg-gray-100/70";

                bubbleContent = (
                  <div
                    className={`max-w-md mr-auto ${bgClass} backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn`}
                    style={{ animation: "fadeInUp 0.5s forwards" }}
                  >
                    <p>
                      <strong>Tool</strong>
                    </p>
                    <div className="mt-2" />
                    <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                      {(() => {
                        return JSON.stringify(parsedMessage, null, 2);
                      })()}
                    </pre>
                    <p className="text-right text-xs opacity-70 mt-1">
                      {formatTime(res.timestamp)}
                    </p>
                  </div>
                )
              } else if (res.type === "error") {
                // Fallback for any error type.
                bubbleContent = (
                  <div
                    className="max-w-md mr-auto bg-red-100/70 backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn"
                    style={{ animation: "fadeInUp 0.5s forwards" }}
                  >
                    <p>{res.message}</p>
                    <p className="text-right text-xs opacity-70 mt-1">{formatTime(res.timestamp)}</p>
                  </div>
                );
              }

              return (
                <div key={idx} className={baseContainer} style={{ animation: "fadeIn 0.4s ease-in-out" }}>
                  {bubbleContent}
                </div>
              );
            })
          )}
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSend}
          className="px-4 py-2 border rounded-lg flex space-x-4 bg-white"
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
            className="p-2 border border-[#ff2158] text-[#ff2158] rounded-md aspect-square hover:text-primary hover:border-primary hover:bg-gray-100 transition-all ease-in-out duration-500 disabled:opacity-50 cursor-pointer"
            disabled={loading || !prompt.trim()}
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
