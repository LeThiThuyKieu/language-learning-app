import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {learningService} from "@/services/learningService.ts";
import type {SkillTreeQuestionsData} from "@/types";
import {loadProgressFromDB} from "@/utils/learnTreeProgress";
import NodePath, {type NodeAccentKey} from "@/components/user/learn/NodePath.tsx";
import {useAuthStore} from "@/store/authStore";
import GuestPrompt from "@/components/user/GuestPrompt";
import LearningPathLoading from "@/components/user/learn/LearningPathLoading";
import {Flame, Lock, Medal, MoreHorizontal, PartyPopper, Star, Zap} from "lucide-react";
import {profileService} from "@/services/profileService";
import type {LevelKey} from "@/utils/learningLevel";
import {hasChosenLearningLevel, isLevelKeyFromState, mapLevelIdToKey} from "@/utils/learningLevel";
import ConfirmModal from "@/components/user/layout/ConfirmModal";
import LeaderboardCard from "@/components/user/common/LeaderboardCard";
import LevelOverviewPanel from "@/components/user/learn/LevelOverviewPanel";

export default function LearningPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const {isAuthenticated, logout} = useAuthStore();
    const [resolvedLevel, setResolvedLevel] = useState<LevelKey | null>(null);
    const [bootstrapping, setBootstrapping] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    // Level thật của user trên profile (không đổi khi user xem lộ trình level khác để ôn tập)
    const [userProfileLevelId, setUserProfileLevelId] = useState<number>(1);

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
    const [showOverview, setShowOverview] = useState(false);
    // Modal chúc mừng mở khoá level mới
    const [unlockModal, setUnlockModal] = useState<{ nextLevelId: number; nextLevelKey: LevelKey; nextLevelName: string } | null>(null);
    const [unlocking, setUnlocking] = useState(false);
    const [trees, setTrees] = useState<SkillTreeQuestionsData[]>([]);
    const [treesLoading, setTreesLoading] = useState(true);
    const [treesError, setTreesError] = useState<string | null>(null);
    const [activeTreeIndex, setActiveTreeIndex] = useState(0);
    // Map treeId → unlockedCount, dùng state để React re-render khi thay đổi
    const [unlockedCounts, setUnlockedCounts] = useState<Record<number, number>>({});

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

    // Chưa chọn level trên profile → không cho vào lộ trình (tránh mặc định beginner)
    useEffect(() => {
        if (!isAuthenticated) {
            setBootstrapping(false);
            setResolvedLevel(null);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const profile = await profileService.getMyProfile();
                if (cancelled) return;
                if (!hasChosenLearningLevel(profile.currentLevelId)) {
                    navigate("/welcome", {replace: true});
                    return;
                }
                // Lưu level thật của user (dùng cho LevelOverviewPanel)
                setUserProfileLevelId(profile.currentLevelId as number);
                const fromState = location.state?.level;
                const level: LevelKey = isLevelKeyFromState(fromState)
                    ? fromState
                    : mapLevelIdToKey(profile.currentLevelId as number);
                setResolvedLevel(level);
            } catch {
                if (!cancelled) navigate("/welcome", {replace: true});
                return;
            }
            if (!cancelled) setBootstrapping(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, navigate, location.state?.level]);

    // Fetch tất cả skill tree + câu hỏi theo level
    useEffect(() => {
        if (!isAuthenticated || !resolvedLevel) return;

        let cancelled = false;
        (async () => {
            setTreesLoading(true);
            setTreesError(null);

            try {
                const levelId = levelIdMap[resolvedLevel];
                const data = await learningService.getLevelQuestions(levelId);
                if (cancelled) return;
                setTrees(data);
                // Load tiến trình từ DB cho tất cả tree — tuần tự để tree N+1
                // luôn check feedback sau khi tree N đã được xử lý
                const counts: Record<number, number> = {};
                for (let i = 0; i < data.length; i++) {
                    const t = data[i];
                    const prevTreeId = i > 0 ? data[i - 1]?.treeId : undefined;
                    const count = await loadProgressFromDB(t.treeId, i, prevTreeId);
                    counts[t.treeId] = count;
                }
                if (!cancelled) {
                    setUnlockedCounts(counts);
                    setTrees([...data]);
                }
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
    }, [resolvedLevel, isAuthenticated, levelIdMap]);

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

    // Level hoàn thành khi tất cả trees đều có unlockedCount >= 5 (5 nodes đã completed)
    // PHẢI đặt trước early returns để không vi phạm Rules of Hooks
    const isCurrentLevelCompleted = useMemo(() => {
        if (trees.length === 0 || treesLoading) return false;
        return trees.every(t => (unlockedCounts[t.treeId] ?? 0) >= 5);
    }, [trees, unlockedCounts, treesLoading]);

    if (!isAuthenticated) {
        return <GuestPrompt/>;
    }

    if (bootstrapping || !resolvedLevel) {
        return (
            <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white flex flex-col items-center justify-center -mt-8">
                <LearningPathLoading/>
            </div>
        );
    }

    const level = resolvedLevel;

    async function handleUnlockLevel(nextLevelId: number, nextLevelKey: LevelKey, nextLevelName: string) {
        setUnlockModal({ nextLevelId, nextLevelKey, nextLevelName });
    }

    async function confirmUnlockLevel() {
        if (!unlockModal || unlocking) return;
        setUnlocking(true);
        try {
            await profileService.updateMyProfile({ currentLevelId: unlockModal.nextLevelId });
            setUserProfileLevelId(unlockModal.nextLevelId);
            setUnlockModal(null);
            // Navigate sang level mới
            navigate("/learn", { state: { level: unlockModal.nextLevelKey }, replace: true });
        } catch {
            // ignore — vẫn navigate
            setUnlockModal(null);
            navigate("/learn", { state: { level: unlockModal.nextLevelKey }, replace: true });
        } finally {
            setUnlocking(false);
        }
    }

    return (
        <div className="relative left-1/2 right-1/2 -translate-x-1/2 w-screen min-h-screen bg-white -mt-8">
            {/* Một lớp pt duy nhất; pt trên aside/main riêng sẽ cuộn mất còn sticky top-* là khoảng cách thật khi dính header */}
            <div className="w-full px-4 pb-8 pt-5 md:px-8 md:pt-6">
                <div className="grid grid-cols-12 gap-6">
                    <aside
                        className="col-span-12 md:col-span-3 lg:col-span-3 md:border-r md:border-gray-200 md:pr-3 md:pl-0 lg:pr-6">
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
                                    onClick={() => navigate("/leaderboard")}
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
                                        <MoreItem label="Hồ sơ" onClick={() => navigate("/profile")}/>
                                        <MoreItem label="Cài đặt" onClick={() => navigate("/settings")}/>
                                        <MoreItem label="Đăng xuất" onClick={() => setShowLogoutConfirm(true)}/>
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
                                            className={`${showOverview ? "bg-gray-700" : bannerBgByAccent[accentForIndex(activeTreeIndex)]} text-white px-6 py-4 flex flex-col gap-1`}
                                        >
                                            {/* Dòng trên: nút Tổng quan / Lộ trình */}
                                            <button
                                                type="button"
                                                onClick={() => setShowOverview(v => !v)}
                                                className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-extrabold uppercase tracking-widest transition w-fit"
                                            >
                                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                                                </svg>
                                                {showOverview ? "Lộ trình học" : "Tổng quan"}
                                            </button>
                                            {/* Dòng dưới: tiêu đề + nút Hướng dẫn */}
                                            <div className="flex items-center justify-between">
                                                <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-tight">
                                                    {showOverview
                                                        ? "Tổng quan lộ trình"
                                                        : `Level ${levelIdMap[level]}: ${levelNameMap[level]}, Tree ${activeTreeIndex + 1}`
                                                    }
                                                </h1>
                                                {!showOverview && (
                                                    <button
                                                        className="hidden md:inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl font-semibold transition shrink-0"
                                                    >
                                                        <span>Hướng dẫn</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {treesError && (
                                    <p className="text-sm font-semibold text-red-600" role="alert">
                                        {treesError}
                                    </p>
                                )}
                                {treesLoading && <LearningPathLoading/>}

                                {/* Overview panel — thay thế lộ trình khi showOverview = true */}
                                {showOverview && (
                                    <LevelOverviewPanel
                                        currentLevelId={userProfileLevelId}
                                        onReview={(levelId) => {
                                            setShowOverview(false);
                                            navigate("/learn", { state: { level: mapLevelIdToKey(levelId) } });
                                        }}
                                        onContinue={() => {
                                            // Quay về lộ trình level thật của user (không phải level đang ôn tập)
                                            setResolvedLevel(mapLevelIdToKey(userProfileLevelId));
                                            setShowOverview(false);
                                        }}
                                        onSkipTest={(targetLevelId, targetLevelKey, targetLevelName, sourceLevelIds) => {
                                            navigate("/learn/skip-test", {
                                                state: { nextLevelId: targetLevelId, nextLevelKey: targetLevelKey, nextLevelName: targetLevelName, sourceLevelIds },
                                            });
                                        }}
                                    />
                                )}

                                {/* Lộ trình cuộn dưới banner (z-0 < z-[45] của banner) */}
                                <div className={`relative z-0 flex flex-col mt-2 ${showOverview ? "hidden" : ""}`}>
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
                                                        unlockedCount={unlockedCounts[tree.treeId] ?? 0}
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
                                {/* Banner level tiếp theo — chỉ hiện khi đang xem đúng level của user */}
                                {trees.length > 0 && !treesLoading && levelIdMap[level] === userProfileLevelId && (() => {
                                    const nextLevelMap: Record<LevelKey, { key: LevelKey; id: number; name: string; sourceLevelIds: number[] }[]> = {
                                        beginner: [
                                            // Vượt lên Level 2: test kiến thức Level 1
                                            { key: "intermediate", id: 2, name: "Intermediate", sourceLevelIds: [1] },
                                            // Vượt lên Level 3: test tổng hợp Level 1 + Level 2
                                            { key: "advanced",     id: 3, name: "Advanced",     sourceLevelIds: [1, 2] },
                                        ],
                                        intermediate: [
                                            // Vượt lên Level 3: test kiến thức Level 2
                                            { key: "advanced", id: 3, name: "Advanced", sourceLevelIds: [2] },
                                        ],
                                        advanced: [],
                                    };
                                    const nexts = nextLevelMap[level];
                                    if (!nexts.length) return null;
                                    return (
                                        <>
                                            {nexts.map((next, i) => (
                                                <NextLevelBanner
                                                    key={next.id}
                                                    nextLevelId={next.id}
                                                    nextLevelName={next.name}
                                                    isSkipTwo={i === 1}
                                                    isLevelCompleted={i === 0 && isCurrentLevelCompleted}
                                                    onGoToNextLevel={() => {
                                                        if (i === 0 && isCurrentLevelCompleted) {
                                                            handleUnlockLevel(next.id, next.key, next.name);
                                                        } else {
                                                            navigate("/learn/skip-test", {
                                                                state: {
                                                                    nextLevelId: next.id,
                                                                    nextLevelKey: next.key,
                                                                    nextLevelName: next.name,
                                                                    sourceLevelIds: next.sourceLevelIds,
                                                                },
                                                            });
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </>
                                    );
                                })()}
                                </div>
                            </div>

                            {/* Cột phải: TopStats, các card bên dưới (sticky để đứng yên khi cuộn) */}
                            <div className="col-span-12 lg:col-span-4">
                                <div className="flex flex-col gap-3 lg:sticky lg:top-24">
                                    <TopStats/>
                                    <LeaderboardCard
                                        title="Bảng xếp hạng"
                                        subtitle="Top 3 tuần này (theo KN)"
                                        limit={3}
                                        period="WEEK"
                                        showViewMore
                                    />
                                    <DailyCard/>
                                    <ProfileCard onCreateProfile={() => navigate("/profile")}/>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={() => {
                    logout();
                    navigate("/login", { replace: true });
                    setShowLogoutConfirm(false);
                }}
                message="Bạn có chắc chắn muốn đăng xuất không?"
            />

            {/* Modal chúc mừng mở khoá level mới */}
            {unlockModal && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !unlocking && setUnlockModal(null)} />
                    <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Gradient top strip */}
                        <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500" />
                        <div className="px-7 py-8 flex flex-col items-center text-center gap-4">
                            {/* Icon */}
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                                <PartyPopper className="h-8 w-8 text-emerald-600" />
                            </div>
                            {/* Lion */}
                            <img src="/logo/lion.png" alt="Lion mascot" className="w-20 h-20 object-contain drop-shadow-lg select-none" draggable={false} />
                            {/* Text */}
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                                    Chúc mừng! 🎉
                                </h2>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Bạn đã hoàn thành toàn bộ lộ trình!<br />
                                    <span className="font-bold text-emerald-600">Level {unlockModal.nextLevelId}: {unlockModal.nextLevelName}</span> đã được mở khoá.
                                </p>
                            </div>
                            {/* Button */}
                            <button
                                type="button"
                                onClick={confirmUnlockLevel}
                                disabled={unlocking}
                                className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:opacity-90 active:scale-95 text-white font-extrabold py-3.5 text-sm uppercase tracking-widest transition-all shadow-md disabled:opacity-60"
                            >
                                {unlocking ? "Đang mở khoá…" : "Bắt đầu học ngay →"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setUnlockModal(null)}
                                disabled={unlocking}
                                className="text-xs text-gray-400 hover:text-gray-600 transition"
                            >
                                Để sau
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}

function NextLevelBanner({
    nextLevelId,
    nextLevelName,
    isSkipTwo = false,
    isLevelCompleted = false,
    onGoToNextLevel,
}: {
    nextLevelId: number;
    nextLevelName: string;
    isSkipTwo?: boolean;
    isLevelCompleted?: boolean;
    onGoToNextLevel: () => void;
}) {
    // Khi level hoàn thành và đây là banner kế tiếp (không phải skip 2): đổi sang "Mở khoá"
    const showUnlock = isLevelCompleted && !isSkipTwo;

    return (
        <div className={`mx-auto w-full max-w-sm relative ${isSkipTwo ? "mt-4 mb-6" : "mt-10 mb-2"}`}>
            {/* Nút scroll lên đầu — chỉ hiện ở banner đầu tiên */}
            {!isSkipTwo && (
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="absolute -right-14 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-md transition"
                    title="Lên đầu trang"
                    aria-label="Cuộn lên đầu trang"
                >
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                </button>
            )}

            <div className={`relative rounded-3xl border-2 bg-white px-6 py-7 shadow-sm text-center ${
                showUnlock
                    ? "border-emerald-300"
                    : isSkipTwo
                        ? "border-purple-200"
                        : "border-gray-200"
            }`}>
                {/* Nhãn */}
                <span className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-widest mb-3 ${
                    showUnlock
                        ? "bg-emerald-100 text-emerald-600"
                        : isSkipTwo
                            ? "bg-purple-100 text-purple-600"
                            : "bg-gray-100 text-gray-500"
                }`}>
                    {showUnlock ? "Sẵn sàng mở khoá" : isSkipTwo ? "Học vượt 2 cấp" : "Kế tiếp"}
                </span>

                {/* Tên level */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <Lock className={`h-5 w-5 shrink-0 ${showUnlock ? "text-emerald-400" : isSkipTwo ? "text-purple-400" : "text-gray-500"}`} />
                    <h2 className="text-xl font-extrabold text-gray-800">
                        Level {nextLevelId}: {nextLevelName}
                    </h2>
                </div>

                {/* Mô tả */}
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    {showUnlock
                        ? "Bạn đã hoàn thành toàn bộ lộ trình! Hãy mở khoá level tiếp theo để tiếp tục hành trình."
                        : isSkipTwo
                            ? "Thử thách bản thân — vượt thẳng lên cấp độ cao nhất nếu bạn tự tin vào năng lực của mình!"
                            : "Tiếp tục luyện tập với bài học khó hơn để củng cố vốn từ và kỹ năng nghe — nói của bạn"
                    }
                </p>

                {/* Nút */}
                <button
                    type="button"
                    onClick={onGoToNextLevel}
                    className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-extrabold uppercase tracking-wide shadow-md transition text-white ${
                        showUnlock
                            ? "bg-gradient-to-r from-emerald-400 to-teal-500 hover:opacity-90 active:scale-95"
                            : isSkipTwo
                                ? "bg-purple-500 hover:bg-purple-600 active:bg-purple-700"
                                : "bg-primary-500 hover:bg-primary-600 active:bg-primary-700"
                    }`}
                >
                    {showUnlock ? (
                        <>
                            <PartyPopper className="h-5 w-5" />
                            Mở khoá
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            {isSkipTwo ? "Thử thách ngay" : "Học vượt"}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

function SidebarItem({label, active = false, icon, onClick}: {
    label: string;
    active?: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
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

function DailyCard() {
    const currentKn = 0;
    const targetKn = 20;
    const percent = (currentKn / targetKn) * 100;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm min-h-[120px]">
            <div className="flex items-center justify-between">
                <div className="text-gray-900 font-extrabold text-basic">Nhiệm vụ hằng ngày</div>
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
            <div className="text-gray-900 font-extrabold text-basic mb-1.5">Tạo hồ sơ lưu tiến trình của bạn!</div>
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
    const location = useLocation();
    const [profile, setProfile] = useState<{ streakCount: number; totalKn: number; totalXp: number; badgeCount: number } | null>(null);

    useEffect(() => {
        profileService.getMyProfile()
            .then((p) => setProfile({
                streakCount: p.streakCount,
                totalKn: p.totalKn ?? 0,
                totalXp: p.totalXp ?? 0,
                badgeCount: p.badges?.filter(b => b.earned).length ?? 0,
            }))
            .catch(() => {/* ignore */});
    }, [location.key]); // refetch mỗi khi navigate về /learn

    const stats = [
        { label: "Streak", value: profile?.streakCount ?? "—", icon: <Flame className="h-5 w-5 text-orange-500" /> },
        { label: "Tổng KN", value: profile?.totalKn ?? "—", icon: <Zap className="h-5 w-5 text-yellow-400" /> },
        { label: "Tổng XP", value: profile?.totalXp ?? "—", icon: <Star className="h-5 w-5 text-primary-500" /> },
        { label: "Badges", value: profile?.badgeCount ?? "—", icon: <Medal className="h-5 w-5 text-blue-500" /> },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-3 shadow-sm">
            <div className="grid grid-cols-4 gap-2">
                {stats.map((item) => (
                    <div key={item.label} className="text-center">
                        <div className="flex justify-center mb-0.5">{item.icon}</div>
                        <div className="text-lg font-extrabold text-gray-900">{item.value}</div>
                        <div className="text-xs text-gray-500 font-semibold">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}