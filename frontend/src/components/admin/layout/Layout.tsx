import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.tsx";
import Sidebar from "./Sidebar.tsx";

export default function AdminLayout() {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Navbar cố định trên cùng */}
      <Navbar />

      {/* Phần còn lại: sidebar + content, chiếm hết chiều cao còn lại */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 bg-white overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

