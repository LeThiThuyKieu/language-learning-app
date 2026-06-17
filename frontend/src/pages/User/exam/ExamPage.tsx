import { useNavigate } from "react-router-dom";
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
        group relative w-full text-left rounded-2xl border-2 p-5
        transition-all hover:shadow-md active:scale-[0.98]
        ${level.color} ${level.borderColor}
      `}
    >
      {/* Badge cấp độ */}
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${level.badgeColor} mb-3`}>
        <span className={`text-2xl font-black ${level.textColor}`}>{level.id}</span>
      </div>

      {/* Tên + mô tả */}
      <div className="mb-3">
        <h3 className={`text-lg font-extrabold ${level.textColor}`}>{level.label}</h3>
        <p className="text-sm text-gray-500 mt-0.5 leading-snug">{level.description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${level.textColor} opacity-70`}>
          {level.testCount} bài thi
        </span>
        <svg
          className={`h-5 w-5 ${level.textColor} transition-transform group-hover:translate-x-1`}
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
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
