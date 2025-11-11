import { cn } from "@/lib/utils";

interface ShadowCardProps {
  children: React.ReactNode;
  className?: string;
  shadowSize?: "sm" | "md" | "lg";
}

/**
 * Reusable neobrutalist shadow card component
 * Provides consistent border and shadow styling
 */
export function ShadowCard({
  children,
  className,
  shadowSize = "md",
}: ShadowCardProps) {
  const shadowSizes = {
    sm: "shadow-[4px_4px_0px_0px_rgba(151,240,229,1)]",
    md: "shadow-[8px_8px_0px_0px_rgba(151,240,229,1)]",
    lg: "shadow-[12px_12px_0px_0px_rgba(151,240,229,1)]",
  };

  return (
    <div
      className={cn(
        "border-4 border-[#97f0e5] rounded-xl bg-white",
        shadowSizes[shadowSize],
        className
      )}
    >
      {children}
    </div>
  );
}
