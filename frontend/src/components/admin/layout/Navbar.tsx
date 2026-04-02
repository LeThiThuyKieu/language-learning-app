import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.ts";
import { LogOut, Bell, Search, Settings } from "lucide-react";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-100 shadow-xs">
      <div className="mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Lion
          </Link>

          {/* Center Search */}
          <div className="flex-1 mx-12">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full px-4 py-2 bg-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all border border-gray-100"
              />
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Right side icons and user */}
          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {/* Notification icon */}
                <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>
                </button>

                {/* Settings icon */}
                <button className="text-gray-500 hover:text-gray-700 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>

                {/* User avatar dropdown */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || "P"}
                    </div>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-rose-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
