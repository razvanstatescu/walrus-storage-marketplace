import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface StudioLayoutProps {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  homeHref?: string;
  showBackButton?: boolean;
  showHomeButton?: boolean;
}

/**
 * Studio layout component with navigation header
 * Provides back/home buttons and studio title
 */
export function StudioLayout({
  children,
  title = "POSTCRAFT STUDIO",
  backHref = "/",
  homeHref = "/",
  showBackButton = true,
  showHomeButton = true,
}: StudioLayoutProps) {
  return (
    <div className="w-full max-w-7xl mx-auto backdrop-blur-xl bg-white/30 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      {/* Header */}
      <header className="border-b-4 border-black p-4 sm:p-6 bg-white/40 backdrop-blur-md">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Link href={backHref}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-2 border-black"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
            {showHomeButton && (
              <Link href={homeHref}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-2 border-black"
                >
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              {title}
            </h1>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
}
