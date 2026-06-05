import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore.ts";
import GuestPrompt from "@/components/user/GuestPrompt.tsx";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";
import LearnRightPanel from "@/components/user/learn/common/LearnRightPanel.tsx";
import GeneralRevisionView from "@/components/user/learn/general_revision/GeneralRevisionView.tsx";

export default function GeneralRevisionPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return <GuestPrompt />;

  return (
    <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
      <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Sidebar */}
          <LearnSidebar
            isAllLevelsCompleted={true}
            showGeneralRevision={true}
            onToggleGeneralRevision={() => navigate("/learn")}
            activeItem="revision"
            onNavigate={(path) => navigate(path)}
            onLogout={() => { logout(); navigate("/login", { replace: true }); }}
          />

          {/* Main content */}
          <main className="col-span-12 md:col-span-9 lg:col-span-9">
            <div className="grid grid-cols-12 gap-6">

              {/* Content */}
              <div className="col-span-12 lg:col-span-8">
                <GeneralRevisionView
                  onBack={() => navigate("/learn")}
                  onStartTask={(topicId, task) => {
                    navigate("/general-revision/task", { state: { topicId, task } });
                  }}
                />
              </div>

              {/* Right panel */}
              <LearnRightPanel onCreateProfile={() => navigate("/profile")} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
