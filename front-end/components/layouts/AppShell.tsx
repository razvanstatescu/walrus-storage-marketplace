import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * App shell wrapper that provides the main background and padding
 * This is the outermost container for the entire application
 */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-2 sm:p-4 md:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
