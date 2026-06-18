import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearnSidebar from "@/components/user/learn/common/LearnSidebar.tsx";
import LearnRightPanel from "@/components/user/learn/common/LearnRightPanel.tsx";
import { EXAM_LEVELS, type ExamLevel } from "@/data/examMockData";

function LevelCard({ level, onClick }: { level: ExamLevel; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative w-full text-left rounded-2xl border-2 p-5 overflow-hidden
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]
        ${level.color} ${level.borderColor}
      `}
    >
      {/* Vòng trang trí góc phải trên */}
      <div className={`absolute -top-6 -right-6 h-24 w-24 rounded-full opacity-20 ${level.badgeColor}`} />

      {/* Badge cấp độ */}
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${level.badgeColor} mb-4 shadow-sm`}>
        <span className={`text-xl font-black ${level.textColor}`}>{level.id}</span>
      </div>

      {/* Mô tả */}
      <p className="text-sm text-gray-500 leading-snug mb-4">{level.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-xs font-bold ${level.textColor} opacity-80`}>
          {/* Icon document */}
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {level.testCount} bài thi
        </div>
        <div className={`flex items-center justify-center h-7 w-7 rounded-full ${level.badgeColor} transition-transform group-hover:translate-x-1`}>
          <ChevronRight className={`h-4 w-4 ${level.textColor}`} />
        </div>
      </div>
    </button>
  );
}

export default function ExamPage() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated) return <GuestPrompt />;

  return (
    <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
      <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
        <div className="grid grid-cols-12 gap-6">

          <LearnSidebar
            isAllLevelsCompleted={false}
            showGeneralRevision={false}
            onToggleGeneralRevision={() => navigate("/general-revision")}
            activeItem="exam"
            onNavigate={(path) => navigate(path)}
            onLogout={() => { logout(); navigate("/login", { replace: true }); }}
          />

          <main className="col-span-12 md:col-span-9 lg:col-span-9">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 px-4 lg:px-6">

                {/* Header */}
                <div className="text-center pt-6 mb-8">
                  <h1 className="text-3xl font-black text-primary-600">
                    Luyện thi tiếng Anh
                  </h1>
                  <p className="mt-2 text-base text-gray-500">
                    Chọn cấp độ để bắt đầu luyện thi theo chuẩn Cambridge
                  </p>
                </div>

                {/* Lưới cấp độ — 2 cột */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {EXAM_LEVELS.map((level) => (
                    <LevelCard
                      key={level.id}
                      level={level}
                      onClick={() => navigate(`/exam/${level.id.toLowerCase()}`)}
                    />
                  ))}
                </div>
              </div>

              <LearnRightPanel onViewProfile={() => navigate("/profile")} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
