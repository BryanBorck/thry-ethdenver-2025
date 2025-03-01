import { Chain, mainnet, sepolia, hederaTestnet } from 'viem/chains';
import * as chains from 'viem/chains';

/**
 * Maps EVM chain IDs to Coinbase network IDs
 */
export const CHAIN_ID_TO_NETWORK_ID: Record<number, string> = {
  1: 'ethereum-mainnet',
  11155111: 'ethereum-sepolia',
  296: 'hedera-testnet',
};

/**
 * Maps Coinbase network IDs to EVM chain IDs
 */
export const NETWORK_ID_TO_CHAIN_ID: Record<string, string> = Object.entries(
  CHAIN_ID_TO_NETWORK_ID,
).reduce((acc, [chainId, networkId]) => {
  acc[networkId] = String(chainId);
  return acc;
}, {} as Record<string, string>);

/**
 * Maps Coinbase network IDs to Viem chain objects
 */
export const NETWORK_ID_TO_VIEM_CHAIN: Record<string, Chain> = {
  'ethereum-mainnet': mainnet,
  'ethereum-sepolia': sepolia,
  'hedera-testnet': hederaTestnet,
};

/**
 * Get a chain from the viem chains object
 *
 * @param id - The chain ID
 * @returns The chain
 */
export const getChain = (id: string): Chain => {
  const chainList = Object.values(chains);
  return chainList.find((chain) => chain.id === parseInt(id)) as Chain;
};
