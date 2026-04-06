import { useLocation, useNavigate } from "react-router-dom";
import {useState } from "react";

type LevelKey = "beginner" | "intermediate" | "advanced";

export default function LearningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const level = (location.state?.level ?? "beginner") as LevelKey;

  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white">
      <div className="w-full px-4 md:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar left */}
          <aside className="col-span-12 md:col-span-3">
            <div className="flex flex-col gap-4">
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
            <div className="grid grid-cols-12 gap-6">
              {/* Header ở giữa */}
              <div className="col-span-12 lg:col-span-7">
                <div className="bg-primary-500 text-white rounded-2xl px-6 py-5 flex items-center justify-between">
                  <div className="max-w-[72%]">
                    <div className="uppercase tracking-wide text-white/90 text-sm font-extrabold">
                      Phần {location.state?.treeNumber ?? 1}, Cửa 1
                    </div>
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
                      {(() => {
                        const mapN: Record<"beginner"|"intermediate"|"advanced", number> = { beginner: 1, intermediate: 2, advanced: 3 };
                        const mapL: Record<"beginner"|"intermediate"|"advanced", string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };
                        const tree = location.state?.treeNumber ?? 1;
                        return `Level ${mapN[level]}: ${mapL[level]}, Skill tree ${tree}`;
                      })()}
                    </h1>
                  </div>
                  <button className="hidden md:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-semibold transition">
                    <span>Hướng dẫn</span>
                  </button>
                </div>
              </div>

              {/* TopStats ở bên phải, cùng hàng với header */}
              <div className="col-span-12 lg:col-span-5">
                <TopStats />
              </div>

              {/* Nodes ở giữa */}
              <div className="col-span-12 lg:col-span-7">
                <NodePath />
              </div>

              {/* Cards ở phải */}
              <div className="col-span-12 lg:col-span-5 space-y-4">
                <InfoCard
                  title="Mở khóa Bảng xếp hạng!"
                  subtitle="Hoàn thành thêm 9 bài học để bắt đầu thi đua"
                />
                <DailyCard />
                <ProfileCard onCreateProfile={() => navigate("/profile")} />
              </div>
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

function NodePath() {
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <div className="absolute -top-7 left-1/2 -translate-x-1/2">
          <span className="bg-white text-gray-900 font-bold text-sm px-3 py-1 rounded-xl shadow">
            Bắt đầu
          </span>
                </div>
                <CircleNode index={1} active />
            </div>
            <CircleNode index={2} />
            <CircleNode index={3} />
            <CircleNode index={4} />
            <CircleNode index={5} />
        </div>
    );
}

function CircleNode({ index, active = false }: { index: number; active?: boolean }) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 w-full max-w-[220px] flex items-center gap-4">
            <div className={`${active ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-700"} w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center`}>
                <span className="font-extrabold">{index}</span>
            </div>
            <div className="flex-1">
                <div className="text-base md:text-lg font-bold text-gray-900">
                    {active ? "Bài 1" : `Bài ${index}`}
                </div>
                <div className="text-xs md:text-sm text-gray-600">Chủ đề {index}</div>
            </div>
        </div>
    );
}

function InfoCard({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="text-gray-900 font-extrabold mb-2">{title}</div>
            <div className="text-gray-600 text-sm">{subtitle}</div>
        </div>
    );
}

function DailyCard() {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="text-gray-900 font-extrabold">Nhiệm vụ hằng ngày</div>
                <button className="text-primary-600 font-semibold text-sm">Xem tất cả</button>
            </div>
            <div className="mt-3">
                <div className="text-gray-700 font-semibold text-sm mb-2">Kiếm 10 KN</div>
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-3 bg-yellow-400 rounded-full" style={{ width: "100%" }} />
                </div>
            </div>
        </div>
    );
}

function ProfileCard({ onCreateProfile }: { onCreateProfile: () => void }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="text-gray-900 font-extrabold mb-2">Tạo hồ sơ để lưu tiến trình của bạn!</div>
            <button
                onClick={onCreateProfile}
                className="mt-2 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl transition"
            >
                Tạo hồ sơ
            </button>
        </div>
    );
}

function TopStats() {
    const stats = [
        { label: "Điểm thưởng", value: "120" },
        { label: "Streak", value: "7" },
        { label: "Badges", value: "5" },
        { label: "Tim", value: "5" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm">
            <div className="grid grid-cols-4 gap-2">
                {stats.map((item) => (
                    <div key={item.label} className="text-center">
                        <div className="text-sm text-gray-500 font-semibold">{item.label}</div>
                        <div className="text-lg font-extrabold text-gray-900">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}