import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X, ChevronDown, ChevronRight, Loader2,
    Headphones, BookOpen, Mic,
} from "lucide-react";
import {
    examProgressService,
    type ExamProgressDetail,
    type AttemptSummary,
} from "@/services/admin/examProgressService";

function pct(correct: number, total: number): string {
    if (!total) return "—";
    return ((correct / total) * 100).toFixed(1) + "%";
}

function ScoreBadge({ value, suffix = "%" }: { value: number | null | undefined; suffix?: string }) {
    if (value == null) return <span className="text-gray-300 text-xs">—</span>;
    const color =
        value >= 80 ? "bg-emerald-100 text-emerald-700" :
        value >= 60 ? "bg-blue-100 text-blue-700" :
        value >= 40 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-600";
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
            {value.toFixed(1)}{suffix}
        </span>
    );
}

const LEVEL_COLOR: Record<string, string> = {
    A2: "bg-green-100 text-green-700",
    B1: "bg-blue-100 text-blue-700",
    B2: "bg-violet-100 text-violet-700",
    C1: "bg-orange-100 text-orange-700",
    C2: "bg-red-100 text-red-700",
};

function AttemptCard({ attempt, index }: { attempt: AttemptSummary; index: number }) {
    const [open, setOpen] = useState(false);
    const overallPct = attempt.totalCount > 0
        ? ((attempt.correctCount / attempt.totalCount) * 100).toFixed(1)
        : null;

    return (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            {/* Row header */}
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/40 transition text-left"
            >
                {open
                    ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                }

                {/* Number */}
                <span className="text-xs font-mono text-gray-400 shrink-0 w-5">{index + 1}</span>

                {/* Title + level badge */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800 truncate">{attempt.testTitle}</span>
                        {attempt.cefrLevel && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${LEVEL_COLOR[attempt.cefrLevel] ?? "bg-gray-100 text-gray-500"}`}>
                                {attempt.cefrLevel}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{attempt.attemptedAt}</p>
                </div>

                {/* Quick scores */}
                <div className="flex items-center gap-2 shrink-0">
                    {overallPct != null && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                            ${parseFloat(overallPct) >= 80 ? "bg-emerald-100 text-emerald-700" :
                              parseFloat(overallPct) >= 60 ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-600"}`}>
                            {overallPct}%
                        </span>
                    )}
                </div>
            </button>

            {/* Expanded body */}
            {open && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3">
                    {/* Section scores */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {/* Listening — câu có đáp án chuẩn */}
                        <div className="bg-white rounded-xl border border-sky-100 p-3 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Headphones className="w-3.5 h-3.5 text-sky-500" />
                                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wide">Listening</span>
                            </div>
                            <p className="text-sm font-black text-gray-800">
                                {attempt.listeningTotal > 0
                                    ? `${attempt.listeningCorrect}/${attempt.listeningTotal}`
                                    : "—"
                                }
                            </p>
                            {attempt.listeningTotal > 0 && (
                                <p className="text-[10px] text-gray-400">
                                    {pct(attempt.listeningCorrect, attempt.listeningTotal)}
                                </p>
                            )}
                            <p className="text-[9px] text-gray-300 mt-0.5">đáp án chuẩn</p>
                        </div>

                        {/* R&W — câu có đáp án chuẩn (không tính SHORT_WRITE) */}
                        <div className="bg-white rounded-xl border border-violet-100 p-3 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wide">R&W</span>
                            </div>
                            <p className="text-sm font-black text-gray-800">
                                {attempt.rwTotal > 0
                                    ? `${attempt.rwCorrect}/${attempt.rwTotal}`
                                    : "—"
                                }
                            </p>
                            {attempt.rwTotal > 0 && (
                                <p className="text-[10px] text-gray-400">
                                    {pct(attempt.rwCorrect, attempt.rwTotal)}
                                </p>
                            )}
                            <p className="text-[9px] text-gray-300 mt-0.5">đáp án chuẩn</p>
                        </div>

                        {/* Writing — LLM chấm SHORT_WRITE */}
                        <div className="bg-white rounded-xl border border-orange-100 p-3 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">Writing</span>
                            </div>
                            <ScoreBadge value={attempt.writingScore} />
                            <p className="text-[9px] text-gray-300 mt-1">AI chấm</p>
                        </div>

                        {/* Speaking — LLM chấm SPEAKING_TASK */}
                        <div className="bg-white rounded-xl border border-rose-100 p-3 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Mic className="w-3.5 h-3.5 text-rose-400" />
                                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Speaking</span>
                            </div>
                            <ScoreBadge value={attempt.speakingScore} />
                            <p className="text-[9px] text-gray-300 mt-1">AI chấm</p>
                        </div>
                    </div>

                    {/* Overall bar */}
                    {attempt.totalCount > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                    Tổng câu có đáp án
                                </span>
                                <span className="text-[10px] font-bold text-gray-600">
                                    {attempt.correctCount}/{attempt.totalCount} đúng
                                </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${
                                        parseFloat(overallPct ?? "0") >= 80 ? "bg-emerald-400" :
                                        parseFloat(overallPct ?? "0") >= 60 ? "bg-blue-400" : "bg-red-400"
                                    }`}
                                    style={{ width: `${overallPct ?? 0}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
export default function ExamProgressDetailModal({
    userId,
    onClose,
}: {
    userId: number | null;
    onClose: () => void;
}) {
    const [detail, setDetail] = useState<ExamProgressDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userId == null) { setDetail(null); return; }
        setLoading(true);
        setDetail(null);
        examProgressService
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

    const stats = detail ? [
        {
            label: "Tổng lượt thi",
            value: detail.totalAttempts.toLocaleString(),
        },
        {
            label: "TB Listening",
            value: detail.avgListeningAccuracy != null ? `${detail.avgListeningAccuracy.toFixed(1)}%` : "—",
        },
        {
            label: "TB R&W",
            value: detail.avgRwAccuracy != null ? `${detail.avgRwAccuracy.toFixed(1)}%` : "—",
        },
        {
            label: "TB Writing AI",
            value: detail.avgWritingScore != null ? `${detail.avgWritingScore.toFixed(1)}%` : "—",
        },
    ] : [];

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-extrabold text-gray-900">Chi tiết tiến trình thi</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-16 gap-2 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Đang tải...</span>
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
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-gray-900 truncate">
                                    {detail.fullName || <span className="text-gray-400 italic font-normal">Chưa đặt tên</span>}
                                </p>
                                <p className="text-sm text-gray-400 truncate">{detail.email}</p>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {stats.map(s => (
                                <div
                                    key={s.label}
                                    className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                                >
                                    <p className="text-base font-extrabold text-gray-900">{s.value}</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Attempts list */}
                        {detail.attempts.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                Người dùng chưa thi lần nào
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Lịch sử lần thi ({detail.attempts.length})
                                </p>
                                {detail.attempts.map((attempt, idx) => (
                                    <AttemptCard
                                        key={attempt.attemptId}
                                        attempt={attempt}
                                        index={idx}
                                    />
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
