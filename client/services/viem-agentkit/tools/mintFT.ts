import { WalletClient as ViemWalletClient, parseEther, parseUnits } from "viem";
import type { Address } from "viem";

// Example: Minimal ABI + bytecode from your compiled contract
import { ERC20_ABI } from "../utils/constants/erc20abi";

/**
 * Deploys a new fungible token (ERC-20 style).
 * @param walletClient A viem WalletClient with an account set (signer).
 * @param tokenProps { name, symbol, decimals, initialSupply }
 * @param recipient The address to mint the tokens to.
 * @returns The newly deployed token's contract address.
 */
export async function mintFT(
  client: ViemWalletClient,
  tokenAddress: Address,
  amount: number,
  recipient: Address
): Promise<Address> {
  // Deploy the contract

  const value = parseEther(amount.toString());

  // @ts-ignore
  const txHash = await client.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "mint",
    args: [recipient, value],
  });

  console.log(`Mint transaction sent: ${txHash}`);
  return txHash;
}
