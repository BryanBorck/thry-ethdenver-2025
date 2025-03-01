"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { Send } from "lucide-react";
import { Particles } from "@/components/magicui/particles";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { executeAgentHandler } from "../../services/HederaAgentService";
import {
  initSqlJsDatabase,
  loadMessages,
} from "../../services/hedera-agentkit/tests";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChatPage() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<
    { type: string; message: string; timestamp: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { address } = useAccount();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hederaAccountId, setHederaAccountId] = useState("");
  const [hederaPrivateKey, setHederaPrivateKey] = useState("");
  const [tempHederaAccountId, setTempHederaAccountId] = useState("");
  const [tempHederaPrivateKey, setTempHederaPrivateKey] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Decide if you want "chat" or "auto" mode:
  const mode = "chat"; // or "auto"

  // Check if credentials are missing and open dialog
  useEffect(() => {
    if (!hederaAccountId || !hederaPrivateKey) {
      setDialogOpen(true);
    } else {
      setDialogOpen(false);
    }
  }, [hederaAccountId, hederaPrivateKey]);

  // Modal submission handler
  const handleModalSubmit = () => {
    if (tempHederaAccountId.trim() && tempHederaPrivateKey.trim()) {
      setHederaAccountId(tempHederaAccountId);
      setHederaPrivateKey(tempHederaPrivateKey);
      setDialogOpen(false);
    } else {
      alert("Both fields are required!");
    }
  };

  useEffect(() => {
    async function init() {
      const db = await initSqlJsDatabase();
      const historyRows = loadMessages(db, "Hedera Agent Kit!");
      const newResponses = historyRows.map((row) => ({
        type: row.type === "user" ? "user" : "agent",
        message: row.content,
        timestamp: row.timestamp,
      }));
      setResponses(newResponses);
    }
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []); // Removed unnecessary dependency: responses

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
        hederaAccountId,
        hederaPrivateKey,
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
    <>
      {/* Credentials Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Hedera Credentials</DialogTitle>
            <DialogDescription>
              Please provide your Hedera account ID and private key to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountId" className="text-right">
                Account ID
              </Label>
              <Input
                id="accountId"
                type="text"
                placeholder="0.0.12345"
                value={tempHederaAccountId}
                onChange={(e: any) => setTempHederaAccountId(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="privateKey" className="text-right">
                Private Key
              </Label>
              <Input
                id="privateKey"
                type="password"
                placeholder="Your private key"
                value={tempHederaPrivateKey}
                onChange={(e) => setTempHederaPrivateKey(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleModalSubmit}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main page content – optionally disabled with pointer-events if modal is active */}
      <div
        className={`relative h-screen pt-14 w-full ${
          dialogOpen ? "pointer-events-none opacity-50" : ""
        }`}
      >
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
          <div className="flex flex-col border border-[#ff2158] items-start justify-start p-4 shadow-lg rounded-lg flex bg-background/30 backdrop-blur-[1px] items-center justify-between">
            <div className="flex flex-col items-start justify-start px-4 py-1">
              <AnimatedShinyText>
                <p className="text-xl font-bold">HederaKit Agent</p>
              </AnimatedShinyText>
            </div>
            <div className="flex flex-col items-start justify-start">
              <p className="text-xs text-[#ff2158] truncate px-4">
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
                        ? "ml-auto bg-gray-100/70"
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
            className="px-4 py-2 border border-[#ff2158] rounded-lg flex space-x-4 bg-white"
          >
            <Input
              type="text"
              className="flex-1"
              value={prompt}
              onChange={(e: any) => setPrompt(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <Button
              type="submit"
              variant="outline"
              className="p-2 border border-[#ff2158] text-[#ff2158] rounded-md aspect-square hover:text-primary hover:border-primary hover:bg-gray-100 transition-all ease-in-out duration-500 disabled:opacity-50"
              disabled={loading || !prompt.trim()}
            >
              <Send size={24} />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
