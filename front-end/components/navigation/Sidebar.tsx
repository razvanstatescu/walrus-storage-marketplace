import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  active?: boolean;
}

interface SidebarProps {
  navItems?: NavItem[];
  showPlatforms?: boolean;
}

const defaultNavItems: NavItem[] = [
  { href: "/", label: "Reserve", active: true },
  { href: "/wallet", label: "My Wallet" },
];

const platforms = [
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Youtube, label: "YouTube" },
];

/**
 * Left sidebar navigation component
 * Displays main navigation links and platform buttons
 */
export function Sidebar({
  navItems = defaultNavItems,
  showPlatforms = true,
}: SidebarProps) {
  return (
    <div className="hidden md:block border-r-2 border-[#97f0e5] bg-white/40 p-4 sm:p-6">
      <nav className="space-y-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={
              item.active
                ? "flex items-center gap-2 font-bold rounded-xl border-2 border-[#97f0e5] shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] bg-[#97f0e5]/50 text-black px-4 py-2 cursor-pointer transition-all"
                : "flex items-center gap-2 font-bold rounded-xl border-2 border-[#97f0e5] shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] px-4 py-2 cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[1px_1px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {showPlatforms && (
        <div className="mt-8">
          <h2 className="text-xl font-black mb-4">PLATFORMS</h2>
          <div className="space-y-3">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.label}
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-xl border-2 border-[#97f0e5] font-bold shadow-[2px_2px_0px_0px_rgba(151,240,229,1)] cursor-pointer hover:bg-[#97f0e5]/10 hover:shadow-[1px_1px_0px_0px_rgba(151,240,229,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <Icon className="h-5 w-5" /> {platform.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
