import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useMemo, useRef, useState} from "react";
import {learningService} from "@/services/learningService.ts";
import type {SkillTreeQuestionsData} from "@/types";
import {getLearnTreeUnlockedCount} from "@/utils/learnTreeProgress";
import NodePath, {type NodeAccentKey} from "@/components/user/learn/NodePath.tsx";
import {useAuthStore} from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearningPathLoading from "@/components/user/learn/LearningPathLoading";
import {MoreHorizontal} from "lucide-react";

type LevelKey = "beginner" | "intermediate" | "advanced";

export default function LearningPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const {isAuthenticated} = useAuthStore();
    const level = (location.state?.level ?? "beginner") as LevelKey;

    const levelIdMap: Record<LevelKey, number> = useMemo(
        () => ({
            beginner: 1,
            intermediate: 2,
            advanced: 3,
        }),
        []
    );

    const levelNameMap: Record<LevelKey, string> = useMemo(
        () => ({
            beginner: "Beginner",
            intermediate: "Intermediate",
            advanced: "Advanced",
        }),
        []
    );

    const [moreOpen, setMoreOpen] = useState(false);
    const [trees, setTrees] = useState<SkillTreeQuestionsData[]>([]);
    const [treesLoading, setTreesLoading] = useState(true);
    const [treesError, setTreesError] = useState<string | null>(null);
    const [activeTreeIndex, setActiveTreeIndex] = useState(0);

    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const accentKeys: NodeAccentKey[] = useMemo(
        () => ["orange", "blue", "purple", "teal", "rose"],
        []
    );

    const bannerBgByAccent: Record<NodeAccentKey, string> = useMemo(
        () => ({
            orange: "bg-primary-500",
            blue: "bg-blue-500",
            purple: "bg-purple-500",
            teal: "bg-teal-500",
            rose: "bg-rose-500",
        }),
        []
    );

    const accentForIndex = (idx: number): NodeAccentKey =>
        accentKeys[idx % accentKeys.length] ?? "orange";

    // Fetch tất cả skill tree + câu hỏi theo level (backend quyết định số tree cho mỗi level)
    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelled = false;
        (async () => {
            setTreesLoading(true);
            setTreesError(null);

            try {
                const levelId = levelIdMap[level];
                const data = await learningService.getLevelQuestions(levelId);
                if (cancelled) return;
                setTrees(data);
            } catch (e: unknown) {
                if (cancelled) return;
                setTreesError(
                    e instanceof Error ? e.message : "Không tải được dữ liệu skill trees"
                );
                setTrees([]);
            } finally {
                if (!cancelled) setTreesLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [level, isAuthenticated, levelIdMap]);

    // Scroll => đổi active tree banner/màu + node status.
    useEffect(() => {
        if (!trees.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (!visible.length) return;
                visible.sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
                const el = visible[0].target as HTMLDivElement;
                const idxRaw = el.dataset.index;
                const idx = idxRaw ? Number(idxRaw) : 0;
                if (Number.isFinite(idx)) setActiveTreeIndex(idx);
            },
            { threshold: 0.55 }
        );

        sectionRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [trees.length, treesLoading]);

    if (!isAuthenticated) {
        return <GuestPrompt/>;
    }

    return (
        <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
            {/* Một lớp pt duy nhất; pt trên aside/main riêng sẽ cuộn mất còn sticky top-* là khoảng cách thật khi dính header */}
            <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
                <div className="grid grid-cols-12 gap-6">
                    <aside
                        className="col-span-12 md:col-span-3 lg:col-span-3 md:border-r md:border-gray-200 md:pr-3 md:pl-0 lg:pr-6">
                        {/* top-24 ≈ header thu gọn (~80px) + khe ~16px; đồng bộ khi scroll */}
                        <div className="md:sticky md:top-24">
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
                        </div>
                    </aside>

                    <main className="col-span-12 md:col-span-9 lg:col-span-9">
                        <div className="grid grid-cols-12 gap-6">
                            <div className="relative isolate z-0 col-span-12 lg:col-span-8 flex min-w-0 flex-col gap-4">
                                <div className="sticky top-20 z-[45]">
                                    <div
                                        className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5"
                                    >
                                        {/* Vệt nền trắng: tạo khe nhẹ dưới header, che nội dung cuộn (cùng lớp với banner) */}
                                        <div
                                            className="h-2 w-full bg-white pointer-events-none"
                                            aria-hidden
                                        />
                                        <div
                                            className={`${bannerBgByAccent[accentForIndex(activeTreeIndex)]} text-white px-6 py-5 flex items-center justify-between`}
                                        >
                                            <div className="max-w-[72%]">
                                                <div className="uppercase tracking-wide text-white/90 text-sm font-extrabold">
                                                    Phần {activeTreeIndex + 1}, Cửa 1
                                                </div>
                                                <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
                                                    {`Level ${levelIdMap[level]}: ${levelNameMap[level]}, Tree ${
                                                        activeTreeIndex + 1
                                                    }`}
                                                </h1>
                                            </div>
                                            <button
                                                className="hidden md:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-semibold transition"
                                            >
                                                <span>Hướng dẫn</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {treesError && (
                                    <p className="text-sm font-semibold text-red-600" role="alert">
                                        {treesError}
                                    </p>
                                )}
                                {treesLoading && <LearningPathLoading/>}

                                {/* Lộ trình cuộn dưới banner (z-0 < z-[45] của banner) */}
                                <div className="relative z-0 flex flex-col mt-2">
                                    {trees.map((tree, idx) => {
                                        const accentKey = accentForIndex(idx);
                                        const treeData = tree;

                                        return (
                                            <div
                                                key={tree.treeId}
                                                ref={(el) => {
                                                    sectionRefs.current[idx] = el;
                                                }}
                                                data-index={idx}
                                                className="scroll-mt-6"
                                            >
                                                {idx > 0 && (
                                                    <div className="relative w-full my-8 border-primary-100">
                                                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-primary-300"/>
                                                        <div className="relative mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary-400 bg-primary-50 shadow-sm ring-4 ring-white">
                                                            <MoreHorizontal
                                                                className="h-6 w-6 text-primary-600"
                                                                strokeWidth={2.5}
                                                                aria-hidden
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Đệm trên vừa đủ để bubble không đụng banner khi cuộn; gần banner hơn so với pt-24 cũ */}
                                                <div className="min-h-[420px] pt-8 md:pt-10">
                                                    <NodePath
                                                        key={`${tree.treeId}-${accentKey}`}
                                                        accentKey={accentKey}
                                                        apiNodes={treeData?.nodes?.slice(0, 5) ?? null}
                                                        unlockedCount={getLearnTreeUnlockedCount(tree.treeId)}
                                                        onStartVocab={(node) =>
                                                            navigate("/learn/vocab", {state: {treeId: tree.treeId, node}})
                                                        }
                                                        onStartListening={(node) =>
                                                            navigate("/learn/listening", {state: {treeId: tree.treeId, node}})
                                                        }
                                                        onStartSpeaking={(node) =>
                                                            navigate("/learn/speaking", {state: {treeId: tree.treeId, node}})
                                                        }
                                                        onStartMatching={(node) =>
                                                            navigate("/learn/matching", {state: {treeId: tree.treeId, node}})
                                                        }
                                                        onStartReview={(node) =>
                                                            navigate("/learn/review", {state: {treeId: tree.treeId, node}})
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Cột phải: TopStats, các card bên dưới (sticky để đứng yên khi cuộn) */}
                            <div className="col-span-12 lg:col-span-4">
                                <div className="flex flex-col gap-3 lg:sticky lg:top-24">
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