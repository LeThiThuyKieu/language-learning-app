import { Outlet } from "react-router-dom";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      {/* Footer */}
      <Footer/>
    </div>
  );
}
