import { Outlet } from "react-router-dom";
import UserNavbar from "./UserNavbar";

export default function UserLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

