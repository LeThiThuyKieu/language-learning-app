import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.ts";
import { Bell, Search, Settings, LogOut } from "lucide-react";
import ConfirmModal from "@/components/user/layout/ConfirmModal";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 shadow-xs">
        <div className="mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/admin/dashboard" className="group flex items-center gap-2 shrink-0">
              <div className="relative w-12 h-12 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <img src="/logo/lion.png" alt="Lion Logo" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
              <div className="relative">
                <span className="text-4xl font-black tracking-tighter text-gray-900 transition-all group-hover:tracking-normal">
                  L<span className="text-primary-600 italic">i</span>on
                </span>
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-orange-400 transition-all duration-300 group-hover:w-full rounded-full" />
              </div>
            </Link>

            {/* Center Search */}
            <div className="flex-1 mx-12">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm"
                  className="w-full px-4 py-2 bg-gray-50 rounded-lg text-basic focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all border border-gray-100"
                />
                <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-6">
              {isAuthenticated ? (
                <>
                  <button className="relative text-gray-500 hover:text-gray-700 transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full" />
                  </button>

                  <button className="text-gray-500 hover:text-gray-700 transition-colors">
                    <Settings className="w-5 h-5" />
                  </button>

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
                      onClick={() => setShowLogoutConfirm(true)}
                      className="text-gray-500 hover:text-rose-500 transition-colors"
                      title="Đăng xuất"
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

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        message="Bạn có chắc chắn muốn đăng xuất không?"
      />
    </>
  );
}
