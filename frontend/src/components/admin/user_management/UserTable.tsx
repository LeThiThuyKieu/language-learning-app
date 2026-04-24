import { useState } from "react";
import {
    Eye, Edit2, Trash2, FileDown, RefreshCw, Filter,
    Flame, ChevronLeft, ChevronRight, RotateCcw, Loader2,
} from "lucide-react";
import type { AdminUser } from "@/pages/Admin/UserManagementPage";

interface UserTableProps {
    users: AdminUser[];
    total: number;
    page: number;
    loading: boolean;
    onUserSelect: (user: AdminUser) => void;
    onBan: (id: number) => void;
    onUnban: (id: number) => void;
    onPageChange: (page: number) => void;
}

const authLabel: Record<string, string> = {
    GOOGLE: "GOOGLE",
    FACEBOOK: "FACEBOOK",
    LOCAL: "EMAIL",
};

const statusLabel: Record<string, string> = {
    Active: "Hoạt động",
    Inactive: "Không hoạt động",
    Banned: "Bị cấm",
};

const PAGE_SIZE = 10;

export default function UserTable({
    users, total, page, loading,
    onUserSelect, onBan, onUnban, onPageChange,
}: UserTableProps) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("Tất cả");
    const [providerFilter, setProviderFilter] = useState("Tất cả");

    const filtered = users.filter((u) => {
        const matchSearch =
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "Tất cả" || u.status === statusFilter;
        const matchProvider = providerFilter === "Tất cả" || u.authProvider === providerFilter;
        return matchSearch && matchStatus && matchProvider;
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
                        <option value="Active">Hoạt động</option>
                        <option value="Inactive">Không hoạt động</option>
                        <option value="Banned">Bị cấm</option>
                    </select>
                    <select
                        value={providerFilter}
                        onChange={(e) => setProviderFilter(e.target.value)}
                        className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none cursor-pointer"
                    >
                        <option value="Tất cả">Tất cả nhà cung cấp</option>
                        <option value="GOOGLE">Google</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="LOCAL">Email</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-gray-100 rounded-xl text-gray-400 hover:bg-gray-50 transition-colors" title="Xuất dữ liệu">
                        <FileDown className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onPageChange(page)}
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
                                <th className="px-6 py-4">Người dùng</th>
                                <th className="px-4 py-4">Vai trò</th>
                                <th className="px-4 py-4">Trạng thái</th>
                                <th className="px-4 py-4 text-center">Đăng nhập qua</th>
                                <th className="px-4 py-4">XP / Streak</th>
                                <th className="px-4 py-4">Đăng nhập cuối</th>
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
                                        Không tìm thấy người dùng nào
                                    </td>
                                </tr>
                            ) : filtered.map((user) => (
                                <tr
                                    key={user.id}
                                    onClick={() => onUserSelect(user)}
                                    className="group hover:bg-orange-50/30 transition-all cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 group-hover:border-orange-200 transition-colors"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                                <p className="text-xs text-gray-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            user.role === "Admin"
                                                ? "bg-orange-100 text-orange-600"
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                user.status === "Active" ? "bg-green-500" :
                                                user.status === "Inactive" ? "bg-gray-300" : "bg-red-500"
                                            }`} />
                                            <span className={`text-xs font-bold ${
                                                user.status === "Active" ? "text-green-600" :
                                                user.status === "Inactive" ? "text-gray-400" : "text-red-500"
                                            }`}>
                                                {statusLabel[user.status]}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex justify-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 border border-gray-100 rounded-md">
                                                {authLabel[user.authProvider]}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <p className="text-xs font-bold text-gray-700">{user.xp.toLocaleString()} XP</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Flame className={`w-3.5 h-3.5 ${user.streak > 0 ? "text-orange-500 fill-orange-500" : "text-gray-300"}`} />
                                            <p className="text-[10px] font-bold text-gray-400">{user.streak} ngày</p>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <p className="text-xs font-medium text-gray-500">{user.lastLogin}</p>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => onUserSelect(user)}
                                                className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Xem"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="Chỉnh sửa">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {user.status === "Banned" ? (
                                                <button
                                                    onClick={() => onUnban(user.id)}
                                                    className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    title="Bỏ cấm"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onBan(user.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Cấm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-400">
                        Trang <span className="font-bold text-gray-800">{page + 1}</span> / <span className="font-bold text-gray-800">{totalPages || 1}</span>
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
