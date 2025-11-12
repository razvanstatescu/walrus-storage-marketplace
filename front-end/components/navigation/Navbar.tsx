"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogOut } from "lucide-react";
import { MobileNav } from "@/components/navigation/MobileNav";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useWalrusEpoch } from "@/hooks/useWalrusEpoch";
import { ConnectButton } from "@mysten/dapp-kit";

interface NavbarProps {
  title?: string;
  showMobileMenu?: boolean;
  showActions?: boolean;
  children?: React.ReactNode;
}

/**
 * Main navigation bar component
 * Displays app title, mobile menu toggle, and action buttons
 */
export function Navbar({
  title = "POSTCRAFT",
  showMobileMenu = true,
  showActions = true,
  children,
}: NavbarProps) {
  const { isConnected, address, disconnect } = useWalletConnection();
  const { epoch, isLoading: isLoadingEpoch } = useWalrusEpoch();

  // Helper function to format address
  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b-2 border-[#97f0e5] p-4 sm:p-6 bg-white/40 backdrop-blur-md">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
          {title}
        </h1>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="flex md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-2 border-[#97f0e5]"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="border-r-4 border-[#97f0e5] p-0"
              >
                <MobileNav />
              </SheetContent>
            </Sheet>
          </div>
        )}

        {/* Custom children or default desktop buttons */}
        {children ? (
          children
        ) : showActions ? (
          <div className="hidden sm:flex items-center gap-3">
            {/* Current Epoch Display */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-[#97f0e5] bg-white/50 font-bold text-sm">
              <span className="text-gray-600">Epoch:</span>
              <span className="font-mono">
                {isLoadingEpoch ? "..." : epoch ?? "N/A"}
              </span>
            </div>

            {!isConnected ? (
              <ConnectButton
                connectText="Connect Account"
                className="!rounded-xl !border-2 !border-[#97f0e5] !font-bold !shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] !cursor-pointer hover:!bg-[#97f0e5]/10 hover:!shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:!translate-x-[2px] hover:!translate-y-[2px] !transition-all !bg-white !text-black !text-sm !h-10 !px-4 !py-2"
              />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    {formatAddress(address || "")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-48 border-4 border-[#97f0e5] rounded-xl bg-white shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]"
                >
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => disconnect()}
                    className="cursor-pointer rounded-lg font-bold"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="outline"
              className="rounded-xl border-2 border-[#97f0e5] font-bold shadow-[4px_4px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Settings
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
