import { WalletClient as ViemWalletClient, parseUnits } from "viem";
import type { Address } from "viem";

// Example: Minimal ABI + bytecode from your compiled contract
import { ERC20_ABI } from "../utils/constants/erc20abi";
import { erc20Bytecode } from "../utils/constants/erc20bytecode";

interface CreateFungibleTokenProps {
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
  walletClient: ViemWalletClient,
  tokenProps: CreateFungibleTokenProps
): Promise<Address> {
  const { name, symbol, decimals, initialSupply } = tokenProps;

  // Deploy the contract
  const { contractAddress } = await walletClient.deployContract({
    abi: ERC20_ABI,
    bytecode: ERC20_BYTECODE,
    // The "account" is your signer. Some setups might let you set a default account
    // on the walletClient. If not, specify it here:
    //   account: "0x...",
    args: [name, symbol, decimals, initialSupply],
  });

  console.log(`Deployed new token at address: ${contractAddress}`);
  return contractAddress;
}
