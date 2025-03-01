"use client";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { Send, Trash2, Mic, StopCircle } from "lucide-react";
import { Particles } from "@/components/magicui/particles";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import {
  executeAgentHandler,
  initSqlJsDatabase,
  loadMessages,
  savePersistedData,
  THREAD_ID,
} from "../../services/ViemAgentService";

interface ResponseItem {
  type: string;
  message: string;
  timestamp: number;
  tool_calls?: any[];
  // For forms
  formId?: string;
  formType?: "transferHBAR" | "createToken";
}

// We'll store form input values in a separate object keyed by formId
interface FormData {
  toAccountId?: string;
  amount?: string;
  name?: string;
  symbol?: string;
  decimals?: string;
  initialSupply?: string;
}

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const audioChunksRef = useRef<Blob[]>([]);

  // Decide if you want "chat" or "auto" mode:
  const mode = "chat"; // or "auto"

  // Holds input data for each form keyed by formId
  const [formsData, setFormsData] = useState<Record<string, FormData>>({});

  useEffect(() => {
    if (address) {
      async function init() {
        const db = await initSqlJsDatabase();
        const historyRows = loadMessages(db, THREAD_ID);
        const newResponses: ResponseItem[] = historyRows.map((row) => ({
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

  /**
   * Send a message to the agent (or the conversation).
   * If `overridePrompt` is given, we send that. Otherwise we send `prompt` state.
   */
  const handleSend = async (overridePrompt?: string, e?: React.FormEvent) => {
    e?.preventDefault();
    const messageText = overridePrompt !== undefined ? overridePrompt : prompt;
    if (!messageText.trim()) return;

    // Add user message to responses
    const userMessage: ResponseItem = {
      type: "user",
      message: messageText,
      timestamp: Date.now(),
    };
    setResponses((prev) => [...prev, userMessage]);

    // Clear input if using the prompt state and no override
    if (!overridePrompt) setPrompt("");

    setLoading(true);

    try {
      const result = await executeAgentHandler({
        mode,
        userPrompt: messageText,
        address: address as `0x${string}`,
      });

      // Each item from result is presumably an agent or tool response
      const timestampedResults: ResponseItem[] = result.map((res: any) => ({
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

  /**
   * Whisper voice-to-text transcription
   */
  const handleTranscribe = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );
    const data = await response.json();
    return data.text;
  };

  const handleRecord = async () => {
    if (!recording) {
      // Start recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Audio recording is not supported in your browser.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          try {
            setLoading(true);
            // Transcribe the audio
            const transcriptionText = await handleTranscribe(audioBlob);
            setRecording(false);
            // Immediately send the transcribed text
            await handleSend(transcriptionText);
          } catch (err) {
            console.error("Error during transcription:", err);
          } finally {
            setLoading(false);
            setRecording(false);
          }
        };
        recorder.start();
        setMediaRecorder(recorder);
        setRecording(true);
      } catch (err) {
        console.error("Error accessing microphone", err);
      }
    } else {
      // Stop recording
      mediaRecorder?.stop();
    }
  };

  /**
   * Insert an "agent" form message for "Transfer HBAR".
   * We'll store default form fields in formsData keyed by a unique formId.
   */
  const handleTransferHBAR = () => {
    const formId = `form-${Date.now()}`;
    setResponses((prev) => [
      ...prev,
      {
        type: "agent_form",
        message: "Please fill out the Transfer HBAR details below.",
        timestamp: Date.now(),
        formId,
        formType: "transferHBAR",
      },
    ]);
    setFormsData((prev) => ({
      ...prev,
      [formId]: {
        toAccountId: "",
        amount: "",
      },
    }));
  };

  /**
   * Insert an "agent" form message for "Create Token".
   */
  const handleCreateToken = () => {
    const formId = `form-${Date.now()}`;
    setResponses((prev) => [
      ...prev,
      {
        type: "agent_form",
        message: "Fill out the details to create a new token:",
        timestamp: Date.now(),
        formId,
        formType: "createToken",
      },
    ]);
    setFormsData((prev) => ({
      ...prev,
      [formId]: {
        name: "",
        symbol: "",
        decimals: "18",
        initialSupply: "100000",
      },
    }));
  };

  /**
   * Called when the user updates a form field. We store it in formsData state.
   */
  const handleFormChange = (formId: string, field: string, value: string) => {
    setFormsData((prev) => ({
      ...prev,
      [formId]: {
        ...prev[formId],
        [field]: value,
      },
    }));
  };

  /**
   * Called when the user clicks "Submit" on a form bubble.
   * We convert the form data to JSON and send it as a user message.
   */
  const handleFormSubmit = (formId: string) => {
    const data = formsData[formId];
    if (!data) return;

    // Convert the data into JSON
    const jsonString = JSON.stringify(data, null, 2);

    // Send as user message
    handleSend(jsonString);
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
      <div className="relative z-10 max-w-6xl mx-auto w-full h-[90vh] px-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 shadow-lg rounded-lg bg-background/30 backdrop-blur-[1px]">
          <div className="flex flex-col items-start justify-start">
            <div className="px-4 py-1">
              <AnimatedShinyText>
                <p className="text-xl font-bold">Hedera DeFi Agent</p>
              </AnimatedShinyText>
            </div>
            <div>
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
            responses.map((res, idx) => {
              // alignment
              const alignment = res.type === "user" ? "ml-auto" : "mr-auto";
              const baseContainer = `max-w-md transition-all duration-500 transform-gpu ${alignment}`;

              let bubbleContent: React.ReactElement | null = null;

              if (res.type === "user") {
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
                    <p className="text-right text-xs opacity-70 mt-1">
                      {formatTime(res.timestamp)}
                    </p>
                  </div>
                );
              } else if (res.type === "agent") {
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
                    <p className="text-right text-xs opacity-70 mt-1">
                      {formatTime(res.timestamp)}
                    </p>
                  </div>
                );
              } else if (res.type === "agent_form") {
                // A special bubble containing an embedded form
                // We'll look up the form data from formsData using res.formId
                const formId = res.formId!;
                const formType = res.formType!;
                const formData = formsData[formId] || {};

                bubbleContent = (
                  <div
                    className="max-w-md mr-auto bg-background/70 backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn"
                    style={{ animation: "fadeInUp 0.5s forwards" }}
                  >
                    <p>
                      <strong>Agent</strong>
                    </p>
                    <p className="mt-2 font-semibold">{res.message}</p>

                    {/* Render different fields for Transfer vs Create Token */}
                    {formType === "transferHBAR" && (
                      <div className="mt-4 space-y-2">
                        <div>
                          <label className="text-sm">
                            Destination Account ID
                          </label>
                          <input
                            type="text"
                            className="w-full p-1 border rounded text-sm"
                            placeholder="0x123..."
                            value={formData.toAccountId || ""}
                            onChange={(e) =>
                              handleFormChange(
                                formId,
                                "toAccountId",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm">Amount (HBAR)</label>
                          <input
                            type="number"
                            className="w-full p-1 border rounded text-sm"
                            placeholder="100"
                            value={formData.amount || ""}
                            onChange={(e) =>
                              handleFormChange(formId, "amount", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {formType === "createToken" && (
                      <div className="mt-4 space-y-2">
                        <div>
                          <label className="text-sm">Name</label>
                          <input
                            type="text"
                            className="w-full p-1 border rounded text-sm"
                            placeholder="My Token"
                            value={formData.name || ""}
                            onChange={(e) =>
                              handleFormChange(formId, "name", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm">Symbol</label>
                          <input
                            type="text"
                            className="w-full p-1 border rounded text-sm"
                            placeholder="MT"
                            value={formData.symbol || ""}
                            onChange={(e) =>
                              handleFormChange(formId, "symbol", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm">Decimals</label>
                          <input
                            type="number"
                            className="w-full p-1 border rounded text-sm"
                            placeholder="18"
                            value={formData.decimals || ""}
                            onChange={(e) =>
                              handleFormChange(
                                formId,
                                "decimals",
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="text-sm">Initial Supply</label>
                          <input
                            type="number"
                            className="w-full p-1 border rounded text-sm"
                            placeholder="100000"
                            value={formData.initialSupply || ""}
                            onChange={(e) =>
                              handleFormChange(
                                formId,
                                "initialSupply",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    )}

                    <button
                      className="mt-4 px-3 py-1 border rounded text-sm bg-[#ff2158] text-white hover:bg-[#f3063f]"
                      onClick={() => handleFormSubmit(formId)}
                    >
                      Submit
                    </button>

                    <p className="text-right text-xs opacity-70 mt-3">
                      {formatTime(res.timestamp)}
                    </p>
                  </div>
                );
              } else if (res.type === "tools") {
                let parsedMessage: any;
                try {
                  parsedMessage = JSON.parse(res.message);
                } catch (error) {
                  parsedMessage = res.message;
                }
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
                      {JSON.stringify(parsedMessage, null, 2)}
                    </pre>
                    <p className="text-right text-xs opacity-70 mt-1">
                      {formatTime(res.timestamp)}
                    </p>
                  </div>
                );
              } else if (res.type === "agent" && res.tool_calls) {
                // If there's a message with tool calls
                // (you might separate logic for agent + tool calls, or unify them)
                bubbleContent = (
                  <div
                    className="max-w-md mr-auto bg-indigo-100/70 backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn"
                    style={{ animation: "fadeInUp 0.5s forwards" }}
                  >
                    {Object.entries(res.tool_calls).map(
                      ([key, tool_call], index) => (
                        <div key={index} className="mb-2">
                          <p>
                            <strong>Agent</strong> (tool call made)
                          </p>
                          {res.message && (
                            <>
                              <div className="mt-2" />
                              <p>{res.message}</p>
                            </>
                          )}
                          <div className="mt-2" />
                          <p>
                            Tool Name:{" "}
                            <span className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                              {tool_call.name}
                            </span>
                          </p>
                          <div className="mt-2" />
                          <p>Tool Args:</p>
                          <div className="mt-1" />
                          <pre className="bg-gray-50 p-2 rounded text-sm whitespace-pre-wrap">
                            {(() => {
                              let args = tool_call.args;
                              try {
                                if (typeof args === "string") {
                                  args = JSON.parse(args);
                                }
                              } catch (e) {
                                // ignore
                              }
                              if (args && typeof args.input === "string") {
                                try {
                                  args.input = JSON.parse(args.input);
                                } catch (e) {
                                  // ignore
                                }
                              }
                              return JSON.stringify(args, null, 2);
                            })()}
                          </pre>
                        </div>
                      )
                    )}
                    <p className="text-right text-xs opacity-70 mt-1">
                      {formatTime(res.timestamp)}
                    </p>
                  </div>
                );
              } else if (res.type === "error") {
                bubbleContent = (
                  <div
                    className="max-w-md mr-auto bg-red-100/70 backdrop-blur-[2px] shadow-xl py-3 px-6 rounded-sm animate-fadeIn"
                    style={{ animation: "fadeInUp 0.5s forwards" }}
                  >
                    <p>{res.message}</p>
                    <p className="text-right text-xs opacity-70 mt-1">
                      {formatTime(res.timestamp)}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={baseContainer}
                  style={{ animation: "fadeIn 0.4s ease-in-out" }}
                >
                  {bubbleContent}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-4 rounded-md shadow mb-4">
          <p className="mb-2 font-semibold">Quick Actions</p>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border border-[#ff2158] text-[#ff2158] rounded text-sm hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-500"
              onClick={handleTransferHBAR}
            >
              Transfer HBAR
            </button>
            <button
              className="px-3 py-1 border border-[#ff2158] text-[#ff2158] rounded text-sm hover:cursor-pointer hover:scale-105 transition-all ease-in-out duration-500"
              onClick={handleCreateToken}
            >
              Create Token
            </button>
            <button className="px-3 py-1 border border-[#ff2158] text-[#ff2158] rounded hover:cursor-pointer text-sm hover:scale-105 transition-all ease-in-out duration-500">
              DeFi Portfolio Research
            </button>
          </div>
        </div>

        {/* Input bar for normal messages */}
        <form
          onSubmit={(e) => handleSend(undefined, e)}
          className="px-4 py-2 border rounded-lg flex space-x-4 bg-white"
        >
          <button
            type="button"
            onClick={handleRecord}
            // Only disable if loading and not currently recording
            disabled={loading && !recording}
            className="p-2 border border-[#ff2158] text-[#ff2158] rounded-md aspect-square hover:text-primary hover:border-primary hover:bg-gray-100 transition-all ease-in-out duration-500 cursor-pointer"
          >
            {recording ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>

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
            className="p-2 border border-[#ff2158] text-[#ff2158] rounded-md aspect-square hover:text-primary hover:border-primary hover:bg-gray-100 transition-all ease-in-out duration-500 disabled:opacity-50"
            disabled={loading || !prompt.trim()}
          >
            <Send size={24} />
          </button>
        </form>
      </div>
    </div>
  );
}
