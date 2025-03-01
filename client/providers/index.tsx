import { ReactNode } from "react";
import { RainbowProviders } from "./Rainbow";

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return <RainbowProviders>{children}</RainbowProviders>;
};
