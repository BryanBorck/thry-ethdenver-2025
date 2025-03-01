import { createPublicClient, http } from 'viem';
import type {
  WalletClient as ViemWalletClient,
  PublicClient as ViemPublicClient,
  Address,
} from 'viem';

export const get_hbar_balance = async (
  client: ViemWalletClient,
  address: Address,
): Promise<number> => {
  if (!address) {
    throw new Error('Address must be provided');
  }

  // Create a public client using the wallet client's chain and HTTP transport
  const publicClient: ViemPublicClient = createPublicClient({
    chain: client.chain,
    transport: http(),
  });

  // Use the public client to get the balance for the provided address.
  // This returns a BigInt representing the balance in tinybars.
  const balanceBigInt: bigint = await publicClient.getBalance({ address });

  // Convert the balance from tinybars to HBAR (assuming 1 HBAR = 100,000,000 tinybars)
  const balance = Number(balanceBigInt) / 1e8;

  return balance;
};
