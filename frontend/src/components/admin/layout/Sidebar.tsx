import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Type,
  Table2,
  Zap,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore.ts";

const menuItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
];

const templateItems = [
  { path: "#typography", icon: Type, label: "Typography" },
  { path: "#tables", icon: Table2, label: "Tables" },
  { path: "#elements", icon: Zap, label: "UI Elements" },
];

const bottomItems = [
  { path: "/profile", icon: Settings, label: "Settings" },
  { path: "/profile", icon: User, label: "Account" },
];

export default function Sidebar() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen p-5 flex flex-col">
      {/* APP Section */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          APP
        </h3>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* TEMPLATE Section */}
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          TEMPLATE
        </h3>
        <nav className="space-y-1">
          {templateItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all font-medium text-sm"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Items */}
      <div className="border-t border-gray-100 pt-5 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all font-medium text-sm"
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-all font-medium text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
