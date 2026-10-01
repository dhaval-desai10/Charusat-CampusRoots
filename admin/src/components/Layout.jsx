import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Image,
  MessageSquare,
  Heart,
  Briefcase,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/users", label: "Users", icon: Users },
  { path: "/posts", label: "Posts", icon: FileText },
  { path: "/reunions", label: "Reunions", icon: Calendar },
  { path: "/gallery", label: "Gallery", icon: Image },
  { path: "/feedback", label: "Feedback", icon: MessageSquare },

  { path: "/donations", label: "Contributions", icon: Heart },
  { path: "/internships", label: "Internships", icon: Briefcase },
  { path: "/rbac", label: "RBAC", icon: Shield },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-white">CampusRoots Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-400 hover:text-white"
        >
          {mobileOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
               fixed top-0 left-0 z-40 h-full bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col
               lg:translate-x-0
               ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
               ${sidebarOpen ? "w-64" : "w-20"}
            `}
      >
        {/* Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-white">CampusRoots</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex text-slate-400 hover:text-white p-1"
          >
            <ChevronRight
              className={`w-5 h-5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          {sidebarOpen && (
            <div className="mb-3 px-3">
              <p className="text-sm text-slate-400">Logged in as</p>
              <p className="text-white font-medium">{admin?.username}</p>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 ${!sidebarOpen && "justify-center"}`}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`
               transition-all duration-300 pt-16 lg:pt-0
               ${sidebarOpen ? "lg:ml-64" : "lg:ml-20"}
            `}
      >
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
