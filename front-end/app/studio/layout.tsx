import type React from "react"
import { AppShell } from "@/components/layout/AppShell"
import { MainNavbar } from "@/components/layout/MainNavbar"

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      <MainNavbar title="POSTCRAFT STUDIO" showBackButton showHomeButton backHref="/" homeHref="/" />
      <div className="p-4 sm:p-6">{children}</div>
    </AppShell>
  )
}
