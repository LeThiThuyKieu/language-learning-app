import { Eye, Filter, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { GeneralRevisionProgressSummary } from "@/services/admin/generalRevisionProgressService";

const PAGE_SIZE = 10;

const STATUS_COLORS: Record<string, string> = {
    "Hoàn thành": "bg-emerald-100 text-emerald-700",
    "Đang ôn tập": "bg-orange-100 text-orange-600",
    "Chưa bắt đầu": "bg-gray-100 text-gray-400",
};

function getStatusLabel(completedTopics: number, totalTopics: number, totalAttempts: number): string {
    if (completedTopics === totalTopics && totalTopics > 0) return "Hoàn thành";
    if (totalAttempts > 0 || completedTopics > 0) return "Đang ôn tập";
    return "Chưa bắt đầu";
}

interface Props {
    users: GeneralRevisionProgressSummary[];
    total: number;
    page: number;
    loading: boolean;
    onViewDetail: (userId: number) => void;
    onPageChange: (page: number) => void;
    onRefresh: () => void;
    search: string;
    onSearchChange: (v: string) => void;
    // Bộ lọc trạng thái
    statusFilter: string;
    onStatusFilterChange: (v: string) => void;
    onResetFilters: () => void;
}

export default function GeneralRevisionProgressTable({
    users, total, page, loading,
    onViewDetail, onPageChange, onRefresh,
    search, onSearchChange,
    statusFilter, onStatusFilterChange, onResetFilters,
}: Props) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const hasActiveFilter = search !== "" || statusFilter !== "";

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Tìm theo tên, email..."
                        className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                    />
                </div>

                {/* Bộ lọc trạng thái */}
                <select
                    value={statusFilter}
                    onChange={e => onStatusFilterChange(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Đang ôn tập">Đang ôn tập</option>
                    <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                </select>

                {/* Reset filters — giữ lại nút icon bên phải, đổi thành reset filter */}
                <button
                    onClick={onResetFilters}
                    disabled={!hasActiveFilter}
                    title="Reset bộ lọc"
                    className={[
                        "p-2 border rounded-xl transition-colors ml-auto",
                        hasActiveFilter
                            ? "border-orange-200 text-orange-500 hover:bg-orange-50"
                            : "border-gray-100 text-gray-300 cursor-not-allowed",
                    ].join(" ")}
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">Người dùng</th>
                                <th className="px-4 py-4">Tiến trình</th>
                                <th className="px-4 py-4 text-center">Số lần ôn tập</th>
                                <th className="px-4 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right w-32 whitespace-nowrap">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-sm text-gray-400">
                                        Không tìm thấy người dùng nào
                                    </td>
                                </tr>
                            ) : users.map(user => {
                                const pct = user.totalTopics > 0
                                    ? Math.round((user.completedTopics / user.totalTopics) * 100)
                                    : 0;
                                const avatar = user.avatarUrl ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.email)}&background=f97316&color=fff`;
                                const statusLabel = getStatusLabel(user.completedTopics, user.totalTopics, user.totalAttempts);
                                const statusClass = STATUS_COLORS[statusLabel] ?? "bg-gray-100 text-gray-400";

                                // Lọc client-side theo trạng thái
                                if (statusFilter && statusLabel !== statusFilter) return null;

                                return (
                                    <tr
                                        key={user.userId}
                                        className="group hover:bg-orange-50/30 transition-all cursor-pointer"
                                        onClick={() => onViewDetail(user.userId)}
                                    >
                                        {/* User */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={avatar}
                                                    alt={user.fullName ?? user.email}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 group-hover:border-orange-200 transition-colors"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800">{user.fullName || "—"}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Progress */}
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2 min-w-[140px]">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-orange-400 rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 shrink-0">
                                                    {user.completedTopics}/{user.totalTopics}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{pct}% topic hoàn thành</p>
                                        </td>

                                        {/* Total attempts — căn giữa, không có chữ "lần" */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-sm font-bold text-gray-700">
                                                {user.totalAttempts.toLocaleString()}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
                                                {statusLabel}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4 w-32 text-right">
                                            <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => onViewDetail(user.userId)}
                                                    className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-400">
                        Trang <span className="font-bold text-gray-800">{page + 1}</span> /{" "}
                        <span className="font-bold text-gray-800">{totalPages || 1}</span>
                        {" · "}Tổng <span className="font-bold text-gray-800">{total.toLocaleString()}</span> người dùng
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 0}
                            onClick={() => onPageChange(page - 1)}
                            className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-white disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => onPageChange(i)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                    i === page
                                        ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                                        : "text-gray-500 hover:bg-white border border-transparent hover:border-gray-100"
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        {totalPages > 5 && <span className="text-gray-300 text-xs">...</span>}
                        <button
                            disabled={page >= totalPages - 1}
                            onClick={() => onPageChange(page + 1)}
                            className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:bg-white disabled:text-gray-200 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
