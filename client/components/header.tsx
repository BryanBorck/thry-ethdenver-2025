import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-12 px-12 flex items-center justify-end bg-transparent z-50">
      <div>
        <ConnectButton label="Connect" accountStatus="avatar" />
      </div>
    </header>
  );
}
