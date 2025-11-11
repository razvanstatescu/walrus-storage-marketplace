import { NavigationLinks } from "./NavigationLinks"
import { PlatformButtons } from "./PlatformButtons"

interface SidebarProps {
  activeLink?: string
}

export function Sidebar({ activeLink }: SidebarProps) {
  return (
    <div className="hidden md:block border-r-4 border-black bg-white/40 p-4">
      <NavigationLinks activeLink={activeLink} />
      <PlatformButtons className="mt-8" />
    </div>
  )
}
