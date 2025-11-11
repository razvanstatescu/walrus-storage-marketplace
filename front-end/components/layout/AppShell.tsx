import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 p-2 sm:p-4 md:p-8">
      <div
        className={cn(
          "w-full max-w-7xl mx-auto backdrop-blur-xl bg-white/30 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
