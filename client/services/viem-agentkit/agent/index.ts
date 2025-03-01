import { ViemWalletProvider } from "../wallet-providers/viemWalletProvider";
import { Address, WalletClient as ViemWalletClient } from "viem";
import { get_hbar_balance } from "../tools/hts/queries/balance";
import { transfer_hbar } from "../tools/hbar/transactions/transfer";
import { transfer_token } from "../tools/hts/transactions/transfer";
import { get_evm_address } from "../tools/address";
import { createFT, CreateFungibleTokenProps } from "../tools/createFT";
import { mintFT } from "../tools/mintFT";

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
  async transferHbar(to?: Address, amountHbar?: number): Promise<string> {
    return transfer_hbar(this.viemClient, to, amountHbar);
  }

  /**
   * Transfers a fungible token to another account.
   *
   * @param tokenAddress - The ID of the token to transfer.
   * @param toAccountId - The account ID to transfer to.
   * @param amount - The amount of tokens to transfer.
   * @returns The transaction
   */
  async transferToken(tokenAddress: Address, toAccountId: `0x${string}`, amount: number): Promise<string> {
    return transfer_token(this.viemClient, tokenAddress, toAccountId, amount);
  }

  /**
   * Returns the EVM address of the connected wallet.
   *
   * @returns The EVM address of the connected wallet.
   */
  async getEvmAddress(): Promise<Address> {
    return get_evm_address(this.viemClient);
  }

  /**
   * Creates a new fungible token.
   *
   * @param tokenProps - The properties of the token to create.
   * @returns The address of the newly created token.
   */
  async createFungibleToken(
    tokenProps: CreateFungibleTokenProps
  ): Promise<Address> {
    return createFT(this.viemClient, tokenProps);
  }

  /**
   * Mints a new fungible token.
   *
   * @param tokenAddress - The address of the token to mint.
   * @param amount - The amount of tokens to mint.
   * @returns The address of the newly created token.
   */
  async mintFungibleToken(
    tokenAddress: Address,
    amount: number,
    recipient: Address
  ): Promise<Address> {
    return mintFT(this.viemClient, tokenAddress, amount, recipient);
  }
}
