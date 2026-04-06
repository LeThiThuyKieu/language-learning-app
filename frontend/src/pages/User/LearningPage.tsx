import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

type LevelKey = "beginner" | "intermediate" | "advanced";

export default function LearningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const level = (location.state?.level ?? "beginner") as LevelKey;

  const headerText = useMemo(() => {
    const levelNumberMap: Record<LevelKey, number> = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };
    const levelLabelMap: Record<LevelKey, string> = {
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    };
    return `Level ${levelNumberMap[level]}: ${levelLabelMap[level]}, Skill tree 1`;
  }, [level]);

  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar left */}
          <aside className="col-span-12 md:col-span-3">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo/lion.png"
                  alt="Lion"
                  className="w-10 h-10 object-contain"
                />
                <div className="text-2xl font-extrabold text-gray-900">Lion</div>
              </div>

              <nav className="mt-2 space-y-2">
                <SidebarItem label="Học" active />
                <SidebarItem label="Bảng xếp hạng" />
                <SidebarItem label="Nhiệm vụ" />

                {/* Xem thêm dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMoreOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-gray-800 bg-white hover:bg-gray-50 transition"
                  >
                    <span className="font-semibold">Xem thêm</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        moreOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {moreOpen && (
                    <div className="mt-2 rounded-xl border bg-white shadow-md overflow-hidden">
                      <MoreItem label="Cài đặt" onClick={() => navigate("/profile")} />
                      <MoreItem label="Trợ giúp" />
                      <MoreItem label="Đăng xuất" />
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="col-span-12 md:col-span-9">
            <div className="bg-primary-500 text-white rounded-2xl px-6 py-5 flex items-center justify-between">
              <div>
                <div className="uppercase tracking-wide text-white/90 text-sm font-extrabold">
                  Phần 1, Cửa 1
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold">
                  {headerText}
                </h1>
              </div>
              <button className="hidden md:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-semibold transition">
                <span>Hướng dẫn</span>
              </button>
            </div>

            {/* Skill nodes */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkillNode key={i} index={i + 1} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      className={`w-full text-left px-4 py-3 rounded-xl border transition ${
        active
          ? "bg-primary-50 border-primary-200 text-primary-700 font-bold"
          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800 font-semibold"
      }`}
    >
      {label}
    </button>
  );
}

function MoreItem({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-gray-800 font-semibold"
    >
      {label}
    </button>
  );
}

function SkillNode({ index }: { index: number }) {
  return (
    <button className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition border border-gray-100 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center">
        <span className="text-primary-700 font-extrabold">{index}</span>
      </div>
      <div className="text-center">
        <div className="text-lg font-bold text-gray-900">Bài {index}</div>
        <div className="text-sm text-gray-600">Chủ đề {index}</div>
      </div>
    </button>
  );
}