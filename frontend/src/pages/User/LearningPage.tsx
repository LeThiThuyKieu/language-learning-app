import { useLocation, useNavigate } from "react-router-dom";
import {useState } from "react";

type LevelKey = "beginner" | "intermediate" | "advanced";

export default function LearningPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const level = (location.state?.level ?? "beginner") as LevelKey;

  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
      <div className="w-full px-4 md:px-8 pt-6 md:pt-8 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar left — layout kiểu Duolingo: cột có viền, mục cùng độ rộng */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-3 md:border-r md:border-gray-200 md:pr-5 md:pl-1 lg:pr-6">
            <nav className="mt-1 flex w-full max-w-[17.5rem] flex-col gap-1">
              <SidebarItem
                label="Học"
                active
                icon={<img src="/icons/learn/hoc.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />}
              />
              <SidebarItem
                label="Bảng xếp hạng"
                icon={<img src="/icons/learn/bxh.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />}
              />
              <SidebarItem
                label="Nhiệm vụ"
                icon={<img src="/icons/learn/task.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />}
              />
              <SidebarItem
                label="Hồ sơ"
                icon={<img src="/icons/learn/more-info.svg" alt="" className="h-8 w-8 shrink-0 object-contain" />}
              />

              <div className="relative w-full pt-0.5">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-transparent px-4 py-3 text-left text-gray-600 transition hover:bg-gray-100"
                >
                  <span className="text-sm font-bold uppercase tracking-wide">Xem thêm</span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${
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
                  <div className="mt-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
                    <MoreItem label="Cài đặt" onClick={() => navigate("/profile")} />
                    <MoreItem label="Trợ giúp" />
                    <MoreItem label="Đăng xuất" />
                  </div>
                )}
              </div>
            </nav>
          </aside>

          {/* Main content */}
          <main className="col-span-12 md:col-span-9 lg:col-span-9">
            <div className="grid grid-cols-12 gap-6">
              {/* Cột trái: banner + lộ trình bài */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
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
                <NodePath />
              </div>

              {/* Cột phải: TopStats sát các card bên dưới */}
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
                <TopStats />
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

function SidebarItem({ label, active = false, icon }: { label: string; active?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm transition ${
        active
          ? "border-primary-300 bg-primary-50 font-bold text-primary-700 shadow-sm"
          : "border-transparent font-semibold text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon && <span className="flex shrink-0 items-center justify-center">{icon}</span>}
      <span className="uppercase tracking-wide">{label}</span>
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
        className="mt-2 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 rounded-xl transition"
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