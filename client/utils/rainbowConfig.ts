import { hederaTestnet, sepolia } from "viem/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}

export const config = getDefaultConfig({
  appName: "Zap_App",
  projectId: process.env.NEXT_PUBLIC_RAINBOW_PROJECT_ID ?? "",
  chains: [
    hederaTestnet,
    sepolia,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [sepolia] : []),
  ],
  ssr: true,
});
