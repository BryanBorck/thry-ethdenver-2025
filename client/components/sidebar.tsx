"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, ChartColumnIncreasing, Info } from "lucide-react";
import { HyperText } from "./magicui/hyper-text";

export function AppSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);

  const menuItems = [
    { label: "Chat", href: "/chat", icon: MessageSquare },
    { label: "Portfolio", href: "/portfolio", icon: ChartColumnIncreasing },
    // { label: "About", href: "/about", icon: Info },
  ];

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen z-50 group",
        expanded ? "w-[160px]" : "w-[70px]",
        "transition-all duration-300 ease-in-out",
        "border-r border-border bg-transparent backdrop-blur-[1px] flex flex-col"
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo Section */}
      <div className="flex items-center w-full h-20 border-b border-border">
        <Link href="/">
          <div className="flex items-center ml-6">
            <p className="text-2xl font-bold text-[#ff2158]">T</p>
            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <HyperText
                className="text-2xl inline-block"
                duration={800}
                delay={500}
              >
                .HYR
              </HyperText>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-4 flex flex-col space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-10 items-center px-5 gap-2 border-l-2 border-transparent transition-colors whitespace-nowrap transition-all duration-500 ease-in-out",
              pathname === item.href
                ? "bg-[#ff2158]/20 text-[#ff2158] border-[#ff2158] hover:bg-[#ff2158]/80 hover:text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                "ml-2 transition-opacity duration-500",
                expanded ? "opacity-100" : "opacity-0"
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
