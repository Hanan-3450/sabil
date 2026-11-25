import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <BrandLogo size="sm" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#57534E] dark:text-[#9CA3AF] hover:bg-[#FAF8F5] dark:hover:bg-[#121417] cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#F0FDFA] dark:bg-[#0F766E]/20 text-[#0F766E] dark:text-[#2DD4BF] border border-[#CCFBF1] dark:border-[#115E59]"
                    : "text-[#57534E] dark:text-[#9CA3AF] hover:bg-[#FAF8F5] dark:hover:bg-[#121417] hover:text-[#1C1917] dark:hover:text-[#ECEAE4] border border-transparent"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="pt-4 border-t border-[#E7E5E4] dark:border-[#2A2E35] space-y-3">
        <div className="px-2">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-[#57534E] dark:text-[#9CA3AF] truncate">
            {user?.email}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ThemeToggle showLabel />
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-[#E7E5E4] dark:border-[#2A2E35] text-[#57534E] dark:text-[#9CA3AF] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#FAF8F5] dark:hover:bg-[#121417] transition-colors cursor-pointer"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] dark:bg-[#121417]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[#E7E5E4] dark:border-[#2A2E35] bg-white dark:bg-[#1A1D21] sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#1A1D21] border-r border-[#E7E5E4] dark:border-[#2A2E35] transform transition-transform duration-200 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar with Hamburger Button */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-[#E7E5E4] dark:border-[#2A2E35] bg-white/95 dark:bg-[#1A1D21]/95 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[#1C1917] dark:text-[#ECEAE4] hover:bg-[#FAF8F5] dark:hover:bg-[#121417] cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BrandLogo size="sm" />
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}