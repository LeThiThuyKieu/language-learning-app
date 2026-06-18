import { useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar";

export default function GrammarPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <GuestPrompt />;
  }

  return (
    <div className="relative left-1/2 right-1/2 min-h-screen w-screen -translate-x-1/2 bg-white -mt-8">
      <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar trái */}
          <LearnSidebar
            isAllLevelsCompleted={false}
            showGeneralRevision={false}
            onToggleGeneralRevision={() => navigate("/general-revision")}
            activeItem="grammar"
            onNavigate={(path) => navigate(path)}
            onLogout={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          />

          {/* Nội dung giữa — render child routes */}
          <main className="col-span-12 md:col-span-9 lg:col-span-9">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
