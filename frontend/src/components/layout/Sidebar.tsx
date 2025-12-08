import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const menuItems = [
  { path: "/", icon: Home, label: "Trang chủ" },
  { path: "/dashboard", icon: BookOpen, label: "Bảng điều khiển" },
  { path: "/learning", icon: BookOpen, label: "Học tập" },
  { path: "/profile", icon: User, label: "Hồ sơ" },
];

export default function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary-100 text-primary-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
