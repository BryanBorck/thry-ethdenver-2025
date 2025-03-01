import { ViemWalletProvider } from "../wallet-providers/viemWalletProvider";
import { WalletClient as ViemWalletClient } from "viem";
import { get_hbar_balance } from "../tools/balance";
import { transfer_hbar } from "../tools/transfer";

/**
 * Configuration options for AgentKit
 */
export type ViemAgentKitOptions = {
  walletProvider: ViemWalletProvider; // ViemWalletProvider instance
  viemClient: ViemWalletClient; // The underlying viem client instance
};

/**
 * AgentKit
 */
export class ViemAgentKit {
  private walletProvider: ViemWalletProvider;
  private viemClient: ViemWalletClient;

  private constructor(config: ViemAgentKitOptions) {
    this.walletProvider = config.walletProvider;
    this.viemClient = config.viemClient;
  }

  /**
   * Initializes a new AgentKit instance.
   *
   * @param config - Configuration options for the AgentKit.
   * @returns A new AgentKit instance.
   */
  public static async from(config: ViemAgentKitOptions): Promise<ViemAgentKit> {
    if (!config.walletProvider || !config.viemClient) {
      throw new Error("walletProvider and viemClient are required");
    }
    return new ViemAgentKit(config);
  }

  /**
   * Returns the wallet provider.
   *
   * @returns The ViemWalletProvider instance.
   */
  public getWalletProvider(): ViemWalletProvider {
    return this.walletProvider;
  }

  /**
   * Returns the HBAR balance.
   *
   * Uses the provided viem client and wallet address.
   *
   * @param accountId - Optionally, an alternate account identifier (address).
   * @returns The HBAR balance as a number.
   */
  async getHbarBalance(address?: string): Promise<number> {
    // Use the viem client passed in AgentKitOptions
    const targetAddress = (address ||
      this.walletProvider.getAddress()) as `0x${string}`;
    return get_hbar_balance(this.viemClient, targetAddress);
  }

  /**
   * Transfers HBAR to another account.
   *
   * @param to - The recipient's address.
   * @param amountHbar - The amount of HBAR to transfer.
   * @returns The new HBAR balance as a number.
   */
  async transferHbar(to?: string, amountHbar?: number): Promise<number> {
    return transfer_hbar(this.viemClient, to, amountHbar);
  }
}
