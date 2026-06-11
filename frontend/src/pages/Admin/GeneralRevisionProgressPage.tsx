import { useEffect, useState } from "react";
import { BookOpen, CheckSquare, Users, RefreshCw } from "lucide-react";
import AdminStatCard from "@/components/admin/common/AdminStatCard";
import GeneralRevisionProgressTable from "@/components/admin/general_revision_progress/GeneralRevisionProgressTable";
import GeneralRevisionProgressDetailModal from "@/components/admin/general_revision_progress/GeneralRevisionProgressDetailModal";
import {
    generalRevisionProgressService,
    type GeneralRevisionProgressSummary,
} from "@/services/admin/generalRevisionProgressService";

export default function GeneralRevisionProgressPage() {
    const [users, setUsers] = useState<GeneralRevisionProgressSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    async function fetchData(p = 0, q = search) {
        setLoading(true);
        try {
            const res = await generalRevisionProgressService.getSummaryList(p, 10, q || undefined);
            setUsers(res.content);
            setTotal(res.totalElements);
        } catch (e) {
            console.error("Lỗi tải dữ liệu:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData(0, "");
    }, []);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(0);
            fetchData(0, search);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    function handlePageChange(p: number) {
        setPage(p);
        fetchData(p);
    }

    // Tính stats từ danh sách hiện tại
    const usersStarted = users.filter(u => u.totalAttempts > 0 || u.completedTopics > 0).length;
    const usersInProgress = users.filter(
        u => u.completedTopics > 0 && u.completedTopics < u.totalTopics
    ).length;
    const usersCompleted = users.filter(
        u => u.totalTopics > 0 && u.completedTopics === u.totalTopics
    ).length;

    const stats = [
        {
            label: "Tổng người dùng",
            value: total.toLocaleString(),
            icon: <Users size={24} />,
            iconBg: "bg-orange-50",
            iconText: "text-orange-500",
            borderColor: "border-l-orange-500",
            change: "Đã có tài khoản",
            trend: "up" as const,
        },
        {
            label: "Đã ôn tập",
            value: usersStarted.toLocaleString(),
            icon: <BookOpen size={24} />,
            iconBg: "bg-blue-50",
            iconText: "text-blue-500",
            borderColor: "border-l-blue-500",
            change: "Trong trang hiện tại",
        },
        {
            label: "Đang ôn tập",
            value: usersInProgress.toLocaleString(),
            icon: <RefreshCw size={24} />,
            iconBg: "bg-yellow-50",
            iconText: "text-yellow-500",
            borderColor: "border-l-yellow-500",
            change: "Chưa hoàn thành",
            pulsing: true,
        },
        {
            label: "Hoàn thành",
            value: usersCompleted.toLocaleString(),
            icon: <CheckSquare size={24} />,
            iconBg: "bg-green-50",
            iconText: "text-green-600",
            borderColor: "border-l-green-500",
            change: "Hoàn thành tất cả topic",
            trend: "up" as const,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Ôn tập tổng hợp</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Theo dõi tiến trình ôn tập tổng hợp của từng người dùng theo topic và task.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map(s => (
                    <AdminStatCard key={s.label} {...s} />
                ))}
            </div>

            {/* Table */}
            <GeneralRevisionProgressTable
                users={users}
                total={total}
                page={page}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                onViewDetail={setSelectedUserId}
                onPageChange={handlePageChange}
                onRefresh={() => fetchData(page)}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onResetFilters={() => {
                    setSearch("");
                    setStatusFilter("");
                }}
            />

            {/* Detail modal */}
            <GeneralRevisionProgressDetailModal
                userId={selectedUserId}
                onClose={() => setSelectedUserId(null)}
            />
        </div>
    );
}
