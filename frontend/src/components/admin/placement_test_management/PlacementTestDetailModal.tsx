import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import type { PlacementTestRecord, PlacementTestAttempt } from "@/services/admin/placementTestManagementService.ts";
import { placementTestManagementService } from "@/services/admin/placementTestManagementService.ts";

interface PlacementTestDetailModalProps {
    test: PlacementTestRecord;
    onClose: () => void;
}

const levelBadge: Record<string, string> = {
    Beginner:     "bg-orange-100 text-orange-600",
    Intermediate: "bg-blue-100 text-blue-600",
    Advanced:     "bg-purple-100 text-purple-600",
};

export default function PlacementTestDetailModal({ test, onClose }: PlacementTestDetailModalProps) {
    const [history, setHistory] = useState<PlacementTestAttempt[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        placementTestManagementService.getUserHistory(test.userId)
            .then(setHistory)
            .catch(console.error)
            .finally(() => setLoadingHistory(false));
    }, [test.userId]);

    const completedCount  = history.filter(h => h.status === "COMPLETED").length;
    const incompleteCount = history.filter(h => h.status !== "COMPLETED").length;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Chi tiết Placement Test</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <X size={20} />
                    </button>
                </div>

                {/* 1. Thông tin học viên — sát header, nền xám phủ full width */}
                <div className="flex items-center gap-4 bg-gray-50 px-6 py-5 border-b border-gray-100">
                    <img
                        src={test.userAvatar}
                        alt={test.userName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-gray-900">{test.userName}</div>
                        <div className="text-sm text-gray-500 truncate">{test.userEmail}</div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        test.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-white text-gray-500 border border-gray-200"
                    }`}>
                        {test.status === "COMPLETED" ? "Hoàn thành" : "Chưa hoàn thành"}
                    </span>
                </div>

                <div className="p-6 space-y-5">

                    {/* 2. Thông tin lần thi mới nhất */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Số lần làm bài:</span>
                            <span className="text-sm font-extrabold text-gray-900">{test.totalAttempts} lần</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Ngày tạo:</span>
                            <span className="text-sm font-medium text-gray-900">{test.createdAt}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Ngày hoàn thành:</span>
                            <span className="text-sm font-medium text-gray-900">
                                {test.completedAt ?? <span className="text-gray-300">—</span>}
                            </span>
                        </div>
                    </div>

                    {/* 3. Kết quả lần thi mới nhất — chỉ khi COMPLETED */}
                    {test.status === "COMPLETED" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-orange-50 rounded-xl p-4 border-l-4 border-orange-500">
                                <div className="text-xs text-orange-600 font-medium mb-1">Tổng điểm</div>
                                <div className="text-2xl font-extrabold text-orange-600">
                                    {test.totalScore !== null ? test.totalScore.toFixed(1) : "N/A"}
                                </div>
                                <div className="text-xs text-orange-400 mt-1">/ 160 điểm</div>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                                <div className="text-xs text-blue-600 font-medium mb-1">Level phát hiện</div>
                                <div className="text-2xl font-extrabold text-blue-600 uppercase">
                                    {test.detectedLevel || "N/A"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Lịch sử tất cả các lần làm bài */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-900">Lịch sử làm bài</h3>
                            {!loadingHistory && (
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>
                                        <span className="font-bold text-green-600">{completedCount}</span> hoàn thành
                                    </span>
                                    <span>·</span>
                                    <span>
                                        <span className="font-bold text-gray-500">{incompleteCount}</span> bỏ dở
                                    </span>
                                </div>
                            )}
                        </div>

                        {loadingHistory ? (
                            <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Đang tải lịch sử...</span>
                            </div>
                        ) : history.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">Chưa có lịch sử</p>
                        ) : (
                            <div className="rounded-xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <th className="px-4 py-3">Lần</th>
                                            <th className="px-4 py-3">Trạng thái</th>
                                            <th className="px-4 py-3">Điểm</th>
                                            <th className="px-4 py-3">Level</th>
                                            <th className="px-4 py-3">Ngày làm</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {history.map((attempt, idx) => (
                                            <tr key={attempt.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-4 py-3 text-xs font-bold text-gray-500">
                                                    #{history.length - idx}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${
                                                            attempt.status === "COMPLETED" ? "bg-green-500" : "bg-gray-300"
                                                        }`} />
                                                        <span className={`text-xs font-semibold ${
                                                            attempt.status === "COMPLETED"
                                                                ? "text-green-600"
                                                                : "text-gray-400"
                                                        }`}>
                                                            {attempt.status === "COMPLETED" ? "Hoàn thành" : "Bỏ dở"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs font-bold text-gray-700">
                                                    {attempt.totalScore !== null
                                                        ? `${attempt.totalScore.toFixed(1)}/160`
                                                        : <span className="text-gray-300">—</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3">
                                                    {attempt.detectedLevelName ? (
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            levelBadge[attempt.detectedLevelName] ?? "bg-gray-100 text-gray-500"
                                                        }`}>
                                                            {attempt.detectedLevelName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300 text-sm">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500">
                                                    {attempt.createdAt}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
