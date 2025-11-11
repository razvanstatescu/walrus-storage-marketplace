import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable glassmorphic card component
 * Provides consistent glass/blur effect styling
 */
export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-white/50 border-2 border-black rounded-xl p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
