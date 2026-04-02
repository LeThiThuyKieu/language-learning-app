import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function UserNavbar() {
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Navbar */}
      <nav className="bg-gray-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Lion
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="hover:text-primary-600 transition-colors font-medium">
                Trang chủ
              </Link>
              <Link to="/learning" className="hover:text-primary-600 transition-colors font-medium">
                Khóa học
              </Link>
              <Link to="/profile" className="hover:text-primary-600 transition-colors font-medium">
                Hồ sơ
              </Link>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold">
                    {user?.email?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-300 hover:text-primary-600 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                >
                  Đăng nhập
                </Link>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-primary-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 text-white border-t-2 border-primary-600">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-4 hover:bg-gray-700 hover:text-primary-600 rounded-lg transition-colors font-semibold"
            >
              Trang chủ
            </Link>
            <Link
              to="/learning"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-4 hover:bg-gray-700 hover:text-primary-600 rounded-lg transition-colors font-semibold"
            >
              Khóa học
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-4 hover:bg-gray-700 hover:text-primary-600 rounded-lg transition-colors font-semibold"
            >
              Hồ sơ
            </Link>

            <div className="border-t border-gray-700 pt-3 mt-3">
              {isAuthenticated ? (
                <>
                  <div className="py-2 px-4 flex items-center gap-2 text-primary-600 font-semibold">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm">
                      {user?.email?.charAt(0).toUpperCase() || "P"}
                    </div>
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-4 hover:bg-red-600 rounded-lg transition-colors font-semibold flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-center font-semibold transition-all"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

