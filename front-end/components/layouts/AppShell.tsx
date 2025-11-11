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
    <>{children}</>
  );
}
