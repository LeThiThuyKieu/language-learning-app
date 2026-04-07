import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {learningService} from "@/services/learningService";
import type {SkillTreeNodeQuestionsData, SkillTreeQuestionsData} from "@/types";

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
    const [activeLessonNode, setActiveLessonNode] =
        useState<SkillTreeNodeQuestionsData | null>(null);

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

    // Nếu đang mở bài học VOCAB thì chuyển sang màn luyện tập
    if (activeLessonNode && activeLessonNode.nodeType === "VOCAB") {
        return (
            <VocabLessonView
                node={activeLessonNode}
                onExit={() => setActiveLessonNode(null)}
            />
        );
    }

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
                                    onStartLesson={(node) => setActiveLessonNode(node)}
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

function LessonBubble({
                          status,
                          title,
                          description,
                          buttonLabel,
                          onStart,
                      }: {
    status: NodeStatus;
    title: string;
    description: string;
    buttonLabel: string;
    onStart?: () => void;
}) {
    const isLocked = status === "locked";

    const containerColor = isLocked
        ? "bg-gray-100 text-gray-700 border-gray-200"
        : "bg-primary-500 text-white border-primary-500";
    const subtitleColor = isLocked ? "text-gray-600" : "text-white/90";
    const buttonColor = isLocked
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : "bg-white text-primary-600 hover:bg-white/90";

    const finalTitle = title || (isLocked ? "Bài học đang khóa" : "Bài học hiện tại");
    const finalDescription =
        description ||
        (isLocked
            ? "Hãy hoàn thành tất cả các cấp độ phía trên để mở khóa!"
            : "Bắt đầu để nhận thêm kinh nghiệm.");

    return (
        <div className="absolute top-[100px] left-1/2 -translate-x-1/2 z-20">
            <div className="relative">
                <div
                    className={`rounded-2xl border px-5 py-3.5 shadow-lg min-w-[230px] max-w-[280px] ${containerColor}`}
                >
                    <div className="text-[15px] font-extrabold leading-snug line-clamp-2">
                        {finalTitle}
                    </div>
                    <div className={`mt-1 text-xs leading-snug ${subtitleColor}`}>
                        {finalDescription}
                    </div>
                    <button
                        type="button"
                        disabled={isLocked || !onStart}
                        className={`mt-3 w-full rounded-2xl px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition ${buttonColor}`}
                        onClick={() => {
                            if (!isLocked && onStart) {
                                onStart();
                            }
                        }}
                    >
                        {isLocked ? "KHÓA" : buttonLabel}
                    </button>
                </div>
                <div
                    className={`absolute left-1/2 -top-[7px] h-4 w-4 -translate-x-1/2 rotate-45 border-l border-t ${isLocked ? "border-gray-200 bg-gray-100" : "border-primary-500 bg-primary-500"}`}
                />
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

const NODE_PATH_OFFSETS = [0, 64, 18, -44, 28] as const;

const FALLBACK_PATH_NODES: SkillTreeNodeQuestionsData[] = [
    {nodeId: 0, title: "Học từ vựng", nodeType: "VOCAB", questions: []},
    {nodeId: 0, title: "Luyện nghe", nodeType: "LISTENING", questions: []},
    {nodeId: 0, title: "Luyện nói", nodeType: "SPEAKING", questions: []},
    {nodeId: 0, title: "Nối từ", nodeType: "MATCHING", questions: []},
    {nodeId: 0, title: "Ôn tập tổng hợp", nodeType: "REVIEW", questions: []},
];

type NodeStatus = "active" | "locked" | "completed";

//bong bóng chat hiện ra khi nhấn vào 1 node
function getNodeMeta(nodeType: string) {
    switch (nodeType) {
        case "VOCAB":
            return {
                title: "Từ vựng",
                description: "Chọn đáp án đúng nhất",
                button: "BẮT ĐẦU +10 KN",
            };
        case "LISTENING":
            return {
                title: "Nghe & Điền từ",
                description: "Hoàn thành đoạn hội thoại",
                button: "BẮT ĐẦU +10 KN",
            };
        case "SPEAKING":
            return {
                title: "Phản xạ giao tiếp",
                description: "Luyện nói theo mẫu câu",
                button: "BẮT ĐẦU +10 KN",
            };
        case "MATCHING":
            return {
                title: "Thử thách nối từ",
                description: "Nối từ với định nghĩa đúng",
                button: "BẮT ĐẦU +10 KN",
            };
        case "REVIEW":
            return {
                title: "Tổng ôn kiến thức",
                description: "Kiểm tra lại toàn bộ bài học",
                button: "BẮT ĐẦU +20 KN",
            };
        default:
            return {
                title: "",
                description: "",
                button: "BẮT ĐẦU",
            };
    }
}

function nodeTypeToKind(
    nodeType: string
): "vocabulary" | "listening" | "speaking" | "puzzle" | "review" {
    switch (nodeType) {
        case "VOCAB":
            return "vocabulary";
        case "LISTENING":
            return "listening";
        case "SPEAKING":
            return "speaking";
        case "MATCHING":
            return "puzzle";
        case "REVIEW":
            return "review";
        default:
            return "vocabulary";
    }
}

function NodePath({
                      apiNodes,
                      onStartLesson,
                  }: {
    apiNodes: SkillTreeNodeQuestionsData[] | null;
    onStartLesson: (node: SkillTreeNodeQuestionsData) => void;
}) {
    const nodes = apiNodes?.length ? apiNodes : FALLBACK_PATH_NODES;
    const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Đóng bong bóng khi click ra ngoài vùng NodePath
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const el = containerRef.current;
            if (!el) return;
            if (selectedIndex === null) return;
            if (!el.contains(event.target as Node)) {
                setSelectedIndex(null);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [selectedIndex]);

    return (
        <div
            ref={containerRef}
            onMouseDown={(e) => {
                // Click vào khoảng trống trong NodePath (không trúng node/bubble) thì đóng
                if (e.target === e.currentTarget) {
                    setSelectedIndex(null);
                }
            }}
            className="flex flex-col items-center gap-5 py-3 pt-7 mt-4"
        >
            {nodes.map((n, idx) => {
                const x = NODE_PATH_OFFSETS[idx % NODE_PATH_OFFSETS.length] ?? 0;
                const kind = nodeTypeToKind(n.nodeType);
                const status: NodeStatus = idx === 0 ? "active" : "locked";
                const isSelected = selectedIndex === idx;
                const label = n.title || FALLBACK_PATH_NODES[idx]?.title;
                const meta = getNodeMeta(n.nodeType);

                return (
                    <div
                        key={`${n.nodeId}-${n.nodeType}-${idx}`}
                        className={`relative ${isSelected ? "z-30" : "z-0"}`}
                        style={{transform: `translateX(${x}px)`}}
                    >
                        {isSelected && (
                            <LessonBubble
                                status={status}
                                title={meta.title || label || ""}
                                description={meta.description}
                                buttonLabel={meta.button}
                                onStart={
                                    status === "active" && n.nodeType === "VOCAB"
                                        ? () => onStartLesson(n)
                                        : undefined
                                }
                            />
                        )}
                        <CircleNode
                            kind={kind}
                            status={status}
                            label={label}
                            onClick={() => setSelectedIndex(idx)}
                        />
                    </div>
                );
            })}
        </div>
    );
}

function TreeNodesDataPreview({data}: { data: SkillTreeQuestionsData | null }) {
    if (!data?.nodes?.length) {
        return null;
    }

    return (
        <section className="mt-8 rounded-2xl border border-gray-200 bg-gray-50/90 p-4 md:p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800 mb-1">
                Dữ liệu bài theo node
            </h2>
            <p className="text-xs text-gray-500 mb-4">
                Tree {data.treeId} · Level {data.levelId} — tạm hiển thị thô, sau có thể chỉnh layout câu hỏi.
            </p>
            <div className="flex flex-col gap-4">
                {data.nodes.map((node) => (
                    <article
                        key={`${node.nodeId}-${node.nodeType}`}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                        <header className="flex flex-wrap items-baseline gap-2 mb-2">
              <span className="text-xs font-bold uppercase text-primary-600 tabular-nums">
                {node.nodeType}
              </span>
                            <span className="text-sm font-semibold text-gray-900">{node.title}</span>
                            <span className="text-xs text-gray-500">({node.questions.length} câu)</span>
                        </header>
                        <ul className="text-sm text-gray-800 space-y-2 max-h-56 overflow-y-auto pr-1">
                            {node.questions.map((q, i) => (
                                <li
                                    key={q.id ?? `${node.nodeId}-q-${i}`}
                                    className="border-t border-gray-100 pt-2 first:border-t-0 first:pt-0"
                                >
                                    <span className="font-semibold text-gray-500">#{i + 1}</span>{" "}
                                    {q.questionText ? (
                                        <span className="whitespace-pre-wrap">{q.questionText}</span>
                                    ) : (
                                        <em className="text-gray-400">(chưa có questionText)</em>
                                    )}
                                    {q.options && q.options.length > 0 ? (
                                        <div className="mt-1 text-xs text-gray-600">
                                            <span className="font-semibold">Lựa chọn: </span>
                                            {q.options.join(" · ")}
                                        </div>
                                    ) : null}
                                    {q.correctAnswer ? (
                                        <div className="mt-1 text-xs text-gray-600">
                                            <span className="font-semibold">Đáp án: </span>
                                            {q.correctAnswer}
                                        </div>
                                    ) : null}
                                    {q.audioUrl ? (
                                        <div className="mt-1 text-xs text-blue-700 break-all">{q.audioUrl}</div>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
            </div>
        </section>
    );
}

function VocabLessonView({
                             node,
                             onExit,
                         }: {
    node: SkillTreeNodeQuestionsData;
    onExit: () => void;
}) {
    const questions = node.questions ?? [];
    const total = questions.length || 1;
    const [index, setIndex] = useState(0);
    const current = questions[index] ?? {};

    const progressPercent = ((index + 1) / total) * 100;

    function handleOptionClick() {
        if (index < total - 1) {
            setIndex((i) => Math.min(i + 1, total - 1));
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top bar with exit + progress + question count */}
            <header className="w-full border-b border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
                    <button
                        type="button"
                        onClick={onExit}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                        aria-label="Thoát bài học"
                    >
                        <span className="text-xl leading-none">&times;</span>
                    </button>
                    <div className="flex-1 mx-4">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                                style={{width: `${progressPercent}%`}}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                        <span>{total}</span>
                        <span className="text-gray-400">câu</span>
                    </div>
                </div>
            </header>

            {/* Body */}
            <main className="flex-1 flex flex-col items-center">
                <div className="w-full max-w-4xl px-4 pt-10 pb-12">
                    <div className="mb-8">
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-2">
                            Từ vựng mới
                        </p>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-snug">
                            {current.questionText || "Câu hỏi đang tải..."}
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-4">
                        {(current.options ?? []).map((opt, i) => (
                            <button
                                key={`${opt}-${i}`}
                                type="button"
                                onClick={handleOptionClick}
                                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-4 py-6 md:py-7 shadow-sm hover:border-primary-500 hover:bg-primary-50 transition-colors"
                            >
                                <span className="text-base md:text-lg font-semibold text-gray-800 text-center">
                                    {opt}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function CircleNode({
                        kind,
                        label,
                        status = "locked",
                        onClick,
                    }: {
    kind: "vocabulary" | "listening" | "speaking" | "puzzle" | "review";
    status?: NodeStatus;
    label?: string;
    onClick?: () => void;
}) {
    const isActive = status === "active";

    return (
        <button
            type="button"
            aria-label={label ?? "Node"}
            className="relative flex items-center justify-center w-[92px] h-[92px]"
            onClick={onClick}
        >
            {/* Vòng ngoài */}
            <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full ${
                    isActive ? "bg-primary-100" : "bg-gray-200"
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
                    isActive
                        ? "bg-primary-500 border-primary-600"
                        : "bg-gray-100 border-gray-200"
                }`}
            >
        {kind === "vocabulary" && (
          <svg
            viewBox="0 0 24 24"
            className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
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
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
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
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
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
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
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
                        className={`h-8 w-8 ${isActive ? "text-white" : "text-gray-500"}`}
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