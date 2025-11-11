interface StudioShellProps {
  children: React.ReactNode
  sidebar: React.ReactNode
}

export function StudioShell({ children, sidebar }: StudioShellProps) {
  return (
    <div className="grid lg:grid-cols-[1fr_350px] gap-6">
      <div className="space-y-6">{children}</div>
      <div className="space-y-6">{sidebar}</div>
    </div>
  )
}
