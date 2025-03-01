// global.d.ts (or window.d.ts, etc.)

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      // You can add more specific methods/properties if you want
      request?: (...args: any[]) => Promise<any>;
    };
  }
}

// Make sure TS treats this file as a module.
export {};
