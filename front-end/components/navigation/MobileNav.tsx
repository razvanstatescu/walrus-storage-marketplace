"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { Github, Info, LogOut } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";
import { useWalletConnection } from "@/hooks/useWalletConnection";

interface NavItem {
  href: string;
  label: string;
  active?: boolean;
}

interface MobileNavProps {
  navItems?: NavItem[];
  showPlatforms?: boolean;
  showActions?: boolean;
}

const defaultNavItems: NavItem[] = [
  { href: "/buy-storage", label: "Buy Storage" },
  { href: "/wallet", label: "My Wallet" },
  { href: "/my-listings", label: "My Listings" },
];

const platforms = [
  { icon: Github, label: "GitHub", href: "https://github.com/razvanstatescu/walrus-storage-marketplace" },
  { icon: Info, label: "About", href: "https://github.com/razvanstatescu/walrus-storage-marketplace/blob/main/README.md" },
];

/**
 * Mobile navigation drawer content for Storewave
 * Displays Logo + Storewave branding, navigation links to Buy Storage/My Wallet/My Listings,
 * useful links, and connect button
 */
export function MobileNav({
  navItems = defaultNavItems,
  showPlatforms = true,
  showActions = true,
}: MobileNavProps) {
  // Wallet connection hook
  const { isConnected, address, disconnect } = useWalletConnection();

  // Helper function to format address
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="h-full bg-white/40 backdrop-blur-md flex flex-col">
      <div className="p-6 border-b-4 border-[#97f0e5]">
        <Link href="/buy-storage" className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          <Logo size={32} />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            <span className="text-black">Store</span>
            <span className="text-[#97f0e5]">wave</span>
          </h1>
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-2 mb-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                item.active
                  ? "flex items-center gap-2 font-bold rounded-xl border-2 border-[#97f0e5] shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] bg-[#97f0e5]/50 text-black px-4 py-3 cursor-pointer transition-all"
                  : "flex items-center gap-2 font-bold rounded-xl border-2 border-[#97f0e5] shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] px-4 py-3 cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[1px_1px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {showPlatforms && (
          <div>
            <h2 className="text-xl font-black mb-4">
              <span className="text-secondary">Useful</span> Links
            </h2>
            <div className="space-y-2">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <Link key={platform.label} href={platform.href} target={platform.href.startsWith('http') ? '_blank' : undefined} rel={platform.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="block">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2 rounded-xl border-2 border-[#97f0e5] font-bold"
                    >
                      <Icon className="h-5 w-5 text-black" /> {platform.label}
                    </Button>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-xl border-2 border-[#97f0e5] bg-white/50">
              <h3 className="text-sm font-black mb-2">
                <span className="text-secondary">About</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Storewave is the 1st Storage Marketplace on Walrus helping you get the best rates for Storage
              </p>
            </div>
          </div>
        )}
      </div>

      {showActions && (
        <div className="p-4 border-t-4 border-[#97f0e5]">
          {!isConnected ? (
            <ConnectButton
              connectText="Connect Account"
              className="!w-full !rounded-xl !border-2 !border-[#97f0e5] !font-bold !shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] !cursor-pointer hover:!bg-[#97f0e5]/10 hover:!shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all !bg-white !text-black !text-sm !h-10 !px-4 !py-2"
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-xs"
              >
                {formatAddress(address || "")}
              </Button>
              <Button
                variant="outline"
                onClick={() => disconnect()}
                className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Default export for backward compatibility
export default MobileNav;
