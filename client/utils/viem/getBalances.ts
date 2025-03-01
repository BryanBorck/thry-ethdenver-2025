// lib/getBalances.ts
import { getContract } from "viem";
import { ERC20_ABI } from "@/services/viem-agentkit/utils/constants/erc20abi";
import { createPublicClient, http } from "viem";
import { hederaTestnet } from "viem/chains";

interface TokenInfo {
  address: `0x${string}`; // EVM address on Hedera
  symbol: string;
  name: string;
  color: string;
}

export const publicClient = createPublicClient({
  chain: hederaTestnet,
  transport: http(),
});

export async function fetchTokenBalances(
  accountAddress: `0x${string}`,
  tokens: TokenInfo[]
) {
  const balances = await Promise.all(
    tokens.map(async (token) => {
      try {
        const data = publicClient.readContract({
          address: token.address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [accountAddress],
        });

        console.log("token", token);
        console.log("data", data);

        // const balance = Number(rawBalance) / 1e18; // assuming 18 decimals for example

        return { ...token };
      } catch (error) {
        console.error(`Error fetching balance for ${token.symbol}`, error);
        return { ...token, balance: 0 };
      }
    })
  );

  return balances;
}
