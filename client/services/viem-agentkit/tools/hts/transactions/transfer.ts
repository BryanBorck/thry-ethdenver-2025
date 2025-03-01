import { createPublicClient, http, parseEther } from "viem";
import type {
  WalletClient as ViemWalletClient,
  PublicClient as ViemPublicClient,
  Address,
} from "viem";
import { ERC20_ABI } from "../../../utils/constants/erc20abi";

export const transfer_token = async (
  client: ViemWalletClient,
  tokenAddress: Address,
  to?: `0x${string}`,
  amount?: number
): Promise<string> => {
  if (!to || !amount || !tokenAddress) {
    throw new Error("Recipient address, token ID, and amount must be provided");
  }

  // Create a public client using the wallet client's chain and HTTP transport

  // Use the public client to get the balance for the provided address.
  // This returns a BigInt representing the balance in tinybars.

  const value = parseEther(amount.toString());

  // @ts-ignore
  const hash = await client.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, value],
  })

  return "SUCCESS: Transaction hash: " + hash;
};
