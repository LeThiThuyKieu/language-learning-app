import { useEffect, useState } from "react";
import { Users, BarChart2, Headphones, BookOpen } from "lucide-react";
import AdminStatCard from "@/components/admin/common/AdminStatCard";
import ExamProgressTable from "@/components/admin/exam_progress/ExamProgressTable";
import ExamProgressDetailModal from "@/components/admin/exam_progress/ExamProgressDetailModal";
import {
    examProgressService,
    type ExamProgressSummary,
    type ExamProgressStats,
} from "@/services/admin/examProgressService";

export default function ExamProgressPage() {
    const [stats, setStats]   = useState<ExamProgressStats | null>(null);
    const [users, setUsers]   = useState<ExamProgressSummary[]>([]);
    const [total, setTotal]   = useState(0);
    const [page, setPage]     = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

    // Load stat cards một lần
    useEffect(() => {
        examProgressService
            .getStats()
            .then(setStats)
            .catch(console.error);
    }, []);

    async function fetchData(p = 0, q = search) {
        setLoading(true);
        try {
            const res = await examProgressService.getSummaryList(p, 10, q || undefined);
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

    const statCards = [
        {
            label: "Tổng người dùng đã thi",
            value: stats ? stats.totalUsers.toLocaleString() : "—",
            icon: <Users size={24} />,
            iconBg: "bg-orange-50",
            iconText: "text-orange-500",
            borderColor: "border-l-orange-500",
            change: "Có ít nhất 1 lượt thi",
            trend: "up" as const,
        },
        {
            label: "Tổng lượt thi",
            value: stats ? stats.totalAttempts.toLocaleString() : "—",
            icon: <BarChart2 size={24} />,
            iconBg: "bg-blue-50",
            iconText: "text-blue-500",
            borderColor: "border-l-blue-500",
            change: "Toàn bộ hệ thống",
        },
        {
            label: "TB Độ chính xác",
            value: stats?.avgObjectiveAccuracy != null
                ? `${stats.avgObjectiveAccuracy.toFixed(1)}%`
                : "—",
            icon: <Headphones size={24} />,
            iconBg: "bg-sky-50",
            iconText: "text-sky-500",
            borderColor: "border-l-sky-500",
            change: "Câu có đáp án (Listening + Reading)",
            trend: "up" as const,
        },
        {
            label: "TB Điểm AI",
            value: stats?.avgAiScore != null
                ? `${stats.avgAiScore.toFixed(1)}%`
                : "—",
            icon: <BookOpen size={24} />,
            iconBg: "bg-violet-50",
            iconText: "text-violet-500",
            borderColor: "border-l-violet-500",
            change: "Chấm bởi AI (Writing + Speaking)",
            trend: "up" as const,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-gray-900">Tiến trình thi</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Theo dõi kết quả và lịch sử thi của từng người dùng theo từng lần làm bài.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statCards.map(s => (
                    <AdminStatCard key={s.label} {...s} />
                ))}
            </div>

            {/* Table */}
            <ExamProgressTable
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
            <ExamProgressDetailModal
                userId={selectedUserId}
                onClose={() => setSelectedUserId(null)}
            />
        </div>
    );
}
