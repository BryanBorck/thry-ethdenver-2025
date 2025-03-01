import { createPublicClient, http } from "viem";
import type {
  WalletClient as ViemWalletClient,
  PublicClient as ViemPublicClient,
  Address,
} from "viem";

export const get_evm_address = async (
  client: ViemWalletClient
): Promise<Address> => {
  // Use the public client to get the balance for the provided address.
  // This returns a BigInt representing the balance in tinybars.
  const address = await client.account?.address;

  if (!address) {
    throw new Error("No addresses found");
  }

  return address;
};
