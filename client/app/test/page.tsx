"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Address,
  custom,
  createWalletClient,
  createPublicClient,
  parseEther,
  http,
} from "viem";
import { useAccount } from "wagmi";
import { hederaTestnet } from "viem/chains";

export default function TestPage() {
  //   const [walletClient, setWalletClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<string>("");
  const [client, setClient] = useState<any>(null);
  const [hash, setHash] = useState<string>("");
  const { address } = useAccount();

  if (typeof window !== "undefined" && window.ethereum && !client) {
    const client = createWalletClient({
      chain: hederaTestnet,
      transport: custom(window.ethereum!),
    });

    console.log("@@@@@@@@", client);

    setClient(client);
  }

  //   const handleGetBalance = async () => {
  //     try {
  //       setIsLoading(true);

  //       //   if (!address) return;

  //       //   const balance = await publicClient.getBalance({
  //       //     address: address,
  //       //   });

  //       //   setBalance(balance.toString());

  //       //   toast.success(`Balance: ${balance.toString()}`);
  //     } catch (error) {
  //       console.error("Error:", error);
  //       toast.error("Something went wrong!");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  const handleSendTransaction = async () => {
    try {
      setIsLoading(true);

      if (!address) return;

      const hash = await client.sendTransaction({
        account: address,
        to: "0x3e2dd61ba5f7538168e23fb6224e7637f26b8086",
        // @ts-ignore
        value: 2000000000000000000n,
      });

      setHash(hash);

      toast.success(`Hash: ${hash}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Test Page</h1>
        {/* <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">
                Click the button to get the balance of the address
              </p>
              <p className="text-muted-foreground">Address: {address}</p>
              {balance && (
                <p className="text-muted-foreground">Balance: {balance}</p>
              )}
            </div>
            <Button
              onClick={handleGetBalance}
              disabled={isLoading}
              className="w-full hover:cursor-pointer"
            >
              {isLoading ? "Processing..." : "Get Balance"}
            </Button>
          </div>
        </div> */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">
                Click the button to send a transaction
              </p>
              <p className="text-muted-foreground">Address: {address}</p>
              {hash && <p className="text-muted-foreground">Hash: {hash}</p>}
            </div>
            <Button
              onClick={handleSendTransaction}
              disabled={isLoading}
              className="w-full hover:cursor-pointer"
            >
              {isLoading ? "Processing..." : "Send Transaction"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
