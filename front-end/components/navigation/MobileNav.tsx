import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  active?: boolean;
}

interface MobileNavProps {
  title?: string;
  navItems?: NavItem[];
  showPlatforms?: boolean;
  showActions?: boolean;
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
 * Mobile navigation drawer content
 * Displays navigation links, platforms, and action buttons
 */
export function MobileNav({
  title = "POSTCRAFT",
  navItems = defaultNavItems,
  showPlatforms = true,
  showActions = true,
}: MobileNavProps) {
  return (
    <div className="h-full bg-white/40 backdrop-blur-md flex flex-col">
      <div className="p-6 border-b-4 border-[#97f0e5]">
        <h2 className="text-2xl font-black">{title}</h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-2 mb-8">
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
          <div>
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

      {showActions && (
        <div className="p-4 border-t-4 border-[#97f0e5]">
          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-[#97f0e5] hover:bg-[#97f0e5]/80 text-black rounded-xl border-2 border-[#97f0e5] font-bold">
              Connect
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-2 border-[#97f0e5] font-bold"
            >
              Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Default export for backward compatibility
export default MobileNav;
