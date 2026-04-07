import {useLocation, useNavigate} from "react-router-dom";
import {useState} from "react";

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
                    {/* Sidebar left */}
                    <aside
                        className="col-span-12 md:col-span-3 lg:col-span-3 md:border-r md:border-gray-200 md:pr-3 md:pl-0 lg:pr-6">
                        <nav className="mt-1 flex w-full max-w-[16.5rem] flex-col gap-1">
                            <SidebarItem
                                label="Học"
                                active
                                icon={<img src="/icons/learn/hoc.svg" alt=""
                                           className="h-8 w-8 shrink-0 object-contain"/>}
                            />
                            <SidebarItem
                                label="Bảng xếp hạng"
                                icon={<img src="/icons/learn/bxh.svg" alt=""
                                           className="h-8 w-8 shrink-0 object-contain"/>}
                            />
                            <SidebarItem
                                label="Nhiệm vụ"
                                icon={<img src="/icons/learn/task.svg" alt=""
                                           className="h-8 w-8 shrink-0 object-contain"/>}
                            />
                            <div className="relative w-full pt-0.5">
                                <button
                                    type="button"
                                    onClick={() => setMoreOpen((v) => !v)}
                                    className="flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-transparent px-4 py-3 text-left text-gray-600 transition hover:bg-gray-100"
                                >
                  <span className="flex items-center gap-3">
                    <img src="/icons/learn/more-info.svg" alt="" className="h-8 w-8 shrink-0 object-contain"/>
                    <span className="text-sm font-semibold uppercase tracking-wide">Xem thêm</span>
                  </span>
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
                                        <path d="M6 9l6 6 6-6"/>
                                    </svg>
                                </button>

                                {moreOpen && (
                                    <div
                                        className="mt-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
                                        <MoreItem label="Cài đặt" onClick={() => navigate("/profile")}/>
                                        <MoreItem label="Trợ giúp"/>
                                        <MoreItem label="Đăng xuất"/>
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
                                <div
                                    className="bg-primary-500 text-white rounded-2xl px-6 py-5 flex items-center justify-between">
                                    <div className="max-w-[72%]">
                                        <div className="uppercase tracking-wide text-white/90 text-sm font-extrabold">
                                            Phần {location.state?.treeNumber ?? 1}, Cửa 1
                                        </div>
                                        <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
                                            {(() => {
                                                const mapN: Record<"beginner" | "intermediate" | "advanced", number> = {
                                                    beginner: 1,
                                                    intermediate: 2,
                                                    advanced: 3
                                                };
                                                const mapL: Record<"beginner" | "intermediate" | "advanced", string> = {
                                                    beginner: "Beginner",
                                                    intermediate: "Intermediate",
                                                    advanced: "Advanced"
                                                };
                                                const tree = location.state?.treeNumber ?? 1;
                                                return `Level ${mapN[level]}: ${mapL[level]}, Skill tree ${tree}`;
                                            })()}
                                        </h1>
                                    </div>
                                    <button
                                        className="hidden md:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-semibold transition">
                                        <span>Hướng dẫn</span>
                                    </button>
                                </div>
                                <NodePath/>
                            </div>

                            {/* Cột phải: TopStats, các card bên dưới */}
                            <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
                                <TopStats/>
                                <InfoCard
                                    title="Mở khóa Bảng xếp hạng!"
                                    subtitle="Hoàn thành thêm 9 bài học để bắt đầu thi đua"
                                    iconSrc="/icons/learn/lock-bxh.svg"
                                />
                                <DailyCard/>
                                <ProfileCard onCreateProfile={() => navigate("/profile")}/>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function SidebarItem({label, active = false, icon}: { label: string; active?: boolean; icon?: React.ReactNode }) {
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

function MoreItem({label, onClick}: { label: string; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="w-full text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-600 hover:bg-gray-100 transition"
        >
            {label}
        </button>
    );
}

function NodePath() {
    const nodes = [
      { id: 1, kind: "vocabulary" as const, active: true, label: "Học từ vựng" },
      { id: 2, kind: "listening" as const, active: false, label: "Luyện nghe" },
      { id: 3, kind: "speaking" as const, active: false, label: "Luyện nói" },
      { id: 4, kind: "puzzle" as const, active: false, label: "Nối từ" },
      { id: 5, kind: "review" as const, active: false, label: "Ôn tập tổng hợp" },
    ];

    return (
        <div className="flex flex-col items-center gap-5 py-3 pt-7 mt-4">
            {/* Offset trái/phải tạo đường cong */}
            {nodes.map((n, idx) => {
                const offsets = [0, 64, 18, -44, 28] as const;
                const x = offsets[idx] ?? 0;

                return (
                    <div
                        key={n.id}
                        className="relative"
                        style={{transform: `translateX(${x}px)`}}
                    >
                        {idx === 0 && (
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2">
                                <div className="relative">
                                    {/* Thân hộp thoại */}
                                    <div className="bg-white text-orange-500 font-extrabold text-sm px-4 py-2 rounded-xl border-2 border-gray-200 uppercase tracking-wide whitespace-nowrap shadow-sm">
                                        Bắt đầu
                                    </div>
                                    <div className="absolute left-1/2 -bottom-[9px] h-4 w-4 -translate-x-1/2 rotate-45 border-r-2 border-b-2 border-gray-200 bg-white" />
                                    <div className="absolute left-1/2 -bottom-[7px] h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
                                </div>
                            </div>
                        )}
                        <CircleNode kind={n.kind} active={Boolean(n.active)} label={n.label} />
                    </div>
                );
            })}
        </div>
    );
}

function CircleNode({
                        kind,
                        active = false,
                        label,
                    }: {
    kind: "vocabulary" | "listening" | "speaking" | "puzzle" | "review";
    active?: boolean;
    label?: string;
}) {
    return (
        <button
            type="button"
            aria-label={label ?? "Node"}
            className="relative flex items-center justify-center w-[92px] h-[92px]"
        >
            {/* Vòng ngoài */}
            <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full ${
                    active ? "bg-primary-100" : "bg-gray-200"
                }`}
            />
            {/* Vòng giữa */}
            <span
                aria-hidden="true"
                className="absolute inset-[7px] rounded-full bg-white"
            />
            {/* Núi chính */}
            <span
                aria-hidden="true"
                className={`absolute inset-[14px] rounded-full flex items-center justify-center border ${
                    active
                        ? "bg-primary-500 border-primary-600"
                        : "bg-gray-100 border-gray-200"
                }`}
            >
        {kind === "vocabulary" && (
          <svg
            viewBox="0 0 24 24"
            className={`h-8 w-8 ${active ? "text-white" : "text-gray-500"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19a2 2 0 0 0 2 2h12" />
            <path d="M6 17V5a2 2 0 0 1 2-2h10v14H8a2 2 0 0 0-2 2z" />
          </svg>
        )}
                {kind === "listening" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${active ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
                        <path d="M6 13v3a2 2 0 0 0 2 2h1v-7H8a2 2 0 0 0-2 2z" />
                        <path d="M18 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2z" />
                    </svg>
                )}
                {kind === "speaking" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${active ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                        <path d="M8 9h9" />
                        <path d="M8 13h6" />
                    </svg>
                )}
                {kind === "puzzle" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${active ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M8 7a2 2 0 1 1 4 0v1h1a2 2 0 0 1 2 2v1h1a2 2 0 1 1 0 4h-1v1a2 2 0 0 1-2 2h-1v1a2 2 0 1 1-4 0v-1H7a2 2 0 0 1-2-2v-1H4a2 2 0 1 1 0-4h1V10a2 2 0 0 1 2-2h1z" />
                    </svg>
                )}
                {kind === "review" && (
                    <svg
                        viewBox="0 0 24 24"
                        className={`h-8 w-8 ${active ? "text-white" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 12a9 9 0 1 1-3-6.7" />
                        <path d="M21 3v6h-6" />
                    </svg>
                )}
      </span>
        </button>
    );
}

function InfoCard({
                      title,
                      subtitle,
                      iconSrc,
                  }: {
    title: string;
    subtitle: string;
    iconSrc?: string;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
            <div className="flex items-center gap-3">
                {iconSrc && (
                    <div
                        className="h-[54px] w-[54px] rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <img src={iconSrc} alt="" className="h-[26px] w-[26px] object-contain"/>
                    </div>
                )}
                <div className="flex-1">
                    <div className="text-gray-900 font-extrabold text-sm mb-1.5">{title}</div>
                    <div className="text-gray-600 text-sm leading-snug">{subtitle}</div>
                </div>
            </div>
        </div>
    );
}

function DailyCard() {
    // Placeholder data for UI demo
    const currentKn = 0;
    const targetKn = 20;
    const percent = (currentKn / targetKn) * 100;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
            <div className="flex items-center justify-between">
                <div className="text-gray-900 font-extrabold text-sm">Nhiệm vụ hằng ngày</div>
                <button className="text-primary-600 font-semibold text-sm uppercase tracking-wide">
                    Xem tất cả
                </button>
            </div>
            <div className="mt-4 flex items-center gap-3">
                <img
                    src="/icons/learn/lightning.svg"
                    alt=""
                    className="h-10 w-10 object-contain shrink-0"
                />
                <div className="flex-1">
                    <div className="text-gray-700 font-semibold text-sm mb-2">Kiếm {targetKn} KN</div>
                    <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{width: `${percent}%`}}
                        />
                        <div
                            className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-gray-500">
                            {currentKn} / {targetKn}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileCard({onCreateProfile}: { onCreateProfile: () => void }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
            <div className="text-gray-900 font-extrabold text-sm mb-1.5">Tạo hồ sơ để lưu tiến trình của bạn!</div>
            <button
                onClick={onCreateProfile}
                className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 rounded-xl transition"
            >
                Tạo hồ sơ
            </button>
        </div>
    );
}

function TopStats() {
    const stats = [
        {label: "Điểm thưởng", value: "120"},
        {label: "Streak", value: "7"},
        {label: "Badges", value: "5"},
        {label: "Tim", value: "5"},
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