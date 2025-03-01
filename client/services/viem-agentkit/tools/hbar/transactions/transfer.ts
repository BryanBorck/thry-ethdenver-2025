import { createPublicClient, http, parseEther } from "viem";
import type {
  WalletClient as ViemWalletClient,
  PublicClient as ViemPublicClient,
  Address,
} from "viem";

export const transfer_hbar = async (
  client: ViemWalletClient,
  to?: `0x${string}`,
  amountHbar?: number
): Promise<string> => {
  if (!to || !amountHbar) {
    throw new Error("Recipient address and amount must be provided");
  }

  // Create a public client using the wallet client's chain and HTTP transport

  // Use the public client to get the balance for the provided address.
  // This returns a BigInt representing the balance in tinybars.

  const value = parseEther(amountHbar.toString());

  // @ts-ignore
  const hash = await client.sendTransaction({ to, value });

  console.log(`Transaction hash: ${hash}`);

  return "SUCCESS: Transaction hash: " + hash;
};
