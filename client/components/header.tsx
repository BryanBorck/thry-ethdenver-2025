import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-12 px-12 flex items-center justify-between border-b-[1px] border-border bg-background/80 backdrop-blur-sm z-50">
      {/* Logo on the left */}
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <span className="font-semibold text-primary">Brand</span>
        </Link>
      </div>

      {/* Menu buttons in center */}
      <nav className="hidden md:flex items-center space-x-6">
        <Link
          href="/test"
          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          Test
        </Link>
      </nav>

      {/* Connect button on the right */}
      <div>
        <ConnectButton label="Connect" accountStatus="avatar" />
      </div>
    </header>
  );
}
