import { useState } from "react";
import {
    Eye, Trash2, FileDown, RefreshCw, Filter,
    ChevronLeft, ChevronRight, Loader2,
} from "lucide-react";
import type { PlacementTestRecord } from "@/services/admin/placementTestManagementService.ts";

interface PlacementTestTableProps {
    tests: PlacementTestRecord[];
    total: number;
    page: number;
    loading: boolean;
    onTestSelect: (test: PlacementTestRecord) => void;
    onDelete: (testId: number) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
}

const statusLabel: Record<string, string> = {
    COMPLETED: "Hoàn thành",
    IN_PROGRESS: "Chưa hoàn thành",
};

const PAGE_SIZE = 10;

export default function PlacementTestTable({
    tests,
    total,
    page,
    loading,
    onTestSelect,
    onDelete,
    onPageChange,
    onRefresh,
}: PlacementTestTableProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tất cả");
    const [levelFilter, setLevelFilter] = useState("Tất cả");

    const filtered = tests.filter((t) => {
        const matchSearch =
            t.userName.toLowerCase().includes(search.toLowerCase()) ||
            t.userEmail.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "Tất cả" || t.status === statusFilter;
        const matchLevel = levelFilter === "Tất cả" || t.detectedLevel === levelFilter;
        return matchSearch && matchStatus && matchLevel;
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="space-y-4">
            {/* Thanh công cụ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, email..."
                            className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none cursor-pointer"
                    >
                        <option value="Tất cả">Tất cả trạng thái</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="IN_PROGRESS">Chưa hoàn thành</option>
                    </select>
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none cursor-pointer"
                    >
                        <option value="Tất cả">Tất cả level</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {/* TODO: Export logic */}}
                        className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-orange-500 transition-colors"
                        title="Xuất dữ liệu CSV"
                    >
                        <FileDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bảng */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Học viên</th>
                                <th className="px-4 py-4">Trạng thái</th>
                                <th className="px-4 py-4">Điểm</th>
                                <th className="px-4 py-4">Level</th>
                                <th className="px-4 py-4">Ngày tạo</th>
                                <th className="px-4 py-4">Hoàn thành</th>
                                <th className="px-6 py-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                                        Không tìm thấy placement test nào
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((test) => (
                                    <tr
                                        key={test.id}
                                        onClick={() => onTestSelect(test)}
                                        className="group hover:bg-orange-50/30 transition-all cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={test.userAvatar}
                                                    alt={test.userName}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 group-hover:border-orange-200 transition-colors"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{test.userName}</p>
                                                    <p className="text-xs text-gray-400">{test.userEmail}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className={`w-1.5 h-1.5 rounded-full ${
                                                        test.status === "COMPLETED" ? "bg-green-500" : "bg-blue-500"
                                                    }`}
                                                />
                                                <span
                                                    className={`text-xs font-bold ${
                                                        test.status === "COMPLETED"
                                                            ? "text-green-600"
                                                            : "text-blue-600"
                                                    }`}
                                                >
                                                    {statusLabel[test.status]}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-bold text-gray-700">
                                                {test.totalScore !== null
                                                    ? `${test.totalScore.toFixed(1)}/160`
                                                    : "N/A"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    test.detectedLevel === "Beginner"
                                                        ? "bg-orange-100 text-orange-600"
                                                        : test.detectedLevel === "Intermediate"
                                                        ? "bg-blue-100 text-blue-600"
                                                        : test.detectedLevel === "Advanced"
                                                        ? "bg-purple-100 text-purple-600"
                                                        : "bg-gray-100 text-gray-500"
                                                }`}
                                            >
                                                {test.detectedLevel || "N/A"}
                                            </span>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-medium text-gray-500">{test.createdAt}</p>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="text-xs font-medium text-gray-500">
                                                {test.completedAt || "N/A"}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div
                                                className="flex items-center justify-end gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => onTestSelect(test)}
                                                    className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Xem"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(test.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-400">
                        Trang <span className="font-bold text-gray-800">{page + 1}</span> /{" "}
                        <span className="font-bold text-gray-800">{totalPages || 1}</span>
                        {" · "}Tổng <span className="font-bold text-gray-800">{total.toLocaleString()}</span>{" "}
                        placement test
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => onPageChange(page - 1)}
                            className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-white disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            const p = i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => onPageChange(p)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                        p === page
                                            ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                                            : "text-gray-500 hover:bg-white border border-transparent hover:border-gray-100"
                                    }`}
                                >
                                    {p + 1}
                                </button>
                            );
                        })}

                        {totalPages > 5 && <span className="text-gray-300 text-xs">...</span>}

                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => onPageChange(page + 1)}
                            className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-white disabled:text-gray-200 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
