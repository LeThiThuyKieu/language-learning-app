import { Outlet } from "react-router-dom";
import UserNavbar from "./UserNavbar";

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UserNavbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-6 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center">
            {/* Logo */}
            <div className="text-3xl font-extrabold text-primary-600 mb-2">Lion</div>
            {/* Main CTA */}
            <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md mb-6 transition-all duration-200">
              Bắt đầu học
            </button>
            {/* Social icons */}
            <div className="flex gap-4 mb-8">
              <a href="#" className="hover:text-primary-600 transition-colors"><svg width="24" height="24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.47.69a4.3 4.3 0 001.88-2.37 8.59 8.59 0 01-2.72 1.04A4.28 4.28 0 0016.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.1.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.7-.02-1.36-.21-1.94-.53v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 012 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 007.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0024 4.59a8.36 8.36 0 01-2.54.7z"/></svg></a>
              <a href="#" className="hover:text-primary-600 transition-colors"><svg width="24" height="24" fill="currentColor"><path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.97 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.67a2.07 2.07 0 110-4.14 2.07 2.07 0 010 4.14zm15.11 12.78h-3.56v-5.6c0-1.33-.03-3.05-1.86-3.05-1.86 0-2.15 1.45-2.15 2.95v5.7h-3.56V9h3.42v1.56h.05c.48-.91 1.65-1.86 3.4-1.86 3.64 0 4.31 2.4 4.31 5.52v6.23z"/></svg></a>
              <a href="#" className="hover:text-primary-600 transition-colors"><svg width="24" height="24" fill="currentColor"><path d="M23.5 6.2a9.6 9.6 0 01-2.77.76A4.8 4.8 0 0022.87 4.1a9.6 9.6 0 01-3.04 1.16A4.8 4.8 0 0012 8.1c0 .38.04.75.12 1.1A13.6 13.6 0 013 4.9a4.8 4.8 0 001.48 6.4A4.8 4.8 0 012.8 10v.06a4.8 4.8 0 003.85 4.7c-.3.08-.62.13-.95.13-.23 0-.45-.02-.67-.06a4.8 4.8 0 004.48 3.33A9.6 9.6 0 012 21.54c-.32 0-.63-.02-.94-.06A13.6 13.6 0 007.29 23.5c8.19 0 12.68-6.79 12.68-12.68 0-.19 0-.37-.01-.56A9.1 9.1 0 0024 4.59a9.6 9.6 0 01-2.5.68z"/></svg></a>
              <a href="#" className="hover:text-primary-600 transition-colors"><svg width="24" height="24" fill="currentColor"><path d="M12 2.16c-5.44 0-9.84 4.4-9.84 9.84 0 4.35 2.82 8.04 6.75 9.36.5.09.68-.22.68-.48v-1.7c-2.75.6-3.33-1.32-3.33-1.32-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.2-.25-4.52-1.1-4.52-4.9 0-1.08.39-1.97 1.03-2.67-.1-.25-.45-1.28.1-2.67 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0112 6.84c.85.004 1.7.12 2.5.35 1.91-1.29 2.75-1.02 2.75-1.02.55 1.39.2 2.42.1 2.67.64.7 1.03 1.59 1.03 2.67 0 3.81-2.32 4.65-4.53 4.89.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.44-4.4-9.84-9.84-9.84z"/></svg></a>
            </div>
            {/* Links grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full text-sm text-gray-200 mb-8">
              <div>
                <div className="font-semibold mb-2 text-white">Thông tin</div>
                <ul className="space-y-1">
                  <li>Giới thiệu</li>
                  <li>Liên hệ</li>
                  <li>FAQ &amp; Trợ giúp</li>
                  <li>Ứng dụng di động</li>
                  <li>Đăng ký</li>
                  <li>Đội ngũ</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-2 text-white">Khóa học</div>
                <ul className="space-y-1">
                  <li>Học tiếng Anh</li>
                  <li>Học tiếng Trung</li>
                  <li>Học tiếng Hàn</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-2 text-white">Tài nguyên</div>
                <ul className="space-y-1">
                  <li>Blog</li>
                  <li>Gói đăng ký</li>
                  <li>Chính sách bảo mật</li>
                  <li>Điều khoản sử dụng</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-2 text-white">Khác</div>
                <ul className="space-y-1">
                  <li>Sổ tay từ vựng</li>
                  <li>Học qua video</li>
                  <li>Chứng chỉ</li>
                </ul>
              </div>
            </div>
            {/* Bottom links */}
            <div className="text-center text-gray-400 text-xs">
              &copy; {new Date().getFullYear()} Lion. All rights reserved. | Điều Khoản Sử Dụng | Chính Sách Bảo Mật | Cookie
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
