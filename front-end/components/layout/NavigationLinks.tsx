"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export const navigationLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/calendar", label: "Calendar" },
  { href: "/messages", label: "Messages" },
]

interface NavigationLinksProps {
  activeLink?: string
  className?: string
}

export function NavigationLinks({ activeLink, className }: NavigationLinksProps) {
  return (
    <nav className={cn("space-y-2", className)}>
      {navigationLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={cn(
            "flex items-center gap-2 text-lg font-bold p-3 rounded-xl transition-colors",
            activeLink === link.label ? "bg-black text-white" : "hover:bg-black/10",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
