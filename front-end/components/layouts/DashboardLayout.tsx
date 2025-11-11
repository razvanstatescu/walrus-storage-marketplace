import { Navbar } from "@/components/navigation/Navbar";
import { Sidebar } from "@/components/navigation/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
  showMobileMenu?: boolean;
  showNavbarActions?: boolean;
}

/**
 * Dashboard layout with navbar and optional sidebar
 * Provides the standard dashboard grid structure
 */
export function DashboardLayout({
  children,
  title = "POSTCRAFT",
  showSidebar = true,
  showMobileMenu = true,
  showNavbarActions = true,
}: DashboardLayoutProps) {
  return (
    <div className="w-full max-w-7xl mx-auto backdrop-blur-xl bg-white/30 border-4 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
      <Navbar
        title={title}
        showMobileMenu={showMobileMenu}
        showActions={showNavbarActions}
      />

      <div className="grid md:grid-cols-[280px_1fr] h-[calc(100vh-6rem)]">
        {showSidebar && <Sidebar />}

        {/* Main content */}
        <div className="overflow-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
