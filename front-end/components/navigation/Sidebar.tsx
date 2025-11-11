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
  { href: "#", label: "Dashboard", active: true },
  { href: "#", label: "Analytics" },
  { href: "#", label: "Calendar" },
  { href: "#", label: "Messages" },
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
    <div className="hidden md:block border-r-4 border-[#97f0e5] bg-white/40 p-4">
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={
              item.active
                ? "flex items-center gap-2 text-lg font-bold p-3 bg-[#97f0e5] text-black rounded-xl"
                : "flex items-center gap-2 text-lg font-bold p-3 hover:bg-[#97f0e5]/10 rounded-xl"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {showPlatforms && (
        <div className="mt-8">
          <h2 className="text-xl font-black mb-4">PLATFORMS</h2>
          <div className="space-y-2">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <Button
                  key={platform.label}
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-xl border-2 border-[#97f0e5] font-bold"
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
