import { WalletClient as ViemWalletClient, parseUnits } from "viem";
import type { Address } from "viem";

// Example: Minimal ABI + bytecode from your compiled contract
import { ERC20_ABI } from "../utils/constants/erc20abi";
import { ERC20_BYTECODE } from "../utils/constants/erc20bytcode";

export interface CreateFungibleTokenProps {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: bigint; // or number, but typically Viem uses bigint
}

/**
 * Deploys a new fungible token (ERC-20 style).
 * @param walletClient A viem WalletClient with an account set (signer).
 * @param tokenProps { name, symbol, decimals, initialSupply }
 * @returns The newly deployed token's contract address.
 */
export async function createFT(
  client: ViemWalletClient,
  tokenProps: CreateFungibleTokenProps
): Promise<Address> {
  const { name, symbol, decimals, initialSupply } = tokenProps;
  // Deploy the contract

  // @ts-ignore
  const contractAddress = await client.deployContract({
    abi: ERC20_ABI,
    bytecode: ERC20_BYTECODE,
    args: [name, symbol, decimals, initialSupply],
  });

  console.log(`Deployed new token at address: ${contractAddress}`);
  return contractAddress;
}
