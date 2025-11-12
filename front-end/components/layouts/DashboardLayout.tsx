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
  title = "Storewave",
  showSidebar = true,
  showMobileMenu = true,
  showNavbarActions = true,
}: DashboardLayoutProps) {
  return (
    <div className="w-full">
      <Navbar
        title={title}
        showMobileMenu={showMobileMenu}
        showActions={showNavbarActions}
      />

      <div className="grid md:grid-cols-[260px_1fr] h-[calc(100vh-6rem)]">
        {showSidebar && <Sidebar />}

        {/* Main content */}
        <div className="overflow-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
