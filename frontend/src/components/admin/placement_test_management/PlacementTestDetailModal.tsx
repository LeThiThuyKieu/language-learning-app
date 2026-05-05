import { X } from "lucide-react";
import type { PlacementTestRecord } from "@/services/admin/placementTestManagementService.ts";

interface PlacementTestDetailModalProps {
    test: PlacementTestRecord;
    onClose: () => void;
}

export default function PlacementTestDetailModal({ test, onClose }: PlacementTestDetailModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Chi tiết Placement Test</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">

                    {/* 1. Thông tin học viên — lên trên cùng */}
                    <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                        <img
                            src={test.userAvatar}
                            alt={test.userName}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-base font-bold text-gray-900">{test.userName}</div>
                            <div className="text-sm text-gray-500 truncate">{test.userEmail}</div>
                        </div>
                        {/* Trạng thái badge góc phải */}
                        <span
                            className={`shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                test.status === "COMPLETED"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            {test.status === "COMPLETED" ? "Hoàn thành" : "Chưa hoàn thành"}
                        </span>
                    </div>

                    {/* 2. Thông tin bài thi */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Số lần làm bài:</span>
                            <span className="text-sm font-extrabold text-gray-900">
                                {test.totalAttempts} lần
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Ngày tạo:</span>
                            <span className="text-sm font-medium text-gray-900">{test.createdAt}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Ngày hoàn thành:</span>
                            <span className="text-sm font-medium text-gray-900">
                                {test.completedAt || "Chưa hoàn thành"}
                            </span>
                        </div>
                    </div>

                    {/* 3. Kết quả — chỉ hiện khi COMPLETED */}
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
        </div>
    );
}
