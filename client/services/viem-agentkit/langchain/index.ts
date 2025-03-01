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
      console.log(input);
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
  ];
}
