import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {learningService} from "@/services/learningService";
import type {SkillTreeQuestionsData} from "@/types";
import NodePath from "@/components/user/learn/NodePath";
import TreeNodesDataPreview from "@/components/user/learn/TreeNodesDataPreview";

type LevelKey = "beginner" | "intermediate" | "advanced";

export default function LearningPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const level = (location.state?.level ?? "beginner") as LevelKey;

    const treeId = Number(location.state?.treeId ?? location.state?.treeNumber ?? 1);

    const [moreOpen, setMoreOpen] = useState(false);
    const [treeData, setTreeData] = useState<SkillTreeQuestionsData | null>(null);
    const [treeLoading, setTreeLoading] = useState(true);
    const [treeError, setTreeError] = useState<string | null>(null);
    const [unlockedCount, setUnlockedCount] = useState<number>(() => {
        try {
            const v = sessionStorage.getItem(`learn_tree_${treeId}_unlocked`);
            const n = v ? Number(v) : 1;
            return Number.isFinite(n) && n >= 1 ? n : 1;
        } catch {
            return 1;
        }
    });

    // cập nhật unlockedCount nếu quay về từ lesson
    useEffect(() => {
        const next = (location.state as any)?.unlockedCount;
        if (next && Number(next) !== unlockedCount) {
            const n = Number(next);
            if (Number.isFinite(n) && n >= 1) {
                setUnlockedCount(n);
                try {
                    sessionStorage.setItem(`learn_tree_${treeId}_unlocked`, String(n));
                } catch {
                    // ignore
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state, treeId]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setTreeLoading(true);
            setTreeError(null);
            try {
                const data = await learningService.getTreeQuestions(treeId);
                if (!cancelled) {
                    setTreeData(data);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    setTreeError(
                        e instanceof Error ? e.message : "Không tải được dữ liệu skill tree"
                    );
                    setTreeData(null);
                }
            } finally {
                if (!cancelled) {
                    setTreeLoading(false);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [treeId]);

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
                                {treeError && (
                                    <p className="text-sm font-semibold text-red-600" role="alert">
                                        {treeError}
                                    </p>
                                )}
                                {treeLoading && (
                                    <p className="text-sm text-gray-500">Đang tải lộ trình bài học…</p>
                                )}
                                <NodePath
                                    apiNodes={treeData?.nodes ?? null}
                                    unlockedCount={unlockedCount}
                                    onStartVocab={(node) =>
                                        navigate("/learn/vocab", {state: {treeId, node}})
                                    }
                                    onStartListening={(node) =>
                                        navigate("/learn/listening", {state: {treeId, node}})
                                    }
                                    onStartSpeaking={(node) =>
                                        navigate("/learn/speaking", {state: {treeId, node}})
                                    }
                                />
                                <TreeNodesDataPreview data={treeData}/>
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

function InfoCard({title, subtitle, iconSrc}: {
    title: string;
    subtitle: string;
    iconSrc?: string;
}) {
    return (<div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
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
        </div>);
}

function DailyCard() {
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