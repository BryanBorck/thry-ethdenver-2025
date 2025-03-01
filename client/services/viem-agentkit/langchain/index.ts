import { Tool } from "@langchain/core/tools";
import { ViemAgentKit } from "../agent";

export class HederaGetEvmAddressTool extends Tool {
  name = "hedera_get_evm_address";

  description = `Retrieves the account EVM address of the connected wallet.

### **Example Usage:**
1. **Get address of the connected account:**
   '{}'
`;

  constructor(private viemAgentKit: ViemAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const address = await this.viemAgentKit.getEvmAddress();

      return JSON.stringify({
        status: "success",
        address: address,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class HederaGetBalanceTool extends Tool {
  name = "hedera_get_hbar_balance";

  description = `Retrieves the HBAR balance of a specified Hedera account using an EVM account address.
If an EVM account address is provided, it returns the balance of that account.
If no input is given (empty JSON '{}'), it returns the balance of the connected account.

### **Inputs** (optional, input is a JSON string):
- **evmAddress** (*string*, optional): The EVM account address to check the balance for (e.g., "0x1234567890abcdef1234567890abcdef12345678").
  - If omitted, the tool will return the balance of the connected account.

### **Example Usage:**
1. **Get balance of a specific account:**
   '{ "evmAddress": "0x1234567890abcdef1234567890abcdef12345678" }'
2. **Get balance of the connected account:**
   '{}'
`;

  constructor(private viemAgentKit: ViemAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const balance = await this.viemAgentKit.getHbarBalance(
        parsedInput?.evmAddress
      );

      return JSON.stringify({
        status: "success",
        balance: balance,
        unit: "HBAR",
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class HederaCreateFungibleTokenTool extends Tool {
  name = "hedera_create_fungible_token";

  description = `Deploy a new fungible token (ERC-20 style) on Hedera.
  Inputs (input is a JSON string):
  name: string, the name of the token (e.g. "My Token"),
  symbol: string, the symbol of the token (e.g. "MT"),
  decimals: number, the number of decimals for the token (e.g. 18),
  initialSupply: number, the initial supply of tokens (e.g. 100000),
  
  Example usage:
  1. Deploy a fungible token named "My Token" with symbol "MT", 18 decimals, and an initial supply of 100000:
    '{
      "name": "My Token",
      "symbol": "MT",
      "decimals": 18,
      "initialSupply": 100000
    }'
  `;

  constructor(private viemAgentKit: ViemAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      // Deploy an ERC-20 contract using createFT (simple example)
      const txHash = await this.viemAgentKit.createFungibleToken({
        name: parsedInput.name,
        symbol: parsedInput.symbol,
        decimals: parsedInput.decimals,
        initialSupply: BigInt(parsedInput.initialSupply),
      });

      return JSON.stringify({
        status: "success",
        message: "Token creation successful",
        name: parsedInput.name,
        symbol: parsedInput.symbol,
        decimals: parsedInput.decimals,
        initialSupply: parsedInput.initialSupply,
        txHash: txHash,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class HederaMintFungibleTokenTool extends Tool {
  name = "hedera_mint_fungible_token";

  description = `Mint fungible tokens to an account on Hedera using EVM addresses.
Inputs (input is a JSON string):
tokenAddress: string, the EVM address of the token to mint, e.g. 0x1234567890abcdef1234567890abcdef12345678,
amount: number, the amount of tokens to mint, e.g. 100,
recipient: string, the EVM address of the recipient, e.g. 0xabcdefabcdefabcdefabcdefabcdefabcdef,
Example usage:
1. Mint 100 tokens of token 0x1234567890abcdef1234567890abcdef12345678 to account 0xabcdefabcdefabcdefabcdefabcdefabcdef:
  '{
    "tokenAddress": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": 100,
    "recipient": "0xabcdefabcdefabcdefabcdefabcdefabcdef"
  }'
`;

  constructor(private viemAgentKit: ViemAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      const txHash = await this.viemAgentKit.mintFungibleToken(
        parsedInput.tokenAddress,
        parsedInput.amount,
        parsedInput.recipient
      );

      return JSON.stringify({
        status: "success",
        message: "Token minting successful",
        tokenAddress: parsedInput.tokenAddress,
        amount: parsedInput.amount,
        recipient: parsedInput.recipient,
        txHash: txHash,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export class HederaTransferHbarTool extends Tool {
  name = "hedera_transfer_hbar";

  description = `Transfer HBAR to an account on Hedera
Inputs ( input is a JSON string ):
toAccountId: string, the account ID to transfer to e.g. 0x1234567890abcdef1234567890abcdef12345678,
amount: number, the amount of HBAR to transfer e.g. 100,
Example usage:
1. Transfer 100 HBAR to account 0x1234567890abcdef1234567890abcdef12345678:
  '{
    "toAccountId": "0x1234567890abcdef1234567890abcdef12345678",
    "amount": 100
  }'
`;

  constructor(private viemAgentKit: ViemAgentKit) {
    super();
  }

  protected async _call(input: string): Promise<string> {
    try {
      const parsedInput = JSON.parse(input);

      await this.viemAgentKit.transferHbar(
        parsedInput.toAccountId,
        parsedInput.amount
      );
      return JSON.stringify({
        status: "success",
        message: "HBAR transfer successful",
        toAccountId: parsedInput.toAccountId,
        amount: parsedInput.amount,
      });
    } catch (error: any) {
      return JSON.stringify({
        status: "error",
        message: error.message,
        code: error.code || "UNKNOWN_ERROR",
      });
    }
  }
}

export function createViemTools(viemAgentKit: ViemAgentKit): Tool[] {
  return [
    new HederaGetEvmAddressTool(viemAgentKit),
    new HederaGetBalanceTool(viemAgentKit),
    new HederaTransferHbarTool(viemAgentKit),
    new HederaCreateFungibleTokenTool(viemAgentKit),
    new HederaMintFungibleTokenTool(viemAgentKit),
  ];
}
