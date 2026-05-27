import { useEffect, useState } from "react";
import { BookOpen, CheckSquare, Users, TrendingUp } from "lucide-react";
import AdminStatCard from "@/components/admin/common/AdminStatCard";
import LearnProgressTable from "@/components/admin/learn_progress/LearnProgressTable";
import LearnProgressDetailModal from "@/components/admin/learn_progress/LearnProgressDetailModal";
import { learnProgressService, type UserLearnSummary } from "@/services/admin/learnProgressService";

export default function LearnProgressPage() {
    const [users, setUsers] = useState<UserLearnSummary[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    async function fetchData(p = 0, q = search) {
        setLoading(true);
        try {
            const res = await learnProgressService.getSummaryList(p, 10, q || undefined);
            setUsers(res.content);
            setTotal(res.totalElements);
        } catch (e) {
            console.error("Lỗi tải dữ liệu:", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(0, ""); }, []);

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
    const usersWithLevel = users.filter(u => u.currentLevelId != null).length;
    const usersInProgress = users.filter(u => u.completedTrees > 0 && u.completedTrees < u.totalTrees).length;
    const usersCompleted = users.filter(u => u.totalTrees > 0 && u.completedTrees === u.totalTrees).length;

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
            label: "Đã chọn level",
            value: usersWithLevel.toLocaleString(),
            icon: <BookOpen size={24} />,
            iconBg: "bg-blue-50",
            iconText: "text-blue-500",
            borderColor: "border-l-blue-500",
            change: "Trong trang hiện tại",
        },
        {
            label: "Đang học",
            value: usersInProgress.toLocaleString(),
            icon: <TrendingUp size={24} />,
            iconBg: "bg-yellow-50",
            iconText: "text-yellow-500",
            borderColor: "border-l-yellow-500",
            change: "Chưa hoàn thành level",
            pulsing: true,
        },
        {
            label: "Hoàn thành level",
            value: usersCompleted.toLocaleString(),
            icon: <CheckSquare size={24} />,
            iconBg: "bg-green-50",
            iconText: "text-green-600",
            borderColor: "border-l-green-500",
            change: "Đã xong tất cả tree",
            trend: "up" as const,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Lộ trình học tập</h1>
                <p className="text-sm text-gray-500 mt-1">Theo dõi tiến trình học của từng người dùng theo level, tree và node.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map(s => <AdminStatCard key={s.label} {...s} />)}
            </div>

            {/* Table */}
            <LearnProgressTable
                users={users}
                total={total}
                page={page}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                onViewDetail={setSelectedUserId}
                onPageChange={handlePageChange}
                onRefresh={() => fetchData(page)}
            />

            {/* Detail modal */}
            {selectedUserId != null && (
                <LearnProgressDetailModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </div>
    );
}
