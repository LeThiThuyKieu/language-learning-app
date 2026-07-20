import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import {
    generalRevisionProgressService,
    type GeneralRevisionProgressDetail,
    type TopicProgressDetail,
} from "@/services/admin/generalRevisionProgressService";

const QUESTION_TYPE_LABEL: Record<string, string> = {
    vocab_image: "Từ vựng + Ảnh",
    writing: "Viết",
    matching: "Nối từ",
    listening: "Nghe",
};

const STATUS_CONFIG: Record<string, { label: string; badge: string; border: string; bg: string }> = {
    completed: {
        label: "Hoàn thành",
        badge: "bg-emerald-100 text-emerald-700",
        border: "border-l-emerald-500",
        bg: "bg-emerald-50/40",
    },
    in_progress: {
        label: "Đang ôn tập",
        badge: "bg-orange-100 text-orange-600",
        border: "border-l-orange-400",
        bg: "bg-orange-50/40",
    },
    not_started: {
        label: "Chưa bắt đầu",
        badge: "bg-gray-100 text-gray-400",
        border: "border-l-gray-200",
        bg: "bg-gray-50/40",
    },
};

function TopicCard({ topic, index }: { topic: TopicProgressDetail; index: number }) {
    const [open, setOpen] = useState(false);
    const cfg = STATUS_CONFIG[topic.status] ?? STATUS_CONFIG.not_started;
    const pct = Math.round((topic.completedTasks / 4) * 100);

    return (
        <div className={`rounded-xl border-l-4 border border-gray-100 ${cfg.border} ${cfg.bg} overflow-hidden`}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/60 transition"
            >
                {open
                    ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                }
                <span className="font-bold text-sm text-gray-800 flex-1">
                    Topic {index + 1}: {topic.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {cfg.label}
                </span>
                <span className="text-xs text-gray-400 font-medium ml-2">
                    {topic.completedTasks}/4 task
                </span>
            </button>

            {/* Progress bar */}
            <div className="px-4 pb-2">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${
                            topic.status === "completed" ? "bg-emerald-500" :
                            topic.status === "in_progress" ? "bg-orange-400" : "bg-gray-300"
                        }`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Task list */}
            {open && (
                <div className="px-4 pb-3 space-y-1.5">
                    {topic.tasks.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">Chưa có dữ liệu task</p>
                    ) : topic.tasks.map(task => (
                        <div
                            key={task.taskId}
                            className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100"
                        >
                            {task.attemptCount > 0
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-gray-700 truncate block">
                                    {task.taskLabel}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    {QUESTION_TYPE_LABEL[task.questionType] ?? task.questionType}
                                </span>
                            </div>
                            {task.attemptCount > 0 && (
                                <>
                                    <div className="text-right shrink-0">
                                        <p className="text-[10px] text-gray-500 font-medium">
                                            ×{task.attemptCount} lần
                                        </p>
                                        {task.bestScore != null && (
                                            <p className="text-[10px] text-emerald-600 font-bold">
                                                Best: {task.bestScore}%
                                            </p>
                                        )}
                                        {task.lastScore != null && (
                                            <p className="text-[10px] text-orange-500 font-bold">
                                                Last: {task.lastScore}%
                                            </p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function GeneralRevisionProgressDetailModal({
    userId,
    onClose,
}: {
    userId: number | null;
    onClose: () => void;
}) {
    const [detail, setDetail] = useState<GeneralRevisionProgressDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId == null) return;
        setLoading(true);
        setDetail(null);
        generalRevisionProgressService
            .getDetail(userId)
            .then(setDetail)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    if (userId == null) return null;

    const avatar =
        detail?.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            detail?.fullName || detail?.email || "U"
        )}&background=f97316&color=fff`;

    const completedTopics = detail?.completedTopics ?? 0;
    const totalTopics = detail?.totalTopics ?? 0;
    const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-extrabold text-gray-900">Chi tiết ôn tập tổng hợp</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-16 text-gray-400 text-sm">
                        Đang tải...
                    </div>
                ) : !detail ? (
                    <div className="flex-1 flex items-center justify-center py-16 text-gray-400 text-sm">
                        Không tìm thấy dữ liệu
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                        {/* User info */}
                        <div className="flex items-center gap-4">
                            <img
                                src={avatar}
                                alt=""
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-gray-900 truncate">
                                    {detail.fullName || "—"}
                                </p>
                                <p className="text-sm text-gray-400 truncate">{detail.email}</p>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                {
                                    label: "Topic hoàn thành",
                                    value: `${completedTopics}/${totalTopics}`,
                                },
                                {
                                    label: "Tổng lần ôn tập",
                                    value: detail.totalAttempts.toLocaleString(),
                                },
                                {
                                    label: "Tiến trình",
                                    value: `${pct}%`,
                                },
                            ].map(s => (
                                <div
                                    key={s.label}
                                    className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                                >
                                    <p className="text-base font-extrabold text-gray-900">{s.value}</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Overall progress bar */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Tiến trình tổng thể
                                </span>
                                <span className="text-xs font-bold text-gray-600">
                                    {completedTopics}/{totalTopics} topic
                                </span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-400 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>

                        {/* Topic list */}
                        {detail.topics.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                Chưa có dữ liệu ôn tập
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Danh sách topic
                                </p>
                                {detail.topics.map((topic, idx) => (
                                    <TopicCard key={topic.topicId} topic={topic} index={idx} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
