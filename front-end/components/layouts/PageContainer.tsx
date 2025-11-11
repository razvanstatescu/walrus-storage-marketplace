import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "fullscreen";
}

/**
 * Reusable glassmorphic container with neobrutalist styling
 * Used as the main content wrapper for pages
 */
export function PageContainer({
  children,
  className,
  variant = "default",
}: PageContainerProps) {
  if (variant === "fullscreen") {
    return (
      <div className={cn("min-h-screen w-full", className)}>{children}</div>
    );
  }

  return (
    <div
      className={cn(
        "backdrop-blur-xl bg-white/30 border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
    >
      {children}
    </div>
  );
}
