"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ArrowLeft, Home, Menu } from "lucide-react"
import MobileNavigation from "@/components/mobile-navigation"

interface MainNavbarProps {
  title: string
  showBackButton?: boolean
  showHomeButton?: boolean
  backHref?: string
  homeHref?: string
  actions?: React.ReactNode
}

export function MainNavbar({
  title,
  showBackButton = false,
  showHomeButton = false,
  backHref = "/",
  homeHref = "/",
  actions,
}: MainNavbarProps) {
  return (
    <header className="border-b-4 border-black p-4 sm:p-6 bg-white/40 backdrop-blur-md">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Link href={backHref}>
              <Button variant="outline" size="icon" className="rounded-xl border-2 border-black">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          {showHomeButton && (
            <Link href={homeHref}>
              <Button variant="outline" size="icon" className="rounded-xl border-2 border-black">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">{title}</h1>
        </div>

        {/* Mobile menu */}
        <div className="flex md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-xl border-2 border-black">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-r-4 border-black p-0">
              <MobileNavigation />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop actions */}
        {actions && <div className="hidden sm:flex items-center gap-3">{actions}</div>}
      </div>
    </header>
  )
}
