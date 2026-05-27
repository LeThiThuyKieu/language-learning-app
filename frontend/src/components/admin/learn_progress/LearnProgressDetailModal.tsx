import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown, ChevronRight, CheckCircle2, Circle, Clock, Lock } from "lucide-react";
import { learnProgressService, type UserLearnDetail, type TreeProgressItem } from "@/services/admin/learnProgressService";

const NODE_TYPE_LABEL: Record<string, string> = {
    VOCAB: "Từ vựng",
    LISTENING: "Nghe",
    SPEAKING: "Nói",
    MATCHING: "Nối từ",
    REVIEW: "Ôn tập",
};

const LEVEL_BADGE: Record<number, string> = {
    1: "bg-green-100 text-green-700",
    2: "bg-blue-100 text-blue-700",
    3: "bg-purple-100 text-purple-700",
};

function NodeStatusIcon({ status }: { status: string }) {
    if (status === "completed") return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (status === "in_progress") return <Clock className="w-4 h-4 text-orange-400 shrink-0" />;
    return <Circle className="w-4 h-4 text-gray-300 shrink-0" />;
}

function TreeCard({ tree, index }: { tree: TreeProgressItem; index: number }) {
    const [open, setOpen] = useState(false);
    const completedNodes = tree.nodes.filter(n => n.status === "completed").length;
    const pct = tree.nodes.length > 0 ? Math.round((completedNodes / tree.nodes.length) * 100) : 0;

    const statusColor =
        tree.status === "done" ? "border-l-emerald-500 bg-emerald-50/40" :
        tree.status === "in_progress" ? "border-l-orange-400 bg-orange-50/40" :
        "border-l-gray-200 bg-gray-50/40";

    const statusBadge =
        tree.status === "done" ? "bg-emerald-100 text-emerald-700" :
        tree.status === "in_progress" ? "bg-orange-100 text-orange-600" :
        "bg-gray-100 text-gray-400";

    const statusLabel =
        tree.status === "done" ? "Hoàn thành" :
        tree.status === "in_progress" ? "Đang học" : "Chưa mở";

    return (
        <div className={`rounded-xl border-l-4 border border-gray-100 ${statusColor} overflow-hidden`}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/60 transition"
            >
                {tree.status === "locked"
                    ? <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                    : open
                        ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                }
                <span className="font-bold text-sm text-gray-800 flex-1">Tree {index + 1}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge}`}>
                    {statusLabel}
                </span>
                <span className="text-xs text-gray-400 font-medium ml-2">
                    {completedNodes}/{tree.nodes.length} node
                </span>
                {tree.status !== "locked" && (
                    <span className="text-xs text-gray-400 ml-2">
                        {Math.round(tree.accuracy * 100)}% accuracy
                    </span>
                )}
            </button>

            {/* Progress bar */}
            {tree.status !== "locked" && (
                <div className="px-4 pb-2">
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${tree.status === "done" ? "bg-emerald-500" : "bg-orange-400"}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Node list */}
            {open && tree.status !== "locked" && (
                <div className="px-4 pb-3 space-y-1.5">
                    {tree.nodes.map(node => (
                        <div
                            key={node.nodeId}
                            className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100"
                        >
                            <NodeStatusIcon status={node.status} />
                            <span className="text-xs font-semibold text-gray-700 flex-1 truncate">
                                {node.title || `Node ${node.orderIndex}`}
                            </span>
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded font-medium">
                                {NODE_TYPE_LABEL[node.nodeType] ?? node.nodeType}
                            </span>
                            {node.status === "completed" && (
                                <span className="text-[10px] text-emerald-600 font-bold">
                                    {node.earnedXp}/{node.maxXp} XP
                                </span>
                            )}
                            {node.attemptCount > 0 && (
                                <span className="text-[10px] text-gray-400">×{node.attemptCount}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LearnProgressDetailModal({
    userId,
    onClose,
}: {
    userId: number;
    onClose: () => void;
}) {
    const [detail, setDetail] = useState<UserLearnDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        learnProgressService.getDetail(userId)
            .then(setDetail)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    const avatar = detail?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(detail?.fullName || detail?.email || "U")}&background=f97316&color=fff`;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-extrabold text-gray-900">Chi tiết lộ trình học</h2>
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
                            <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-100" />
                            <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-gray-900 truncate">{detail.fullName || "—"}</p>
                                <p className="text-sm text-gray-400 truncate">{detail.email}</p>
                                {detail.currentLevelName && (
                                    <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_BADGE[detail.currentLevelId ?? 0] ?? "bg-gray-100 text-gray-500"}`}>
                                        {detail.currentLevelName}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: "Tree hoàn thành", value: `${detail.completedTrees}/${detail.totalTrees}` },
                                { label: "Node hoàn thành", value: `${detail.completedNodes}/${detail.totalNodes}` },
                                { label: "Đang học", value: detail.currentProgressLabel ?? "—" },
                            ].map(s => (
                                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                    <p className="text-base font-extrabold text-gray-900">{s.value}</p>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tree list */}
                        {detail.trees.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu học tập</p>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lộ trình</p>
                                {detail.trees.map((tree, idx) => (
                                    <TreeCard key={tree.treeId} tree={tree} index={idx} />
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
